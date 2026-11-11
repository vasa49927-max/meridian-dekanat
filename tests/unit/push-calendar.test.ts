/**
 * Web Push и календарь (раунд 3): шифрование проверяем «со стороны браузера» — расшифровываем по RFC 8291;
 * подпись VAPID — открытым ключом; .ics — переносы строк по 75 байт.
 */
import { describe, expect, it } from "vitest";
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from "node:crypto";
import { encryptPayload, isAllowedEndpoint, vapidHeader, vapidKeys } from "@/server/push";
import { fold } from "@/server/calendar";

describe("Web Push", () => {
  it("браузер расшифровывает сообщение своим ключом (RFC 8291, aes128gcm)", () => {
    const ua = createECDH("prime256v1");
    const uaPub = ua.generateKeys();
    const auth = randomBytes(16);
    const msg = JSON.stringify({ title: "Перенос: Статистика", body: "Теперь 19 ноября (чт), 17:40, ауд. 1018", url: "/schedule" });
    const enc = encryptPayload(Buffer.from(msg), uaPub.toString("base64url"), auth.toString("base64url"));

    const salt = enc.subarray(0, 16), rs = enc.readUInt32BE(16), idlen = enc[20];
    const asPub = enc.subarray(21, 21 + idlen), ct = enc.subarray(21 + idlen);
    expect(rs).toBe(4096);
    expect(idlen).toBe(65);
    const shared = ua.computeSecret(asPub);
    const ikm = Buffer.from(hkdfSync("sha256", shared, auth, Buffer.concat([Buffer.from("WebPush: info\0"), uaPub, asPub]), 32));
    const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
    const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
    const d = createDecipheriv("aes-128-gcm", cek, nonce);
    d.setAuthTag(ct.subarray(ct.length - 16));
    const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
    expect(plain[plain.length - 1]).toBe(2); // разделитель последней записи
    expect(plain.subarray(0, -1).toString()).toBe(msg);
  });

  it("VAPID: JWT подписан ключом сервера, aud — адрес push-сервиса", async () => {
    const keys = await vapidKeys();
    const h = vapidHeader("https://fcm.googleapis.com/fcm/send/abc", keys, "mailto:test@example.org", 1_800_000_000);
    const [, jwt, k] = h.match(/^vapid t=([^,]+), k=(.+)$/)!;
    expect(k).toBe(keys.publicKey);
    const [hd, cl, sig] = jwt.split(".");
    const claims = JSON.parse(Buffer.from(cl, "base64url").toString());
    expect(claims).toMatchObject({ aud: "https://fcm.googleapis.com", sub: "mailto:test@example.org", exp: 1_800_000_000 + 12 * 3600 });
    const raw = Buffer.from(k, "base64url");
    const pub = createPublicKey({ key: { kty: "EC", crv: "P-256", x: raw.subarray(1, 33).toString("base64url"), y: raw.subarray(33).toString("base64url") }, format: "jwk" });
    expect(verify("sha256", Buffer.from(`${hd}.${cl}`), { key: pub, dsaEncoding: "ieee-p1363" }, Buffer.from(sig, "base64url"))).toBe(true);
    // ключи не пересоздаются при повторном вызове
    expect((await vapidKeys()).publicKey).toBe(keys.publicKey);
  });

  it("отправляем только на известные push-сервисы по HTTPS (защита от SSRF)", () => {
    expect(isAllowedEndpoint("https://fcm.googleapis.com/fcm/send/x")).toBe(true);
    expect(isAllowedEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(isAllowedEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(isAllowedEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isAllowedEndpoint("https://169.254.169.254/latest")).toBe(false);
    expect(isAllowedEndpoint("https://evil-googleapis.com/x")).toBe(false);
  });
});

describe("Календарь .ics", () => {
  it("строки не длиннее 75 байт и склеиваются обратно без потерь (кириллица — 2 байта)", () => {
    const line = "SUMMARY:" + "Международные финансовые рынки (Семинар) — перенос по просьбе преподавателя ".repeat(3);
    const folded = fold(line);
    for (const part of folded.split("\r\n")) expect(Buffer.byteLength(part)).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n ").join("")).toBe(line);
  });
});

import { morningText } from "@/server/morning";
describe("Утренняя сводка", () => {
  it("считает только неотменённые пары и называет первую", () => {
    const d = (h: number) => new Date(Date.UTC(2026, 10, 13, h - 3, 0));
    const t = morningText([
      { title: "Макроэкономика", startsAt: d(9), room: "2001", buildingName: "Главный корпус", status: "CANCELLED" },
      { title: "МФР", startsAt: d(10), room: "3047", buildingName: "Главный корпус", status: "SCHEDULED" },
      { title: "Испанский", startsAt: d(13), room: "518", buildingName: "Корпус Б", status: "MOVED" },
    ]);
    expect(t.title).toBe("Сегодня 2 пары");
    expect(t.body).toBe("Первая — 10:00, «МФР», ауд. 3047 (Главный корпус). Изменений: 2.");
    expect(morningText([]).title).toBe("Сегодня пар нет");
  });
});
