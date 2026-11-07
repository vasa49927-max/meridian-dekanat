import "server-only";
import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";

/**
 * Подключает дополнительные корневые сертификаты из папки certs/ (нужен сертификат НУЦ Минцифры для GigaChat).
 * Принимает и PEM, и двоичный DER (.cer с Госуслуг) — DER переводится в PEM на лету.
 * Проверка TLS НЕ отключается: мы лишь добавляем доверенный корень к стандартному набору Node.
 */
export function loadExtraCaCertificates(dir = path.join(process.cwd(), "certs")) {
  if (!fs.existsSync(dir) || typeof tls.setDefaultCACertificates !== "function") return 0;
  const pems: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (!/\.(pem|crt|cer)$/i.test(name)) continue;
    const buf = fs.readFileSync(path.join(dir, name));
    const text = buf.toString("utf8");
    if (text.includes("-----BEGIN CERTIFICATE-----")) {
      pems.push(...(text.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? []));
    } else {
      const b64 = buf.toString("base64").match(/.{1,64}/g)!.join("\n");
      pems.push(`-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----`);
    }
  }
  if (!pems.length) return 0;
  tls.setDefaultCACertificates([...tls.getCACertificates("default"), ...pems]);
  console.log(`[certs] добавлено корневых сертификатов: ${pems.length}`);
  return pems.length;
}
