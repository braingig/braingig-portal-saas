type EmailLayoutOptions = {
  title: string;
  preview: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

function emailLayout({ title, preview, bodyHtml, ctaLabel, ctaUrl }: EmailLayoutOptions): string {
  const cta = ctaLabel && ctaUrl
    ? `<p style="margin:24px 0 0"><a href="${ctaUrl}" style="display:inline-block;padding:10px 18px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">${ctaLabel}</a></p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <span style="display:none;max-height:0;overflow:hidden">${preview}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:8px;border:1px solid #e4e4e7">
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.05em">WorkPilot</p>
          <h1 style="margin:0 0 16px;font-size:20px;color:#18181b">${title}</h1>
          ${bodyHtml}
          ${cta}
          <p style="margin:32px 0 0;font-size:12px;color:#71717a">You received this email because of activity in your WorkPilot workspace.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function inviteEmailTemplate(args: {
  orgName: string;
  role: string;
  inviteCode: string;
  inviteUrl: string;
  inviterName?: string;
}): { subject: string; html: string } {
  const inviter = args.inviterName ? `<strong>${args.inviterName}</strong> has invited you` : "You have been invited";
  return {
    subject: `You're invited to join ${args.orgName} on WorkPilot`,
    html: emailLayout({
      title: `Join ${args.orgName}`,
      preview: `${inviter} to join ${args.orgName} on WorkPilot`,
      bodyHtml: `<p style="margin:0;color:#3f3f46;line-height:1.6">${inviter} to join <strong>${args.orgName}</strong> as <strong>${args.role}</strong>.</p>
        <p style="margin:16px 0 0;color:#3f3f46;line-height:1.6">Your invite code:</p>
        <p style="margin:8px 0 0;padding:14px 16px;background:#f4f4f5;border-radius:6px;font-family:ui-monospace,monospace;font-size:15px;letter-spacing:0.04em;color:#18181b;word-break:break-all">${args.inviteCode}</p>
        <p style="margin:16px 0 0;color:#3f3f46;line-height:1.6">Click below to sign in or create an account, then paste this code on the <strong>Join workspace</strong> screen.</p>`,
      ctaLabel: "Sign in to accept invite",
      ctaUrl: args.inviteUrl,
    }),
  };
}

export function organizationCreatedEmailTemplate(args: {
  orgName: string;
  orgSlug: string;
  creatorName: string;
  creatorEmail: string;
  platformUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `New agency workspace: ${args.orgName}`,
    html: emailLayout({
      title: "New agency created",
      preview: `${args.creatorName} created ${args.orgName} on WorkPilot`,
      bodyHtml: `<p style="margin:0;color:#3f3f46;line-height:1.6"><strong>${args.creatorName}</strong> (${args.creatorEmail}) created a new agency workspace:</p>
        <p style="margin:12px 0 0;padding:12px;background:#f4f4f5;border-radius:6px;color:#18181b">
          <strong>${args.orgName}</strong><br>
          <span style="color:#71717a;font-size:14px">Slug: ${args.orgSlug}</span>
        </p>`,
      ctaLabel: "View in platform admin",
      ctaUrl: args.platformUrl,
    }),
  };
}

export function memberJoinedEmailTemplate(args: {
  orgName: string;
  memberName: string;
  memberEmail: string;
  role: string;
}): { subject: string; html: string } {
  return {
    subject: `${args.memberName} joined ${args.orgName}`,
    html: emailLayout({
      title: "New workspace member",
      preview: `${args.memberName} joined ${args.orgName}`,
      bodyHtml: `<p style="margin:0;color:#3f3f46;line-height:1.6"><strong>${args.memberName}</strong> (${args.memberEmail}) has joined <strong>${args.orgName}</strong> as <strong>${args.role}</strong>.</p>`,
    }),
  };
}

export function taskAssignedEmailTemplate(args: {
  orgName: string;
  assignerName: string;
  taskTitle: string;
  taskUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${args.assignerName} assigned you: ${args.taskTitle}`,
    html: emailLayout({
      title: "Task assigned to you",
      preview: `${args.assignerName} assigned you "${args.taskTitle}"`,
      bodyHtml: `<p style="margin:0;color:#3f3f46;line-height:1.6"><strong>${args.assignerName}</strong> assigned you a task in <strong>${args.orgName}</strong>:</p>
        <p style="margin:12px 0 0;padding:12px;background:#f4f4f5;border-radius:6px;color:#18181b;font-weight:600">${args.taskTitle}</p>`,
      ctaLabel: "View task",
      ctaUrl: args.taskUrl,
    }),
  };
}

export function taskMentionEmailTemplate(args: {
  orgName: string;
  authorName: string;
  taskTitle: string;
  context: string;
  taskUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${args.authorName} mentioned you on: ${args.taskTitle}`,
    html: emailLayout({
      title: "You were mentioned",
      preview: `${args.authorName} mentioned you on "${args.taskTitle}"`,
      bodyHtml: `<p style="margin:0;color:#3f3f46;line-height:1.6"><strong>${args.authorName}</strong> mentioned you in the <strong>${args.context}</strong> of task <strong>${args.taskTitle}</strong> in <strong>${args.orgName}</strong>.</p>`,
      ctaLabel: "View task",
      ctaUrl: args.taskUrl,
    }),
  };
}
