/**
 * Sinh & hash token ngẫu nhiên (session token, QR token).
 */
import { bytesToBase64Url } from "./encoding";

const BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32 without I, L, O, U

/**
 * Generate a 32-byte secure random session token in base64url format
 */
export function generateSessionToken(byteLength = 32): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return bytesToBase64Url(randomBytes);
}

/**
 * Hash session token bằng SHA-256 (base64url) trước khi lưu/tra cứu DB.
 * Cookie giữ token gốc, DB chỉ giữ hash → lộ DB không chiếm được phiên đăng nhập.
 * Token đã có 256 bit entropy nên SHA-256 thuần (không salt) là đủ an toàn.
 */
export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return bytesToBase64Url(new Uint8Array(digest));
}

/**
 * Generate random base32 token (8 characters by default, ~40 bits of entropy)
 * Used for location QR tokens (e.g. 7Kx9QpZa)
 */
export function generateQrToken(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let token = "";
  for (let i = 0; i < length; i++) {
    token += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }
  return token;
}
