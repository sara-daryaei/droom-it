import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "node:crypto";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "codex/cloudflare-turnstile") return res.status(404).end();
  const expected = process.env.PREVIEW_DB_CHECK_SECRET;
  const supplied = req.headers["x-diagnostic-secret"];
  if (!expected || typeof supplied !== "string" || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(404).end();
  if (req.method !== "GET") return res.status(405).end();
  try {
    const connection = (process.env.POSTGRES_URL || process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
    const endpoint = new URL(connection).hostname.split(".")[0].replace(/-pooler$/, "");
    if (endpoint !== "ep-wispy-flower-apeuzpic") return res.status(409).json({ ok: false, reason: "endpoint_mismatch" });
    const sql = neon(connection);
    const rows = await sql`SELECT count(*)::int AS count FROM public.project_requests`;
    const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_requests'`;
    const schemaMatches = ["id", "name", "email", "message", "created_at", "request_type"].every(name => columns.some(c => c.column_name === name));
    return res.status(rows[0].count === 0 && schemaMatches ? 200 : 409).json({ ok: rows[0].count === 0 && schemaMatches, endpointMatches: true, schemaMatches, empty: rows[0].count === 0 });
  } catch { return res.status(503).json({ ok: false, reason: "read_only_check_failed" }); }
}
