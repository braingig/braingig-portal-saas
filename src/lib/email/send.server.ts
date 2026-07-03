import nodemailer from "nodemailer";
import type { SmtpConfig } from "@/lib/email/types";

export async function sendEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const secure = config.secure ?? config.port === 465;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    ...(secure ? {} : { requireTLS: true }),
  });

  await transport.sendMail({
    from: config.from,
    to,
    subject,
    html,
  });
}
