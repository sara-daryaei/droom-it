import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultRecipient = "info@droomit.be";

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
      website_url TEXT,
      project_type TEXT,
      request_type TEXT DEFAULT 'project',
      message TEXT NOT NULL,
      language TEXT,
      source TEXT DEFAULT 'website',
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS website_url TEXT`;
  await sql`ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS project_type TEXT`;
  await sql`ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'project'`;
}

function getEmailConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASSWORD || "").trim();
  const from = (process.env.CONTACT_FROM_EMAIL || user || defaultRecipient).trim();
  const to = (process.env.CONTACT_TO_EMAIL || defaultRecipient).trim();

  if (!host || !port || !user || !pass || !from || !to) {
    return null;
  }

  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465,
    auth: { user, pass },
    from,
    to: to.split(",").map((email) => email.trim()).filter(Boolean),
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmail({ id, createdAt, name, email, company, websiteUrl, projectType, requestType, message, language }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompany = escapeHtml(company || "Not provided");
  const safeWebsiteUrl = escapeHtml(websiteUrl || "Not provided");
  const safeProjectType = escapeHtml(projectType || "Not specified");
  const safeRequestType = escapeHtml(requestType || "project");
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br />");
  const safeLanguage = escapeHtml(language);
  const safeCreatedAt = escapeHtml(new Date(createdAt).toLocaleString("en-GB", { timeZone: "Europe/Brussels" }));

  const text = [
    `New DROOM IT ${requestType === "audit" ? "website audit" : "project"} request`,
    "",
    `Request ID: ${id}`,
    `Received: ${safeCreatedAt}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "Not provided"}`,
    `Website URL: ${websiteUrl || "Not provided"}`,
    `Project type: ${projectType || "Not specified"}`,
    `Request type: ${requestType || "project"}`,
    `Language: ${language}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111315;max-width:640px">
      <h1 style="font-size:22px;margin:0 0 16px">New DROOM IT ${safeRequestType === "audit" ? "website audit" : "project"} request</h1>
      <p style="margin:0 0 20px;color:#5d6265">A visitor submitted the contact form on www.droomit.be.</p>
      <table style="border-collapse:collapse;width:100%;margin:0 0 20px">
        <tr><td style="padding:8px 0;font-weight:700;width:130px">Request ID</td><td>${escapeHtml(id)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Received</td><td>${safeCreatedAt}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Name</td><td>${safeName}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Email</td><td><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Company</td><td>${safeCompany}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Website URL</td><td>${safeWebsiteUrl}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Project type</td><td>${safeProjectType}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Request type</td><td>${safeRequestType}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Language</td><td>${safeLanguage}</td></tr>
      </table>
      <div style="border-top:1px solid #d9ddda;padding-top:18px">
        <h2 style="font-size:16px;margin:0 0 10px">Message</h2>
        <p style="margin:0">${safeMessage}</p>
      </div>
    </div>
  `;

  return {
    subject: `${requestType === "audit" ? "New website audit request" : "New project request"} from ${name}`,
    text,
    html,
  };
}

function buildAutoReplyEmail({ name }) {
  const safeName = escapeHtml(name);

  const text = [
    `Dear ${name},`,
    "",
    "Thank you for trusting DROOM IT. We will contact you as soon as possible.",
    "",
    "Kind regards,",
    "DROOM IT",
    "",
    "------------------------------",
    "",
    `Beste ${name},`,
    "",
    "Bedankt voor uw vertrouwen in DROOM IT. Wij nemen zo snel mogelijk contact met u op.",
    "",
    "Met vriendelijke groeten,",
    "DROOM IT",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111315;max-width:640px">
      <div style="border:1px solid #d9ddda;padding:28px;background:#f7f8f6">
        <p style="margin:0 0 16px">Dear ${safeName},</p>
        <p style="margin:0 0 16px">Thank you for trusting <strong>DROOM IT</strong>. We will contact you as soon as possible.</p>
        <p style="margin:0">Kind regards,<br /><strong>DROOM IT</strong></p>
      </div>
      <div style="border:1px solid #d9ddda;border-top:0;padding:28px;background:#ffffff">
        <p style="margin:0 0 16px">Beste ${safeName},</p>
        <p style="margin:0 0 16px">Bedankt voor uw vertrouwen in <strong>DROOM IT</strong>. Wij nemen zo snel mogelijk contact met u op.</p>
        <p style="margin:0">Met vriendelijke groeten,<br /><strong>DROOM IT</strong></p>
      </div>
      <p style="margin:18px 0 0;color:#5d6265;font-size:12px">DROOM IT - Web Design & Digital Solutions</p>
    </div>
  `;

  return {
    subject: "Thank you for contacting DROOM IT / Bedankt voor uw bericht aan DROOM IT",
    text,
    html,
  };
}

async function sendNotificationEmail(details) {
  const config = getEmailConfig();

  if (!config) {
    console.warn("Email notification skipped: SMTP environment variables are not configured.");
    return { sent: false, reason: "missing_email_config" };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const emailContent = buildEmail(details);

  await transporter.sendMail({
    from: `"DROOM IT Website" <${config.from}>`,
    to: config.to,
    replyTo: details.email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });

  return { sent: true };
}

async function sendAutoReplyEmail(details) {
  const config = getEmailConfig();

  if (!config) {
    console.warn("Auto-reply email skipped: SMTP environment variables are not configured.");
    return { sent: false, reason: "missing_email_config" };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const emailContent = buildAutoReplyEmail(details);

  await transporter.sendMail({
    from: `"DROOM IT" <${config.from}>`,
    to: details.email,
    replyTo: config.to[0] || defaultRecipient,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });

  return { sent: true };
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
    const websiteUrl = String(body.websiteUrl || body.website_url || "").trim();
    const projectType = String(body.projectType || body.project_type || "").trim();
    const requestType = String(body.requestType || body.request_type || "project").trim().slice(0, 30) || "project";
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
        website_url,
        project_type,
        request_type,
        message,
        language,
        user_agent
      )
      VALUES (
        ${name},
        ${email},
        ${company || null},
        ${websiteUrl || null},
        ${projectType || null},
        ${requestType},
        ${message},
        ${language},
        ${userAgent}
      )
      RETURNING id, created_at
    `;

    const emailDetails = {
      id: rows[0].id,
      createdAt: rows[0].created_at,
      name,
      email,
      company,
      websiteUrl,
      projectType,
      requestType,
      message,
      language,
    };

    const emailResult = await sendNotificationEmail(emailDetails).catch((emailError) => {
      console.error("Notification email failed", {
        code: emailError.code,
        responseCode: emailError.responseCode,
        command: emailError.command,
      });
      return { sent: false, reason: "notification_failed" };
    });

    const autoReplyResult = await sendAutoReplyEmail(emailDetails).catch((emailError) => {
      console.error("Auto-reply email failed", {
        code: emailError.code,
        responseCode: emailError.responseCode,
        command: emailError.command,
      });
      return { sent: false, reason: "auto_reply_failed" };
    });

    return response.status(201).json({
      ok: true,
      id: rows[0].id,
      createdAt: rows[0].created_at,
      emailSent: emailResult.sent,
      autoReplySent: autoReplyResult.sent,
    });
  } catch (error) {
    console.error("Project request failed", error);

    return response.status(500).json({
      ok: false,
      message: "Something went wrong. Please try again or email info@droomit.be.",
    });
  }
}
