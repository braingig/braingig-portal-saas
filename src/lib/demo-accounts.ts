import type { AppRole } from "@/hooks/use-role";

/** Shared demo password — strong enough to pass Supabase leaked-password checks. */
export const DEMO_PASSWORD = "Wp9!kL2mNxQ7vR4sDemo";

export type DemoAccount = {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  description: string;
  platformAdmin?: boolean;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "polash.sahel@gmail.com", password: DEMO_PASSWORD, fullName: "Platform Admin", role: "owner", description: "Platform super-admin", platformAdmin: true },
  { email: "demo-owner@workpilot.dev", password: DEMO_PASSWORD, fullName: "Demo Owner", role: "owner", description: "Agency owner — full access" },
  { email: "demo-admin@workpilot.dev", password: DEMO_PASSWORD, fullName: "Demo Admin", role: "admin", description: "Agency admin" },
  { email: "demo-hr@workpilot.dev", password: DEMO_PASSWORD, fullName: "Demo HR", role: "hr", description: "HR & payroll" },
  { email: "demo-lead@workpilot.dev", password: DEMO_PASSWORD, fullName: "Demo Team Lead", role: "team_lead", description: "Projects & team" },
  { email: "demo-employee@workpilot.dev", password: DEMO_PASSWORD, fullName: "Demo Employee", role: "employee", description: "Standard employee" },
  { email: "demo-member@workpilot.dev", password: DEMO_PASSWORD, fullName: "Demo Member", role: "member", description: "Member access" },
  { email: "demo-client@workpilot.dev", password: DEMO_PASSWORD, fullName: "Demo Client", role: "client", description: "External client portal" },
];

export const DEMO_ORG_SLUG = "demo-agency";
