import type { OrgEmailSettings, OrganizationSettings } from "@/lib/email/types";

export function parseOrgEmailSettings(settings: unknown): OrgEmailSettings {
  if (!settings || typeof settings !== "object") return {};
  const raw = settings as OrganizationSettings;
  return {
    notification_email: typeof raw.notification_email === "string" ? raw.notification_email.trim() : undefined,
    smtp: raw.smtp && typeof raw.smtp === "object" ? raw.smtp : undefined,
  };
}

export function mergeOrgEmailSettings(
  current: unknown,
  patch: OrgEmailSettings,
): OrganizationSettings {
  const base = (current && typeof current === "object" ? { ...(current as OrganizationSettings) } : {}) as OrganizationSettings;
  if (patch.notification_email !== undefined) {
    base.notification_email = patch.notification_email || undefined;
  }
  if (patch.smtp !== undefined) {
    base.smtp = patch.smtp;
  }
  return base;
}
