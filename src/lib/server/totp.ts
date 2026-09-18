import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "CMTG Client Portal";

export function generateSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function buildTotp(secret: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({ issuer: ISSUER, label, secret, algorithm: "SHA1", digits: 6, period: 30 });
}

export async function generateEnrollmentQrCode(secret: string, label: string): Promise<string> {
  const uri = buildTotp(secret, label).toString();
  return QRCode.toDataURL(uri);
}

export function verifyTotpCode(secret: string, label: string, code: string): boolean {
  const delta = buildTotp(secret, label).validate({ token: code, window: 1 });
  return delta !== null;
}
