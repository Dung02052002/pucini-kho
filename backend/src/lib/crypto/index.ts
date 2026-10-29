/**
 * Cryptographic helpers using standard WebCrypto API
 * Compatible with Cloudflare Workers and Node.js
 *
 * Điểm import duy nhất cho phần còn lại của app: `import { ... } from "../lib/crypto"`.
 */
export { base64ToBytes, bytesToBase64, bytesToBase64Url } from "./encoding";
export {
  DEFAULT_PIN_ITERATIONS,
  hashPin,
  verifyAgainstDummyHash,
  verifyPin,
} from "./pin-hash";
export { timingSafeEqual } from "./timing-safe";
export {
  generateQrToken,
  generateSessionToken,
  hashSessionToken,
} from "./token";
