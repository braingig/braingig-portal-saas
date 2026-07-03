import type { OrgEmailSettings, SmtpConfig } from "@/lib/email/types";
import { parseOrgEmailSettings } from "@/lib/email/org-settings";

function cleanEnv(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function readPlatformSmtp(): SmtpConfig | null {
  const host = cleanEnv(process.env.SMTP_HOST);
  const port = Number(cleanEnv(process.env.SMTP_PORT) || "587");
  const user = cleanEnv(process.env.SMTP_USER);
  const pass = cleanEnv(process.env.SMTP_PASS);
  const from = cleanEnv(process.env.MAIL_FROM);

  if (!host || !user || !pass || !from) return null;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    user,
    pass,
    from,
    secure: port === 465,
  };
}

function readOrgSmtp(settings: unknown): SmtpConfig | null {
  const { smtp } = parseOrgEmailSettings(settings);
  if (!smtp?.enabled) return null;

  const host = smtp.host?.trim();
  const user = smtp.user?.trim();
  const pass = smtp.pass?.trim();
  const from = smtp.from?.trim() || user;
  const port = Number(smtp.port ?? 587);

  if (!host || !user || !pass || !from) return null;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    user,
    pass,
    from,
    secure: smtp.secure ?? port === 465,
  };
}

/** Org SMTP takes precedence when enabled; otherwise falls back to platform env. */
export function resolveSmtpConfig(orgSettings: unknown): SmtpConfig | null {
  return readOrgSmtp(orgSettings) ?? readPlatformSmtp();
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL?.trim()
    || process.env.VITE_APP_URL?.trim()
    || "http://localhost:5173"
  ).replace(/\/$/, "");
}

export function getOrgNotificationEmail(orgSettings: unknown): string | null {
  const email = parseOrgEmailSettings(orgSettings).notification_email?.trim();
  return email || null;
}
