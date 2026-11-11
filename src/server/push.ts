import "server-only";
import { createECDH, createPrivateKey, generateKeyPairSync, hkdfSync, randomBytes, sign, createCipheriv, type KeyObject } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema as t } from "@/server/db";

/**
 * Web Push без сторонних библиотек (D-032): VAPID (RFC 8292) + шифрование aes128gcm (RFC 8291) на node:crypto.
 * Ключи VAPID создаются при первом запуске и хранятся в app_settings (или задаются в env VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
 * Само сообщение шифруется ключом браузера — push-сервис (Google, Apple, Mozilla) его не видит.
 */
const b64u = (b: Buffer) => b.toString("base64url");
const unb64u = (s: string) => Buffer.from(s, "base64url");

type Vapid = { publicKey: string; privateKey: KeyObject };
let cached: Vapid | null = null;

function fromJwk(d: string, x: string, y: string): Vapid {
  const privateKey = createPrivateKey({ key: { kty: "EC", crv: "P-256", d, x, y }, format: "jwk" });
  return { privateKey, publicKey: b64u(Buffer.concat([Buffer.from([4]), unb64u(x), unb64u(y)])) };
}

/** Публичный ключ — для браузера (applicationServerKey), приватный — для подписи JWT. */
export async function vapidKeys(): Promise<Vapid> {
  if (cached) return cached;
  const envPub = process.env.VAPID_PUBLIC_KEY, envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) {
    const raw = unb64u(envPub);
    cached = fromJwk(envPriv, b64u(raw.subarray(1, 33)), b64u(raw.subarray(33, 65)));
    return cached;
  }
  const [row] = await db.select().from(t.appSettings).where(eq(t.appSettings.key, "vapid_jwk"));
  if (row) {
    const j = JSON.parse(row.value) as { d: string; x: string; y: string };
    cached = fromJwk(j.d, j.x, j.y);
    return cached;
  }
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const jwk = privateKey.export({ format: "jwk" }) as { d: string; x: string; y: string };
  await db.insert(t.appSettings).values({ key: "vapid_jwk", value: JSON.stringify({ d: jwk.d, x: jwk.x, y: jwk.y }) }).onConflictDoNothing();
  const [again] = await db.select().from(t.appSettings).where(eq(t.appSettings.key, "vapid_jwk")); // если параллельно создал другой процесс
  const j = JSON.parse(again.value) as { d: string; x: string; y: string };
  cached = fromJwk(j.d, j.x, j.y);
  return cached;
}

/** Заголовок Authorization: vapid t=<JWT ES256>, k=<публичный ключ>. */
export function vapidHeader(endpoint: string, keys: Vapid, subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@meridian.example", nowSec = Math.floor(Date.now() / 1000)) {
  const header = b64u(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: nowSec + 12 * 3600, sub: subject })));
  const sig = sign("sha256", Buffer.from(`${header}.${claims}`), { key: keys.privateKey, dsaEncoding: "ieee-p1363" });
  return `vapid t=${header}.${claims}.${b64u(sig)}, k=${keys.publicKey}`;
}

