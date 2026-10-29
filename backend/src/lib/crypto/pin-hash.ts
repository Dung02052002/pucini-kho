/**
 * Hash & verify PIN/mật khẩu bằng PBKDF2-SHA256 (WebCrypto).
 * Định dạng lưu DB: pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>
 *
 * Lưu ý: Cloudflare Workers giới hạn PBKDF2 tối đa 100.000 vòng,
 * nên DEFAULT_PIN_ITERATIONS không thể tăng thêm.
 */
import { base64ToBytes, bytesToBase64 } from "./encoding";
import { timingSafeEqual } from "./timing-safe";

export const DEFAULT_PIN_ITERATIONS = 100_000;

/** Chặn hash "độc" trong DB khiến 1 lần verify ngốn hết CPU của Worker */
const MAX_PIN_ITERATIONS = 100_000;

async function derivePbkdf2(
  pin: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256,
  );

  return new Uint8Array(derivedBits);
}

/**
 * Hash PIN với salt ngẫu nhiên 16 byte.
 */
export async function hashPin(
  pin: string,
  iterations = DEFAULT_PIN_ITERATIONS,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePbkdf2(pin, salt, iterations);
  return `pbkdf2$sha256$${iterations}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

/**
 * Verify PIN với chuỗi hash đã lưu. Trả false (không throw) khi hash sai định dạng.
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
  if (
    Number.isNaN(iterations) ||
    iterations <= 0 ||
    iterations > MAX_PIN_ITERATIONS
  ) {
    return false;
  }

  let salt: Uint8Array;
  try {
    salt = base64ToBytes(parts[3]);
  } catch {
    return false;
  }

  const actualHash = await derivePbkdf2(pin, salt, iterations);
  return timingSafeEqual(bytesToBase64(actualHash), parts[4]);
}

let dummyHashPromise: Promise<string> | undefined;

/**
 * Chạy verify với 1 hash giả khi không tìm thấy user, để thời gian phản hồi
 * của "sai username" và "sai PIN" như nhau → chống dò username qua timing.
 * Hash giả được tạo 1 lần rồi cache theo isolate.
 */
export async function verifyAgainstDummyHash(pin: string): Promise<void> {
  dummyHashPromise ??= hashPin("dummy-pin-for-timing-equalization");
  await verifyPin(pin, await dummyHashPromise);
}
