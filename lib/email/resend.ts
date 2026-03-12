import type { ReactNode } from "react";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  // This will surface clearly in logs if misconfigured in production.
  // In development, it helps avoid silent failures.
  console.warn("RESEND_API_KEY is not set. Invite emails will not be sent.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendInviteEmailArgs {
  to: string;
  subject: string;
  react: ReactNode;
}

export async function sendInviteEmail(args: SendInviteEmailArgs): Promise<void> {
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: "Ambag Invites <invites@your-domain.com>",
    to: args.to,
    subject: args.subject,
    react: args.react,
  });
}

