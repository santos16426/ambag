import { Resend } from "resend";

interface InviteEmailParams {
  to: string;
  groupName: string;
  inviteUrl: string;
  inviterName?: string | null;
}

interface InviteEmailConfig {
  apiKey: string;
  from: string;
}

function getInviteEmailConfig(): InviteEmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.INVITE_FROM_EMAIL ??
    "Ambag <noreply@contact-ambag.joelucas.dev>";

  if (!apiKey || !from) return null;

  return { apiKey, from };
}

export async function sendInviteEmail(params: InviteEmailParams) {
  const inviteEmailConfig = getInviteEmailConfig();

  if (!inviteEmailConfig) {
    console.error(
      "[invite-email] RESEND_API_KEY or INVITE_FROM_EMAIL is missing. Skipping email send.",
    );
    return;
  }

  const { to, groupName, inviteUrl, inviterName } = params;

  if (!to || !inviteUrl) {
    console.error("[invite-email] Missing recipient email or invite URL.");
    return;
  }

  const subject = `You're invited to join ${groupName}`;
  const greeting = inviterName
    ? `${inviterName} has invited you`
    : "You have been invited";

  const text = [
    `${greeting} to join the group "${groupName}".`,
    "",
    "To accept this invitation, open the link below:",
    inviteUrl,
    "",
    "If you did not expect this invitation, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #0f172a;">
      <p>${greeting} to join the group <strong>${groupName}</strong>.</p>
      <p>To accept this invitation, click the button below:</p>
      <p style="margin: 24px 0;">
        <a
          href="${inviteUrl}"
          style="
            display: inline-block;
            padding: 10px 18px;
            border-radius: 999px;
            background-color: #0f172a;
            color: #ffffff;
            text-decoration: none;
            font-weight: 600;
          "
        >
          Accept invite
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    console.log("[invite-email] sending to", to);
    const resend = new Resend(inviteEmailConfig.apiKey);
    const { error } = await resend.emails.send({
      from: inviteEmailConfig.from,
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      console.error("[invite-email] Failed to send invite email", error);
    }
  } catch (error) {
    console.error("[invite-email] Failed to send invite email", error);
  }
}
