import { t as INFRA_API_URL } from "./constants-B-e0_Nsv.mjs";
import { logger } from "better-auth";
import { env } from "@better-auth/core/env";

//#region src/email.ts
/**
* Email sending module for @better-auth/infra
*
* This module provides email sending functionality that integrates with
* Better Auth Infra's template system.
*/
/**
* Email template definitions with their required variables
*/
const EMAIL_TEMPLATES = {
	"verify-email": { variables: {} },
	"reset-password": { variables: {} },
	"change-email": { variables: {} },
	"sign-in-otp": { variables: {} },
	"verify-email-otp": { variables: {} },
	"reset-password-otp": { variables: {} },
	"magic-link": { variables: {} },
	"two-factor": { variables: {} },
	invitation: { variables: {} },
	"application-invite": { variables: {} },
	"delete-account": { variables: {} },
	"stale-account-user": { variables: {} },
	"stale-account-admin": { variables: {} }
};
/**
* Create an email sender instance
*/
function createEmailSender(config) {
	const baseUrl = config?.apiUrl || INFRA_API_URL;
	const apiUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
	const apiKey = config?.apiKey || env.BETTER_AUTH_API_KEY || "";
	if (!apiKey) logger.warn("[Dash] No API key provided for email sending. Set BETTER_AUTH_API_KEY environment variable or pass apiKey in config.");
	/**
	* Send an email using a template from Better Auth Infra
	*/
	async function send(options) {
		if (!apiKey) return {
			success: false,
			error: "API key not configured"
		};
		try {
			const response = await fetch(`${apiUrl}/v1/email/send`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					template: options.template,
					to: options.to,
					variables: options.variables || {},
					subject: options.subject
				})
			});
			if (!response.ok) return {
				success: false,
				error: (await response.json().catch(() => ({ message: "Unknown error" }))).message || `HTTP ${response.status}`
			};
			return {
				success: true,
				messageId: (await response.json()).messageId
			};
		} catch (error) {
			logger.warn("[Dash] Email send failed:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to send email"
			};
		}
	}
	/**
	* Send bulk emails using a template from Better Auth Infra
	*/
	async function sendBulk(options) {
		if (!apiKey) return {
			success: false,
			failures: Object.fromEntries(options.emails.map((e) => [e.to, [{ error: "API key not configured" }]]))
		};
		try {
			const response = await fetch(`${apiUrl}/v1/email/send-bulk`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					template: options.template,
					emails: options.emails.map((e) => ({
						to: e.to,
						variables: e.variables || {}
					})),
					subject: options.subject,
					variables: options.variables || {}
				})
			});
			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: "Unknown error" }));
				return {
					success: false,
					failures: Object.fromEntries(options.emails.map((e) => [e.to, [{ error: error.message || `HTTP ${response.status}` }]]))
				};
			}
			const result = await response.json();
			return {
				success: result.success,
				failures: result.failures
			};
		} catch (error) {
			logger.warn("[Dash] Bulk email send failed:", error);
			return {
				success: false,
				failures: Object.fromEntries(options.emails.map((e) => [e.to, [{ error: error instanceof Error ? error.message : "Failed to send bulk emails" }]]))
			};
		}
	}
	/**
	* Get available email templates
	*/
	async function getTemplates() {
		if (!apiKey) return [];
		try {
			const response = await fetch(`${apiUrl}/v1/email/templates`, { headers: { Authorization: `Bearer ${apiKey}` } });
			if (!response.ok) return [];
			return response.json();
		} catch (error) {
			logger.warn("[Dash] Failed to fetch email templates:", error);
			return [];
		}
	}
	return {
		send,
		sendBulk,
		getTemplates
	};
}
/**
* Send an email using the Better Auth dashboard's email templates.
*
* @example
* ```ts
* import { sendEmail } from "@better-auth/infra";
*
* // Type-safe - variables are inferred from template
* await sendEmail({
*   template: "reset-password",
*   to: "user@example.com",
*   variables: {
*     resetLink: "https://...",
*     userEmail: "user@example.com",
*   },
* });
* ```
*/
async function sendEmail(options, config) {
	return createEmailSender(config).send(options);
}
/**
* Send bulk emails using the Better Auth dashboard's email templates.
*
* @example
* ```ts
* import { sendBulkEmails } from "@better-auth/infra";
*
* const result = await sendBulkEmails({
*   template: "reset-password",
*   emails: [
*     { to: "user1@example.com", variables: { resetLink: "...", userEmail: "user1@example.com" } },
*     { to: "user2@example.com", variables: { resetLink: "...", userEmail: "user2@example.com" } },
*   ],
* });
* ```
*/
async function sendBulkEmails(options, config) {
	return createEmailSender(config).sendBulk(options);
}

//#endregion
export { EMAIL_TEMPLATES, createEmailSender, sendBulkEmails, sendEmail };