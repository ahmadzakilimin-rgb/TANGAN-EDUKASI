import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "tandu_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export function getAdminConfig() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    throw new Error("Set ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET in Vercel.");
  }
  if (ADMIN_PASSWORD.length < 16 || ADMIN_SESSION_SECRET.length < 32) {
    throw new Error("ADMIN_PASSWORD must be at least 16 characters and ADMIN_SESSION_SECRET at least 32 characters.");
  }
  return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, secret: ADMIN_SESSION_SECRET };
}

export function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const requestHost = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase();
    return originHost === requestHost;
  } catch {
    return false;
  }
}

function safeEqual(left, right) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function signature(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function readCookie(req) {
  const cookies = String(req.headers.cookie || "").split(";");
  const cookie = cookies.find((item) => item.trim().startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.trim().slice(COOKIE_NAME.length + 1) : "";
}

export function getAdminSession(req) {
  const { username, secret } = getAdminConfig();
  const token = readCookie(req);
  if (!token || token.length > 2048) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  if (!safeEqual(token.slice(separator + 1), signature(payload, secret))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.username !== username || !Number.isInteger(session.expiresAt) || session.expiresAt <= Date.now()) return null;
    return { username };
  } catch {
    return null;
  }
}

export function credentialsMatch(input, config) {
  const username = String(input?.username || "");
  const password = String(input?.password || "");
  return username.length <= 100 &&
    password.length <= 256 &&
    safeEqual(username, config.username) &&
    safeEqual(password, config.password);
}

export function setAdminSessionCookie(res, username, secret) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  })).toString("base64url");
  const token = `${payload}.${signature(payload, secret)}`;
  const secure = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`,
  );
}

export function clearAdminSessionCookie(res) {
  const secure = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`,
  );
}
