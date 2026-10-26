import { generateQrToken, generateSessionToken } from "./crypto";

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function generateClientUuid(): string {
  return crypto.randomUUID();
}

export function generateSessionId(): string {
  return generateSessionToken(32);
}

export { generateQrToken };
