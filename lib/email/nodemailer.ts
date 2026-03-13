import nodemailer from "nodemailer";

interface InviteEmailParams {
  to: string;
  groupName: string;
  inviteUrl: string;
  inviterName?: string | null;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const secure = process.env.SMTP_SECURE;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.INVITE_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!host || !port || !user || !password || !from || !appUrl) {
    return null;
  }

  const portNumber = Number.parseInt(port, 10);
  const isSecure = secure === "true" || secure === "1";

  if (Number.isNaN(portNumber)) {
    return null;
  }

  return {
    host,
    port: portNumber,
    secure: isSecure,
    auth: {
      user,
      pass: password,
    },
    from,
    appUrl,
  };
}

const smtpConfig = getSmtpConfig();

const transport = smtpConfig
  ? nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    })
  : null;

export async function sendInviteEmail(params: InviteEmailParams) {
  if (!smtpConfig || !transport) {
    console.error(
      "[invite-email] SMTP configuration is missing or invalid. Skipping email send.",
    );
    return;
  }

  const { to, groupName, inviteUrl, inviterName } = params;

  if (!to || !inviteUrl) {
    console.error("[invite-email] Missing recipient email or invite URL.");
    return;
  }

  const subject = `You're invited to join ${groupName}`;

  const greeting = inviterName ? `${inviterName} has invited you` : "You have been invited";

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
    await transport.sendMail({
      from: smtpConfig.from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("[invite-email] Failed to send invite email", error);
  }
}

