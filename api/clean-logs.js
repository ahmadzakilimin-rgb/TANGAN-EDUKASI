import { neon } from "@neondatabase/serverless";
import { getAdminSession, isSameOrigin } from "../server/adminAuth.js";

const tableSetup = `
  CREATE TABLE IF NOT EXISTS clean_logs (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    activity_date DATE NOT NULL,
    participants BIGINT NOT NULL CHECK (participants > 0),
    plastic_kg NUMERIC(10, 1) NOT NULL DEFAULT 0 CHECK (plastic_kg >= 0),
    other_kg NUMERIC(10, 1) NOT NULL DEFAULT 0 CHECK (other_kg >= 0),
    bags BIGINT NOT NULL DEFAULT 0 CHECK (bags >= 0),
    notes VARCHAR(300) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

function send(res, status, payload) {
  res.status(status).json(payload);
}

function parseBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      throw Object.assign(new Error("Request body must be valid JSON."), { status: 400 });
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("A JSON object is required."), { status: 400 });
  }
  return body;
}

function validEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
  const date = typeof entry.date === "string" ? entry.date : "";
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date;
  const validText = (value, maxLength, required = false) =>
    typeof value === "string" &&
    Array.from(value.trim()).length <= maxLength &&
    (!required || value.trim().length > 0);
  const validCount = (value, min) =>
    Number.isSafeInteger(value) && value >= min && value <= 4_294_967_295;

  return (
    typeof entry.id === "string" &&
    /^[A-Za-z0-9-]{1,64}$/.test(entry.id) &&
    validText(entry.title, 100, true) &&
    validText(entry.location, 100, true) &&
    validDate &&
    validCount(entry.participants, 1) &&
    typeof entry.plasticKg === "number" &&
    Number.isFinite(entry.plasticKg) &&
    entry.plasticKg >= 0 &&
    entry.plasticKg <= 999_999_999.9 &&
    typeof entry.otherKg === "number" &&
    Number.isFinite(entry.otherKg) &&
    entry.otherKg >= 0 &&
    entry.otherKg <= 999_999_999.9 &&
    validCount(entry.bags, 0) &&
    validText(entry.notes, 300)
  );
}

function databaseEntry(row) {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    date: row.date,
    participants: Number(row.participants),
    plasticKg: Number(row.plasticKg),
    otherKg: Number(row.otherKg),
    bags: Number(row.bags),
    notes: row.notes,
  };
}

function parameters(entry, offset = 0) {
  return [
    entry.id,
    entry.title.trim(),
    entry.location.trim(),
    entry.date,
    entry.participants,
    entry.plasticKg,
    entry.otherKg,
    entry.bags,
    entry.notes.trim(),
  ].map((value, index) => `$${offset + index + 1}`);
}

export default async function handler(req, res) {
  const method = req.method || "GET";
  if (!["GET", "POST", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return send(res, 405, { error: "Method not allowed." });
  }
  if (method !== "GET" && !isSameOrigin(req)) {
    return send(res, 403, { error: "Cross-origin request blocked." });
  }
  if (method !== "GET") {
    try {
      if (!getAdminSession(req)) {
        return send(res, 401, { error: "Admin login diperlukan untuk mengubah catatan." });
      }
    } catch (error) {
      console.error("Tangan Edukasi admin authentication configuration:", error.message);
      return send(res, 503, { error: error.message });
    }
  }
  if (!process.env.DATABASE_URL) {
    return send(res, 503, { error: "Database is not configured. Set DATABASE_URL in Vercel." });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql.query(tableSetup);

    if (method === "GET") {
      const rows = await sql.query(`
        SELECT id, title, location, activity_date::text AS date, participants,
          plastic_kg AS "plasticKg", other_kg AS "otherKg", bags, notes
        FROM clean_logs
        ORDER BY activity_date DESC, created_at DESC
      `);
      return send(res, 200, { entries: rows.map(databaseEntry) });
    }

    if (method === "DELETE") {
      const id = typeof req.query?.id === "string" ? req.query.id : "";
      if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) {
        return send(res, 400, { error: "A valid entry id is required." });
      }
      const rows = await sql.query("DELETE FROM clean_logs WHERE id = $1 RETURNING id", [id]);
      return send(res, 200, { deleted: rows.length > 0 });
    }

    const body = parseBody(req.body);
    const entries = body.mode === "import" ? body.entries : [body.entry];
    if (!Array.isArray(entries) || entries.length > 500) {
      return send(res, 400, { error: "The request must contain at most 500 entries." });
    }
    if (!entries.every(validEntry)) {
      return send(res, 422, { error: "One or more clean-up entries contain invalid fields." });
    }
    if (entries.length === 0) return send(res, 200, { saved: 0 });

    const values = entries.flatMap((entry) => [
      entry.id,
      entry.title.trim(),
      entry.location.trim(),
      entry.date,
      entry.participants,
      entry.plasticKg,
      entry.otherKg,
      entry.bags,
      entry.notes.trim(),
    ]);
    const placeholders = entries.map((entry, index) => `(${parameters(entry, index * 9).join(", ")})`).join(", ");
    const conflictClause = body.mode === "import" ? "ON CONFLICT (id) DO NOTHING" : "";
    const rows = await sql.query(
      `INSERT INTO clean_logs
        (id, title, location, activity_date, participants, plastic_kg, other_kg, bags, notes)
       VALUES ${placeholders}
       ${conflictClause}
       RETURNING id`,
      values,
    );
    return send(res, 200, { saved: rows.length });
  } catch (error) {
    if (error?.status) return send(res, error.status, { error: error.message });
    console.error("Tangan Edukasi clean-logs API failed:", error);
    return send(res, 500, { error: "Database service is unavailable. Check the Vercel DATABASE_URL configuration." });
  }
}
