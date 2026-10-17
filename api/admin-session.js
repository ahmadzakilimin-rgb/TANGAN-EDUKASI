import {
  clearAdminSessionCookie,
  credentialsMatch,
  getAdminConfig,
  getAdminSession,
  isSameOrigin,
  setAdminSessionCookie,
} from "../server/adminAuth.js";

function send(res, status, payload) {
  return res.status(status).json(payload);
}

function parseBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

export default function handler(req, res) {
  const method = req.method || "GET";
  if (!["GET", "POST", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return send(res, 405, { error: "Method not allowed." });
  }
  if (method !== "GET" && !isSameOrigin(req)) {
    return send(res, 403, { error: "Cross-origin request blocked." });
  }

  try {
    const config = getAdminConfig();
    if (method === "GET") {
      const session = getAdminSession(req);
      return send(res, 200, { authenticated: Boolean(session), username: session?.username || "" });
    }
    if (method === "DELETE") {
      clearAdminSessionCookie(res);
      return send(res, 200, { authenticated: false });
    }

    const body = parseBody(req.body);
    if (!body) return send(res, 400, { error: "A valid JSON object is required." });
    if (!credentialsMatch(body, config)) {
      return send(res, 401, { error: "Username atau password admin salah." });
    }

    setAdminSessionCookie(res, config.username, config.secret);
    return send(res, 200, { authenticated: true, username: config.username });
  } catch (error) {
    console.error("Tangan Edukasi admin authentication configuration:", error.message);
    return send(res, 503, { error: error.message });
  }
}
