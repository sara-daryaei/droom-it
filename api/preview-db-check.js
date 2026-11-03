import { getSql } from "./start-project.js";
import { timingSafeEqual } from "node:crypto";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "codex/cloudflare-turnstile") return res.status(404).end();
  const expected = process.env.PREVIEW_DB_CHECK_SECRET;
  const supplied = req.headers["x-diagnostic-secret"];
  if (!expected || typeof supplied !== "string" || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(404).end();
  if (req.method !== "GET") return res.status(405).end();
  try {
    const matches = ["POSTGRES_URL", "DATABASE_URL"].every(key => new URL((process.env[key] || "").trim().replace(/^['"]|['"]$/g, "")).hostname.split(".")[0].replace(/-pooler$/, "") === "ep-wispy-flower-apeuzpic");
    if (!matches) return res.status(409).json({ ok: false, endpointMatches: false });
    const sql = getSql();
    const rows = await sql`SELECT count(*)::int AS count FROM public.project_requests`;
    const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_requests'`;
    const schemaMatches = ["id", "name", "email", "message", "created_at", "request_type"].every(name => columns.some(c => c.column_name === name));
    return res.status(schemaMatches && rows[0].count === 0 ? 200 : 409).json({ ok: schemaMatches && rows[0].count === 0, endpointMatches: true, schemaMatches, empty: rows[0].count === 0 });
  } catch { return res.status(503).json({ ok: false }); }
}
