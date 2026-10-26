/**
 * Cryptographic helpers using standard WebCrypto API
 * Compatible with Cloudflare Workers and Node.js
 */

const BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32 without I, L, O, U

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Constant-time byte string comparison to prevent timing attacks
 */
export function timingSafeEqual(
  a: string | Uint8Array,
  b: string | Uint8Array,
): boolean {
  const aBytes = typeof a === "string" ? new TextEncoder().encode(a) : a;
  const bBytes = typeof b === "string" ? new TextEncoder().encode(b) : b;

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

/**
 * Hash a PIN or password using PBKDF2-SHA256
 * Returns format: pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>
 */
export async function hashPin(
  pin: string,
  iterations = 100_000,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const saltB64 = bytesToBase64(salt);
  const hashB64 = bytesToBase64(new Uint8Array(derivedBits));

  return `pbkdf2$sha256$${iterations}$${saltB64}$${hashB64}`;
}

/**
 * Verify a PIN against a stored hash string formatted as:
 * pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>
 */
export async function verifyPin(
  pin: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    return false;
  }

  const iterations = Number.parseInt(parts[2], 10);
  if (Number.isNaN(iterations) || iterations <= 0) {
    return false;
  }

  const saltB64 = parts[3];
  const expectedHashB64 = parts[4];

  let salt: Uint8Array;
  try {
    salt = base64ToBytes(saltB64);
  } catch {
    return false;
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const actualHashB64 = bytesToBase64(new Uint8Array(derivedBits));
  return timingSafeEqual(actualHashB64, expectedHashB64);
}

/**
 * Generate a 32-byte secure random session token in base64url format
 */
export function generateSessionToken(byteLength = 32): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return bytesToBase64Url(randomBytes);
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
