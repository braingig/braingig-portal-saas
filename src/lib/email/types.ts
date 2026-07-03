export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure?: boolean;
};

export type OrgSmtpSettings = {
  enabled?: boolean;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure?: boolean;
};

export type OrgEmailSettings = {
  notification_email?: string;
  smtp?: OrgSmtpSettings;
};

export type OrganizationSettings = OrgEmailSettings & Record<string, unknown>;
