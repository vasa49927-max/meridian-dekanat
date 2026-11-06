import "server-only";
import QRCode from "qrcode";
import { env } from "@/server/env";

export const verifyUrl = (code: string) => `${env.APP_URL.replace(/\/$/, "")}/verify/${code}`;

/** QR-код проверки подлинности: SVG, генерируется на сервере (без внешних сервисов). */
export async function qrSvg(code: string) {
  return QRCode.toString(verifyUrl(code), { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#14244b", light: "#ffffff" } });
}
