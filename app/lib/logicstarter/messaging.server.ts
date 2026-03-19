import { sendEmail, sendSMS } from "@better-auth/infra";
import { createAwsSigV4Headers } from "~/lib/logicstarter/aws-signature.server";
import { readLogicstarterProviderConfig } from "~/lib/logicstarter/config.server";

type SendAuthEmailInput = {
  template: string;
  to: string;
  variables: Record<string, string | undefined>;
};

type SendAuthSmsInput = {
  to: string;
  code: string;
  template: string;
};

function requireConfigured(value: string | undefined, message: string): string {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

function buildEmailFromHeader(fromEmail: string, fromName?: string) {
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmailLayout({
  eyebrow,
  title,
  body,
  actionLabel,
  actionUrl,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
}) {
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionUrl = escapeHtml(actionUrl);

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:32px;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.08);">
      <div style="padding:32px 32px 12px;background:linear-gradient(135deg,#172554 0%,#0f172a 100%);">
        <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(16,185,129,0.16);color:#d1fae5;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">${safeEyebrow}</div>
        <h1 style="margin:20px 0 0;font-size:28px;line-height:1.2;color:#ffffff;">${safeTitle}</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#334155;white-space:pre-line;">${safeBody}</p>
        <a href="${safeActionUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;">${safeActionLabel}</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#64748b;word-break:break-all;">If the button does not open, copy and paste this link into your browser:<br>${safeActionUrl}</p>
      </div>
    </div>
  </body>
</html>`;
}

function renderEmailTemplate(input: SendAuthEmailInput): RenderedEmail {
  const appName = input.variables.appName ?? "Logicstarter";
  const userName = input.variables.userName ?? input.variables.userEmail ?? "there";
  const resetLink = input.variables.resetLink ?? "";
  const verificationUrl = input.variables.verificationUrl ?? "";
  const inviteLink = input.variables.inviteLink ?? "";
  const inviterName = input.variables.inviterName ?? "A teammate";
  const organizationName = input.variables.organizationName ?? appName;
  const role = input.variables.role ?? "member";

  if (input.template === "reset-password") {
    return {
      subject: `Reset your ${appName} password`,
      text: `Hi ${userName},\n\nReset your password using this link:\n${resetLink}\n`,
      html: renderEmailLayout({
        eyebrow: "Password reset",
        title: `Reset your ${appName} password`,
        body: `Hi ${userName},\n\nUse the secure button below to reset your password.`,
        actionLabel: "Reset password",
        actionUrl: resetLink,
      }),
    };
  }

  if (input.template === "verify-email") {
    return {
      subject: `Verify your ${appName} email`,
      text: `Hi ${userName},\n\nVerify your email using this link:\n${verificationUrl}\n`,
      html: renderEmailLayout({
        eyebrow: "Email verification",
        title: `Verify your ${appName} email`,
        body: `Hi ${userName},\n\nConfirm your email address to finish setting up your account.`,
        actionLabel: "Verify email",
        actionUrl: verificationUrl,
      }),
    };
  }

  if (input.template === "invitation") {
    return {
      subject: `You were invited to join ${organizationName}`,
      text: `${inviterName} invited you to join ${organizationName} as ${role}.\n\nAccept the invitation here:\n${inviteLink}\n`,
      html: renderEmailLayout({
        eyebrow: "Organization invitation",
        title: `Join ${organizationName}`,
        body: `${inviterName} invited you to join ${organizationName} as ${role}.`,
        actionLabel: "Accept invitation",
        actionUrl: inviteLink,
      }),
    };
  }

  return {
    subject: `${appName} notification`,
    text: Object.entries(input.variables)
      .map(([key, value]) => `${key}: ${value ?? ""}`)
      .join("\n"),
    html: `<pre>${escapeHtml(
      Object.entries(input.variables)
        .map(([key, value]) => `${key}: ${value ?? ""}`)
        .join("\n"),
    )}</pre>`,
  };
}

async function sendWithResend(input: SendAuthEmailInput) {
  const config = readLogicstarterProviderConfig().email;
  const resendApiKey = requireConfigured(config.resendApiKey, "RESEND_API_KEY is required when EMAIL_PROVIDER=resend.");
  const fromEmail = requireConfigured(config.from, "EMAIL_FROM is required when EMAIL_PROVIDER=resend.");

  const rendered = renderEmailTemplate(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: buildEmailFromHeader(fromEmail, config.fromName),
      to: [input.to],
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email send failed with status ${response.status}: ${await response.text()}`);
  }
}

async function sendWithSes(input: SendAuthEmailInput) {
  const config = readLogicstarterProviderConfig().email;
  const sesRegion = requireConfigured(config.sesRegion, "SES_REGION is required when EMAIL_PROVIDER=ses.");
  const sesAccessKeyId = requireConfigured(config.sesAccessKeyId, "SES_ACCESS_KEY_ID is required when EMAIL_PROVIDER=ses.");
  const sesSecretAccessKey = requireConfigured(config.sesSecretAccessKey, "SES_SECRET_ACCESS_KEY is required when EMAIL_PROVIDER=ses.");
  const fromEmail = requireConfigured(config.from, "EMAIL_FROM is required when EMAIL_PROVIDER=ses.");
  const rendered = renderEmailTemplate(input);
  const url = new URL(`https://email.${sesRegion}.amazonaws.com/v2/email/outbound-emails`);
  const body = JSON.stringify({
    FromEmailAddress: buildEmailFromHeader(fromEmail, config.fromName),
    Destination: {
      ToAddresses: [input.to],
    },
    Content: {
      Simple: {
        Subject: {
          Data: rendered.subject,
        },
        Body: {
          Text: {
            Data: rendered.text,
          },
          Html: {
            Data: rendered.html,
          },
        },
      },
    },
  });
  const headers = createAwsSigV4Headers({
    accessKeyId: sesAccessKeyId,
    secretAccessKey: sesSecretAccessKey,
    region: sesRegion,
    service: "ses",
    method: "POST",
    url,
    headers: {
      "content-type": "application/json",
    },
    body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`SES email send failed with status ${response.status}: ${await response.text()}`);
  }
}

