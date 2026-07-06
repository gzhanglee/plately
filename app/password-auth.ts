import { cookies } from "next/headers";
import { env } from "cloudflare:workers";

export const PASSWORD_COOKIE = "plateful_access";
export const PASSWORD_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

type RuntimeEnv = {
  PLATEFUL_PASSWORD?: string;
  PLATEFUL_SESSION_SECRET?: string;
};

export function isPasswordConfigured() {
  return Boolean(readRuntimeValue("PLATEFUL_PASSWORD") && readRuntimeValue("PLATEFUL_SESSION_SECRET"));
}

export async function isUnlocked() {
  if (!isPasswordConfigured()) return false;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(PASSWORD_COOKIE)?.value;
  if (!cookieValue) return false;

  return timingSafeEqual(cookieValue, await createSessionCookieValue());
}

export async function isValidPassword(password: string) {
  const configuredPassword = readRuntimeValue("PLATEFUL_PASSWORD");
  if (!configuredPassword) return false;

  return timingSafeEqual(password.trim(), configuredPassword);
}

export async function createSessionCookieValue() {
  const password = readRuntimeValue("PLATEFUL_PASSWORD");
  const sessionSecret = readRuntimeValue("PLATEFUL_SESSION_SECRET");
  return sha256(`${password}:${sessionSecret}`);
}

function readRuntimeValue(key: keyof RuntimeEnv) {
  const runtimeEnv = env as unknown as RuntimeEnv;
  return runtimeEnv[key] ?? process.env[key] ?? "";
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return mismatch === 0;
}