/** Шифрование тела сообщения для конкретного браузера (RFC 8291, одна запись aes128gcm). */
export function encryptPayload(payload: Buffer, p256dh: string, auth: string, salt = randomBytes(16)) {
  const uaPublic = unb64u(p256dh);
  const authSecret = unb64u(auth);
  const ecdh = createECDH("prime256v1");
  const asPublic = ecdh.generateKeys();
  const shared = ecdh.computeSecret(uaPublic);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", shared, authSecret, keyInfo, 32));
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([cipher.update(Buffer.concat([payload, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, body]);
}

export type PushKind = "schedule" | "requests" | "announcements" | "morning" | "test";
export type PushMessage = { title: string; body: string; url: string; tag?: string };

const ALLOWED_PUSH_HOSTS = /(^|\.)(googleapis\.com|push\.apple\.com|mozilla\.com|mozaws\.net|windows\.com|notify\.windows\.com|yandex\.(ru|net))$/;
/** Защита от SSRF: отправляем только на адреса известных push-сервисов по HTTPS. */
export function isAllowedEndpoint(endpoint: string) {
  try { const u = new URL(endpoint); return u.protocol === "https:" && ALLOWED_PUSH_HOSTS.test(u.hostname); } catch { return false; }
}

async function sendOne(sub: { id: string; endpoint: string; p256dh: string; auth: string }, msg: PushMessage, keys: Vapid) {
  if (!isAllowedEndpoint(sub.endpoint)) return;
  try {
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: { TTL: "86400", Urgency: "high", "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", Authorization: vapidHeader(sub.endpoint, keys) },
      body: new Uint8Array(encryptPayload(Buffer.from(JSON.stringify(msg)), sub.p256dh, sub.auth)),
      signal: AbortSignal.timeout(8000),
    });
    // 404/410 — подписка больше не действует (удалили приложение, отозвали разрешение): убираем её.
    if (res.status === 404 || res.status === 410) await db.delete(t.pushSubscriptions).where(eq(t.pushSubscriptions.id, sub.id));
    else if (!res.ok) console.warn(`[push] ${new URL(sub.endpoint).hostname}: ${res.status}`);
  } catch (e) {
    console.warn("[push] не отправлено:", (e as Error).message);
  }
}

/** Разослать уведомление на все устройства пользователей с учётом их настроек. Ошибки не роняют основное действие. */
export async function pushToUsers(userIds: string[], kind: PushKind, msg: PushMessage) {
  if (!userIds.length) return;
  try {
    const subs = await db.select({ id: t.pushSubscriptions.id, userId: t.pushSubscriptions.userId, endpoint: t.pushSubscriptions.endpoint, p256dh: t.pushSubscriptions.p256dh, auth: t.pushSubscriptions.auth })
      .from(t.pushSubscriptions).where(inArray(t.pushSubscriptions.userId, [...new Set(userIds)]));
    if (!subs.length) return;
    const prefs = await db.select().from(t.notifyPrefs).where(inArray(t.notifyPrefs.userId, [...new Set(subs.map((s) => s.userId))]));
    const pref = new Map(prefs.map((p) => [p.userId, p]));
    const wants = (uid: string) => {
      const p = pref.get(uid);
      if (kind === "test") return true;
      if (!p) return kind !== "morning";
      return p[kind];
    };
    const keys = await vapidKeys();
    await Promise.all(subs.filter((s) => wants(s.userId)).map((s) => sendOne(s, msg, keys)));
  } catch (e) {
    console.warn("[push] рассылка не удалась:", (e as Error).message);
  }
}

export async function getPrefs(userId: string) {
  const [p] = await db.select().from(t.notifyPrefs).where(eq(t.notifyPrefs.userId, userId));
  return p ?? { userId, schedule: true, requests: true, announcements: true, morning: false };
}

export async function savePrefs(userId: string, p: { schedule: boolean; requests: boolean; announcements: boolean; morning: boolean }) {
  await db.insert(t.notifyPrefs).values({ userId, ...p }).onConflictDoUpdate({ target: t.notifyPrefs.userId, set: p });
}

export async function saveSubscription(userId: string, s: { endpoint: string; p256dh: string; auth: string }, userAgent: string | null) {
  await db.insert(t.pushSubscriptions).values({ userId, ...s, userAgent }).onConflictDoUpdate({ target: t.pushSubscriptions.endpoint, set: { userId, p256dh: s.p256dh, auth: s.auth, userAgent } });
}

export async function removeSubscription(userId: string, endpoint: string) {
  await db.delete(t.pushSubscriptions).where(and(eq(t.pushSubscriptions.userId, userId), eq(t.pushSubscriptions.endpoint, endpoint)));
}

export async function countSubscriptions(userId: string) {
  return (await db.select({ id: t.pushSubscriptions.id }).from(t.pushSubscriptions).where(eq(t.pushSubscriptions.userId, userId))).length;
}

