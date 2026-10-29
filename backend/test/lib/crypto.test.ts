import { describe, expect, it } from "vitest";
import {
  generateQrToken,
  generateSessionToken,
  hashPin,
  hashSessionToken,
  timingSafeEqual,
  verifyPin,
} from "../../src/lib/crypto";

describe("Crypto Utilities Unit Tests", () => {
  describe("PBKDF2 PIN Hashing and Verification", () => {
    it("hashes and verifies correctly with correct PIN", async () => {
      const pin = "123456";
      const hash = await hashPin(pin, 1000);

      expect(hash.startsWith("pbkdf2$sha256$1000$")).toBe(true);
      const isMatch = await verifyPin(pin, hash);
      expect(isMatch).toBe(true);
    });

    it("rejects incorrect PIN", async () => {
      const pin = "123456";
      const hash = await hashPin(pin, 1000);

      const isMatch = await verifyPin("654321", hash);
      expect(isMatch).toBe(false);
    });

    it("returns false for invalid or corrupted hash format", async () => {
      expect(await verifyPin("123456", "invalid_hash_string")).toBe(false);
      expect(await verifyPin("123456", "pbkdf2$md5$1000$salt$hash")).toBe(
        false,
      );
      expect(await verifyPin("123456", "pbkdf2$sha256$invalid$salt$hash")).toBe(
        false,
      );
      expect(
        await verifyPin("123456", "pbkdf2$sha256$1000$invalid_b64$hash"),
      ).toBe(false);
    });

    it("rejects stored hashes with iterations above the Workers limit", async () => {
      expect(
        await verifyPin("123456", "pbkdf2$sha256$100000000$c2FsdA==$aGFzaA=="),
      ).toBe(false);
    });
  });

  describe("hashSessionToken", () => {
    it("is deterministic, base64url and differs from the raw token", async () => {
      const token = generateSessionToken();
      const hash1 = await hashSessionToken(token);
      const hash2 = await hashSessionToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(token);
      expect(hash1).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });
  });

  describe("timingSafeEqual", () => {
    it("returns true for equal strings and byte arrays", () => {
      expect(timingSafeEqual("abc123XYZ", "abc123XYZ")).toBe(true);
      const arr1 = new Uint8Array([1, 2, 3, 4]);
      const arr2 = new Uint8Array([1, 2, 3, 4]);
      expect(timingSafeEqual(arr1, arr2)).toBe(true);
    });

    it("returns false for different lengths or values", () => {
      expect(timingSafeEqual("abc123XYZ", "abc123XY")).toBe(false);
      expect(timingSafeEqual("abc123XYZ", "abc123XYW")).toBe(false);
    });
  });

  describe("Token Generators", () => {
    it("generates 32-byte secure session token in base64url format", () => {
      const token = generateSessionToken(32);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThanOrEqual(40);
      expect(token).not.toContain("+");
      expect(token).not.toContain("/");
      expect(token).not.toContain("=");
    });

    it("generates 8-character Crockford base32 QR token", () => {
      const qrToken = generateQrToken(8);
      expect(qrToken.length).toBe(8);
      // Valid base32 Crockford characters
      expect(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(qrToken)).toBe(
        true,
      );
    });
  });
});