function renderSmsMessage(input: SendAuthSmsInput) {
  if (input.template === "phone-verification") {
    return `Your Logicstarter verification code is ${input.code}`;
  }

  return `${input.template}: ${input.code}`;
}

async function sendWithVonage(input: SendAuthSmsInput) {
  const config = readLogicstarterProviderConfig().sms;
  const vonageApiKey = requireConfigured(config.vonageApiKey, "VONAGE_API_KEY is required when SMS_PROVIDER=vonage.");
  const vonageApiSecret = requireConfigured(config.vonageApiSecret, "VONAGE_API_SECRET is required when SMS_PROVIDER=vonage.");
  const vonageFrom = requireConfigured(config.vonageFrom, "VONAGE_FROM is required when SMS_PROVIDER=vonage.");

  const response = await fetch("https://rest.nexmo.com/sms/json", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      api_key: vonageApiKey,
      api_secret: vonageApiSecret,
      to: input.to,
      from: vonageFrom,
      text: renderSmsMessage(input),
    }),
  });

  const result = await response.json() as {
    messages?: Array<{
      status?: string;
      "error-text"?: string;
    }>;
  };

  if (!response.ok) {
    throw new Error(`Vonage SMS send failed with status ${response.status}`);
  }

  const message = result.messages?.[0];
  if (!message || message.status !== "0") {
    throw new Error(`Vonage SMS send failed: ${message?.["error-text"] ?? "unknown error"}`);
  }
}

async function sendWithAmazonSns(input: SendAuthSmsInput) {
  const config = readLogicstarterProviderConfig().sms;
  const region = requireConfigured(config.amazonSnsRegion, "AMAZON_SNS_REGION is required when SMS_PROVIDER=amazon_sns.");
  const accessKeyId = requireConfigured(config.amazonSnsAccessKeyId, "AMAZON_SNS_ACCESS_KEY_ID is required when SMS_PROVIDER=amazon_sns.");
  const secretAccessKey = requireConfigured(config.amazonSnsSecretAccessKey, "AMAZON_SNS_SECRET_ACCESS_KEY is required when SMS_PROVIDER=amazon_sns.");
  const senderId = requireConfigured(config.amazonSnsSenderId, "AMAZON_SNS_SENDER_ID is required when SMS_PROVIDER=amazon_sns.");
  const url = new URL(`https://sns.${region}.amazonaws.com/`);
  const form = new URLSearchParams({
    Action: "Publish",
    Version: "2010-03-31",
    PhoneNumber: input.to,
    Message: renderSmsMessage(input),
    "MessageAttributes.entry.1.Name": "AWS.SNS.SMS.SenderID",
    "MessageAttributes.entry.1.Value.DataType": "String",
    "MessageAttributes.entry.1.Value.StringValue": senderId,
    "MessageAttributes.entry.2.Name": "AWS.SNS.SMS.SMSType",
    "MessageAttributes.entry.2.Value.DataType": "String",
    "MessageAttributes.entry.2.Value.StringValue": "Transactional",
  });
  const body = form.toString();
  const headers = createAwsSigV4Headers({
    accessKeyId,
    secretAccessKey,
    region,
    service: "sns",
    method: "POST",
    url,
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`Amazon SNS SMS send failed with status ${response.status}: ${await response.text()}`);
  }
}

export async function sendLogicstarterEmail(input: SendAuthEmailInput) {
  const config = readLogicstarterProviderConfig().email;

  if (config.provider === "better_platform") {
    await sendEmail({
      template: input.template,
      to: input.to,
      variables: input.variables,
    });
    return;
  }

  if (config.provider === "resend") {
    await sendWithResend(input);
    return;
  }

  if (config.provider === "smtp") {
    requireConfigured(config.smtpHost, "SMTP_HOST is required when EMAIL_PROVIDER=smtp.");
    requireConfigured(config.smtpPort, "SMTP_PORT is required when EMAIL_PROVIDER=smtp.");
    requireConfigured(config.smtpUser, "SMTP_USER is required when EMAIL_PROVIDER=smtp.");
    requireConfigured(config.smtpPass, "SMTP_PASS is required when EMAIL_PROVIDER=smtp.");
    throw new Error("EMAIL_PROVIDER=smtp is configured, but the SMTP driver is not wired yet.");
  }

  await sendWithSes(input);
}

export async function sendLogicstarterSms(input: SendAuthSmsInput) {
  const config = readLogicstarterProviderConfig().sms;

  if (config.provider === "better_platform") {
    await sendSMS({
      to: input.to,
      code: input.code,
      template: input.template,
    });
    return;
  }

  if (config.provider === "console") {
    console.info("[Logicstarter SMS] Console SMS provider", {
      to: input.to,
      code: input.code,
      template: input.template,
    });
    return;
  }

  if (config.provider === "vonage") {
    await sendWithVonage(input);
    return;
  }

  await sendWithAmazonSns(input);
}
