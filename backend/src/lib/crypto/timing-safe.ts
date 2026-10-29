/**
 * So sánh 2 chuỗi/bytes trong thời gian hằng định để chống timing attack.
 * Lưu ý: vẫn trả false sớm khi độ dài khác nhau — chỉ dùng cho dữ liệu có độ dài cố định
 * (hash, chữ ký HMAC), không dùng để so sánh trực tiếp mật khẩu thô.
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
