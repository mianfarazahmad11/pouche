import crypto from "crypto";

const RESET_TOKEN_TTL_MINUTES = 60;

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashPasswordResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetUrl(token) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  const parsed = new URL(baseUrl);
  parsed.pathname = "/reset-password";
  parsed.searchParams.set("token", token);
  return parsed.toString();
}
