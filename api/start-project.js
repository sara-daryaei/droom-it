import { neon } from "@neondatabase/serverless";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSql() {
  const connectionString = (process.env.POSTGRES_URL || process.env.DATABASE_URL || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!connectionString) {
    throw new Error("Missing Neon connection string");
  }

  return neon(connectionString);
}

async function readBody(request) {
  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return request.body || {};
  }

  if (typeof request.body === "object" && request.body !== null) {
    return request.body;
  }

  return {};
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS project_requests (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      message TEXT NOT NULL,
      language TEXT,
      source TEXT DEFAULT 'website',
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const body = await readBody(request);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const company = String(body.company || "").trim();
    const message = String(body.message || "").trim();
    const language = String(body.language || "").trim().slice(0, 12) || "unknown";
    const userAgent = String(request.headers["user-agent"] || "").slice(0, 500);

    if (!name || !email || !message) {
      return response.status(400).json({
        ok: false,
        message: "Name, email and message are required.",
      });
    }

    if (!emailPattern.test(email)) {
      return response.status(400).json({
        ok: false,
        message: "Please enter a valid email address.",
      });
    }

    const sql = getSql();
    await ensureTable(sql);

    const rows = await sql`
      INSERT INTO project_requests (
        name,
        email,
        company,
        message,
        language,
        user_agent
      )
      VALUES (
        ${name},
        ${email},
        ${company || null},
        ${message},
        ${language},
        ${userAgent}
      )
      RETURNING id, created_at
    `;

    return response.status(201).json({
      ok: true,
      id: rows[0].id,
      createdAt: rows[0].created_at,
    });
  } catch (error) {
    console.error("Project request failed", error);

    return response.status(500).json({
      ok: false,
      message: "Something went wrong. Please try again or email info@droomit.be.",
    });
  }
}
