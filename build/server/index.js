import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration, ServerRouter, UNSAFE_withComponentProps, useFetcher, useLoaderData, useRouteLoaderData } from "react-router";
import { renderToPipeableStream } from "react-dom/server";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { betterAuth } from "better-auth";
import { cloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dash, sendEmail, sendSMS } from "@better-auth/infra";
import { i18n } from "@better-auth/i18n";
import { sso } from "@better-auth/sso";
import { organization } from "better-auth/plugins/organization";
import { phoneNumber } from "better-auth/plugins/phone-number";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { constants, readFileSync } from "node:fs";
import { and, eq, inArray, isNotNull, relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path, { extname } from "node:path";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as LabelPrimitive from "@radix-ui/react-label";
import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";
import { ssoClient } from "@better-auth/sso/client";
import { stripeClient } from "@better-auth/stripe/client";
import { organizationClient } from "better-auth/client/plugins";
import { isAPIError } from "better-auth/api";
import { z } from "zod";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region app/entry.server.tsx
var entry_server_exports = /* @__PURE__ */ __exportAll({ default: () => handleRequest });
function handleRequest(request, responseStatusCode, responseHeaders, routerContext) {
	return new Promise((resolve, reject) => {
		const { pipe } = renderToPipeableStream(/* @__PURE__ */ jsx(ServerRouter, {
			context: routerContext,
			url: request.url
		}), {
			onShellReady() {
				responseHeaders.set("Content-Type", "text/html");
				const body = new PassThrough();
				const stream = createReadableStreamFromReadable(body);
				resolve(new Response(stream, {
					headers: responseHeaders,
					status: responseStatusCode
				}));
				pipe(body);
			},
			onShellError(error) {
				reject(error);
			}
		});
	});
}
//#endregion
//#region app/app.css?url
var app_default = "/assets/app-CAlhX44b.css";
//#endregion
//#region app/lib/logicstarter/config.server.ts
var logicstarterEnvFilePaths = [
	"/app/.env.runtime",
	".env.runtime",
	"/app/.env",
	".env"
];
var cachedRuntimeEnvValues = null;
var injectedRuntimeEnvValues = null;
function canUseNodeProcessEnv() {
	return typeof process !== "undefined" && !!process.env;
}
function readNodeFileSync(filePath) {
	try {
		return readFileSync(filePath, "utf8");
	} catch {
		return null;
	}
}
function readRuntimeEnvValues() {
	if (cachedRuntimeEnvValues) return cachedRuntimeEnvValues;
	if (injectedRuntimeEnvValues) {
		cachedRuntimeEnvValues = injectedRuntimeEnvValues;
		return cachedRuntimeEnvValues;
	}
	const values = /* @__PURE__ */ new Map();
	for (const filePath of logicstarterEnvFilePaths) {
		const content = readNodeFileSync(filePath);
		if (!content) continue;
		for (const line of content.split(/\r?\n/)) {
			const separatorIndex = line.indexOf("=");
			if (separatorIndex <= 0) continue;
			const key = line.slice(0, separatorIndex).trim();
			const value = line.slice(separatorIndex + 1).trim();
			if (key && value && !values.has(key)) values.set(key, value);
		}
	}
	cachedRuntimeEnvValues = values;
	return values;
}
function readLogicstarterEnvValue(key) {
	const value = (canUseNodeProcessEnv() ? process.env[key]?.trim() : void 0) || readRuntimeEnvValues().get(key);
	return value ? value : void 0;
}
function readLogicstarterFirstEnvValue(...keys) {
	for (const key of keys) {
		const value = readLogicstarterEnvValue(key);
		if (value) return value;
	}
}
function readR2AccountIdFromEndpoint(endpoint) {
	if (!endpoint) return;
	try {
		const [accountId] = new URL(endpoint).hostname.split(".");
		return accountId?.trim() || void 0;
	} catch {
		return;
	}
}
function readBooleanEnv(key) {
	return readLogicstarterEnvValue(key) === "true";
}
function readLogicstarterRuntimeTarget() {
	const target = readLogicstarterEnvValue("RUNTIME_TARGET")?.toLowerCase();
	if (target === "cloudflare" || target === "vercel" || target === "node") return target;
	return "node";
}
function supportsLogicstarterRuntimeEnvFileExport(target = readLogicstarterRuntimeTarget()) {
	return target === "node";
}
function getLogicstarterRuntimeConfigSourceMode(target = readLogicstarterRuntimeTarget()) {
	return supportsLogicstarterRuntimeEnvFileExport(target) ? "env_file" : "deployment_bindings";
}
function readLogicstarterDatabaseProfile() {
	const profile = readLogicstarterEnvValue("DATABASE_PROFILE")?.toLowerCase();
	if (profile === "d1" || profile === "pg") return profile;
	return "pg";
}
function readLogicstarterEmailProvider() {
	const provider = readLogicstarterEnvValue("EMAIL_PROVIDER")?.toLowerCase();
	if (provider === "better_auth_infra" || provider === "better_platform") return "better_platform";
	if (provider === "resend" || provider === "smtp" || provider === "ses") return provider;
	return "better_platform";
}
function readLogicstarterSmsProvider() {
	const provider = readLogicstarterEnvValue("SMS_PROVIDER")?.toLowerCase();
	if (provider === "better_auth_infra" || provider === "better_platform") return "better_platform";
	if (provider === "console" || provider === "vonage" || provider === "amazon_sns") return provider;
	return "better_platform";
}
function readLogicstarterStorageProvider() {
	const provider = readLogicstarterEnvValue("STORAGE_PROVIDER")?.toLowerCase();
	if (provider === "s3" || provider === "r2" || provider === "local") return provider;
	return "local";
}
function readLogicstarterProviderConfig() {
	return {
		runtime: {
			target: readLogicstarterRuntimeTarget(),
			databaseProfile: readLogicstarterDatabaseProfile(),
			appOrigin: readLogicstarterEnvValue("APP_ORIGIN"),
			betterAuthUrl: readLogicstarterEnvValue("BETTER_AUTH_URL"),
			authCanonicalOrigin: readLogicstarterEnvValue("AUTH_CANONICAL_ORIGIN")
		},
		email: {
			provider: readLogicstarterEmailProvider(),
			from: readLogicstarterEnvValue("EMAIL_FROM"),
			fromName: readLogicstarterEnvValue("EMAIL_FROM_NAME"),
			resendApiKey: readLogicstarterEnvValue("RESEND_API_KEY"),
			smtpHost: readLogicstarterEnvValue("SMTP_HOST"),
			smtpPort: readLogicstarterEnvValue("SMTP_PORT"),
			smtpUser: readLogicstarterEnvValue("SMTP_USER"),
			smtpPass: readLogicstarterEnvValue("SMTP_PASS"),
			sesRegion: readLogicstarterEnvValue("SES_REGION"),
			sesAccessKeyId: readLogicstarterEnvValue("SES_ACCESS_KEY_ID"),
			sesSecretAccessKey: readLogicstarterEnvValue("SES_SECRET_ACCESS_KEY")
		},
		sms: {
			provider: readLogicstarterSmsProvider(),
			vonageApiKey: readLogicstarterEnvValue("VONAGE_API_KEY"),
			vonageApiSecret: readLogicstarterEnvValue("VONAGE_API_SECRET"),
			vonageFrom: readLogicstarterEnvValue("VONAGE_FROM"),
			amazonSnsRegion: readLogicstarterEnvValue("AMAZON_SNS_REGION"),
			amazonSnsAccessKeyId: readLogicstarterEnvValue("AMAZON_SNS_ACCESS_KEY_ID"),
			amazonSnsSecretAccessKey: readLogicstarterEnvValue("AMAZON_SNS_SECRET_ACCESS_KEY"),
			amazonSnsSenderId: readLogicstarterEnvValue("AMAZON_SNS_SENDER_ID")
		},
		storage: {
			provider: readLogicstarterStorageProvider(),
			localBasePath: readLogicstarterFirstEnvValue("STORAGE_LOCAL_BASE_PATH", "UPLOAD_DIR"),
			publicBaseUrl: readLogicstarterFirstEnvValue("STORAGE_PUBLIC_BASE_URL", "S3_PUBLIC_URL", "R2_PUBLIC_URL"),
			s3Region: readLogicstarterFirstEnvValue("S3_REGION", "R2_REGION"),
			s3Bucket: readLogicstarterFirstEnvValue("S3_BUCKET", "R2_BUCKET"),
			s3AccessKeyId: readLogicstarterFirstEnvValue("S3_ACCESS_KEY_ID", "S3_ACCESS_KEY", "R2_ACCESS_KEY_ID"),
			s3SecretAccessKey: readLogicstarterFirstEnvValue("S3_SECRET_ACCESS_KEY", "S3_SECRET_KEY", "R2_SECRET_ACCESS_KEY"),
			s3Endpoint: readLogicstarterFirstEnvValue("S3_ENDPOINT", "R2_ENDPOINT"),
			s3ForcePathStyle: readLogicstarterEnvValue("S3_FORCE_PATH_STYLE"),
			r2AccountId: readLogicstarterFirstEnvValue("R2_ACCOUNT_ID") ?? readR2AccountIdFromEndpoint(readLogicstarterFirstEnvValue("R2_ENDPOINT", "S3_ENDPOINT")),
			r2Bucket: readLogicstarterFirstEnvValue("R2_BUCKET", "S3_BUCKET"),
			r2AccessKeyId: readLogicstarterEnvValue("R2_ACCESS_KEY_ID"),
			r2SecretAccessKey: readLogicstarterEnvValue("R2_SECRET_ACCESS_KEY")
		},
		auth: {
			googleEnabled: readBooleanEnv("AUTH_GOOGLE_ENABLED"),
			googleClientId: readLogicstarterEnvValue("AUTH_GOOGLE_CLIENT_ID"),
			googleClientSecret: readLogicstarterEnvValue("AUTH_GOOGLE_CLIENT_SECRET"),
			githubEnabled: readBooleanEnv("AUTH_GITHUB_ENABLED"),
			githubClientId: readLogicstarterEnvValue("AUTH_GITHUB_CLIENT_ID"),
			githubClientSecret: readLogicstarterEnvValue("AUTH_GITHUB_CLIENT_SECRET")
		},
		billing: {
			stripeSecretKey: readLogicstarterEnvValue("STRIPE_SECRET_KEY"),
			stripePublishableKey: readLogicstarterEnvValue("STRIPE_PUBLISHABLE_KEY"),
			stripeWebhookSecret: readLogicstarterEnvValue("STRIPE_WEBHOOK_SECRET")
		}
	};
}
function readLogicstarterSocialProviders() {
	const auth = readLogicstarterProviderConfig().auth;
	const providers = {};
	if (auth.googleEnabled && auth.googleClientId && auth.googleClientSecret) providers.google = {
		clientId: auth.googleClientId,
		clientSecret: auth.googleClientSecret
	};
	if (auth.githubEnabled && auth.githubClientId && auth.githubClientSecret) providers.github = {
		clientId: auth.githubClientId,
		clientSecret: auth.githubClientSecret
	};
	return providers;
}
//#endregion
//#region app/db/index.server.ts
function createLogicstarterDb() {
	const profile = readLogicstarterDatabaseProfile();
	if (profile !== "pg") throw new Error(`Database profile ${profile} is not implemented yet in Logicstarter runtime wiring.`);
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) throw new Error("DATABASE_URL is required for the Better Auth Drizzle baseline.");
	const client = postgres(connectionString, { prepare: false });
	return {
		profile,
		client,
		db: drizzle(client)
	};
}
var cachedLogicstarterDatabase = null;
function getLogicstarterDatabaseRuntime() {
	cachedLogicstarterDatabase ??= createLogicstarterDb();
	return cachedLogicstarterDatabase;
}
function getLogicstarterDatabaseProfile() {
	return getLogicstarterDatabaseRuntime().profile;
}
function getLogicstarterDb() {
	return getLogicstarterDatabaseRuntime().db;
}
readLogicstarterDatabaseProfile();
var db = new Proxy({}, { get(_, property) {
	return getLogicstarterDb()[property];
} });
//#endregion
//#region auth-schema.ts
var user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	phoneNumber: text("phone_number").unique(),
	phoneNumberVerified: boolean("phone_number_verified"),
	stripeCustomerId: text("stripe_customer_id"),
	lastActiveAt: timestamp("last_active_at")
});
var session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	activeOrganizationId: text("active_organization_id")
}, (table) => [index("session_userId_idx").on(table.userId)]);
var account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("account_userId_idx").on(table.userId)]);
var verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);
var organization$1 = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	logo: text("logo"),
	createdAt: timestamp("created_at").notNull(),
	metadata: text("metadata"),
	stripeCustomerId: text("stripe_customer_id")
}, (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)]);
var member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization$1.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	role: text("role").default("member").notNull(),
	createdAt: timestamp("created_at").notNull()
}, (table) => [index("member_organizationId_idx").on(table.organizationId), index("member_userId_idx").on(table.userId)]);
var invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization$1.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").default("pending").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" })
}, (table) => [index("invitation_organizationId_idx").on(table.organizationId), index("invitation_email_idx").on(table.email)]);
var ssoProvider = pgTable("sso_provider", {
	id: text("id").primaryKey(),
	issuer: text("issuer").notNull(),
	oidcConfig: text("oidc_config"),
	samlConfig: text("saml_config"),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	providerId: text("provider_id").notNull().unique(),
	organizationId: text("organization_id"),
	domain: text("domain").notNull()
});
var logicstarterProviderSetting = pgTable("logicstarter_provider_setting", {
	key: text("key").primaryKey(),
	category: text("category").notNull(),
	value: text("value").notNull().default(""),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("logicstarter_provider_setting_category_idx").on(table.category)]);
relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	members: many(member),
	invitations: many(invitation),
	ssoProviders: many(ssoProvider)
}));
relations(session, ({ one }) => ({ user: one(user, {
	fields: [session.userId],
	references: [user.id]
}) }));
relations(account, ({ one }) => ({ user: one(user, {
	fields: [account.userId],
	references: [user.id]
}) }));
relations(organization$1, ({ many }) => ({
	members: many(member),
	invitations: many(invitation)
}));
relations(member, ({ one }) => ({
	organization: one(organization$1, {
		fields: [member.organizationId],
		references: [organization$1.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	})
}));
relations(invitation, ({ one }) => ({
	organization: one(organization$1, {
		fields: [invitation.organizationId],
		references: [organization$1.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	})
}));
relations(ssoProvider, ({ one }) => ({ user: one(user, {
	fields: [ssoProvider.userId],
	references: [user.id]
}) }));
//#endregion
//#region app/lib/logicstarter/aws-signature.server.ts
function sha256Hex(value) {
	return createHash("sha256").update(value, "utf8").digest("hex");
}
function hmacSha256Raw(key, value) {
	return createHmac("sha256", key).update(value, "utf8").digest();
}
function hmacSha256Hex(key, value) {
	return createHmac("sha256", key).update(value, "utf8").digest("hex");
}
function toAmzDate(date) {
	return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}
function toDateStamp(amzDate) {
	return amzDate.slice(0, 8);
}
function deriveSigningKey(secretAccessKey, dateStamp, region, service) {
	return hmacSha256Raw(hmacSha256Raw(hmacSha256Raw(hmacSha256Raw(`AWS4${secretAccessKey}`, dateStamp), region), service), "aws4_request");
}
function createAwsSigV4Headers(input) {
	const amzDate = toAmzDate(input.now ?? /* @__PURE__ */ new Date());
	const dateStamp = toDateStamp(amzDate);
	const bodyHash = sha256Hex(input.body);
	const baseHeaders = {
		host: input.url.host,
		"x-amz-content-sha256": bodyHash,
		"x-amz-date": amzDate,
		...Object.fromEntries(Object.entries(input.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value.trim()]))
	};
	const sortedHeaderKeys = Object.keys(baseHeaders).sort();
	const canonicalHeaders = sortedHeaderKeys.map((key) => `${key}:${baseHeaders[key]}\n`).join("");
	const signedHeaders = sortedHeaderKeys.join(";");
	const canonicalRequest = [
		input.method.toUpperCase(),
		input.url.pathname || "/",
		input.url.searchParams.toString(),
		canonicalHeaders,
		signedHeaders,
		bodyHash
	].join("\n");
	const credentialScope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
	const stringToSign = [
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		sha256Hex(canonicalRequest)
	].join("\n");
	const signature = hmacSha256Hex(deriveSigningKey(input.secretAccessKey, dateStamp, input.region, input.service), stringToSign);
	return {
		...baseHeaders,
		Authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
	};
}
//#endregion
//#region app/lib/logicstarter/messaging.server.ts
function requireConfigured$1(value, message) {
	if (!value) throw new Error(message);
	return value;
}
function buildEmailFromHeader(fromEmail, fromName) {
	return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}
function escapeHtml(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;");
}
function renderEmailLayout({ eyebrow, title, body, actionLabel, actionUrl }) {
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
function renderEmailTemplate(input) {
	const appName = input.variables.appName ?? "Logicstarter";
	const userName = input.variables.userName ?? input.variables.userEmail ?? "there";
	const resetLink = input.variables.resetLink ?? "";
	const verificationUrl = input.variables.verificationUrl ?? "";
	const inviteLink = input.variables.inviteLink ?? "";
	const inviterName = input.variables.inviterName ?? "A teammate";
	const organizationName = input.variables.organizationName ?? appName;
	const role = input.variables.role ?? "member";
	if (input.template === "reset-password") return {
		subject: `Reset your ${appName} password`,
		text: `Hi ${userName},\n\nReset your password using this link:\n${resetLink}\n`,
		html: renderEmailLayout({
			eyebrow: "Password reset",
			title: `Reset your ${appName} password`,
			body: `Hi ${userName},\n\nUse the secure button below to reset your password.`,
			actionLabel: "Reset password",
			actionUrl: resetLink
		})
	};
	if (input.template === "verify-email") return {
		subject: `Verify your ${appName} email`,
		text: `Hi ${userName},\n\nVerify your email using this link:\n${verificationUrl}\n`,
		html: renderEmailLayout({
			eyebrow: "Email verification",
			title: `Verify your ${appName} email`,
			body: `Hi ${userName},\n\nConfirm your email address to finish setting up your account.`,
			actionLabel: "Verify email",
			actionUrl: verificationUrl
		})
	};
	if (input.template === "invitation") return {
		subject: `You were invited to join ${organizationName}`,
		text: `${inviterName} invited you to join ${organizationName} as ${role}.\n\nAccept the invitation here:\n${inviteLink}\n`,
		html: renderEmailLayout({
			eyebrow: "Organization invitation",
			title: `Join ${organizationName}`,
			body: `${inviterName} invited you to join ${organizationName} as ${role}.`,
			actionLabel: "Accept invitation",
			actionUrl: inviteLink
		})
	};
	return {
		subject: `${appName} notification`,
		text: Object.entries(input.variables).map(([key, value]) => `${key}: ${value ?? ""}`).join("\n"),
		html: `<pre>${escapeHtml(Object.entries(input.variables).map(([key, value]) => `${key}: ${value ?? ""}`).join("\n"))}</pre>`
	};
}
async function sendWithResend(input) {
	const config = readLogicstarterProviderConfig().email;
	const resendApiKey = requireConfigured$1(config.resendApiKey, "RESEND_API_KEY is required when EMAIL_PROVIDER=resend.");
	const fromEmail = requireConfigured$1(config.from, "EMAIL_FROM is required when EMAIL_PROVIDER=resend.");
	const rendered = renderEmailTemplate(input);
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${resendApiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			from: buildEmailFromHeader(fromEmail, config.fromName),
			to: [input.to],
			subject: rendered.subject,
			text: rendered.text,
			html: rendered.html
		})
	});
	if (!response.ok) throw new Error(`Resend email send failed with status ${response.status}: ${await response.text()}`);
}
async function sendWithSes(input) {
	const config = readLogicstarterProviderConfig().email;
	const sesRegion = requireConfigured$1(config.sesRegion, "SES_REGION is required when EMAIL_PROVIDER=ses.");
	const sesAccessKeyId = requireConfigured$1(config.sesAccessKeyId, "SES_ACCESS_KEY_ID is required when EMAIL_PROVIDER=ses.");
	const sesSecretAccessKey = requireConfigured$1(config.sesSecretAccessKey, "SES_SECRET_ACCESS_KEY is required when EMAIL_PROVIDER=ses.");
	const fromEmail = requireConfigured$1(config.from, "EMAIL_FROM is required when EMAIL_PROVIDER=ses.");
	const rendered = renderEmailTemplate(input);
	const url = new URL(`https://email.${sesRegion}.amazonaws.com/v2/email/outbound-emails`);
	const body = JSON.stringify({
		FromEmailAddress: buildEmailFromHeader(fromEmail, config.fromName),
		Destination: { ToAddresses: [input.to] },
		Content: { Simple: {
			Subject: { Data: rendered.subject },
			Body: {
				Text: { Data: rendered.text },
				Html: { Data: rendered.html }
			}
		} }
	});
	const headers = createAwsSigV4Headers({
		accessKeyId: sesAccessKeyId,
		secretAccessKey: sesSecretAccessKey,
		region: sesRegion,
		service: "ses",
		method: "POST",
		url,
		headers: { "content-type": "application/json" },
		body
	});
	const response = await fetch(url, {
		method: "POST",
		headers,
		body
	});
	if (!response.ok) throw new Error(`SES email send failed with status ${response.status}: ${await response.text()}`);
}
function renderSmsMessage(input) {
	if (input.template === "phone-verification") return `Your Logicstarter verification code is ${input.code}`;
	return `${input.template}: ${input.code}`;
}
async function sendWithVonage(input) {
	const config = readLogicstarterProviderConfig().sms;
	const vonageApiKey = requireConfigured$1(config.vonageApiKey, "VONAGE_API_KEY is required when SMS_PROVIDER=vonage.");
	const vonageApiSecret = requireConfigured$1(config.vonageApiSecret, "VONAGE_API_SECRET is required when SMS_PROVIDER=vonage.");
	const vonageFrom = requireConfigured$1(config.vonageFrom, "VONAGE_FROM is required when SMS_PROVIDER=vonage.");
	const response = await fetch("https://rest.nexmo.com/sms/json", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			api_key: vonageApiKey,
			api_secret: vonageApiSecret,
			to: input.to,
			from: vonageFrom,
			text: renderSmsMessage(input)
		})
	});
	const result = await response.json();
	if (!response.ok) throw new Error(`Vonage SMS send failed with status ${response.status}`);
	const message = result.messages?.[0];
	if (!message || message.status !== "0") throw new Error(`Vonage SMS send failed: ${message?.["error-text"] ?? "unknown error"}`);
}
async function sendWithAmazonSns(input) {
	const config = readLogicstarterProviderConfig().sms;
	const region = requireConfigured$1(config.amazonSnsRegion, "AMAZON_SNS_REGION is required when SMS_PROVIDER=amazon_sns.");
	const accessKeyId = requireConfigured$1(config.amazonSnsAccessKeyId, "AMAZON_SNS_ACCESS_KEY_ID is required when SMS_PROVIDER=amazon_sns.");
	const secretAccessKey = requireConfigured$1(config.amazonSnsSecretAccessKey, "AMAZON_SNS_SECRET_ACCESS_KEY is required when SMS_PROVIDER=amazon_sns.");
	const senderId = requireConfigured$1(config.amazonSnsSenderId, "AMAZON_SNS_SENDER_ID is required when SMS_PROVIDER=amazon_sns.");
	const url = new URL(`https://sns.${region}.amazonaws.com/`);
	const body = new URLSearchParams({
		Action: "Publish",
		Version: "2010-03-31",
		PhoneNumber: input.to,
		Message: renderSmsMessage(input),
		"MessageAttributes.entry.1.Name": "AWS.SNS.SMS.SenderID",
		"MessageAttributes.entry.1.Value.DataType": "String",
		"MessageAttributes.entry.1.Value.StringValue": senderId,
		"MessageAttributes.entry.2.Name": "AWS.SNS.SMS.SMSType",
		"MessageAttributes.entry.2.Value.DataType": "String",
		"MessageAttributes.entry.2.Value.StringValue": "Transactional"
	}).toString();
	const headers = createAwsSigV4Headers({
		accessKeyId,
		secretAccessKey,
		region,
		service: "sns",
		method: "POST",
		url,
		headers: { "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
		body
	});
	const response = await fetch(url, {
		method: "POST",
		headers,
		body
	});
	if (!response.ok) throw new Error(`Amazon SNS SMS send failed with status ${response.status}: ${await response.text()}`);
}
async function sendLogicstarterEmail(input) {
	const config = readLogicstarterProviderConfig().email;
	if (config.provider === "better_platform") {
		await sendEmail({
			template: input.template,
			to: input.to,
			variables: input.variables
		});
		return;
	}
	if (config.provider === "resend") {
		await sendWithResend(input);
		return;
	}
	if (config.provider === "smtp") {
		requireConfigured$1(config.smtpHost, "SMTP_HOST is required when EMAIL_PROVIDER=smtp.");
		requireConfigured$1(config.smtpPort, "SMTP_PORT is required when EMAIL_PROVIDER=smtp.");
		requireConfigured$1(config.smtpUser, "SMTP_USER is required when EMAIL_PROVIDER=smtp.");
		requireConfigured$1(config.smtpPass, "SMTP_PASS is required when EMAIL_PROVIDER=smtp.");
		throw new Error("EMAIL_PROVIDER=smtp is configured, but the SMTP driver is not wired yet.");
	}
	await sendWithSes(input);
}
async function sendLogicstarterSms(input) {
	const config = readLogicstarterProviderConfig().sms;
	if (config.provider === "better_platform") {
		await sendSMS({
			to: input.to,
			code: input.code,
			template: input.template
		});
		return;
	}
	if (config.provider === "console") {
		console.info("[Logicstarter SMS] Console SMS provider", {
			to: input.to,
			code: input.code,
			template: input.template
		});
		return;
	}
	if (config.provider === "vonage") {
		await sendWithVonage(input);
		return;
	}
	await sendWithAmazonSns(input);
}
//#endregion
//#region app/lib/logicstarter/storage.server.ts
var contentTypes = new Map([
	[".png", "image/png"],
	[".jpg", "image/jpeg"],
	[".jpeg", "image/jpeg"],
	[".webp", "image/webp"],
	[".gif", "image/gif"],
	[".svg", "image/svg+xml"],
	[".ico", "image/x-icon"],
	[".json", "application/json"],
	[".pdf", "application/pdf"],
	[".txt", "text/plain; charset=utf-8"]
]);
function normalizeStorageKey(key) {
	return key.replace(/^\/+/, "").replace(/\\/g, "/");
}
function assertSafeStorageKey(key) {
	const normalizedKey = normalizeStorageKey(key);
	if (!normalizedKey || normalizedKey.includes("..") || normalizedKey.startsWith(".")) throw new Error("Storage key must be a safe relative path.");
	return normalizedKey;
}
function resolveLocalBasePath(config) {
	const configuredBasePath = config.localBasePath?.trim();
	if (!configuredBasePath) return path.resolve(process.cwd(), "uploads");
	return path.isAbsolute(configuredBasePath) ? configuredBasePath : path.resolve(process.cwd(), configuredBasePath);
}
function resolveLogicstarterLocalStoragePath(key, config = readLogicstarterProviderConfig().storage) {
	const normalizedKey = assertSafeStorageKey(key);
	return path.join(resolveLocalBasePath(config), normalizedKey);
}
function toUint8Array(body) {
	if (typeof body === "string") return new TextEncoder().encode(body);
	if (body instanceof Uint8Array) return body;
	if (body instanceof ArrayBuffer) return new Uint8Array(body);
	throw new Error("ReadableStream bodies are not implemented yet for local Logicstarter storage.");
}
function resolvePublicUrl(baseUrl, key) {
	const normalizedKey = normalizeStorageKey(key);
	if (!normalizedKey) return null;
	const trimmedBaseUrl = baseUrl?.trim();
	if (!trimmedBaseUrl) return `/uploads/${normalizedKey}`;
	if (trimmedBaseUrl.startsWith("/")) return `${trimmedBaseUrl.replace(/\/$/, "")}/${normalizedKey}`;
	return `${trimmedBaseUrl.replace(/\/$/, "")}/${normalizedKey}`;
}
function parseForcePathStyle(value) {
	return value?.trim().toLowerCase() === "true";
}
function buildS3DefaultPublicUrl(config, key) {
	const normalizedKey = normalizeStorageKey(key);
	if (!normalizedKey || !config.s3Bucket) return null;
	if (config.s3Endpoint) {
		const trimmedEndpoint = config.s3Endpoint.replace(/\/$/, "");
		if (parseForcePathStyle(config.s3ForcePathStyle)) return `${trimmedEndpoint}/${config.s3Bucket}/${normalizedKey}`;
		return `${trimmedEndpoint.replace(/:\/\//, `://${config.s3Bucket}.`)}/${normalizedKey}`;
	}
	if (!config.s3Region) return null;
	return `https://${config.s3Bucket}.s3.${config.s3Region}.amazonaws.com/${normalizedKey}`;
}
function buildR2Endpoint(config) {
	if (!config.r2AccountId) return null;
	return `https://${config.r2AccountId}.r2.cloudflarestorage.com`;
}
function buildR2DefaultPublicUrl(config, key) {
	const normalizedKey = normalizeStorageKey(key);
	if (!normalizedKey || !config.r2AccountId || !config.r2Bucket) return null;
	return `https://${config.r2Bucket}.${config.r2AccountId}.r2.cloudflarestorage.com/${normalizedKey}`;
}
function createS3CompatibleClient(options) {
	return new S3Client({
		region: options.region,
		endpoint: options.endpoint,
		forcePathStyle: options.forcePathStyle,
		credentials: {
			accessKeyId: options.accessKeyId,
			secretAccessKey: options.secretAccessKey
		}
	});
}
function createRemoteStorageProvider(options) {
	return {
		provider: options.provider,
		validateConfig() {},
		async putObject(input) {
			const key = assertSafeStorageKey(input.key);
			await options.client.send(new PutObjectCommand({
				Bucket: options.bucket,
				Key: key,
				Body: toUint8Array(input.body),
				ContentType: input.contentType,
				Metadata: input.metadata
			}));
			return {
				key,
				url: options.resolvePublicUrlForKey(key) ?? void 0
			};
		},
		getPublicUrl(key) {
			return options.resolvePublicUrlForKey(key);
		},
		async getSignedUrl(input) {
			const key = assertSafeStorageKey(input.key);
			const expiresInSeconds = input.expiresInSeconds ?? 900;
			const command = input.method === "PUT" ? new PutObjectCommand({
				Bucket: options.bucket,
				Key: key,
				ContentType: input.contentType
			}) : new GetObjectCommand({
				Bucket: options.bucket,
				Key: key
			});
			return {
				url: await getSignedUrl(options.client, command, { expiresIn: expiresInSeconds }),
				expiresAt: new Date(Date.now() + expiresInSeconds * 1e3)
			};
		},
		async deleteObject(input) {
			const key = assertSafeStorageKey(input.key);
			await options.client.send(new DeleteObjectCommand({
				Bucket: options.bucket,
				Key: key
			}));
		}
	};
}
function createNotImplementedOperation(provider, operation) {
	return async () => {
		throw new Error(`Logicstarter storage provider ${provider} does not implement ${operation} yet.`);
	};
}
function getLogicstarterStorageContentType(filePath) {
	return contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
}
function createLocalStorageProvider(config) {
	return {
		provider: "local",
		validateConfig() {},
		async putObject(input) {
			this.validateConfig();
			const key = assertSafeStorageKey(input.key);
			const absolutePath = resolveLogicstarterLocalStoragePath(key, config);
			await mkdir(path.dirname(absolutePath), { recursive: true });
			await writeFile(absolutePath, toUint8Array(input.body));
			return {
				key,
				url: resolvePublicUrl(config.publicBaseUrl, key) ?? void 0
			};
		},
		getPublicUrl(key) {
			return resolvePublicUrl(config.publicBaseUrl, key);
		},
		async getSignedUrl(input) {
			this.validateConfig();
			if (input.method === "PUT") throw new Error("Logicstarter local storage does not support signed PUT URLs.");
			const url = resolvePublicUrl(config.publicBaseUrl, input.key);
			if (!url) throw new Error("A valid storage key is required to resolve a local storage URL.");
			return { url };
		},
		async deleteObject(input) {
			this.validateConfig();
			await rm(resolveLogicstarterLocalStoragePath(input.key, config), { force: true });
		}
	};
}
function createS3StorageProvider(config) {
	if (!config.s3Region || !config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) return {
		provider: "s3",
		validateConfig() {
			throw new Error("S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are required when STORAGE_PROVIDER=s3.");
		},
		putObject: createNotImplementedOperation("s3", "putObject"),
		getPublicUrl(key) {
			return resolvePublicUrl(config.publicBaseUrl, key) ?? buildS3DefaultPublicUrl(config, key);
		},
		getSignedUrl: createNotImplementedOperation("s3", "getSignedUrl"),
		deleteObject: createNotImplementedOperation("s3", "deleteObject")
	};
	const client = createS3CompatibleClient({
		region: config.s3Region,
		endpoint: config.s3Endpoint,
		forcePathStyle: parseForcePathStyle(config.s3ForcePathStyle),
		accessKeyId: config.s3AccessKeyId,
		secretAccessKey: config.s3SecretAccessKey
	});
	return createRemoteStorageProvider({
		provider: "s3",
		config,
		bucket: config.s3Bucket,
		client,
		resolvePublicUrlForKey(key) {
			return resolvePublicUrl(config.publicBaseUrl, key) ?? buildS3DefaultPublicUrl(config, key);
		}
	});
}
function createR2StorageProvider(config) {
	if (!config.r2AccountId || !config.r2Bucket || !config.r2AccessKeyId || !config.r2SecretAccessKey) return {
		provider: "r2",
		validateConfig() {
			throw new Error("R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required when STORAGE_PROVIDER=r2.");
		},
		putObject: createNotImplementedOperation("r2", "putObject"),
		getPublicUrl(key) {
			return resolvePublicUrl(config.publicBaseUrl, key) ?? buildR2DefaultPublicUrl(config, key);
		},
		getSignedUrl: createNotImplementedOperation("r2", "getSignedUrl"),
		deleteObject: createNotImplementedOperation("r2", "deleteObject")
	};
	const client = createS3CompatibleClient({
		region: "auto",
		endpoint: buildR2Endpoint(config) ?? void 0,
		forcePathStyle: true,
		accessKeyId: config.r2AccessKeyId,
		secretAccessKey: config.r2SecretAccessKey
	});
	return createRemoteStorageProvider({
		provider: "r2",
		config,
		bucket: config.r2Bucket,
		client,
		resolvePublicUrlForKey(key) {
			return resolvePublicUrl(config.publicBaseUrl, key) ?? buildR2DefaultPublicUrl(config, key);
		}
	});
}
function getLogicstarterStorageRuntimeSnapshot() {
	const config = readLogicstarterProviderConfig().storage;
	const capabilities = {
		putObject: true,
		deleteObject: true,
		signedGetUrl: true,
		signedPutUrl: config.provider === "s3" || config.provider === "r2",
		publicObjectUrl: true
	};
	return {
		provider: config.provider,
		localBasePath: resolveLocalBasePath(config),
		publicBaseUrl: config.publicBaseUrl,
		s3Region: config.s3Region,
		s3Bucket: config.s3Bucket,
		s3Endpoint: config.s3Endpoint,
		s3ForcePathStyle: parseForcePathStyle(config.s3ForcePathStyle),
		r2AccountId: config.r2AccountId,
		r2Bucket: config.r2Bucket,
		resolvedEndpoint: config.provider === "s3" ? config.s3Endpoint ?? (config.s3Region ? `https://s3.${config.s3Region}.amazonaws.com` : null) : config.provider === "r2" ? buildR2Endpoint(config) : null,
		capabilities
	};
}
function createLogicstarterStorageProvider() {
	const config = readLogicstarterProviderConfig().storage;
	if (config.provider === "s3") return createS3StorageProvider(config);
	if (config.provider === "r2") return createR2StorageProvider(config);
	return createLocalStorageProvider(config);
}
//#endregion
//#region app/lib/logicstarter/index.server.ts
function logicstarter() {
	return {
		sendEmail: sendLogicstarterEmail,
		sendSms: sendLogicstarterSms,
		storage: createLogicstarterStorageProvider()
	};
}
//#endregion
//#region app/lib/auth.server.ts
function createLogicstarterAuthDatabase() {
	return drizzleAdapter(getLogicstarterDb(), {
		provider: getLogicstarterDatabaseProfile(),
		schema: createLogicstarterAuthDatabaseSchema()
	});
}
function createLogicstarterAuthDatabaseSchema() {
	return {
		user,
		session,
		account,
		verification,
		organization: organization$1,
		member,
		invitation,
		ssoProvider
	};
}
function normalizeOrigin(value) {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	try {
		if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return new URL(trimmed).origin;
		return new URL(`https://${trimmed}`).origin;
	} catch {
		return null;
	}
}
function getRequestOrigin(request) {
	if (!request) return null;
	try {
		const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
		const forwardedProto = request.headers.get("x-forwarded-proto");
		if (forwardedHost) return `${forwardedProto?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "") || "https"}://${forwardedHost.split(",")[0].trim()}`;
		return new URL(request.url).origin;
	} catch {
		return null;
	}
}
function resolveConfiguredAuthOrigin() {
	const runtime = readLogicstarterProviderConfig().runtime;
	return normalizeOrigin(runtime.authCanonicalOrigin) || normalizeOrigin(runtime.betterAuthUrl) || normalizeOrigin(runtime.appOrigin) || normalizeOrigin(readLogicstarterEnvValue("BETTER_AUTH_URL")) || normalizeOrigin(readLogicstarterEnvValue("APP_ORIGIN"));
}
function resolveBetterAuthSecret() {
	const runtimeSecret = readLogicstarterEnvValue("BETTER_AUTH_SECRET");
	if (runtimeSecret) return runtimeSecret;
	throw new Error("BETTER_AUTH_SECRET is required for Logicstarter auth.");
}
function getBaseUrl(request) {
	return normalizeOrigin(getRequestOrigin(request)) || resolveConfiguredAuthOrigin();
}
function shouldUseSecureCookies(origin) {
	if (!origin) return false;
	try {
		return new URL(origin).protocol === "https:";
	} catch {
		return false;
	}
}
function getTrustedOrigins(request) {
	const trustedOrigins = /* @__PURE__ */ new Set();
	const runtime = readLogicstarterProviderConfig().runtime;
	const candidates = [
		getRequestOrigin(request),
		runtime.authCanonicalOrigin,
		runtime.betterAuthUrl,
		runtime.appOrigin,
		readLogicstarterEnvValue("BETTER_AUTH_URL"),
		readLogicstarterEnvValue("APP_ORIGIN")
	];
	for (const value of candidates) {
		const origin = normalizeOrigin(value);
		if (origin) trustedOrigins.add(origin);
	}
	return [...trustedOrigins];
}
var configuredAuthOrigin = resolveConfiguredAuthOrigin();
var betterAuthSecret = resolveBetterAuthSecret();
var logicstarterAdapter = logicstarter();
var socialProviders = readLogicstarterSocialProviders();
var cachedStripePluginPromise = null;
async function resolveLogicstarterStripePlugin() {
	if (readLogicstarterRuntimeTarget() !== "node") return null;
	const billingConfig = readLogicstarterProviderConfig().billing;
	const stripeSecretKey = billingConfig.stripeSecretKey?.trim();
	const stripeWebhookSecret = billingConfig.stripeWebhookSecret?.trim();
	if (!stripeSecretKey || !stripeWebhookSecret) return null;
	const [{ stripe }, { default: Stripe }] = await Promise.all([import("@better-auth/stripe"), import("stripe")]);
	return stripe({
		stripeClient: new Stripe(stripeSecretKey, { apiVersion: "2025-11-17.clover" }),
		stripeWebhookSecret,
		createCustomerOnSignUp: true,
		organization: { enabled: true }
	});
}
async function getLogicstarterStripePlugin() {
	cachedStripePluginPromise ??= resolveLogicstarterStripePlugin();
	return cachedStripePluginPromise;
}
async function createNodeLogicstarterAuth(request) {
	const baseURL = getBaseUrl(request) || configuredAuthOrigin;
	const trustedOrigins = getTrustedOrigins(request);
	const useSecureCookies = shouldUseSecureCookies(baseURL);
	const stripePlugin = await getLogicstarterStripePlugin();
	return betterAuth({
		secret: betterAuthSecret,
		baseURL: baseURL ?? void 0,
		trustHost: true,
		trustedOrigins,
		advanced: {
			useSecureCookies,
			crossSubDomainCookies: { enabled: false },
			cookies: {
				state: {
					name: "better-auth.state",
					options: {
						httpOnly: true,
						sameSite: "lax",
						path: "/",
						secure: useSecureCookies,
						maxAge: 600
					}
				},
				pkce_code_verifier: {
					name: "better-auth.pkce_code_verifier",
					options: {
						httpOnly: true,
						sameSite: "lax",
						path: "/",
						secure: useSecureCookies,
						maxAge: 600
					}
				}
			}
		},
		database: createLogicstarterAuthDatabase(),
		socialProviders,
		session: {
			expiresIn: 3600 * 24 * 30,
			updateAge: 3600 * 24
		},
		account: {
			storeStateStrategy: "cookie",
			accountLinking: { enabled: true }
		},
		emailAndPassword: {
			enabled: true,
			async sendResetPassword({ user, url }) {
				await logicstarterAdapter.sendEmail({
					template: "reset-password",
					to: user.email,
					variables: {
						resetLink: url,
						userEmail: user.email,
						userName: user.name,
						appName: "Logicstarter"
					}
				});
			}
		},
		emailVerification: {
			sendOnSignUp: true,
			async sendVerificationEmail({ user, url }) {
				await logicstarterAdapter.sendEmail({
					template: "verify-email",
					to: user.email,
					variables: {
						verificationUrl: url,
						userEmail: user.email,
						userName: user.name,
						appName: "Logicstarter"
					}
				});
			}
		},
		plugins: [
			organization({ async sendInvitationEmail(data) {
				await logicstarterAdapter.sendEmail({
					template: "invitation",
					to: data.email,
					variables: {
						inviteLink: `${baseURL ?? configuredAuthOrigin ?? ""}/accept-invitation/${data.id}`,
						inviterName: data.inviter.user.name,
						inviterEmail: data.inviter.user.email,
						organizationName: data.organization.name,
						role: data.role,
						appName: "Logicstarter"
					}
				});
			} }),
			phoneNumber({ async sendOTP({ phoneNumber, code }) {
				await logicstarterAdapter.sendSms({
					to: phoneNumber,
					code,
					template: "phone-verification"
				});
			} }),
			i18n({
				defaultLocale: "en",
				detection: ["header", "cookie"],
				translations: { en: {
					USER_NOT_FOUND: "User not found",
					INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
					INVALID_PASSWORD: "Invalid password"
				} }
			}),
			sso(),
			...stripePlugin ? [stripePlugin] : [],
			dash({
				apiKey: process.env.BETTER_AUTH_API_KEY,
				activityTracking: {
					enabled: true,
					updateInterval: 3e5
				}
			})
		]
	});
}
async function createCloudflareLogicstarterAuth(request, runtimeContext) {
	if (readLogicstarterProviderConfig().runtime.databaseProfile !== "d1") throw new Error("Cloudflare auth currently requires DATABASE_PROFILE=d1 before enabling RUNTIME_TARGET=cloudflare.");
	const cloudflareRequestContext = runtimeContext?.cloudflare;
	const baseURL = getBaseUrl(request) || configuredAuthOrigin;
	const trustedOrigins = getTrustedOrigins(request);
	const useSecureCookies = shouldUseSecureCookies(baseURL);
	return betterAuth({
		secret: betterAuthSecret,
		baseURL: baseURL ?? void 0,
		trustHost: true,
		trustedOrigins,
		advanced: {
			useSecureCookies,
			crossSubDomainCookies: { enabled: false },
			cookies: {
				state: {
					name: "better-auth.state",
					options: {
						httpOnly: true,
						sameSite: "lax",
						path: "/",
						secure: useSecureCookies,
						maxAge: 600
					}
				},
				pkce_code_verifier: {
					name: "better-auth.pkce_code_verifier",
					options: {
						httpOnly: true,
						sameSite: "lax",
						path: "/",
						secure: useSecureCookies,
						maxAge: 600
					}
				}
			}
		},
		database: createLogicstarterAuthDatabase(),
		socialProviders,
		session: {
			expiresIn: 3600 * 24 * 30,
			updateAge: 3600 * 24
		},
		account: {
			storeStateStrategy: "cookie",
			accountLinking: { enabled: true }
		},
		emailAndPassword: {
			enabled: true,
			async sendResetPassword({ user, url }) {
				await logicstarterAdapter.sendEmail({
					template: "reset-password",
					to: user.email,
					variables: {
						resetLink: url,
						userEmail: user.email,
						userName: user.name,
						appName: "Logicstarter"
					}
				});
			}
		},
		emailVerification: {
			sendOnSignUp: true,
			async sendVerificationEmail({ user, url }) {
				await logicstarterAdapter.sendEmail({
					template: "verify-email",
					to: user.email,
					variables: {
						verificationUrl: url,
						userEmail: user.email,
						userName: user.name,
						appName: "Logicstarter"
					}
				});
			}
		},
		plugins: [
			cloudflare({ cf: cloudflareRequestContext?.cf ?? null }),
			organization({ async sendInvitationEmail(data) {
				await logicstarterAdapter.sendEmail({
					template: "invitation",
					to: data.email,
					variables: {
						inviteLink: `${baseURL ?? configuredAuthOrigin ?? ""}/accept-invitation/${data.id}`,
						inviterName: data.inviter.user.name,
						inviterEmail: data.inviter.user.email,
						organizationName: data.organization.name,
						role: data.role,
						appName: "Logicstarter"
					}
				});
			} }),
			phoneNumber({ async sendOTP({ phoneNumber, code }) {
				await logicstarterAdapter.sendSms({
					to: phoneNumber,
					code,
					template: "phone-verification"
				});
			} }),
			i18n({
				defaultLocale: "en",
				detection: ["header", "cookie"],
				translations: { en: {
					USER_NOT_FOUND: "User not found",
					INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
					INVALID_PASSWORD: "Invalid password"
				} }
			}),
			sso(),
			dash({
				apiKey: process.env.BETTER_AUTH_API_KEY,
				activityTracking: {
					enabled: true,
					updateInterval: 3e5
				}
			})
		]
	});
}
function createVercelLogicstarterAuth() {
	throw new Error("Vercel auth factory is not wired yet. Add a Vercel runtime database adapter before enabling RUNTIME_TARGET=vercel.");
}
async function getLogicstarterAuth(request, runtimeContext) {
	const runtimeTarget = readLogicstarterRuntimeTarget();
	if (runtimeTarget === "cloudflare") return createCloudflareLogicstarterAuth(request, runtimeContext);
	if (runtimeTarget === "vercel") return createVercelLogicstarterAuth();
	return createNodeLogicstarterAuth(request);
}
//#endregion
//#region app/root.tsx
var root_exports = /* @__PURE__ */ __exportAll({
	Layout: () => Layout,
	default: () => root_default,
	links: () => links,
	loader: () => loader$20
});
async function loader$20({ request }) {
	return { session: await (await getLogicstarterAuth(request)).api.getSession({ headers: request.headers }) };
}
var links = () => [
	{
		rel: "stylesheet",
		href: app_default
	},
	{
		rel: "preconnect",
		href: "https://fonts.googleapis.com"
	},
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous"
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
	}
];
function Layout({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		className: "h-full",
		children: [/* @__PURE__ */ jsxs("head", { children: [
			/* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
			/* @__PURE__ */ jsx("meta", {
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			}),
			/* @__PURE__ */ jsx(Meta, {}),
			/* @__PURE__ */ jsx(Links, {})
		] }), /* @__PURE__ */ jsxs("body", { children: [
			children,
			/* @__PURE__ */ jsx(ScrollRestoration, {}),
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	});
}
var root_default = UNSAFE_withComponentProps(function App() {
	return /* @__PURE__ */ jsx(Outlet, {});
});
//#endregion
//#region app/lib/logicstarter/auth-methods.ts
var logicstarterAuthMethods = {
	password: {
		key: "password",
		kind: "native",
		label: "Email and Password"
	},
	google: {
		key: "google",
		kind: "social",
		label: "Google"
	},
	github: {
		key: "github",
		kind: "social",
		label: "GitHub"
	}
};
function listLogicstarterAuthMethodsByKeys(keys) {
	return keys.map((key) => logicstarterAuthMethods[key]);
}
//#endregion
//#region app/lib/logicstarter/auth-methods.server.ts
function listEnabledLogicstarterAuthMethods() {
	const auth = readLogicstarterProviderConfig().auth;
	const enabled = ["password"];
	if (auth.googleEnabled && auth.googleClientId && auth.googleClientSecret) enabled.push("google");
	if (auth.githubEnabled && auth.githubClientId && auth.githubClientSecret) enabled.push("github");
	return listLogicstarterAuthMethodsByKeys(enabled);
}
//#endregion
//#region app/lib/logicstarter/storage-upload-policy.ts
var logicstarterStorageMaxUploadBytes = 10 * 1024 * 1024;
var logicstarterStorageAllowedContentTypes = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/svg+xml",
	"application/pdf",
	"application/json",
	"text/plain",
	"text/markdown"
];
var logicstarterStorageUploadAccept = [...logicstarterStorageAllowedContentTypes, ".md"].join(",");
var logicstarterStorageUploadPolicyLabel = "images, PDF, JSON, text; max 10 MB";
//#endregion
//#region app/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region app/components/ui/button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", {
	variants: {
		variant: {
			default: "bg-primary px-4 py-2.5 text-primary-foreground shadow-sm hover:opacity-90",
			secondary: "bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-4 py-2.5 text-foreground ring-1 ring-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
			ghost: "px-3 py-2 text-foreground hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
			destructive: "bg-red-600 px-4 py-2.5 text-white shadow-sm hover:bg-red-500",
			outline: "border border-border bg-transparent px-4 py-2.5 text-foreground hover:bg-muted"
		},
		size: {
			default: "h-10",
			sm: "h-9 px-3",
			lg: "h-11 px-5"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		ref,
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
});
Button.displayName = "Button";
//#endregion
//#region app/components/ui/input.tsx
var Input = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("input", {
		ref,
		className: cn("flex h-10 w-full rounded-xl border border-border bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400", className),
		...props
	});
});
Input.displayName = "Input";
//#endregion
//#region app/components/ui/label.tsx
var Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(LabelPrimitive.Root, {
	ref,
	className: cn("text-sm font-medium text-slate-200", className),
	...props
}));
Label.displayName = LabelPrimitive.Root.displayName;
//#endregion
//#region app/components/auth/LoginModal.tsx
var SOCIAL_LABELS = {
	google: "Continue with Google",
	github: "Continue with GitHub"
};
function GoogleIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		viewBox: "0 0 24 24",
		xmlns: "http://www.w3.org/2000/svg",
		children: [
			/* @__PURE__ */ jsx("path", {
				d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z",
				fill: "#4285F4"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
				fill: "#34A853"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
				fill: "#FBBC05"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
				fill: "#EA4335"
			})
		]
	});
}
function LoginModal({ open, onClose, loginMethods }) {
	const backdropDown = useRef(false);
	const [view, setView] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [loading, setLoading] = useState(false);
	const [loadingSocial, setLoadingSocial] = useState(null);
	const [existingUserInfo, setExistingUserInfo] = useState({});
	const enabledSocialMethods = useMemo(() => loginMethods.filter((method) => method.kind === "social"), [loginMethods]);
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (event) => {
			if (event.key === "Escape") close();
		};
		window.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	});
	if (!open) return null;
	const reset = () => {
		setView("login");
		setEmail("");
		setPassword("");
		setConfirmPassword("");
		setError("");
		setNotice("");
		setLoading(false);
		setLoadingSocial(null);
		setExistingUserInfo({});
	};
	const close = () => {
		reset();
		onClose();
	};
	const openPasswordStep = async (nextEmail) => {
		setLoading(true);
		setError("");
		setNotice("");
		try {
			const response = await fetch("/api/check-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: nextEmail })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Email check failed");
			if (!data.exists) {
				setExistingUserInfo({ bootstrapAdminSetup: Boolean(data.bootstrapAdminSetup) });
				setView("register");
				return;
			}
			setExistingUserInfo({
				name: data.name,
				hasSocialAccount: data.hasSocialAccount,
				linkedProviders: Array.isArray(data.linkedProviders) ? data.linkedProviders : [],
				emailVerified: data.emailVerified,
				bootstrapAdminSetup: Boolean(data.bootstrapAdminSetup),
				hasPassword: Boolean(data.hasPassword)
			});
			if (data.hasPassword) {
				setView("password");
				return;
			}
			setView("register");
			setNotice(data.hasSocialAccount ? "This email is already linked to a social account. Complete password setup to use email sign-in too." : "This email exists but does not have a password yet. Finish password setup below.");
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Unable to verify email.");
		} finally {
			setLoading(false);
		}
	};
	const handleSocial = async (provider) => {
		setLoadingSocial(provider);
		setError("");
		setNotice("");
		try {
			const callbackUrl = new URL(window.location.href);
			callbackUrl.hash = "";
			callbackUrl.searchParams.set("authReturn", "social");
			const response = await fetch("/api/auth/sign-in/social", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify({
					provider,
					callbackURL: callbackUrl.toString()
				})
			});
			const data = await response.json().catch(() => null);
			if (!response.ok) throw new Error((data && typeof data === "object" && "message" in data && typeof data.message === "string" ? data.message : null) ?? `${provider} sign-in failed.`);
			const redirectUrl = data && typeof data === "object" && "url" in data && typeof data.url === "string" ? data.url : null;
			if (!redirectUrl) throw new Error("Social sign-in did not return a redirect URL.");
			window.location.href = redirectUrl;
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : `${provider} sign-in failed.`);
			setLoadingSocial(null);
		}
	};
	const handlePasswordSignIn = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError("");
		setNotice("");
		try {
			const result = await (void 0).email({
				email: email.trim(),
				password
			});
			if (result.error) throw new Error(result.error.message || "Invalid email or password.");
			close();
			window.location.reload();
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Invalid email or password.");
		} finally {
			setLoading(false);
		}
	};
	const handleRegister = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError("");
		setNotice("");
		try {
			const response = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					password,
					confirmPassword,
					name: email.trim().split("@")[0] || "user"
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Unable to complete registration.");
			if (data.bootstrapAdminSetup) {
				setNotice(data.message || "Administrator account created. You can now sign in.");
				setView("password");
				setConfirmPassword("");
				return;
			}
			setNotice(data.message || "Registration completed. You can now sign in.");
			setView("password");
			setConfirmPassword("");
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Unable to complete registration.");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm",
		children: [/* @__PURE__ */ jsx("div", {
			className: "absolute inset-0",
			onMouseDown: () => {
				backdropDown.current = true;
			},
			onMouseUp: () => {
				if (backdropDown.current) close();
				backdropDown.current = false;
			}
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative z-10 w-full max-w-xl rounded-[28px] border border-white/10 bg-[rgba(8,15,30,0.96)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200",
							children: "Logicstarter access"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-3 text-3xl font-semibold tracking-tight text-slate-50",
							children: view === "login" ? "Sign in" : view === "password" ? "Enter your password" : "Create your account"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-6 text-slate-300",
							children: view === "login" ? "Use email and password or continue with any enabled social provider." : view === "password" ? "Continue with your email and password." : existingUserInfo.bootstrapAdminSetup ? "This fresh installation will initialize the first administrator account." : "Create password access for this email address."
						})
					] }), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: close,
						className: "rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white",
						children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
					})]
				}),
				view !== "login" ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => {
						setError("");
						setNotice("");
						setView("login");
					},
					className: "mt-5 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white",
					children: [/* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }), "Back"]
				}) : null,
				view === "login" ? /* @__PURE__ */ jsxs("div", {
					className: "mt-6 space-y-5",
					children: [
						enabledSocialMethods.length ? /* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [enabledSocialMethods.map((method) => /* @__PURE__ */ jsxs(Button, {
								type: "button",
								variant: "outline",
								className: "h-12 w-full justify-center bg-white/5 text-slate-100 hover:bg-white/10",
								onClick: () => handleSocial(method.key),
								disabled: loading || loadingSocial !== null,
								children: [loadingSocial === method.key ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : method.key === "google" ? /* @__PURE__ */ jsx(GoogleIcon, { className: "h-4 w-4" }) : null, SOCIAL_LABELS[method.key] ?? `Continue with ${method.label}`]
							}, method.key)), /* @__PURE__ */ jsx("p", {
								className: "px-1 text-center text-xs leading-6 text-slate-400",
								children: "Social sign-in will return you to this page and keep your Logicstarter session active."
							})]
						}) : null,
						enabledSocialMethods.length ? /* @__PURE__ */ jsxs("div", {
							className: "relative",
							children: [/* @__PURE__ */ jsx("div", {
								className: "absolute inset-0 flex items-center",
								children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-white/10" })
							}), /* @__PURE__ */ jsx("div", {
								className: "relative flex justify-center text-xs uppercase tracking-[0.24em]",
								children: /* @__PURE__ */ jsx("span", {
									className: "bg-[rgba(8,15,30,0.96)] px-3 text-slate-500",
									children: "or"
								})
							})]
						}) : null,
						/* @__PURE__ */ jsxs("form", {
							className: "space-y-4",
							onSubmit: (event) => {
								event.preventDefault();
								openPasswordStep(email.trim());
							},
							children: [/* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "login-modal-email",
									children: "Email"
								}), /* @__PURE__ */ jsx(Input, {
									id: "login-modal-email",
									type: "email",
									value: email,
									onChange: (event) => setEmail(event.target.value),
									placeholder: "you@example.com"
								})]
							}), /* @__PURE__ */ jsxs(Button, {
								type: "submit",
								className: "h-11 w-full",
								disabled: loading || !email.trim(),
								children: [loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : null, "Continue with email"]
							})]
						})
					]
				}) : null,
				view === "password" ? /* @__PURE__ */ jsxs("form", {
					className: "mt-6 space-y-4",
					onSubmit: handlePasswordSignIn,
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "login-modal-email-password",
								children: "Email"
							}), /* @__PURE__ */ jsx(Input, {
								id: "login-modal-email-password",
								type: "email",
								value: email,
								onChange: (event) => setEmail(event.target.value)
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "login-modal-password",
								children: "Password"
							}), /* @__PURE__ */ jsx(Input, {
								id: "login-modal-password",
								type: "password",
								value: password,
								onChange: (event) => setPassword(event.target.value),
								placeholder: "Enter your password"
							})]
						}),
						/* @__PURE__ */ jsxs(Button, {
							type: "submit",
							className: "h-11 w-full",
							disabled: loading || !email.trim() || !password,
							children: [loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : null, "Sign in"]
						})
					]
				}) : null,
				view === "register" ? /* @__PURE__ */ jsxs("form", {
					className: "mt-6 space-y-4",
					onSubmit: handleRegister,
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "register-modal-email",
								children: "Email"
							}), /* @__PURE__ */ jsx(Input, {
								id: "register-modal-email",
								type: "email",
								value: email,
								onChange: (event) => setEmail(event.target.value)
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "register-modal-password",
								children: "Password"
							}), /* @__PURE__ */ jsx(Input, {
								id: "register-modal-password",
								type: "password",
								value: password,
								onChange: (event) => setPassword(event.target.value),
								placeholder: "Minimum 8 characters"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "register-modal-confirm-password",
								children: "Confirm password"
							}), /* @__PURE__ */ jsx(Input, {
								id: "register-modal-confirm-password",
								type: "password",
								value: confirmPassword,
								onChange: (event) => setConfirmPassword(event.target.value),
								placeholder: "Repeat your password"
							})]
						}),
						/* @__PURE__ */ jsxs(Button, {
							type: "submit",
							className: "h-11 w-full",
							disabled: loading || !email.trim() || !password || !confirmPassword,
							children: [loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : null, existingUserInfo.bootstrapAdminSetup ? "Create administrator" : "Create account"]
						})
					]
				}) : null,
				notice ? /* @__PURE__ */ jsx("div", {
					className: "mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100",
					children: notice
				}) : null,
				error ? /* @__PURE__ */ jsx("div", {
					className: "mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200",
					children: error
				}) : null
			]
		})]
	});
}
var { signIn, signOut, signUp, useSession } = createAuthClient({
	baseURL: typeof window !== "undefined" ? window.location.origin : void 0,
	credentialsPropagation: true,
	plugins: [
		organizationClient(),
		dashClient(),
		ssoClient(),
		stripeClient()
	]
});
async function getSession() {
	const response = await fetch("/api/auth/get-session", {
		method: "GET",
		credentials: "include",
		headers: { Accept: "application/json" }
	});
	if (!response.ok) throw new Error(`Failed to fetch auth session: ${response.status}`);
	return { data: await response.json() };
}
//#endregion
//#region app/routes/_index.tsx
var _index_exports = /* @__PURE__ */ __exportAll({
	default: () => _index_default,
	loader: () => loader$19
});
async function loader$19(_) {
	return {
		authMethods: listEnabledLogicstarterAuthMethods(),
		storageRuntime: getLogicstarterStorageRuntimeSnapshot()
	};
}
var coreItems = [
	"Better Auth runtime",
	"Provider settings store",
	"Email and SMS adapter layer",
	"Social login configuration",
	"Env export and runtime sync",
	"PostgreSQL-backed persistence"
];
var operatorLinks = [
	{
		label: "Provider settings",
		href: "/settings/providers",
		description: "Review, validate, save, and export runtime provider configuration."
	},
	{
		label: "Focused authentication settings",
		href: "/settings/providers?category=authentication",
		description: "Jump straight into Google and GitHub login configuration before testing sign-in."
	},
	{
		label: "Focused SMS settings",
		href: "/settings/providers?category=sms",
		description: "Inspect DB-backed SMS provider state and export it into the runtime .env file."
	}
];
var capabilityGroups = [
	{
		eyebrow: "Authentication",
		title: "Social login and email/password are now part of the starter runtime.",
		description: "Google and GitHub can be configured through the operator flow while Better Auth stays the system of record."
	},
	{
		eyebrow: "Communications",
		title: "Email and SMS delivery are wired as provider-driven runtime modules.",
		description: "Resend, SES, Vonage, Amazon SNS, and console fallback can be validated from one place without editing source code."
	},
	{
		eyebrow: "Operator flow",
		title: "Settings can now validate, save to DB, read back, and export into .env.",
		description: "This gives you an operator path that is much closer to a real starter control plane instead of a raw configuration form."
	}
];
var _index_default = UNSAFE_withComponentProps(function Index() {
	const data = useLoaderData();
	const [loginOpen, setLoginOpen] = useState(false);
	const [signingOut, setSigningOut] = useState(false);
	const [uploadPending, setUploadPending] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const [uploadResult, setUploadResult] = useState(null);
	const rootData = useRouteLoaderData("root");
	const [clientSession, setClientSession] = useState(void 0);
	const fallbackSession = rootData?.session ?? null;
	const authReturnRef = useRef(typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("authReturn") : null);
	const storageFileInputRef = useRef(null);
	const effectiveSessionUser = (clientSession === void 0 ? fallbackSession : clientSession ?? null)?.user ?? null;
	const sessionDisplayName = effectiveSessionUser?.name?.trim() || effectiveSessionUser?.email?.trim() || "user";
	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const result = await getSession();
				const nextSession = result && typeof result === "object" && "data" in result ? result.data : result;
				if (active) {
					setClientSession(nextSession ?? null);
					if (authReturnRef.current) {
						const nextUrl = new URL(window.location.href);
						nextUrl.searchParams.delete("authReturn");
						window.history.replaceState({}, "", nextUrl.toString());
						authReturnRef.current = null;
					}
				}
			} catch (error) {
				console.error("[Logicstarter Auth] Failed to refresh homepage session state", { error });
				if (active) setClientSession(fallbackSession);
			}
		})();
		return () => {
			active = false;
		};
	}, [fallbackSession]);
	const sessionLabel = effectiveSessionUser ? `Signed in as ${effectiveSessionUser.name || effectiveSessionUser.email || "user"}` : "No active session yet.";
	const handleStorageDelete = async () => {
		if (!uploadResult?.key) return;
		setUploadPending(true);
		setUploadError("");
		try {
			const response = await fetch("/api/storage/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ key: uploadResult.key })
			});
			const payload = await response.json();
			if (!response.ok || !payload.ok) throw new Error(payload.error || "Storage delete failed.");
			setUploadResult(null);
			if (storageFileInputRef.current) storageFileInputRef.current.value = "";
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Storage delete failed.");
		} finally {
			setUploadPending(false);
		}
	};
	const handleStorageUpload = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setUploadPending(true);
		setUploadError("");
		try {
			const formData = new FormData();
			formData.set("file", file);
			formData.set("prefix", "homepage");
			const response = await fetch("/api/storage/upload", {
				method: "POST",
				body: formData
			});
			const payload = await response.json();
			if (!response.ok || !payload.ok || typeof payload.key !== "string") throw new Error(payload.error || "Storage upload failed.");
			setUploadResult({
				key: payload.key,
				url: typeof payload.url === "string" ? payload.url : null,
				contentType: typeof payload.contentType === "string" ? payload.contentType : null,
				size: typeof payload.size === "number" ? payload.size : file.size
			});
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Storage upload failed.");
		} finally {
			setUploadPending(false);
			if (storageFileInputRef.current) storageFileInputRef.current.value = "";
		}
	};
	const handleSignOut = async () => {
		setSigningOut(true);
		try {
			await signOut();
			setClientSession(null);
			window.location.href = "/";
		} finally {
			setSigningOut(false);
		}
	};
	return /* @__PURE__ */ jsxs("main", {
		className: "min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_45%,#020617_100%)] text-white",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14",
			children: [
				/* @__PURE__ */ jsx("header", {
					className: "sticky top-4 z-20 rounded-[28px] border border-white/10 bg-[rgba(8,15,30,0.8)] px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-4",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs uppercase tracking-[0.24em] text-slate-400",
							children: "Logicstarter"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-slate-300",
							children: "Better Auth-first starter runtime"
						})] }), /* @__PURE__ */ jsxs("nav", {
							className: "flex flex-wrap items-center gap-2 text-sm text-slate-300",
							children: [
								/* @__PURE__ */ jsx(Link, {
									to: "/",
									className: "rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white",
									children: "Home"
								}),
								effectiveSessionUser ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
									className: "rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-emerald-100",
									children: sessionDisplayName
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => void handleSignOut(),
									disabled: signingOut,
									className: "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60",
									children: signingOut ? "Signing out..." : "Sign out"
								})] }) : /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setLoginOpen(true),
									className: "rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-emerald-200 transition hover:bg-emerald-500/20",
									children: "Login"
								}),
								/* @__PURE__ */ jsx(Link, {
									to: "/settings/providers",
									className: "rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white",
									children: "Provider settings"
								}),
								/* @__PURE__ */ jsx(Link, {
									to: "/settings/providers?category=authentication",
									className: "rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white",
									children: "Authentication"
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "rounded-[34px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-sm sm:p-10",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200",
								children: "Starter operator preview"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl",
								children: "A polished Better Auth starter shell that is ready for operator testing."
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg",
								children: "Logicstarter now has DB-backed provider settings, env-first runtime resolution, and export-to-env controls. I am aligning the entry experience with the original starter so you can test configuration and then move directly into login validation."
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-8 flex flex-wrap gap-4",
								children: [
									/* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => setLoginOpen(true),
										className: "inline-flex items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20",
										children: "Open login"
									}),
									/* @__PURE__ */ jsx(Link, {
										to: "/settings/providers",
										className: "inline-flex items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20",
										children: "Open provider console"
									}),
									/* @__PURE__ */ jsx(Link, {
										to: "/settings/providers?category=authentication",
										className: "inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10",
										children: "Prepare login settings"
									})
								]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
								children: coreItems.map((item) => /* @__PURE__ */ jsx("div", {
									className: "rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-slate-100",
									children: item
								}, item))
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-[34px] border border-emerald-400/20 bg-emerald-500/10 p-8 backdrop-blur-sm",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs uppercase tracking-[0.24em] text-emerald-200",
										children: "Login entry"
									}),
									/* @__PURE__ */ jsx("h2", {
										className: "mt-4 text-2xl font-semibold tracking-[-0.04em] text-white",
										children: "Starter-style access modal"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-4 text-sm leading-7 text-slate-200",
										children: "Open the Better Auth login modal to continue with email/password or any enabled social provider without leaving the homepage."
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-6 flex flex-wrap gap-3",
										children: [/* @__PURE__ */ jsx("button", {
											type: "button",
											onClick: () => setLoginOpen(true),
											className: "inline-flex items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20",
											children: "Open login modal"
										}), /* @__PURE__ */ jsx(Link, {
											to: "/settings/providers?category=authentication",
											className: "inline-flex items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20",
											children: "Open auth settings"
										})]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-[34px] border border-violet-400/20 bg-violet-500/10 p-8 backdrop-blur-sm",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs uppercase tracking-[0.24em] text-violet-200",
										children: "Session"
									}),
									/* @__PURE__ */ jsx("h2", {
										className: "mt-4 text-2xl font-semibold tracking-[-0.04em] text-white",
										children: "Runtime status"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-4 text-sm leading-7 text-slate-200",
										children: sessionLabel
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-6 rounded-[22px] border border-white/10 bg-black/20 p-4",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs uppercase tracking-[0.18em] text-slate-400",
											children: "Enabled auth methods"
										}), /* @__PURE__ */ jsx("div", {
											className: "mt-4 flex flex-wrap gap-3",
											children: data.authMethods.map((method) => /* @__PURE__ */ jsx("span", {
												className: "inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200",
												children: method.label
											}, method.key))
										})]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-[34px] border border-cyan-400/20 bg-cyan-500/10 p-8 backdrop-blur-sm",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs uppercase tracking-[0.24em] text-cyan-200",
										children: "Storage upload"
									}),
									/* @__PURE__ */ jsx("h2", {
										className: "mt-4 text-2xl font-semibold tracking-[-0.04em] text-white",
										children: "Test the local storage runtime"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-4 text-sm leading-7 text-slate-200",
										children: "Upload a file through the new storage API and verify the returned key and public URL without leaving the homepage."
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-slate-200",
										children: [
											/* @__PURE__ */ jsxs("div", { children: [
												/* @__PURE__ */ jsx("span", {
													className: "text-slate-400",
													children: "Provider:"
												}),
												" ",
												data.storageRuntime.provider
											] }),
											/* @__PURE__ */ jsxs("div", {
												className: "mt-2 break-all",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "Local path:"
													}),
													" ",
													data.storageRuntime.localBasePath
												]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "mt-2 break-all",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "Public base URL:"
													}),
													" ",
													data.storageRuntime.publicBaseUrl || "/uploads"
												]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "mt-2 break-all",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "Upload policy:"
													}),
													" ",
													logicstarterStorageUploadPolicyLabel
												]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "mt-2 break-all",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "Max upload bytes:"
													}),
													" ",
													logicstarterStorageMaxUploadBytes
												]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "mt-2 break-all",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "Accept:"
													}),
													" ",
													logicstarterStorageUploadAccept
												]
											})
										]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-6 flex flex-wrap items-center gap-3",
										children: [/* @__PURE__ */ jsxs("label", {
											className: `inline-flex cursor-pointer items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${effectiveSessionUser ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20" : "cursor-not-allowed border-white/10 bg-white/5 text-slate-400"}`,
											children: [/* @__PURE__ */ jsx("input", {
												ref: storageFileInputRef,
												type: "file",
												className: "sr-only",
												accept: logicstarterStorageUploadAccept,
												disabled: !effectiveSessionUser || uploadPending,
												onChange: (event) => void handleStorageUpload(event)
											}), uploadPending ? "Uploading..." : "Choose file"]
										}), /* @__PURE__ */ jsx("span", {
											className: "text-sm text-slate-300",
											children: effectiveSessionUser ? "Uploads use /api/storage/upload with the signed-in Better Auth session." : "Sign in to enable uploads."
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 flex flex-wrap gap-3",
										children: [/* @__PURE__ */ jsx(Link, {
											to: "/settings/providers?category=storage",
											className: "inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10",
											children: "Open storage settings"
										}), /* @__PURE__ */ jsx("a", {
											href: "/api/storage/runtime",
											target: "_blank",
											rel: "noreferrer",
											className: "inline-flex items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20",
											children: "Open runtime JSON"
										})]
									}),
									uploadError ? /* @__PURE__ */ jsx("div", {
										className: "mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100",
										children: uploadError
									}) : null,
									uploadResult ? /* @__PURE__ */ jsxs("div", {
										className: "mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-slate-200",
										children: [
											/* @__PURE__ */ jsxs("div", { children: [
												/* @__PURE__ */ jsx("span", {
													className: "text-slate-400",
													children: "Key:"
												}),
												" ",
												uploadResult.key
											] }),
											/* @__PURE__ */ jsxs("div", {
												className: "mt-2",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "Content type:"
													}),
													" ",
													uploadResult.contentType || "unknown"
												]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "mt-2",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "Size:"
													}),
													" ",
													uploadResult.size,
													" bytes"
												]
											}),
											uploadResult.url ? /* @__PURE__ */ jsxs("div", {
												className: "mt-2 break-all",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: "text-slate-400",
														children: "URL:"
													}),
													" ",
													/* @__PURE__ */ jsx("a", {
														href: uploadResult.url,
														target: "_blank",
														rel: "noreferrer",
														className: "text-cyan-200 underline decoration-cyan-400/40 underline-offset-4 hover:text-cyan-100",
														children: uploadResult.url
													})
												]
											}) : null,
											uploadResult.url && uploadResult.contentType?.startsWith("image/") ? /* @__PURE__ */ jsx("img", {
												src: uploadResult.url,
												alt: "Uploaded preview",
												className: "mt-4 max-h-48 rounded-2xl border border-white/10 object-contain"
											}) : null,
											/* @__PURE__ */ jsx("div", {
												className: "mt-4 flex flex-wrap gap-3",
												children: /* @__PURE__ */ jsx("button", {
													type: "button",
													onClick: () => void handleStorageDelete(),
													disabled: uploadPending,
													className: "inline-flex items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60",
													children: uploadPending ? "Working..." : "Delete uploaded file"
												})
											})
										]
									}) : null
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-[34px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-xs uppercase tracking-[0.24em] text-slate-400",
									children: "Operator actions"
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-5 space-y-4",
									children: operatorLinks.map((item) => /* @__PURE__ */ jsxs(Link, {
										to: item.href,
										className: "block rounded-[24px] border border-white/10 bg-black/20 p-5 transition hover:border-cyan-400/30 hover:bg-cyan-500/10",
										children: [/* @__PURE__ */ jsx("div", {
											className: "text-base font-semibold text-white",
											children: item.label
										}), /* @__PURE__ */ jsx("p", {
											className: "mt-2 text-sm leading-6 text-slate-300",
											children: item.description
										})]
									}, item.href))
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsx("section", {
					className: "grid gap-6 lg:grid-cols-3",
					children: capabilityGroups.map((group) => /* @__PURE__ */ jsxs("div", {
						className: "rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs uppercase tracking-[0.24em] text-slate-400",
								children: group.eyebrow
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "mt-4 text-2xl font-semibold tracking-[-0.04em] text-white",
								children: group.title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-4 text-sm leading-7 text-slate-300",
								children: group.description
							})
						]
					}, group.title))
				})
			]
		}), /* @__PURE__ */ jsx(LoginModal, {
			open: loginOpen,
			onClose: () => setLoginOpen(false),
			loginMethods: data.authMethods
		})]
	});
});
//#endregion
//#region app/lib/logicstarter/provider-settings-store.server.ts
async function getLogicstarterStoredProviderSettings(keys) {
	if (!keys.length) return {};
	const rows = await db.select({
		key: logicstarterProviderSetting.key,
		value: logicstarterProviderSetting.value
	}).from(logicstarterProviderSetting).where(inArray(logicstarterProviderSetting.key, keys));
	return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
async function saveLogicstarterProviderSettings(category, values) {
	const entries = Object.entries(values);
	if (!entries.length) return;
	for (const [key, value] of entries) await db.insert(logicstarterProviderSetting).values({
		key,
		category,
		value
	}).onConflictDoUpdate({
		target: logicstarterProviderSetting.key,
		set: {
			category,
			value
		}
	});
}
//#endregion
//#region app/lib/logicstarter/provider-settings.server.ts
var logicstarterProviderSettingsKeys = {
	email: [
		"EMAIL_PROVIDER",
		"EMAIL_FROM",
		"EMAIL_FROM_NAME",
		"RESEND_API_KEY",
		"SMTP_HOST",
		"SMTP_PORT",
		"SMTP_USER",
		"SMTP_PASS",
		"SES_REGION",
		"SES_ACCESS_KEY_ID",
		"SES_SECRET_ACCESS_KEY"
	],
	sms: [
		"SMS_PROVIDER",
		"VONAGE_API_KEY",
		"VONAGE_API_SECRET",
		"VONAGE_FROM",
		"AMAZON_SNS_REGION",
		"AMAZON_SNS_ACCESS_KEY_ID",
		"AMAZON_SNS_SECRET_ACCESS_KEY",
		"AMAZON_SNS_SENDER_ID"
	],
	storage: [
		"STORAGE_PROVIDER",
		"STORAGE_LOCAL_BASE_PATH",
		"STORAGE_PUBLIC_BASE_URL",
		"S3_REGION",
		"S3_BUCKET",
		"S3_ACCESS_KEY_ID",
		"S3_SECRET_ACCESS_KEY",
		"S3_ENDPOINT",
		"S3_FORCE_PATH_STYLE",
		"R2_ACCOUNT_ID",
		"R2_BUCKET",
		"R2_ACCESS_KEY_ID",
		"R2_SECRET_ACCESS_KEY"
	],
	authentication: [
		"AUTH_GOOGLE_ENABLED",
		"AUTH_GOOGLE_CLIENT_ID",
		"AUTH_GOOGLE_CLIENT_SECRET",
		"AUTH_GITHUB_ENABLED",
		"AUTH_GITHUB_CLIENT_ID",
		"AUTH_GITHUB_CLIENT_SECRET"
	],
	billing: [
		"STRIPE_SECRET_KEY",
		"STRIPE_PUBLISHABLE_KEY",
		"STRIPE_WEBHOOK_SECRET"
	]
};
function normalizeSettingValue(value) {
	if (typeof value === "boolean") return value ? "true" : "false";
	return value ?? "";
}
function readRawEnvValue(key) {
	return process.env[key]?.trim();
}
function hasMeaningfulEnvOverride(key) {
	const rawValue = readRawEnvValue(key);
	if (!rawValue) return false;
	if (key === "EMAIL_PROVIDER") return rawValue !== "better_auth_infra" && rawValue !== "better_platform";
	if (key === "SMS_PROVIDER") return rawValue !== "better_auth_infra" && rawValue !== "better_platform";
	if (key === "STORAGE_PROVIDER") return rawValue === "local" || rawValue === "s3" || rawValue === "r2";
	if (key === "AUTH_GOOGLE_ENABLED") return rawValue === "true" || !!readRawEnvValue("AUTH_GOOGLE_CLIENT_ID") || !!readRawEnvValue("AUTH_GOOGLE_CLIENT_SECRET");
	if (key === "AUTH_GITHUB_ENABLED") return rawValue === "true" || !!readRawEnvValue("AUTH_GITHUB_CLIENT_ID") || !!readRawEnvValue("AUTH_GITHUB_CLIENT_SECRET");
	return true;
}
function getLogicstarterEnvValues() {
	const config = readLogicstarterProviderConfig();
	return {
		EMAIL_PROVIDER: config.email.provider,
		EMAIL_FROM: config.email.from,
		EMAIL_FROM_NAME: config.email.fromName,
		RESEND_API_KEY: config.email.resendApiKey,
		SMTP_HOST: config.email.smtpHost,
		SMTP_PORT: config.email.smtpPort,
		SMTP_USER: config.email.smtpUser,
		SMTP_PASS: config.email.smtpPass,
		SES_REGION: config.email.sesRegion,
		SES_ACCESS_KEY_ID: config.email.sesAccessKeyId,
		SES_SECRET_ACCESS_KEY: config.email.sesSecretAccessKey,
		SMS_PROVIDER: config.sms.provider,
		VONAGE_API_KEY: config.sms.vonageApiKey,
		VONAGE_API_SECRET: config.sms.vonageApiSecret,
		VONAGE_FROM: config.sms.vonageFrom,
		AMAZON_SNS_REGION: config.sms.amazonSnsRegion,
		AMAZON_SNS_ACCESS_KEY_ID: config.sms.amazonSnsAccessKeyId,
		AMAZON_SNS_SECRET_ACCESS_KEY: config.sms.amazonSnsSecretAccessKey,
		AMAZON_SNS_SENDER_ID: config.sms.amazonSnsSenderId,
		STORAGE_PROVIDER: config.storage.provider,
		STORAGE_LOCAL_BASE_PATH: config.storage.localBasePath,
		STORAGE_PUBLIC_BASE_URL: config.storage.publicBaseUrl,
		S3_REGION: config.storage.s3Region,
		S3_BUCKET: config.storage.s3Bucket,
		S3_ACCESS_KEY_ID: config.storage.s3AccessKeyId,
		S3_SECRET_ACCESS_KEY: config.storage.s3SecretAccessKey,
		S3_ENDPOINT: config.storage.s3Endpoint,
		S3_FORCE_PATH_STYLE: config.storage.s3ForcePathStyle,
		R2_ACCOUNT_ID: config.storage.r2AccountId,
		R2_BUCKET: config.storage.r2Bucket,
		R2_ACCESS_KEY_ID: config.storage.r2AccessKeyId,
		R2_SECRET_ACCESS_KEY: config.storage.r2SecretAccessKey,
		AUTH_GOOGLE_ENABLED: config.auth.googleEnabled,
		AUTH_GOOGLE_CLIENT_ID: config.auth.googleClientId,
		AUTH_GOOGLE_CLIENT_SECRET: config.auth.googleClientSecret,
		AUTH_GITHUB_ENABLED: config.auth.githubEnabled,
		AUTH_GITHUB_CLIENT_ID: config.auth.githubClientId,
		AUTH_GITHUB_CLIENT_SECRET: config.auth.githubClientSecret,
		STRIPE_SECRET_KEY: config.billing.stripeSecretKey,
		STRIPE_PUBLISHABLE_KEY: config.billing.stripePublishableKey,
		STRIPE_WEBHOOK_SECRET: config.billing.stripeWebhookSecret
	};
}
async function getMergedLogicstarterProviderSettings(keys) {
	const envValues = getLogicstarterEnvValues();
	const storedValues = await getLogicstarterStoredProviderSettings(keys);
	return Object.fromEntries(keys.map((key) => {
		const envValue = envValues[key];
		const envOverride = hasMeaningfulEnvOverride(key);
		const hasStoredValue = Object.prototype.hasOwnProperty.call(storedValues, key);
		const source = envOverride ? "env" : hasStoredValue ? "db" : "default";
		return [key, {
			key,
			value: envOverride ? normalizeSettingValue(envValue) : hasStoredValue ? normalizeSettingValue(storedValues[key]) : normalizeSettingValue(envValue),
			source
		}];
	}));
}
async function getLogicstarterProviderSettingsByCategory(category) {
	return getMergedLogicstarterProviderSettings(logicstarterProviderSettingsKeys[category]);
}
async function getManyLogicstarterProviderSettingsDetail(keys) {
	return getMergedLogicstarterProviderSettings(keys);
}
//#endregion
//#region app/lib/logicstarter/runtime-config.server.ts
async function getResolvedLogicstarterProviderSettingValues() {
	const settings = await getManyLogicstarterProviderSettingsDetail([
		...logicstarterProviderSettingsKeys.email,
		...logicstarterProviderSettingsKeys.sms,
		...logicstarterProviderSettingsKeys.storage,
		...logicstarterProviderSettingsKeys.authentication,
		...logicstarterProviderSettingsKeys.billing
	]);
	return Object.fromEntries(Object.entries(settings).map(([key, detail]) => [key, detail.value]));
}
async function getResolvedLogicstarterProviderConfig() {
	const baseConfig = readLogicstarterProviderConfig();
	if (readLogicstarterRuntimeTarget() !== "node") return baseConfig;
	const settings = await getResolvedLogicstarterProviderSettingValues();
	const emailProvider = settings.EMAIL_PROVIDER || baseConfig.email.provider;
	const smsProvider = settings.SMS_PROVIDER || baseConfig.sms.provider;
	const storageProvider = settings.STORAGE_PROVIDER || baseConfig.storage.provider;
	return {
		runtime: baseConfig.runtime,
		email: {
			provider: emailProvider,
			from: settings.EMAIL_FROM || void 0,
			fromName: settings.EMAIL_FROM_NAME || void 0,
			resendApiKey: settings.RESEND_API_KEY || void 0,
			smtpHost: settings.SMTP_HOST || void 0,
			smtpPort: settings.SMTP_PORT || void 0,
			smtpUser: settings.SMTP_USER || void 0,
			smtpPass: settings.SMTP_PASS || void 0,
			sesRegion: settings.SES_REGION || void 0,
			sesAccessKeyId: settings.SES_ACCESS_KEY_ID || void 0,
			sesSecretAccessKey: settings.SES_SECRET_ACCESS_KEY || void 0
		},
		sms: {
			provider: smsProvider,
			vonageApiKey: settings.VONAGE_API_KEY || void 0,
			vonageApiSecret: settings.VONAGE_API_SECRET || void 0,
			vonageFrom: settings.VONAGE_FROM || void 0,
			amazonSnsRegion: settings.AMAZON_SNS_REGION || void 0,
			amazonSnsAccessKeyId: settings.AMAZON_SNS_ACCESS_KEY_ID || void 0,
			amazonSnsSecretAccessKey: settings.AMAZON_SNS_SECRET_ACCESS_KEY || void 0,
			amazonSnsSenderId: settings.AMAZON_SNS_SENDER_ID || void 0
		},
		storage: {
			provider: storageProvider,
			localBasePath: settings.STORAGE_LOCAL_BASE_PATH || void 0,
			publicBaseUrl: settings.STORAGE_PUBLIC_BASE_URL || void 0,
			s3Region: settings.S3_REGION || void 0,
			s3Bucket: settings.S3_BUCKET || void 0,
			s3AccessKeyId: settings.S3_ACCESS_KEY_ID || void 0,
			s3SecretAccessKey: settings.S3_SECRET_ACCESS_KEY || void 0,
			s3Endpoint: settings.S3_ENDPOINT || void 0,
			s3ForcePathStyle: settings.S3_FORCE_PATH_STYLE || void 0,
			r2AccountId: settings.R2_ACCOUNT_ID || void 0,
			r2Bucket: settings.R2_BUCKET || void 0,
			r2AccessKeyId: settings.R2_ACCESS_KEY_ID || void 0,
			r2SecretAccessKey: settings.R2_SECRET_ACCESS_KEY || void 0
		},
		auth: {
			googleEnabled: settings.AUTH_GOOGLE_ENABLED === "true",
			googleClientId: settings.AUTH_GOOGLE_CLIENT_ID || void 0,
			googleClientSecret: settings.AUTH_GOOGLE_CLIENT_SECRET || void 0,
			githubEnabled: settings.AUTH_GITHUB_ENABLED === "true",
			githubClientId: settings.AUTH_GITHUB_CLIENT_ID || void 0,
			githubClientSecret: settings.AUTH_GITHUB_CLIENT_SECRET || void 0
		},
		billing: {
			stripeSecretKey: settings.STRIPE_SECRET_KEY || void 0,
			stripePublishableKey: settings.STRIPE_PUBLISHABLE_KEY || void 0,
			stripeWebhookSecret: settings.STRIPE_WEBHOOK_SECRET || void 0
		}
	};
}
//#endregion
//#region app/lib/logicstarter/provider-runtime.server.ts
async function getLogicstarterAuthRuntimeSnapshot() {
	const resolvedConfig = await getResolvedLogicstarterProviderConfig();
	const runtime = resolvedConfig.runtime;
	const googleEnabled = resolvedConfig.auth.googleEnabled;
	const githubEnabled = resolvedConfig.auth.githubEnabled;
	const googleConfigured = googleEnabled && !!resolvedConfig.auth.googleClientId && !!resolvedConfig.auth.googleClientSecret;
	const githubConfigured = githubEnabled && !!resolvedConfig.auth.githubClientId && !!resolvedConfig.auth.githubClientSecret;
	const trustedOriginReady = !!runtime.betterAuthUrl || !!runtime.appOrigin || !!runtime.authCanonicalOrigin;
	return {
		provider: "better_auth",
		snapshot: {
			emailPasswordEnabled: true,
			googleEnabled,
			googleConfigured,
			githubEnabled,
			githubConfigured,
			betterAuthUrlConfigured: !!runtime.betterAuthUrl,
			appOriginConfigured: !!runtime.appOrigin,
			authCanonicalOriginConfigured: !!runtime.authCanonicalOrigin,
			trustedOriginReady,
			socialProvidersConfigured: Number(googleConfigured) + Number(githubConfigured)
		}
	};
}
async function getLogicstarterProviderRuntimeOverview() {
	const runtimeConfig = readLogicstarterProviderConfig().runtime;
	const authRuntime = await getLogicstarterAuthRuntimeSnapshot();
	const emailRuntime = await getLogicstarterEmailRuntimeSnapshot();
	const smsRuntime = await getLogicstarterSmsRuntimeSnapshot();
	const billingSnapshot = await getLogicstarterBillingRuntimeSnapshot();
	const billingStatus = getLogicstarterBillingRuntimeStatus(billingSnapshot);
	const storageProvider = createLogicstarterStorageProvider();
	const storageSnapshot = getLogicstarterStorageRuntimeSnapshot();
	let storageRuntimeReady = true;
	let storageError = null;
	try {
		await storageProvider.validateConfig();
	} catch (error) {
		storageRuntimeReady = false;
		storageError = error instanceof Error ? error.message : "Unable to validate Logicstarter storage runtime.";
	}
	const modules = {
		authentication: {
			provider: authRuntime.provider,
			runtimeReady: !!authRuntime.snapshot.trustedOriginReady,
			attention: authRuntime.snapshot.trustedOriginReady ? "healthy" : "action_required",
			remediation: authRuntime.snapshot.trustedOriginReady ? "Authentication origins are ready for Better Auth requests." : "Set BETTER_AUTH_URL, APP_ORIGIN, or AUTH_CANONICAL_ORIGIN before validating sign-in flows.",
			socialProvidersConfigured: authRuntime.snapshot.socialProvidersConfigured,
			snapshot: authRuntime.snapshot
		},
		email: {
			provider: emailRuntime.provider,
			runtimeReady: !!emailRuntime.snapshot.providerReady,
			attention: emailRuntime.snapshot.providerReady ? "healthy" : "action_required",
			remediation: emailRuntime.snapshot.providerReady ? `Email provider ${emailRuntime.provider} is ready.` : `Complete the required credentials for the active email provider ${emailRuntime.provider}.`,
			snapshot: emailRuntime.snapshot
		},
		sms: {
			provider: smsRuntime.provider,
			runtimeReady: !!smsRuntime.snapshot.providerReady,
			attention: smsRuntime.snapshot.providerReady ? "healthy" : "action_required",
			remediation: smsRuntime.snapshot.providerReady ? `SMS provider ${smsRuntime.provider} is ready.` : `Complete the required credentials for the active SMS provider ${smsRuntime.provider}.`,
			snapshot: smsRuntime.snapshot
		},
		billing: {
			provider: "stripe",
			runtimeReady: !!billingSnapshot.pluginActive,
			attention: billingStatus.attention,
			remediation: billingStatus.remediation,
			runtimeHealth: billingStatus.runtimeHealth,
			checkoutReadiness: billingStatus.checkoutReadiness,
			webhookReadiness: billingStatus.webhookReadiness,
			snapshot: billingSnapshot
		},
		storage: {
			provider: storageProvider.provider,
			runtimeReady: storageRuntimeReady,
			attention: storageRuntimeReady ? "healthy" : "action_required",
			remediation: storageRuntimeReady ? `Storage provider ${storageProvider.provider} is ready.` : storageError ?? "Fix the active storage provider configuration before validating uploads.",
			snapshot: storageSnapshot,
			error: storageError
		}
	};
	const readyCount = Object.values(modules).filter((module) => module.runtimeReady).length;
	const incompleteCount = Object.values(modules).length - readyCount;
	const attentionModules = Object.entries(modules).filter(([, module]) => !module.runtimeReady).map(([name, module]) => ({
		name,
		provider: module.provider,
		remediation: module.remediation
	}));
	const cloudflareBlockers = [modules.storage.provider === "local" ? {
		name: "storage",
		reason: "Local storage depends on a writable filesystem and should be replaced with R2 or another remote object store before targeting Cloudflare Workers."
	} : null, billingSnapshot.serverPathMode === "worker_safe_api" ? null : {
		name: "billing",
		reason: "Stripe billing now lazy-loads only for the node runtime target, but checkout and webhook handling still depend on a Node-only server path until a Worker-safe Stripe integration is introduced."
	}].filter((item) => !!item);
	const cloudflareCompatible = cloudflareBlockers.length === 0;
	return {
		runtime: {
			target: runtimeConfig.target,
			databaseProfile: runtimeConfig.databaseProfile,
			supportsRuntimeEnvFileExport: supportsLogicstarterRuntimeEnvFileExport(runtimeConfig.target),
			configSourceMode: getLogicstarterRuntimeConfigSourceMode(runtimeConfig.target),
			cloudflareCompatible,
			cloudflareBlockers
		},
		modules,
		summary: {
			readyCount,
			incompleteCount,
			totalCount: Object.values(modules).length,
			attentionModules
		}
	};
}
async function getLogicstarterBillingRuntimeSnapshot() {
	const resolvedConfig = await getResolvedLogicstarterProviderConfig();
	const runtimeTarget = readLogicstarterRuntimeTarget();
	const serverPluginEligible = runtimeTarget === "node";
	const hasServerKeys = !!resolvedConfig.billing.stripeSecretKey && !!resolvedConfig.billing.stripeWebhookSecret;
	const hasWorkerSafeKeys = !!resolvedConfig.billing.stripeSecretKey && !!resolvedConfig.billing.stripeWebhookSecret;
	const workerPathEligible = runtimeTarget !== "node" && hasWorkerSafeKeys;
	return {
		runtimeTarget,
		stripeSecretKeyConfigured: !!resolvedConfig.billing.stripeSecretKey,
		stripePublishableKeyConfigured: !!resolvedConfig.billing.stripePublishableKey,
		stripeWebhookSecretConfigured: !!resolvedConfig.billing.stripeWebhookSecret,
		serverPluginEligible,
		serverPathMode: serverPluginEligible ? "node_only" : workerPathEligible ? "worker_safe_api" : "worker_unsupported",
		pluginActive: serverPluginEligible && hasServerKeys,
		checkoutReady: !!resolvedConfig.billing.stripeSecretKey && !!resolvedConfig.billing.stripePublishableKey,
		webhookReady: serverPluginEligible ? hasServerKeys : workerPathEligible
	};
}
function getLogicstarterBillingRuntimeStatus(snapshot) {
	const runtimeHealth = snapshot.pluginActive ? "Stripe plugin active" : snapshot.serverPathMode === "worker_safe_api" ? `Worker-safe Stripe billing route active on ${snapshot.runtimeTarget}` : !snapshot.serverPluginEligible && (snapshot.stripeSecretKeyConfigured || snapshot.stripeWebhookSecretConfigured || snapshot.stripePublishableKeyConfigured) ? `Stripe server path unavailable on ${snapshot.runtimeTarget}` : snapshot.stripeSecretKeyConfigured || snapshot.stripeWebhookSecretConfigured || snapshot.stripePublishableKeyConfigured ? "Partial Stripe configuration" : "Stripe plugin inactive";
	const checkoutReadiness = snapshot.checkoutReady ? snapshot.serverPluginEligible ? "Server and client billing keys are present" : snapshot.serverPathMode === "worker_safe_api" ? `Worker-safe checkout route is available on ${snapshot.runtimeTarget}` : `Billing keys are present, but ${snapshot.runtimeTarget} still needs a Worker-safe server path` : "Missing server or client billing key";
	const webhookReadiness = snapshot.webhookReady ? "Webhook verification ready" : !snapshot.serverPluginEligible && snapshot.stripeWebhookSecretConfigured ? `Webhook secret is present, but ${snapshot.runtimeTarget} cannot use the current node-only webhook path` : "Webhook secret missing";
	return {
		attention: snapshot.pluginActive ? "healthy" : "action_required",
		remediation: snapshot.pluginActive ? "Stripe runtime is ready. You can validate checkout and webhook delivery from the current runtime origin." : snapshot.serverPathMode === "worker_safe_api" ? `Stripe runtime is ready through the Worker-safe billing API on ${snapshot.runtimeTarget}. Validate the dedicated checkout and webhook routes from the current runtime origin.` : !snapshot.serverPluginEligible && (snapshot.stripeSecretKeyConfigured || snapshot.stripeWebhookSecretConfigured || snapshot.stripePublishableKeyConfigured) ? `Stripe values are configured, but the current ${snapshot.runtimeTarget} runtime still needs a Worker-safe checkout and webhook implementation instead of the existing node-only server path.` : snapshot.stripeSecretKeyConfigured && !snapshot.stripeWebhookSecretConfigured ? "Add the Stripe webhook secret, export the values to .env.runtime, and restart the service before testing webhooks." : !snapshot.stripeSecretKeyConfigured && snapshot.stripeWebhookSecretConfigured ? "Add the Stripe secret key so the Better Auth Stripe plugin can initialize with webhook verification enabled." : snapshot.stripeSecretKeyConfigured && snapshot.stripeWebhookSecretConfigured && !snapshot.stripePublishableKeyConfigured ? "Add the Stripe publishable key before validating browser checkout surfaces." : "Add the Stripe secret key and webhook secret, export the values to .env.runtime, and restart the service before testing billing flows.",
		runtimeHealth,
		checkoutReadiness,
		webhookReadiness
	};
}
async function getLogicstarterEmailRuntimeSnapshot() {
	const resolvedConfig = await getResolvedLogicstarterProviderConfig();
	const provider = resolvedConfig.email.provider;
	return {
		provider,
		snapshot: {
			fromConfigured: !!resolvedConfig.email.from,
			fromNameConfigured: !!resolvedConfig.email.fromName,
			resendApiKeyConfigured: !!resolvedConfig.email.resendApiKey,
			smtpHostConfigured: !!resolvedConfig.email.smtpHost,
			smtpPortConfigured: !!resolvedConfig.email.smtpPort,
			smtpUserConfigured: !!resolvedConfig.email.smtpUser,
			smtpPassConfigured: !!resolvedConfig.email.smtpPass,
			sesRegionConfigured: !!resolvedConfig.email.sesRegion,
			sesAccessKeyIdConfigured: !!resolvedConfig.email.sesAccessKeyId,
			sesSecretAccessKeyConfigured: !!resolvedConfig.email.sesSecretAccessKey,
			providerReady: provider === "better_platform" ? true : provider === "resend" ? !!resolvedConfig.email.from && !!resolvedConfig.email.resendApiKey : provider === "smtp" ? !!resolvedConfig.email.from && !!resolvedConfig.email.smtpHost && !!resolvedConfig.email.smtpPort && !!resolvedConfig.email.smtpUser && !!resolvedConfig.email.smtpPass : !!resolvedConfig.email.from && !!resolvedConfig.email.sesRegion && !!resolvedConfig.email.sesAccessKeyId && !!resolvedConfig.email.sesSecretAccessKey
		}
	};
}
async function getLogicstarterSmsRuntimeSnapshot() {
	const resolvedConfig = await getResolvedLogicstarterProviderConfig();
	const provider = resolvedConfig.sms.provider;
	return {
		provider,
		snapshot: {
			vonageApiKeyConfigured: !!resolvedConfig.sms.vonageApiKey,
			vonageApiSecretConfigured: !!resolvedConfig.sms.vonageApiSecret,
			vonageFromConfigured: !!resolvedConfig.sms.vonageFrom,
			amazonSnsRegionConfigured: !!resolvedConfig.sms.amazonSnsRegion,
			amazonSnsAccessKeyIdConfigured: !!resolvedConfig.sms.amazonSnsAccessKeyId,
			amazonSnsSecretAccessKeyConfigured: !!resolvedConfig.sms.amazonSnsSecretAccessKey,
			amazonSnsSenderIdConfigured: !!resolvedConfig.sms.amazonSnsSenderId,
			providerReady: provider === "better_platform" || provider === "console" ? true : provider === "vonage" ? !!resolvedConfig.sms.vonageApiKey && !!resolvedConfig.sms.vonageApiSecret && !!resolvedConfig.sms.vonageFrom : !!resolvedConfig.sms.amazonSnsRegion && !!resolvedConfig.sms.amazonSnsAccessKeyId && !!resolvedConfig.sms.amazonSnsSecretAccessKey && !!resolvedConfig.sms.amazonSnsSenderId
		}
	};
}
//#endregion
//#region app/routes/api.auth.runtime.tsx
var api_auth_runtime_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$18 });
async function loader$18(_) {
	const { provider, snapshot } = await getLogicstarterAuthRuntimeSnapshot();
	return Response.json({
		ok: true,
		provider,
		snapshot
	});
}
//#endregion
//#region app/lib/logicstarter/billing-state.server.ts
function isLogicstarterD1Binding(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return typeof candidate.prepare === "function" && typeof candidate.exec === "function";
}
function resolveLogicstarterD1Binding(runtimeContext) {
	const envBindings = runtimeContext?.cloudflare?.env;
	if (!envBindings) throw new Error("Cloudflare billing state requires context.cloudflare.env so a D1 binding can be resolved.");
	for (const value of Object.values(envBindings)) if (isLogicstarterD1Binding(value)) return value;
	throw new Error("Cloudflare billing state could not find a D1 binding in context.cloudflare.env.");
}
function createTableStatements() {
	return [
		`CREATE TABLE IF NOT EXISTS logicstarter_billing_customer (
      owner_type text NOT NULL,
      owner_id text NOT NULL,
      email text,
      stripe_customer_id text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      PRIMARY KEY (owner_type, owner_id)
    );`,
		"CREATE UNIQUE INDEX IF NOT EXISTS logicstarter_billing_customer_customer_uidx ON logicstarter_billing_customer (stripe_customer_id);",
		`CREATE TABLE IF NOT EXISTS logicstarter_billing_subscription (
      owner_type text NOT NULL,
      owner_id text NOT NULL,
      stripe_customer_id text NOT NULL,
      stripe_subscription_id text NOT NULL,
      stripe_price_id text,
      status text,
      current_period_end text,
      updated_at text NOT NULL,
      PRIMARY KEY (owner_type, owner_id)
    );`,
		"CREATE UNIQUE INDEX IF NOT EXISTS logicstarter_billing_subscription_subscription_uidx ON logicstarter_billing_subscription (stripe_subscription_id);",
		`CREATE TABLE IF NOT EXISTS logicstarter_billing_webhook_event (
      event_id text PRIMARY KEY,
      event_type text NOT NULL,
      processed_at text NOT NULL
    );`
	];
}
function createNodeBillingStore() {
	const profile = readLogicstarterDatabaseProfile();
	if (profile !== "pg") throw new Error(`Node billing state store does not support database profile ${profile}.`);
	const client = getLogicstarterDatabaseRuntime().client;
	let readyPromise = null;
	async function ensureReady() {
		if (!readyPromise) readyPromise = (async () => {
			for (const statement of createTableStatements()) await client.unsafe(statement);
		})();
		await readyPromise;
	}
	return {
		async ensureReady() {
			await ensureReady();
		},
		async clearCustomerByOwner(owner) {
			await ensureReady();
			await client`
        DELETE FROM logicstarter_billing_customer
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
      `;
		},
		async clearSubscriptionByOwner(owner) {
			await ensureReady();
			await client`
        DELETE FROM logicstarter_billing_subscription
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
      `;
		},
		async getCustomerByOwner(owner) {
			await ensureReady();
			const row = (await client`
        SELECT email, stripe_customer_id
        FROM logicstarter_billing_customer
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
        LIMIT 1
      `)[0];
			return row ? {
				ownerType: owner.ownerType,
				ownerId: owner.ownerId,
				email: row.email,
				stripeCustomerId: row.stripe_customer_id
			} : null;
		},
		async getSubscriptionByOwner(owner) {
			await ensureReady();
			const row = (await client`
        SELECT current_period_end, status, stripe_customer_id, stripe_price_id, stripe_subscription_id
        FROM logicstarter_billing_subscription
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
        LIMIT 1
      `)[0];
			return row ? {
				ownerType: owner.ownerType,
				ownerId: owner.ownerId,
				currentPeriodEnd: row.current_period_end,
				priceId: row.stripe_price_id,
				status: row.status,
				stripeCustomerId: row.stripe_customer_id,
				stripeSubscriptionId: row.stripe_subscription_id
			} : null;
		},
		async getStripeCustomerIdByOwner(owner) {
			await ensureReady();
			return (await client`
        SELECT stripe_customer_id
        FROM logicstarter_billing_customer
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
        LIMIT 1
      `)[0]?.stripe_customer_id ?? null;
		},
		async getOwnerByStripeCustomerId(stripeCustomerId) {
			await ensureReady();
			const row = (await client`
        SELECT owner_type, owner_id, email
        FROM logicstarter_billing_customer
        WHERE stripe_customer_id = ${stripeCustomerId}
        LIMIT 1
      `)[0];
			return row ? {
				ownerType: row.owner_type,
				ownerId: row.owner_id,
				email: row.email
			} : null;
		},
		async markWebhookProcessed(eventId, eventType) {
			await ensureReady();
			return (await client`
        INSERT INTO logicstarter_billing_webhook_event (event_id, event_type, processed_at)
        VALUES (${eventId}, ${eventType}, ${(/* @__PURE__ */ new Date()).toISOString()})
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
      `).length > 0;
		},
		async upsertCustomer(state) {
			await ensureReady();
			await client`
        INSERT INTO logicstarter_billing_customer (owner_type, owner_id, email, stripe_customer_id, created_at, updated_at)
        VALUES (${state.ownerType}, ${state.ownerId}, ${state.email ?? null}, ${state.stripeCustomerId}, ${(/* @__PURE__ */ new Date()).toISOString()}, ${(/* @__PURE__ */ new Date()).toISOString()})
        ON CONFLICT (owner_type, owner_id)
        DO UPDATE SET email = EXCLUDED.email, stripe_customer_id = EXCLUDED.stripe_customer_id, updated_at = EXCLUDED.updated_at
      `;
		},
		async upsertSubscription(state) {
			await ensureReady();
			await client`
        INSERT INTO logicstarter_billing_subscription (owner_type, owner_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end, updated_at)
        VALUES (${state.ownerType}, ${state.ownerId}, ${state.stripeCustomerId}, ${state.stripeSubscriptionId}, ${state.priceId ?? null}, ${state.status ?? null}, ${state.currentPeriodEnd ?? null}, ${(/* @__PURE__ */ new Date()).toISOString()})
        ON CONFLICT (owner_type, owner_id)
        DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, stripe_subscription_id = EXCLUDED.stripe_subscription_id, stripe_price_id = EXCLUDED.stripe_price_id, status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end, updated_at = EXCLUDED.updated_at
      `;
		}
	};
}
function createCloudflareBillingStore(runtimeContext) {
	const binding = resolveLogicstarterD1Binding(runtimeContext);
	let readyPromise = null;
	async function ensureReady() {
		if (!readyPromise) readyPromise = (async () => {
			for (const statement of createTableStatements()) await binding.exec(statement);
		})();
		await readyPromise;
	}
	return {
		async ensureReady() {
			await ensureReady();
		},
		async clearCustomerByOwner(owner) {
			await ensureReady();
			await binding.prepare("DELETE FROM logicstarter_billing_customer WHERE owner_type = ?1 AND owner_id = ?2").bind(owner.ownerType, owner.ownerId).run();
		},
		async clearSubscriptionByOwner(owner) {
			await ensureReady();
			await binding.prepare("DELETE FROM logicstarter_billing_subscription WHERE owner_type = ?1 AND owner_id = ?2").bind(owner.ownerType, owner.ownerId).run();
		},
		async getCustomerByOwner(owner) {
			await ensureReady();
			const row = await binding.prepare("SELECT email, stripe_customer_id FROM logicstarter_billing_customer WHERE owner_type = ?1 AND owner_id = ?2 LIMIT 1").bind(owner.ownerType, owner.ownerId).first();
			return row ? {
				ownerType: owner.ownerType,
				ownerId: owner.ownerId,
				email: row.email,
				stripeCustomerId: row.stripe_customer_id
			} : null;
		},
		async getSubscriptionByOwner(owner) {
			await ensureReady();
			const row = await binding.prepare("SELECT current_period_end, status, stripe_customer_id, stripe_price_id, stripe_subscription_id FROM logicstarter_billing_subscription WHERE owner_type = ?1 AND owner_id = ?2 LIMIT 1").bind(owner.ownerType, owner.ownerId).first();
			return row ? {
				ownerType: owner.ownerType,
				ownerId: owner.ownerId,
				currentPeriodEnd: row.current_period_end,
				priceId: row.stripe_price_id,
				status: row.status,
				stripeCustomerId: row.stripe_customer_id,
				stripeSubscriptionId: row.stripe_subscription_id
			} : null;
		},
		async getStripeCustomerIdByOwner(owner) {
			await ensureReady();
			return (await binding.prepare("SELECT stripe_customer_id FROM logicstarter_billing_customer WHERE owner_type = ?1 AND owner_id = ?2 LIMIT 1").bind(owner.ownerType, owner.ownerId).first())?.stripe_customer_id ?? null;
		},
		async getOwnerByStripeCustomerId(stripeCustomerId) {
			await ensureReady();
			const row = await binding.prepare("SELECT owner_type, owner_id, email FROM logicstarter_billing_customer WHERE stripe_customer_id = ?1 LIMIT 1").bind(stripeCustomerId).first();
			return row ? {
				ownerType: row.owner_type,
				ownerId: row.owner_id,
				email: row.email
			} : null;
		},
		async markWebhookProcessed(eventId, eventType) {
			await ensureReady();
			if ((await binding.prepare("SELECT event_id FROM logicstarter_billing_webhook_event WHERE event_id = ?1 LIMIT 1").bind(eventId).first())?.event_id) return false;
			await binding.prepare("INSERT INTO logicstarter_billing_webhook_event (event_id, event_type, processed_at) VALUES (?1, ?2, ?3)").bind(eventId, eventType, (/* @__PURE__ */ new Date()).toISOString()).run();
			return true;
		},
		async upsertCustomer(state) {
			await ensureReady();
			await binding.prepare(`INSERT INTO logicstarter_billing_customer (owner_type, owner_id, email, stripe_customer_id, created_at, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          ON CONFLICT(owner_type, owner_id) DO UPDATE SET
            email = excluded.email,
            stripe_customer_id = excluded.stripe_customer_id,
            updated_at = excluded.updated_at`).bind(state.ownerType, state.ownerId, state.email ?? null, state.stripeCustomerId, (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString()).run();
		},
		async upsertSubscription(state) {
			await ensureReady();
			await binding.prepare(`INSERT INTO logicstarter_billing_subscription (owner_type, owner_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
          ON CONFLICT(owner_type, owner_id) DO UPDATE SET
            stripe_customer_id = excluded.stripe_customer_id,
            stripe_subscription_id = excluded.stripe_subscription_id,
            stripe_price_id = excluded.stripe_price_id,
            status = excluded.status,
            current_period_end = excluded.current_period_end,
            updated_at = excluded.updated_at`).bind(state.ownerType, state.ownerId, state.stripeCustomerId, state.stripeSubscriptionId, state.priceId ?? null, state.status ?? null, state.currentPeriodEnd ?? null, (/* @__PURE__ */ new Date()).toISOString()).run();
		}
	};
}
function createLogicstarterBillingStateStore(runtimeContext) {
	return readLogicstarterDatabaseProfile() === "d1" ? createCloudflareBillingStore(runtimeContext) : createNodeBillingStore();
}
//#endregion
//#region app/lib/logicstarter/billing.server.ts
function requireConfigured(value, message) {
	const normalized = value?.trim();
	if (!normalized) throw new Error(message);
	return normalized;
}
function normalizeAbsoluteUrl(value, label) {
	try {
		const url = new URL(value);
		if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
		return url.toString();
	} catch {
		throw new Error(`${label} must be a valid absolute URL.`);
	}
}
async function getStripeRuntime() {
	const billing = readLogicstarterProviderConfig().billing;
	const secretKey = requireConfigured(billing.stripeSecretKey, "STRIPE_SECRET_KEY is required before using Logicstarter billing routes.");
	return {
		stripe: new (await (import("stripe"))).default(secretKey, { apiVersion: "2025-11-17.clover" }),
		webhookSecret: billing.stripeWebhookSecret?.trim() || void 0,
		publishableKeyConfigured: !!billing.stripePublishableKey?.trim(),
		runtimeTarget: readLogicstarterRuntimeTarget()
	};
}
async function createLogicstarterCheckoutSession(input) {
	const { stripe, publishableKeyConfigured, runtimeTarget } = await getStripeRuntime();
	const priceId = requireConfigured(input.priceId, "priceId is required.");
	const successUrl = normalizeAbsoluteUrl(input.successUrl, "successUrl");
	const cancelUrl = normalizeAbsoluteUrl(input.cancelUrl, "cancelUrl");
	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		success_url: successUrl,
		cancel_url: cancelUrl,
		line_items: [{
			price: priceId,
			quantity: 1
		}],
		client_reference_id: input.metadata?.userId,
		customer_email: input.customerEmail?.trim() || void 0,
		allow_promotion_codes: true,
		metadata: input.metadata
	});
	return {
		id: session.id,
		url: session.url,
		publishableKeyConfigured,
		runtimeTarget
	};
}
async function verifyLogicstarterStripeWebhook(request) {
	const signature = request.headers.get("stripe-signature")?.trim();
	if (!signature) throw new Error("Missing Stripe signature header.");
	const { stripe, webhookSecret, runtimeTarget } = await getStripeRuntime();
	const verifiedWebhookSecret = requireConfigured(webhookSecret, "STRIPE_WEBHOOK_SECRET is required before using the Logicstarter billing webhook.");
	const payload = await request.text();
	return {
		event: await stripe.webhooks.constructEventAsync(payload, signature, verifiedWebhookSecret),
		runtimeTarget
	};
}
async function createLogicstarterBillingPortalSession(input, runtimeContext) {
	const { stripe, runtimeTarget } = await getStripeRuntime();
	const store = createLogicstarterBillingStateStore(runtimeContext);
	const returnUrl = normalizeAbsoluteUrl(input.returnUrl, "returnUrl");
	const stripeCustomerId = await store.getStripeCustomerIdByOwner({
		ownerType: "user",
		ownerId: input.ownerId
	});
	if (!stripeCustomerId) throw new Error("No Stripe customer is linked to the current Logicstarter account yet.");
	return {
		runtimeTarget,
		url: (await stripe.billingPortal.sessions.create({
			customer: stripeCustomerId,
			return_url: returnUrl
		})).url
	};
}
async function syncLogicstarterSubscriptionFromStripe(stripe, input, runtimeContext) {
	const store = createLogicstarterBillingStateStore(runtimeContext);
	const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId);
	await store.upsertSubscription({
		ownerType: input.ownerType,
		ownerId: input.ownerId,
		stripeCustomerId: input.stripeCustomerId,
		stripeSubscriptionId: subscription.id,
		priceId: subscription.items?.data?.[0]?.price?.id ?? null,
		status: subscription.status ?? null,
		currentPeriodEnd: typeof subscription.current_period_end === "number" ? (/* @__PURE__ */ new Date(subscription.current_period_end * 1e3)).toISOString() : null
	});
}
async function syncLogicstarterBillingState(input, runtimeContext) {
	const { stripe, runtimeTarget } = await getStripeRuntime();
	const store = createLogicstarterBillingStateStore(runtimeContext);
	const owner = {
		ownerType: "user",
		ownerId: input.ownerId,
		email: input.ownerEmail ?? null
	};
	let stripeCustomerId = await store.getStripeCustomerIdByOwner(owner);
	if (!stripeCustomerId && owner.email) {
		const customer = (await stripe.customers.list({
			email: owner.email,
			limit: 5
		})).data.find((candidate) => !candidate.deleted && typeof candidate.id === "string");
		if (customer?.id) {
			stripeCustomerId = customer.id;
			await store.upsertCustomer({
				ownerType: owner.ownerType,
				ownerId: owner.ownerId,
				email: owner.email,
				stripeCustomerId
			});
		}
	}
	if (!stripeCustomerId) {
		await store.clearSubscriptionByOwner(owner);
		return {
			linkedCustomer: false,
			runtimeTarget,
			synced: true
		};
	}
	const customer = await stripe.customers.retrieve(stripeCustomerId);
	if (customer.deleted) {
		await store.clearSubscriptionByOwner(owner);
		await store.clearCustomerByOwner(owner);
		return {
			linkedCustomer: false,
			runtimeTarget,
			synced: true
		};
	}
	await store.upsertCustomer({
		ownerType: owner.ownerType,
		ownerId: owner.ownerId,
		email: customer.email ?? owner.email,
		stripeCustomerId: customer.id
	});
	const subscriptions = await stripe.subscriptions.list({
		customer: customer.id,
		limit: 10,
		status: "all"
	});
	const preferredSubscription = subscriptions.data.find((subscription) => subscription.status !== "canceled") ?? subscriptions.data[0];
	if (!preferredSubscription?.id) {
		await store.clearSubscriptionByOwner(owner);
		return {
			linkedCustomer: true,
			runtimeTarget,
			synced: true,
			stripeCustomerId: customer.id,
			subscriptionLinked: false
		};
	}
	await syncLogicstarterSubscriptionFromStripe(stripe, {
		ownerType: owner.ownerType,
		ownerId: owner.ownerId,
		stripeCustomerId: customer.id,
		stripeSubscriptionId: preferredSubscription.id
	}, runtimeContext);
	return {
		linkedCustomer: true,
		runtimeTarget,
		synced: true,
		stripeCustomerId: customer.id,
		subscriptionLinked: true,
		stripeSubscriptionId: preferredSubscription.id
	};
}
async function processLogicstarterStripeWebhook(request, runtimeContext) {
	const { event, runtimeTarget } = await verifyLogicstarterStripeWebhook(request);
	const { stripe } = await getStripeRuntime();
	const store = createLogicstarterBillingStateStore(runtimeContext);
	if (!await store.markWebhookProcessed(event.id, event.type)) return {
		accepted: false,
		event,
		runtimeTarget
	};
	if (event.type === "checkout.session.completed") {
		const session = event.data.object;
		const userId = session.metadata?.userId?.trim();
		const stripeCustomerId = session.customer?.trim();
		if (userId && stripeCustomerId) {
			await store.upsertCustomer({
				ownerType: "user",
				ownerId: userId,
				email: session.customer_email ?? null,
				stripeCustomerId
			});
			const stripeSubscriptionId = session.subscription?.trim();
			if (stripeSubscriptionId) await syncLogicstarterSubscriptionFromStripe(stripe, {
				ownerType: "user",
				ownerId: userId,
				stripeCustomerId,
				stripeSubscriptionId
			}, runtimeContext);
		}
	}
	if (event.type === "checkout.session.expired") {
		const userId = event.data.object.metadata?.userId?.trim();
		if (userId) await store.clearSubscriptionByOwner({
			ownerType: "user",
			ownerId: userId
		});
	}
	if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
		const subscription = event.data.object;
		const owner = await store.getOwnerByStripeCustomerId(subscription.customer);
		if (owner) if (event.type === "customer.subscription.deleted") await store.clearSubscriptionByOwner(owner);
		else await store.upsertSubscription({
			ownerType: owner.ownerType,
			ownerId: owner.ownerId,
			stripeCustomerId: subscription.customer,
			stripeSubscriptionId: subscription.id,
			priceId: subscription.items?.data?.[0]?.price?.id ?? null,
			status: subscription.status ?? null,
			currentPeriodEnd: typeof subscription.current_period_end === "number" ? (/* @__PURE__ */ new Date(subscription.current_period_end * 1e3)).toISOString() : null
		});
	}
	if (event.type === "customer.updated") {
		const customer = event.data.object;
		const owner = await store.getOwnerByStripeCustomerId(customer.id);
		if (owner) if (customer.deleted) {
			await store.clearSubscriptionByOwner(owner);
			await store.clearCustomerByOwner(owner);
		} else await store.upsertCustomer({
			ownerType: owner.ownerType,
			ownerId: owner.ownerId,
			email: customer.email ?? owner.email ?? null,
			stripeCustomerId: customer.id
		});
	}
	if (event.type === "customer.deleted") {
		const customer = event.data.object;
		const owner = await store.getOwnerByStripeCustomerId(customer.id);
		if (owner) {
			await store.clearSubscriptionByOwner(owner);
			await store.clearCustomerByOwner(owner);
		}
	}
	return {
		accepted: true,
		event,
		runtimeTarget
	};
}
//#endregion
//#region app/routes/api.billing.checkout.tsx
var api_billing_checkout_exports = /* @__PURE__ */ __exportAll({
	action: () => action$10,
	loader: () => loader$17
});
async function loader$17(_) {
	return Response.json({
		ok: false,
		error: "Method not allowed."
	}, {
		status: 405,
		headers: { Allow: "POST" }
	});
}
async function action$10({ request, context }) {
	if (request.method !== "POST") return new Response("Method not allowed", {
		status: 405,
		headers: { Allow: "POST" }
	});
	const session = await (await getLogicstarterAuth(request, context)).api.getSession({ headers: request.headers });
	if (!session?.user?.id || !session.user.email) return Response.json({
		ok: false,
		error: "Authentication required."
	}, { status: 401 });
	const payload = await request.json();
	try {
		const checkout = await createLogicstarterCheckoutSession({
			cancelUrl: String(payload.cancelUrl ?? ""),
			customerEmail: session.user.email,
			metadata: {
				logicstarterRuntime: "billing_api",
				userEmail: session.user.email,
				userId: session.user.id
			},
			priceId: String(payload.priceId ?? ""),
			successUrl: String(payload.successUrl ?? "")
		});
		return Response.json({
			ok: true,
			checkout
		});
	} catch (error) {
		return Response.json({
			ok: false,
			error: error instanceof Error ? error.message : "Unable to create a Stripe checkout session."
		}, { status: 400 });
	}
}
//#endregion
//#region app/routes/api.billing.portal.tsx
var api_billing_portal_exports = /* @__PURE__ */ __exportAll({
	action: () => action$9,
	loader: () => loader$16
});
async function loader$16(_) {
	return Response.json({
		ok: false,
		error: "Method not allowed."
	}, {
		status: 405,
		headers: { Allow: "POST" }
	});
}
async function action$9({ request, context }) {
	if (request.method !== "POST") return new Response("Method not allowed", {
		status: 405,
		headers: { Allow: "POST" }
	});
	const session = await (await getLogicstarterAuth(request, context)).api.getSession({ headers: request.headers });
	if (!session?.user?.id) return Response.json({
		ok: false,
		error: "Authentication required."
	}, { status: 401 });
	const payload = await request.json();
	try {
		const portal = await createLogicstarterBillingPortalSession({
			ownerId: session.user.id,
			returnUrl: String(payload.returnUrl ?? "")
		}, context);
		return Response.json({
			ok: true,
			portal
		});
	} catch (error) {
		return Response.json({
			ok: false,
			error: error instanceof Error ? error.message : "Unable to create a Stripe billing portal session."
		}, { status: 400 });
	}
}
//#endregion
//#region app/routes/api.billing.runtime.tsx
var api_billing_runtime_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$15 });
async function loader$15(_) {
	const snapshot = await getLogicstarterBillingRuntimeSnapshot();
	const status = getLogicstarterBillingRuntimeStatus(snapshot);
	return Response.json({
		ok: true,
		provider: "stripe",
		attention: status.attention,
		remediation: status.remediation,
		runtimeHealth: status.runtimeHealth,
		checkoutReadiness: status.checkoutReadiness,
		webhookReadiness: status.webhookReadiness,
		snapshot
	});
}
//#endregion
//#region app/routes/api.billing.state.tsx
var api_billing_state_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$14 });
async function loader$14({ request, context }) {
	const session = await (await getLogicstarterAuth(request, context)).api.getSession({ headers: request.headers });
	if (!session?.user?.id) return Response.json({
		ok: false,
		error: "Authentication required."
	}, { status: 401 });
	const store = createLogicstarterBillingStateStore(context);
	const owner = {
		ownerType: "user",
		ownerId: session.user.id,
		email: session.user.email ?? null
	};
	const customer = await store.getCustomerByOwner(owner);
	const subscription = await store.getSubscriptionByOwner(owner);
	return Response.json({
		ok: true,
		billing: {
			linkedCustomer: !!customer?.stripeCustomerId,
			activeSubscription: !!subscription?.stripeSubscriptionId,
			customer,
			subscription
		}
	});
}
//#endregion
//#region app/routes/api.billing.sync.tsx
var api_billing_sync_exports = /* @__PURE__ */ __exportAll({
	action: () => action$8,
	loader: () => loader$13
});
async function loader$13(_) {
	return Response.json({
		ok: false,
		error: "Method not allowed."
	}, {
		status: 405,
		headers: { Allow: "POST" }
	});
}
async function action$8({ request, context }) {
	if (request.method !== "POST") return new Response("Method not allowed", {
		status: 405,
		headers: { Allow: "POST" }
	});
	const session = await (await getLogicstarterAuth(request, context)).api.getSession({ headers: request.headers });
	if (!session?.user?.id) return Response.json({
		ok: false,
		error: "Authentication required."
	}, { status: 401 });
	try {
		const result = await syncLogicstarterBillingState({
			ownerId: session.user.id,
			ownerEmail: session.user.email ?? null
		}, context);
		return Response.json({
			ok: true,
			sync: result
		});
	} catch (error) {
		return Response.json({
			ok: false,
			error: error instanceof Error ? error.message : "Unable to synchronize billing state from Stripe."
		}, { status: 400 });
	}
}
//#endregion
//#region app/routes/api.billing.webhook.tsx
var api_billing_webhook_exports = /* @__PURE__ */ __exportAll({
	action: () => action$7,
	loader: () => loader$12
});
async function loader$12(_) {
	return Response.json({
		ok: false,
		error: "Method not allowed."
	}, {
		status: 405,
		headers: { Allow: "POST" }
	});
}
async function action$7({ request, context }) {
	if (request.method !== "POST") return new Response("Method not allowed", {
		status: 405,
		headers: { Allow: "POST" }
	});
	try {
		const result = await processLogicstarterStripeWebhook(request, context);
		return Response.json({
			ok: true,
			runtimeTarget: result.runtimeTarget,
			received: true,
			accepted: result.accepted,
			event: {
				id: result.event.id,
				type: result.event.type
			}
		});
	} catch (error) {
		return Response.json({
			ok: false,
			error: error instanceof Error ? error.message : "Unable to verify the Stripe webhook payload."
		}, { status: 400 });
	}
}
//#endregion
//#region app/lib/logicstarter/first-login.server.ts
async function getLogicstarterFirstLoginState() {
	return { bootstrapAdminSetup: (await db.select({ id: user.id }).from(user).limit(1)).length === 0 };
}
//#endregion
//#region app/routes/api.check-email.ts
var api_check_email_exports = /* @__PURE__ */ __exportAll({ action: () => action$6 });
async function action$6({ request }) {
	if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
	try {
		const { email } = await request.json();
		const normalizedEmail = String(email ?? "").trim().toLowerCase();
		const { bootstrapAdminSetup } = await getLogicstarterFirstLoginState();
		if (!normalizedEmail) return Response.json({
			exists: false,
			bootstrapAdminSetup
		});
		const [user$1] = await db.select({
			id: user.id,
			name: user.name,
			emailVerified: user.emailVerified
		}).from(user).where(eq(user.email, normalizedEmail)).limit(1);
		if (!user$1) return Response.json({
			exists: false,
			bootstrapAdminSetup
		});
		const [passwordAccount] = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, user$1.id), eq(account.providerId, "credential"), isNotNull(account.password))).limit(1);
		const linkedProviders = (await db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, user$1.id))).map((account) => account.providerId).filter((providerId) => providerId !== "credential");
		return Response.json({
			exists: true,
			bootstrapAdminSetup,
			hasPassword: Boolean(passwordAccount),
			hasSocialAccount: linkedProviders.length > 0,
			linkedProviders,
			name: user$1.name,
			emailVerified: user$1.emailVerified
		});
	} catch (error) {
		console.error("[Logicstarter Auth] Email existence check failed", { error });
		return Response.json({ exists: false }, { status: 500 });
	}
}
//#endregion
//#region app/routes/api.email.runtime.tsx
var api_email_runtime_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$11 });
async function loader$11(_) {
	const { provider, snapshot } = await getLogicstarterEmailRuntimeSnapshot();
	return Response.json({
		ok: true,
		provider,
		snapshot
	});
}
//#endregion
//#region app/routes/api.providers.runtime.tsx
var api_providers_runtime_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$10 });
async function loader$10(_) {
	const { runtime, modules, summary } = await getLogicstarterProviderRuntimeOverview();
	return Response.json({
		ok: true,
		runtime,
		modules,
		summary
	});
}
//#endregion
//#region app/routes/api.register.ts
var api_register_exports = /* @__PURE__ */ __exportAll({ action: () => action$5 });
function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
async function action$5({ request }) {
	if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
	try {
		const { email, password, confirmPassword, name } = await request.json();
		const normalizedEmail = String(email ?? "").trim().toLowerCase();
		const normalizedName = String(name ?? "").trim();
		const normalizedPassword = String(password ?? "");
		const normalizedConfirmPassword = String(confirmPassword ?? "");
		const { bootstrapAdminSetup } = await getLogicstarterFirstLoginState();
		if (!normalizedEmail || !normalizedPassword) return Response.json({ error: bootstrapAdminSetup ? "Admin email and password are required" : "Email, password, and name are required" }, { status: 400 });
		if (!isValidEmail(normalizedEmail)) return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
		if (normalizedPassword.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
		if (bootstrapAdminSetup) {
			if (!normalizedConfirmPassword) return Response.json({ error: "Please confirm the admin password" }, { status: 400 });
			if (normalizedPassword !== normalizedConfirmPassword) return Response.json({ error: "Passwords do not match" }, { status: 400 });
		}
		if (!bootstrapAdminSetup && !normalizedName) return Response.json({ error: "Email, password, and name are required" }, { status: 400 });
		const effectiveName = bootstrapAdminSetup ? normalizedEmail.split("@")[0] : normalizedName;
		const callbackUrl = new URL(request.url);
		callbackUrl.pathname = "/";
		callbackUrl.search = "";
		callbackUrl.hash = "";
		const { headers } = await (await getLogicstarterAuth(request)).api.signUpEmail({
			returnHeaders: true,
			headers: request.headers,
			body: {
				name: effectiveName,
				email: normalizedEmail,
				password: normalizedPassword,
				callbackURL: callbackUrl.toString()
			}
		});
		const responseHeaders = new Headers();
		const setCookieHeaders = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
		for (const value of setCookieHeaders) responseHeaders.append("set-cookie", value);
		const singleCookieHeader = headers.get("set-cookie");
		if (singleCookieHeader && setCookieHeaders.length === 0) responseHeaders.append("set-cookie", singleCookieHeader);
		return Response.json({
			success: true,
			bootstrapAdminSetup,
			requireVerification: true,
			message: bootstrapAdminSetup ? "Administrator account created with Better Auth. Please verify the email before first password sign-in." : "Registration successful. Please check your email to verify your account."
		}, { headers: responseHeaders });
	} catch (error) {
		console.error("[Logicstarter Auth] Registration failed", { error });
		if (isAPIError(error)) {
			const status = typeof error.status === "number" ? error.status : 400;
			return Response.json({ error: error.message }, { status });
		}
		return Response.json({ error: error instanceof Error ? error.message : "Registration failed" }, { status: 500 });
	}
}
//#endregion
//#region app/routes/api.auth.methods.tsx
var api_auth_methods_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$9 });
async function loader$9(_) {
	return Response.json({ methods: listEnabledLogicstarterAuthMethods() });
}
//#endregion
//#region app/routes/api.sms.runtime.tsx
var api_sms_runtime_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$8 });
async function loader$8(_) {
	const { provider, snapshot } = await getLogicstarterSmsRuntimeSnapshot();
	return Response.json({
		ok: true,
		provider,
		snapshot
	});
}
//#endregion
//#region app/routes/api.auth.$.tsx
var api_auth_$_exports = /* @__PURE__ */ __exportAll({
	action: () => action$4,
	loader: () => loader$7
});
function getLogicstarterStripeRuntimeGuardResponse(request) {
	if (!new URL(request.url).pathname.startsWith("/api/auth/stripe")) return null;
	const runtimeTarget = readLogicstarterRuntimeTarget();
	if (runtimeTarget === "node") return null;
	return Response.json({
		ok: false,
		error: `Stripe billing routes are not yet Worker-safe on ${runtimeTarget}.`,
		runtimeTarget,
		serverPathMode: "worker_unsupported"
	}, { status: 503 });
}
async function loader$7({ request, context }) {
	const guardResponse = getLogicstarterStripeRuntimeGuardResponse(request);
	if (guardResponse) return guardResponse;
	return (await getLogicstarterAuth(request, context)).handler(request);
}
async function action$4({ request, context }) {
	const guardResponse = getLogicstarterStripeRuntimeGuardResponse(request);
	if (guardResponse) return guardResponse;
	return (await getLogicstarterAuth(request, context)).handler(request);
}
//#endregion
//#region app/routes/api.storage.delete.tsx
var api_storage_delete_exports = /* @__PURE__ */ __exportAll({
	action: () => action$3,
	loader: () => loader$6
});
async function loader$6(_) {
	return Response.json({
		ok: false,
		error: "Method not allowed."
	}, {
		status: 405,
		headers: { Allow: "POST" }
	});
}
async function action$3({ request }) {
	if (request.method !== "POST") return new Response("Method not allowed", {
		status: 405,
		headers: { Allow: "POST" }
	});
	if (!(await (await getLogicstarterAuth(request)).api.getSession({ headers: request.headers }))?.user?.id) return Response.json({
		ok: false,
		error: "Authentication required."
	}, { status: 401 });
	const { key } = await request.json();
	const normalizedKey = String(key ?? "").trim();
	if (!normalizedKey) return Response.json({
		ok: false,
		error: "Storage key is required."
	}, { status: 400 });
	await logicstarter().storage.deleteObject({ key: normalizedKey });
	return Response.json({
		ok: true,
		key: normalizedKey
	});
}
//#endregion
//#region app/routes/api.storage.runtime.tsx
var api_storage_runtime_exports = /* @__PURE__ */ __exportAll({ loader: () => loader$5 });
async function loader$5(_) {
	const storage = createLogicstarterStorageProvider();
	const snapshot = getLogicstarterStorageRuntimeSnapshot();
	const uploadPolicy = {
		maxUploadBytes: logicstarterStorageMaxUploadBytes,
		contentTypes: logicstarterStorageAllowedContentTypes,
		accept: logicstarterStorageUploadAccept,
		label: logicstarterStorageUploadPolicyLabel
	};
	try {
		await storage.validateConfig();
		return Response.json({
			ok: true,
			provider: storage.provider,
			snapshot,
			capabilities: snapshot.capabilities,
			uploadPolicy
		});
	} catch (error) {
		return Response.json({
			ok: false,
			provider: storage.provider,
			snapshot,
			capabilities: snapshot.capabilities,
			uploadPolicy,
			error: error instanceof Error ? error.message : "Unable to validate Logicstarter storage runtime."
		}, { status: 400 });
	}
}
//#endregion
//#region app/routes/api.storage.signed-url.tsx
var api_storage_signed_url_exports = /* @__PURE__ */ __exportAll({
	action: () => action$2,
	loader: () => loader$4
});
async function loader$4(_) {
	return Response.json({
		ok: false,
		error: "Method not allowed."
	}, {
		status: 405,
		headers: { Allow: "POST" }
	});
}
async function action$2({ request }) {
	if (request.method !== "POST") return new Response("Method not allowed", {
		status: 405,
		headers: { Allow: "POST" }
	});
	if (!(await (await getLogicstarterAuth(request)).api.getSession({ headers: request.headers }))?.user?.id) return Response.json({
		ok: false,
		error: "Authentication required."
	}, { status: 401 });
	const payload = await request.json();
	const key = String(payload.key ?? "").trim();
	const method = payload.method === "PUT" ? "PUT" : payload.method === "GET" || payload.method == null ? "GET" : null;
	const expiresInSeconds = typeof payload.expiresInSeconds === "number" ? Math.max(60, Math.min(3600, Math.floor(payload.expiresInSeconds))) : 900;
	const contentType = typeof payload.contentType === "string" ? payload.contentType.trim() || void 0 : void 0;
	if (!key) return Response.json({
		ok: false,
		error: "Storage key is required."
	}, { status: 400 });
	if (!method) return Response.json({
		ok: false,
		error: "Signed URL method must be GET or PUT."
	}, { status: 400 });
	try {
		const result = await logicstarter().storage.getSignedUrl({
			key,
			method,
			expiresInSeconds,
			contentType
		});
		return Response.json({
			ok: true,
			key,
			method,
			expiresInSeconds,
			url: result.url,
			expiresAt: result.expiresAt?.toISOString() ?? null
		});
	} catch (error) {
		return Response.json({
			ok: false,
			error: error instanceof Error ? error.message : "Unable to create a signed storage URL."
		}, { status: 400 });
	}
}
//#endregion
//#region app/routes/api.storage.upload.tsx
var api_storage_upload_exports = /* @__PURE__ */ __exportAll({
	action: () => action$1,
	loader: () => loader$3
});
var allowedContentTypes = new Set(logicstarterStorageAllowedContentTypes);
function sanitizePrefix(value) {
	return value.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").split("/").map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "-")).filter(Boolean).join("/");
}
function sanitizeExtension(fileName, contentType) {
	const fromName = extname(fileName).toLowerCase();
	if (/^\.[a-z0-9]{1,10}$/.test(fromName)) return fromName;
	if (contentType === "image/png") return ".png";
	if (contentType === "image/jpeg") return ".jpg";
	if (contentType === "image/webp") return ".webp";
	if (contentType === "image/gif") return ".gif";
	if (contentType === "image/svg+xml") return ".svg";
	if (contentType === "application/pdf") return ".pdf";
	if (contentType === "application/json") return ".json";
	if (contentType.startsWith("text/")) return ".txt";
	return "";
}
async function loader$3(_) {
	return Response.json({
		ok: false,
		error: "Method not allowed. Use POST to upload files."
	}, {
		status: 405,
		headers: { Allow: "POST" }
	});
}
async function action$1({ request }) {
	if (request.method !== "POST") return new Response("Method not allowed", {
		status: 405,
		headers: { Allow: "POST" }
	});
	if (!(await (await getLogicstarterAuth(request)).api.getSession({ headers: request.headers }))?.user?.id) return Response.json({
		ok: false,
		error: "Authentication required."
	}, { status: 401 });
	const formData = await request.formData();
	const fileEntry = formData.get("file");
	const prefix = sanitizePrefix(String(formData.get("prefix") ?? "uploads"));
	if (!(fileEntry instanceof File)) return Response.json({
		ok: false,
		error: "File is required."
	}, { status: 400 });
	if (fileEntry.size <= 0) return Response.json({
		ok: false,
		error: "Empty files are not supported."
	}, { status: 400 });
	if (fileEntry.size > 10485760) return Response.json({
		ok: false,
		error: `Files larger than ${logicstarterStorageMaxUploadBytes} bytes are not supported.`
	}, { status: 400 });
	if (!allowedContentTypes.has(fileEntry.type || "")) return Response.json({
		ok: false,
		error: "Unsupported file type."
	}, { status: 400 });
	const extension = sanitizeExtension(fileEntry.name, fileEntry.type);
	if (!extension) return Response.json({
		ok: false,
		error: "Unable to determine a safe file extension for this upload."
	}, { status: 400 });
	const baseName = fileEntry.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "") || "upload";
	const fileName = `${Date.now()}-${baseName}-${randomUUID()}${extension}`;
	const key = prefix ? `${prefix}/${fileName}` : fileName;
	const arrayBuffer = await fileEntry.arrayBuffer();
	const result = await logicstarter().storage.putObject({
		key,
		body: arrayBuffer,
		contentType: fileEntry.type || void 0
	});
	return Response.json({
		ok: true,
		key: result.key,
		url: result.url ?? null,
		contentType: fileEntry.type || null,
		size: fileEntry.size
	});
}
//#endregion
//#region app/lib/logicstarter/env-export.server.ts
function toEnvLine$1(key, value) {
	return `${key}=${value ?? ""}`;
}
async function exportLogicstarterProviderEnv() {
	const keys = [
		...logicstarterProviderSettingsKeys.email,
		...logicstarterProviderSettingsKeys.sms,
		...logicstarterProviderSettingsKeys.storage,
		...logicstarterProviderSettingsKeys.authentication,
		...logicstarterProviderSettingsKeys.billing
	];
	const settings = await getManyLogicstarterProviderSettingsDetail(keys);
	return `${keys.map((key) => toEnvLine$1(key, settings[key]?.value)).join("\n")}\n`;
}
//#endregion
//#region app/lib/logicstarter/env-sync.server.ts
var defaultRuntimeEnvPath = path.resolve(process.cwd(), ".env.runtime");
var orderedKeys = [
	...logicstarterProviderSettingsKeys.email,
	...logicstarterProviderSettingsKeys.sms,
	...logicstarterProviderSettingsKeys.storage,
	...logicstarterProviderSettingsKeys.authentication,
	...logicstarterProviderSettingsKeys.billing
];
function toEnvLine(key, value) {
	return `${key}=${value}`;
}
function serializeEnvOverrides(values) {
	return Object.entries(values).map(([key, value]) => toEnvLine(key, value)).join("\n");
}
function mergeEnvContent(existingContent, exportContent) {
	const lines = existingContent.split(/\r?\n/);
	const values = new Map(exportContent.trimEnd().split(/\r?\n/).filter(Boolean).map((line) => {
		const separatorIndex = line.indexOf("=");
		return [separatorIndex === -1 ? line.trim() : line.slice(0, separatorIndex).trim(), separatorIndex === -1 ? "" : line.slice(separatorIndex + 1)];
	}));
	const mergedLines = lines.map((line) => {
		const separatorIndex = line.indexOf("=");
		if (separatorIndex === -1) return line;
		const key = line.slice(0, separatorIndex).trim();
		if (!values.has(key)) return line;
		const nextLine = toEnvLine(key, values.get(key) ?? "");
		values.delete(key);
		return nextLine;
	});
	for (const key of orderedKeys) if (values.has(key)) {
		mergedLines.push(toEnvLine(key, values.get(key) ?? ""));
		values.delete(key);
	}
	for (const [key, value] of values.entries()) mergedLines.push(toEnvLine(key, value));
	return `${mergedLines.join("\n").replace(/\n*$/, "")}\n`;
}
async function syncLogicstarterProviderEnvFile(envPath = defaultRuntimeEnvPath, envOverrides = {}) {
	const runtimeTarget = readLogicstarterRuntimeTarget();
	if (!supportsLogicstarterRuntimeEnvFileExport(runtimeTarget)) throw new Error(`Runtime env file export is only supported when RUNTIME_TARGET=node. Current target: ${runtimeTarget}.`);
	const exportContent = mergeEnvContent(await exportLogicstarterProviderEnv(), serializeEnvOverrides(envOverrides));
	await writeFile(envPath, mergeEnvContent(await readFile(envPath, "utf8").catch((error) => {
		if (error.code === "ENOENT") return "";
		throw error;
	}), exportContent), "utf8");
	return {
		ok: true,
		envPath,
		exportedKeyCount: orderedKeys.length
	};
}
//#endregion
//#region app/lib/logicstarter/provider-settings-schema.server.ts
var optionalTrimmedString = z.string().trim().optional();
var optionalEmail = z.union([z.literal(""), z.string().email()]).optional();
var optionalPort = z.union([z.literal(""), z.string().regex(/^\d{2,5}$/)]).optional();
var optionalUrl = z.union([
	z.literal(""),
	z.string().url(),
	z.string().regex(/^\/uploads\/[A-Za-z0-9/_\-.]+$/)
]).optional();
var emailProviderSchema = z.union([
	z.literal("better_platform"),
	z.literal("better_auth_infra"),
	z.literal("resend"),
	z.literal("smtp"),
	z.literal("ses")
]).transform((value) => value === "better_auth_infra" ? "better_platform" : value);
var smsProviderSchema = z.union([
	z.literal("better_platform"),
	z.literal("better_auth_infra"),
	z.literal("console"),
	z.literal("vonage"),
	z.literal("amazon_sns")
]).transform((value) => value === "better_auth_infra" ? "better_platform" : value);
var logicstarterProviderSettingsSchemas = {
	email: z.object({
		category: z.literal("email"),
		EMAIL_PROVIDER: emailProviderSchema,
		EMAIL_FROM: optionalEmail,
		EMAIL_FROM_NAME: optionalTrimmedString,
		RESEND_API_KEY: optionalTrimmedString,
		SMTP_HOST: optionalTrimmedString,
		SMTP_PORT: optionalPort,
		SMTP_USER: optionalTrimmedString,
		SMTP_PASS: optionalTrimmedString,
		SES_REGION: optionalTrimmedString,
		SES_ACCESS_KEY_ID: optionalTrimmedString,
		SES_SECRET_ACCESS_KEY: optionalTrimmedString
	}).superRefine((value, ctx) => {
		if (value.EMAIL_PROVIDER === "resend" && (!value.RESEND_API_KEY || !value.EMAIL_FROM)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["RESEND_API_KEY"],
			message: "Resend API key and email from are required."
		});
		if (value.EMAIL_PROVIDER === "smtp" && (!value.SMTP_HOST || !value.SMTP_PORT || !value.SMTP_USER || !value.SMTP_PASS || !value.EMAIL_FROM)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["SMTP_HOST"],
			message: "SMTP host, port, user, password, and email from are required."
		});
		if (value.EMAIL_PROVIDER === "ses" && (!value.SES_REGION || !value.SES_ACCESS_KEY_ID || !value.SES_SECRET_ACCESS_KEY || !value.EMAIL_FROM)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["SES_REGION"],
			message: "SES region, credentials, and email from are required."
		});
	}),
	sms: z.object({
		category: z.literal("sms"),
		SMS_PROVIDER: smsProviderSchema,
		VONAGE_API_KEY: optionalTrimmedString,
		VONAGE_API_SECRET: optionalTrimmedString,
		VONAGE_FROM: optionalTrimmedString,
		AMAZON_SNS_REGION: optionalTrimmedString,
		AMAZON_SNS_ACCESS_KEY_ID: optionalTrimmedString,
		AMAZON_SNS_SECRET_ACCESS_KEY: optionalTrimmedString,
		AMAZON_SNS_SENDER_ID: optionalTrimmedString
	}).superRefine((value, ctx) => {
		if (value.SMS_PROVIDER === "vonage" && (!value.VONAGE_API_KEY || !value.VONAGE_API_SECRET || !value.VONAGE_FROM)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["VONAGE_API_KEY"],
			message: "Vonage API key, secret, and from are required."
		});
		if (value.SMS_PROVIDER === "amazon_sns" && (!value.AMAZON_SNS_REGION || !value.AMAZON_SNS_ACCESS_KEY_ID || !value.AMAZON_SNS_SECRET_ACCESS_KEY || !value.AMAZON_SNS_SENDER_ID)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["AMAZON_SNS_REGION"],
			message: "Amazon SNS region, credentials, and sender ID are required."
		});
	}),
	storage: z.object({
		category: z.literal("storage"),
		STORAGE_PROVIDER: z.enum([
			"local",
			"s3",
			"r2"
		]),
		STORAGE_LOCAL_BASE_PATH: optionalTrimmedString,
		STORAGE_PUBLIC_BASE_URL: optionalUrl,
		S3_REGION: optionalTrimmedString,
		S3_BUCKET: optionalTrimmedString,
		S3_ACCESS_KEY_ID: optionalTrimmedString,
		S3_SECRET_ACCESS_KEY: optionalTrimmedString,
		S3_ENDPOINT: optionalUrl,
		S3_FORCE_PATH_STYLE: z.union([
			z.literal(""),
			z.literal("true"),
			z.literal("false")
		]).optional(),
		R2_ACCOUNT_ID: optionalTrimmedString,
		R2_BUCKET: optionalTrimmedString,
		R2_ACCESS_KEY_ID: optionalTrimmedString,
		R2_SECRET_ACCESS_KEY: optionalTrimmedString
	}).superRefine((value, ctx) => {
		if (value.STORAGE_PROVIDER === "local" && !value.STORAGE_LOCAL_BASE_PATH) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["STORAGE_LOCAL_BASE_PATH"],
			message: "Local base path is required for local storage."
		});
		if (value.STORAGE_PROVIDER === "s3" && (!value.S3_REGION || !value.S3_BUCKET || !value.S3_ACCESS_KEY_ID || !value.S3_SECRET_ACCESS_KEY)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["S3_REGION"],
			message: "S3 region, bucket, and credentials are required."
		});
		if (value.STORAGE_PROVIDER === "r2" && (!value.R2_ACCOUNT_ID || !value.R2_BUCKET || !value.R2_ACCESS_KEY_ID || !value.R2_SECRET_ACCESS_KEY)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["R2_ACCOUNT_ID"],
			message: "R2 account, bucket, and credentials are required."
		});
	}),
	authentication: z.object({
		category: z.literal("authentication"),
		AUTH_GOOGLE_ENABLED: z.union([
			z.literal(""),
			z.literal("true"),
			z.literal("false")
		]).optional(),
		AUTH_GOOGLE_CLIENT_ID: optionalTrimmedString,
		AUTH_GOOGLE_CLIENT_SECRET: optionalTrimmedString,
		AUTH_GITHUB_ENABLED: z.union([
			z.literal(""),
			z.literal("true"),
			z.literal("false")
		]).optional(),
		AUTH_GITHUB_CLIENT_ID: optionalTrimmedString,
		AUTH_GITHUB_CLIENT_SECRET: optionalTrimmedString
	}).superRefine((value, ctx) => {
		if (value.AUTH_GOOGLE_ENABLED === "true" && (!value.AUTH_GOOGLE_CLIENT_ID || !value.AUTH_GOOGLE_CLIENT_SECRET)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["AUTH_GOOGLE_CLIENT_ID"],
			message: "Google client ID and secret are required when Google sign-in is enabled."
		});
		if (value.AUTH_GITHUB_ENABLED === "true" && (!value.AUTH_GITHUB_CLIENT_ID || !value.AUTH_GITHUB_CLIENT_SECRET)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["AUTH_GITHUB_CLIENT_ID"],
			message: "GitHub client ID and secret are required when GitHub sign-in is enabled."
		});
	}),
	billing: z.object({
		category: z.literal("billing"),
		STRIPE_SECRET_KEY: optionalTrimmedString,
		STRIPE_PUBLISHABLE_KEY: optionalTrimmedString,
		STRIPE_WEBHOOK_SECRET: optionalTrimmedString
	}).superRefine((value, ctx) => {
		if ((!!value.STRIPE_SECRET_KEY || !!value.STRIPE_PUBLISHABLE_KEY || !!value.STRIPE_WEBHOOK_SECRET) && (!value.STRIPE_SECRET_KEY || !value.STRIPE_WEBHOOK_SECRET)) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["STRIPE_SECRET_KEY"],
			message: "Stripe secret key and webhook secret are required together when Stripe billing is configured."
		});
	})
};
function parseLogicstarterProviderSettingsCategory(rawCategory) {
	if (rawCategory === "email" || rawCategory === "sms" || rawCategory === "storage" || rawCategory === "authentication" || rawCategory === "billing") return rawCategory;
	return null;
}
function parseLogicstarterProviderSettingsForm(category, values) {
	return logicstarterProviderSettingsSchemas[category].safeParse({
		category,
		...values
	});
}
//#endregion
//#region app/lib/logicstarter/provider-settings-route.server.ts
function resolveLogicstarterProviderSettingsCategory(rawCategory) {
	if (!rawCategory) return null;
	return parseLogicstarterProviderSettingsCategory(rawCategory);
}
async function getLogicstarterProviderSettingsResponse(category) {
	return {
		category,
		settings: await getLogicstarterProviderSettingsByCategory(category),
		envExport: await exportLogicstarterProviderEnv()
	};
}
async function parseLogicstarterProviderSettingsRequest(request) {
	const formData = await request.formData();
	const rawCategory = formData.get("category");
	const rawIntent = formData.get("intent");
	const category = resolveLogicstarterProviderSettingsCategory(typeof rawCategory === "string" ? rawCategory : null);
	const intent = typeof rawIntent === "string" && (rawIntent === "save" || rawIntent === "export-env") ? rawIntent : "validate";
	if (!category) return {
		ok: false,
		error: "Invalid provider settings category."
	};
	const parsed = parseLogicstarterProviderSettingsForm(category, Object.fromEntries(Array.from(formData.entries()).filter(([key]) => key !== "category").map(([key, value]) => [key, typeof value === "string" ? value : ""])));
	if (!parsed.success) return {
		ok: false,
		category,
		error: parsed.error.flatten()
	};
	if (intent === "save") return saveLogicstarterProviderSettingsRequest(category, parsed.data);
	if (intent === "export-env") return exportLogicstarterProviderSettingsRequest(category, parsed.data);
	return {
		ok: true,
		category,
		intent,
		values: parsed.data
	};
}
async function saveLogicstarterProviderSettingsRequest(category, values) {
	await saveLogicstarterProviderSettings(category, Object.fromEntries(Object.entries(values).filter(([key]) => key !== "category")));
	return {
		ok: true,
		category,
		saved: true,
		values
	};
}
async function exportLogicstarterProviderSettingsRequest(category, values) {
	const valuesToSave = Object.fromEntries(Object.entries(values).filter(([key]) => key !== "category"));
	await saveLogicstarterProviderSettings(category, valuesToSave);
	const runtimeTarget = readLogicstarterRuntimeTarget();
	const configSourceMode = getLogicstarterRuntimeConfigSourceMode(runtimeTarget);
	if (!supportsLogicstarterRuntimeEnvFileExport(runtimeTarget)) return {
		ok: true,
		category,
		exported: false,
		saved: true,
		runtimeTarget,
		configSourceMode,
		message: `Settings were saved as operator draft values for ${runtimeTarget}. Keep deployment bindings and secrets as the runtime source of truth instead of exporting .env.runtime.`,
		values
	};
	let exportResult;
	try {
		exportResult = await syncLogicstarterProviderEnvFile(void 0, valuesToSave);
	} catch (error) {
		return {
			ok: false,
			category,
			error: error instanceof Error ? error.message : "Unable to export Logicstarter runtime env file.",
			values
		};
	}
	return {
		ok: true,
		category,
		exported: true,
		saved: true,
		runtimeTarget,
		configSourceMode,
		envPath: exportResult.envPath,
		values
	};
}
//#endregion
//#region app/routes/api.settings.providers.tsx
var api_settings_providers_exports = /* @__PURE__ */ __exportAll({
	action: () => action,
	loader: () => loader$2
});
async function loader$2({ request }) {
	const category = resolveLogicstarterProviderSettingsCategory(new URL(request.url).searchParams.get("category"));
	if (!category) return Response.json({ error: "Invalid or missing provider settings category." }, { status: 400 });
	return Response.json(await getLogicstarterProviderSettingsResponse(category));
}
async function action({ request }) {
	const result = await parseLogicstarterProviderSettingsRequest(request);
	if (!result.ok) return Response.json(result, { status: 400 });
	return Response.json(result);
}
//#endregion
//#region app/routes/settings.providers.tsx
var settings_providers_exports = /* @__PURE__ */ __exportAll({
	default: () => settings_providers_default,
	loader: () => loader$1
});
var categoryMeta = {
	email: {
		label: "Email",
		eyebrow: "Communications",
		description: "Manage email provider selection, sender identity, and delivery credentials."
	},
	sms: {
		label: "SMS",
		eyebrow: "Communications",
		description: "Control SMS delivery providers, relay credentials, and DB-backed fallback values."
	},
	storage: {
		label: "Storage",
		eyebrow: "Assets",
		description: "Configure local, S3, or R2 storage before enabling shared uploads and generated asset flows."
	},
	authentication: {
		label: "Authentication",
		eyebrow: "Login",
		description: "Configure Google and GitHub login before testing the Better Auth sign-in flow."
	},
	billing: {
		label: "Billing",
		eyebrow: "Payments",
		description: "Manage Stripe runtime keys and webhook configuration used by the Better Auth Stripe plugin."
	}
};
var fieldOptions = {
	EMAIL_PROVIDER: [
		{
			value: "better_platform",
			label: "Better Platform"
		},
		{
			value: "resend",
			label: "Resend"
		},
		{
			value: "smtp",
			label: "SMTP"
		},
		{
			value: "ses",
			label: "Amazon SES"
		}
	],
	SMS_PROVIDER: [
		{
			value: "better_platform",
			label: "Better Platform"
		},
		{
			value: "console",
			label: "Console"
		},
		{
			value: "vonage",
			label: "Vonage"
		},
		{
			value: "amazon_sns",
			label: "Amazon SNS"
		}
	],
	STORAGE_PROVIDER: [
		{
			value: "local",
			label: "Local"
		},
		{
			value: "s3",
			label: "Amazon S3"
		},
		{
			value: "r2",
			label: "Cloudflare R2"
		}
	],
	AUTH_GOOGLE_ENABLED: [{
		value: "false",
		label: "Disabled"
	}, {
		value: "true",
		label: "Enabled"
	}],
	AUTH_GITHUB_ENABLED: [{
		value: "false",
		label: "Disabled"
	}, {
		value: "true",
		label: "Enabled"
	}]
};
var fieldLabels = {
	EMAIL_PROVIDER: "Email provider",
	EMAIL_FROM: "From email",
	EMAIL_FROM_NAME: "From name",
	RESEND_API_KEY: "Resend API key",
	SMTP_HOST: "SMTP host",
	SMTP_PORT: "SMTP port",
	SMTP_USER: "SMTP username",
	SMTP_PASS: "SMTP password",
	SES_REGION: "SES region",
	SES_ACCESS_KEY_ID: "SES access key ID",
	SES_SECRET_ACCESS_KEY: "SES secret access key",
	SMS_PROVIDER: "SMS provider",
	VONAGE_API_KEY: "Vonage API key",
	VONAGE_API_SECRET: "Vonage API secret",
	VONAGE_FROM: "Vonage sender",
	AMAZON_SNS_REGION: "Amazon SNS region",
	AMAZON_SNS_ACCESS_KEY_ID: "Amazon SNS access key ID",
	AMAZON_SNS_SECRET_ACCESS_KEY: "Amazon SNS secret access key",
	AMAZON_SNS_SENDER_ID: "Amazon SNS sender ID",
	STORAGE_PROVIDER: "Storage provider",
	STORAGE_LOCAL_BASE_PATH: "Local base path",
	STORAGE_PUBLIC_BASE_URL: "Public base URL",
	S3_REGION: "S3 region",
	S3_BUCKET: "S3 bucket",
	S3_ACCESS_KEY_ID: "S3 access key ID",
	S3_SECRET_ACCESS_KEY: "S3 secret access key",
	S3_ENDPOINT: "S3 endpoint",
	S3_FORCE_PATH_STYLE: "S3 force path style",
	R2_ACCOUNT_ID: "R2 account ID",
	R2_BUCKET: "R2 bucket",
	R2_ACCESS_KEY_ID: "R2 access key ID",
	R2_SECRET_ACCESS_KEY: "R2 secret access key",
	AUTH_GOOGLE_ENABLED: "Google sign-in",
	AUTH_GOOGLE_CLIENT_ID: "Google client ID",
	AUTH_GOOGLE_CLIENT_SECRET: "Google client secret",
	AUTH_GITHUB_ENABLED: "GitHub sign-in",
	AUTH_GITHUB_CLIENT_ID: "GitHub client ID",
	AUTH_GITHUB_CLIENT_SECRET: "GitHub client secret",
	STRIPE_SECRET_KEY: "Stripe secret key",
	STRIPE_PUBLISHABLE_KEY: "Stripe publishable key",
	STRIPE_WEBHOOK_SECRET: "Stripe webhook secret"
};
var fieldHelpText = {
	EMAIL_PROVIDER: "Choose which email delivery provider Logicstarter should use.",
	SMS_PROVIDER: "Choose which SMS delivery provider Logicstarter should use.",
	STORAGE_PROVIDER: "Choose which storage backend Logicstarter should use for shared uploads and generated assets.",
	STORAGE_PUBLIC_BASE_URL: "Optional public base URL used when stored files should resolve to a stable public address.",
	AUTH_GOOGLE_ENABLED: "Turn Google login on or off.",
	AUTH_GITHUB_ENABLED: "Turn GitHub login on or off.",
	STRIPE_SECRET_KEY: "Server-side Stripe secret key used by the Better Auth Stripe plugin.",
	STRIPE_PUBLISHABLE_KEY: "Client-side Stripe publishable key for browser checkout surfaces.",
	STRIPE_WEBHOOK_SECRET: "Webhook signing secret from the Stripe endpoint configured for this site."
};
function isSecretField(key) {
	return key.includes("SECRET") || key.includes("PASS") || key.includes("API_KEY");
}
function getInitialFieldValues(section) {
	return Object.fromEntries(Object.values(section.settings).map((setting) => [setting.key, setting.value]));
}
function getVisibleSettingKeys(category, values) {
	if (category === "email") {
		const provider = values.EMAIL_PROVIDER || "better_platform";
		if (provider === "resend") return [
			"EMAIL_PROVIDER",
			"EMAIL_FROM",
			"EMAIL_FROM_NAME",
			"RESEND_API_KEY"
		];
		if (provider === "smtp") return [
			"EMAIL_PROVIDER",
			"EMAIL_FROM",
			"EMAIL_FROM_NAME",
			"SMTP_HOST",
			"SMTP_PORT",
			"SMTP_USER",
			"SMTP_PASS"
		];
		if (provider === "ses") return [
			"EMAIL_PROVIDER",
			"EMAIL_FROM",
			"EMAIL_FROM_NAME",
			"SES_REGION",
			"SES_ACCESS_KEY_ID",
			"SES_SECRET_ACCESS_KEY"
		];
		return [
			"EMAIL_PROVIDER",
			"EMAIL_FROM",
			"EMAIL_FROM_NAME"
		];
	}
	if (category === "sms") {
		const provider = values.SMS_PROVIDER || "better_platform";
		if (provider === "vonage") return [
			"SMS_PROVIDER",
			"VONAGE_API_KEY",
			"VONAGE_API_SECRET",
			"VONAGE_FROM"
		];
		if (provider === "amazon_sns") return [
			"SMS_PROVIDER",
			"AMAZON_SNS_REGION",
			"AMAZON_SNS_ACCESS_KEY_ID",
			"AMAZON_SNS_SECRET_ACCESS_KEY",
			"AMAZON_SNS_SENDER_ID"
		];
		return ["SMS_PROVIDER"];
	}
	if (category === "storage") {
		const provider = values.STORAGE_PROVIDER || "local";
		if (provider === "s3") return [
			"STORAGE_PROVIDER",
			"STORAGE_PUBLIC_BASE_URL",
			"S3_REGION",
			"S3_BUCKET",
			"S3_ACCESS_KEY_ID",
			"S3_SECRET_ACCESS_KEY",
			"S3_ENDPOINT",
			"S3_FORCE_PATH_STYLE"
		];
		if (provider === "r2") return [
			"STORAGE_PROVIDER",
			"STORAGE_PUBLIC_BASE_URL",
			"R2_ACCOUNT_ID",
			"R2_BUCKET",
			"R2_ACCESS_KEY_ID",
			"R2_SECRET_ACCESS_KEY"
		];
		return [
			"STORAGE_PROVIDER",
			"STORAGE_LOCAL_BASE_PATH",
			"STORAGE_PUBLIC_BASE_URL"
		];
	}
	if (category === "authentication") {
		const keys = ["AUTH_GOOGLE_ENABLED", "AUTH_GITHUB_ENABLED"];
		if (values.AUTH_GOOGLE_ENABLED === "true") keys.push("AUTH_GOOGLE_CLIENT_ID", "AUTH_GOOGLE_CLIENT_SECRET");
		if (values.AUTH_GITHUB_ENABLED === "true") keys.push("AUTH_GITHUB_CLIENT_ID", "AUTH_GITHUB_CLIENT_SECRET");
		return keys;
	}
	return [
		"STRIPE_SECRET_KEY",
		"STRIPE_PUBLISHABLE_KEY",
		"STRIPE_WEBHOOK_SECRET"
	];
}
function formatFieldSource(source) {
	return source === "env" ? "Currently resolved from an explicit runtime env value." : source === "db" ? "Currently resolved from the settings store." : "Currently resolved from the built-in default snapshot.";
}
function ValueBlock({ label, value }) {
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
		className: "font-medium text-white",
		children: label
	}), /* @__PURE__ */ jsx("div", {
		className: "mt-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-slate-100 break-all",
		children: value
	})] });
}
function BillingApiReferenceCard({ requestOrigin }) {
	const runtimeUrl = `${requestOrigin}/api/billing/runtime`;
	const stripeCheckoutUrl = `${requestOrigin}/api/billing/checkout`;
	const stripeStateUrl = `${requestOrigin}/api/billing/state`;
	const stripeSyncUrl = `${requestOrigin}/api/billing/sync`;
	const stripeWebhookUrl = `${requestOrigin}/api/billing/webhook`;
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-slate-400",
				children: "Stripe API quick reference"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: "Billing endpoints in this runtime"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Billing runtime snapshot",
						value: runtimeUrl
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Stripe checkout endpoint",
						value: stripeCheckoutUrl
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Billing state endpoint",
						value: stripeStateUrl
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Billing sync endpoint",
						value: stripeSyncUrl
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Stripe webhook endpoint",
						value: stripeWebhookUrl
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Current runtime origin",
						value: requestOrigin
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-medium text-white",
						children: "Operator notes"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-200",
						children: "Use deployment bindings and secrets as the runtime source of truth on Workers. In Node-target workflows, export updated Stripe values to `.env.runtime` and restart the service before validating webhook delivery. If webhook delivery was delayed or missed, run the authenticated billing sync endpoint to repair local customer and subscription state from Stripe."
					})] })
				]
			})
		]
	});
}
function ProviderRuntimeOverviewCard() {
	const fetcher = useFetcher();
	useEffect(() => {
		if (fetcher.state === "idle" && !fetcher.data) fetcher.load("/api/providers/runtime");
	}, [fetcher]);
	const modules = fetcher.data?.modules ?? {};
	const runtime = fetcher.data?.runtime;
	const summary = fetcher.data?.summary;
	const providerSummary = Object.entries(modules).map(([name, module]) => `${name}: ${module.provider ?? "unknown"}`).join(" · ");
	const attentionModules = summary?.attentionModules ?? [];
	const cloudflareChecklist = runtime?.cloudflareCompatible ? [
		"Switch RUNTIME_TARGET to cloudflare when the deployment config and runtime bindings are ready.",
		"Keep remote object storage on R2 or another shared object store before validating uploads in Workers.",
		"Re-run the runtime overview after deployment to confirm the target and provider surfaces still report healthy."
	] : [
		"Keep STORAGE_PROVIDER on r2 or another remote object store before moving Worker uploads into the mainline path.",
		"Billing is now gated behind the node runtime target, but Stripe checkout and webhook handling still need a Worker-safe path before Cloudflare can become the primary runtime.",
		"Treat Cloudflare bindings and secrets as the source of truth for provider configuration, and only keep DB values as low-frequency operator drafts if you still need them."
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs uppercase tracking-[0.24em] text-slate-400",
							children: "Provider runtime overview"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-3 text-2xl font-semibold text-white",
							children: "Live operator readiness"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-sm leading-6 text-slate-300",
							children: "This summary is sourced from the active runtime APIs instead of only merged form values."
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200",
					children: providerSummary || "Loading runtime providers..."
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-6 grid gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ jsx(StatusPill, {
						label: "Runtime-ready modules",
						value: summary?.readyCount ?? 0,
						tone: "emerald"
					}),
					/* @__PURE__ */ jsx(StatusPill, {
						label: "Needs attention",
						value: summary?.incompleteCount ?? 0,
						tone: "sky"
					}),
					/* @__PURE__ */ jsx(StatusPill, {
						label: "Tracked modules",
						value: summary?.totalCount ?? 0,
						tone: "slate"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-6 grid gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime target",
						value: runtime?.target ?? "unknown"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Database profile",
						value: runtime?.databaseProfile ?? "unknown"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Cloudflare compatibility",
						value: runtime?.cloudflareCompatible ? "Ready for CF-first follow-up" : "Blocked by Node-first surfaces"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ jsx(ValueBlock, {
					label: "Runtime config mode",
					value: runtime?.configSourceMode ?? "unknown"
				}), /* @__PURE__ */ jsx(ValueBlock, {
					label: "Runtime env export",
					value: runtime?.supportsRuntimeEnvFileExport ? "Node env file workflow available" : "Worker runtime should use deployment bindings and secrets"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-4 space-y-3",
				children: (runtime?.cloudflareBlockers ?? []).map((item) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "font-medium text-white",
						children: ["CF blocker · ", item.name]
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-1 text-cyan-100/90",
						children: item.reason
					})]
				}, item.name))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-6 rounded-[24px] border border-violet-400/20 bg-violet-500/10 p-5",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs uppercase tracking-[0.24em] text-violet-200",
						children: "Cloudflare deployment guide"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-3 text-lg font-semibold text-white",
						children: "CF-first runtime checklist"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm leading-6 text-slate-200",
						children: "Use this checklist when you switch Logicstarter from a Node runtime to a Cloudflare Worker target. The overview above reflects the current runtime state, while this card highlights the deployment assumptions that must change for Workers."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-4 grid gap-4 md:grid-cols-2",
						children: [
							/* @__PURE__ */ jsx(ValueBlock, {
								label: "Target to apply",
								value: runtime?.target === "cloudflare" ? "cloudflare" : "cloudflare (planned)"
							}),
							/* @__PURE__ */ jsx(ValueBlock, {
								label: "Preferred CF database profile",
								value: runtime?.databaseProfile === "d1" ? "d1" : `${runtime?.databaseProfile ?? "unknown"} → prefer d1 for Worker-native deployments`
							}),
							/* @__PURE__ */ jsx(ValueBlock, {
								label: "Runtime env export",
								value: runtime?.supportsRuntimeEnvFileExport ? "Available only in Node-target workflows" : "Use bindings/secrets for runtime config; DB values are optional operator drafts"
							}),
							/* @__PURE__ */ jsx(ValueBlock, {
								label: "Current CF status",
								value: runtime?.cloudflareCompatible ? "No known CF blockers in the tracked provider overview" : "CF blockers still exist in the tracked provider overview"
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3 text-sm leading-6 text-slate-100",
						children: cloudflareChecklist.map((item) => /* @__PURE__ */ jsx("div", {
							className: "rounded-2xl border border-white/10 bg-black/20 px-4 py-3",
							children: item
						}, item))
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-6 space-y-3",
				children: attentionModules.length > 0 ? attentionModules.map((item) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "font-medium text-white",
						children: [
							item.name,
							" · ",
							item.provider ?? "unknown"
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-1 text-amber-100/90",
						children: item.remediation ?? "Review this module before proceeding."
					})]
				}, item.name)) : /* @__PURE__ */ jsx("div", {
					className: "rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100",
					children: "All tracked modules are currently runtime-ready."
				})
			})
		]
	});
}
function AuthenticationRuntimeStatusCard() {
	const fetcher = useFetcher();
	useEffect(() => {
		if (fetcher.state === "idle" && !fetcher.data) fetcher.load("/api/auth/runtime");
	}, [fetcher]);
	const snapshot = fetcher.data?.snapshot;
	const runtimeHealth = snapshot?.trustedOriginReady ? "Authentication runtime ready" : "Authentication origin configuration incomplete";
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-slate-400",
				children: "Authentication runtime status"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: "Active authentication runtime"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime health",
						value: runtimeHealth
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Provider",
						value: fetcher.data?.provider || "better_auth"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Email/password",
						value: snapshot?.emailPasswordEnabled ? "Enabled" : "Disabled"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Google enabled",
						value: snapshot?.googleEnabled ? "Enabled" : "Disabled"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Google configured",
						value: snapshot?.googleConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "GitHub enabled",
						value: snapshot?.githubEnabled ? "Enabled" : "Disabled"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "GitHub configured",
						value: snapshot?.githubConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Better Auth URL",
						value: snapshot?.betterAuthUrlConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "App origin",
						value: snapshot?.appOriginConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Canonical origin",
						value: snapshot?.authCanonicalOriginConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Trusted origin readiness",
						value: snapshot?.trustedOriginReady ? "Ready" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Configured social providers",
						value: String(snapshot?.socialProvidersConfigured ?? 0)
					})
				]
			})
		]
	});
}
function StorageApiReferenceCard({ requestOrigin }) {
	const runtimeUrl = `${requestOrigin}/api/storage/runtime`;
	const signedUrl = `${requestOrigin}/api/storage/signed-url`;
	const uploadUrl = `${requestOrigin}/api/storage/upload`;
	const deleteUrl = `${requestOrigin}/api/storage/delete`;
	const uploadsUrl = `${requestOrigin}/uploads/...`;
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-slate-400",
				children: "Storage API quick reference"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: "Operator endpoints"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime status",
						value: `GET ${runtimeUrl}`
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Signed URL",
						value: `POST ${signedUrl}`
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Upload file",
						value: `POST ${uploadUrl}`
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Delete file",
						value: `POST ${deleteUrl}`
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Public files",
						value: `GET ${uploadsUrl}`
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime curl",
						value: `curl -s ${runtimeUrl}`
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Signed URL curl",
						value: `curl -s -X POST ${signedUrl} -H 'content-type: application/json' --data '{"key":"homepage/example.txt","method":"GET"}'`
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Direct upload prep curl",
						value: `curl -s -X POST ${signedUrl} -H 'content-type: application/json' --data '{"key":"homepage/example.txt","method":"PUT","contentType":"text/plain"}'`
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Delete curl",
						value: `curl -s -X POST ${deleteUrl} -H 'content-type: application/json' --data '{"key":"homepage/example.txt"}'`
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "text-slate-400",
						children: "Signed URL contract:"
					}), " `POST /api/storage/signed-url` requires a signed-in Better Auth session and accepts `GET` or `PUT` in the request body."] }),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-slate-400",
							children: "Provider support:"
						}), " `local` supports signed `GET` only. `s3` and `r2` support signed `GET` and signed `PUT` for direct uploads."]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-2",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-slate-400",
								children: "Direct upload guidance:"
							}),
							" Use `POST /api/storage/signed-url` with ",
							/* @__PURE__ */ jsx("code", { children: "{\"method\":\"PUT\"}" }),
							" only when the active provider is `s3` or `r2`."
						]
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "text-slate-400",
						children: "Auth contract:"
					}), " `POST /api/storage/upload` and `POST /api/storage/delete` require a signed-in Better Auth session and reject anonymous requests with `401`."] }),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-slate-400",
							children: "Method contract:"
						}), " `GET /api/storage/upload` and `GET /api/storage/delete` return `405 Method Not Allowed`."]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 flex flex-wrap gap-3",
				children: [/* @__PURE__ */ jsx(Link, {
					to: "/",
					className: "inline-flex items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20",
					children: "Open homepage upload panel"
				}), /* @__PURE__ */ jsx("a", {
					href: runtimeUrl,
					target: "_blank",
					rel: "noreferrer",
					className: "inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10",
					children: "Open runtime JSON"
				})]
			})
		]
	});
}
function StorageRuntimeStatusCard() {
	const fetcher = useFetcher();
	useEffect(() => {
		if (fetcher.state === "idle" && !fetcher.data) fetcher.load("/api/storage/runtime");
	}, [fetcher]);
	const isLoading = fetcher.state !== "idle";
	const snapshot = fetcher.data?.snapshot;
	const capabilities = fetcher.data?.capabilities || snapshot?.capabilities;
	const uploadPolicy = fetcher.data?.uploadPolicy;
	const resolvedProvider = fetcher.data?.provider || snapshot?.provider || "unknown";
	const publicDeliveryMode = snapshot?.publicBaseUrl ? "Stable public base URL" : resolvedProvider === "r2" || resolvedProvider === "s3" ? "Provider-managed object URL" : "Local uploads route";
	const directUploadReadiness = capabilities?.signedPutUrl ? "Ready for signed PUT uploads" : "Signed PUT unavailable in this runtime";
	const runtimeHealth = fetcher.data?.ok === false ? "Configuration error" : resolvedProvider === "r2" || resolvedProvider === "s3" ? "Remote object storage active" : "Local filesystem storage active";
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs uppercase tracking-[0.24em] text-slate-400",
					children: "Storage runtime status"
				}), /* @__PURE__ */ jsx("h3", {
					className: "mt-3 text-lg font-semibold text-white",
					children: "Active storage runtime"
				})] }), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => fetcher.load("/api/storage/runtime"),
					disabled: isLoading,
					className: "rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60",
					children: isLoading ? "Refreshing..." : "Refresh runtime status"
				})]
			}),
			fetcher.data?.ok === false ? /* @__PURE__ */ jsx("div", {
				className: "mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100",
				children: fetcher.data.error || "Unable to validate the active storage runtime."
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime health",
						value: runtimeHealth
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Provider",
						value: resolvedProvider
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Public delivery mode",
						value: publicDeliveryMode
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Direct upload readiness",
						value: directUploadReadiness
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Public base URL",
						value: snapshot?.publicBaseUrl || "/uploads"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Local path",
						value: snapshot?.localBasePath || "Not applicable"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Bucket target",
						value: snapshot?.s3Bucket || snapshot?.r2Bucket || "Not configured"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "R2 account",
						value: snapshot?.r2AccountId || "Not applicable"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Resolved endpoint",
						value: snapshot?.resolvedEndpoint || snapshot?.s3Endpoint || "Not applicable"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Signed GET support",
						value: capabilities?.signedGetUrl ? "Enabled" : "Unavailable"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Signed PUT support",
						value: capabilities?.signedPutUrl ? "Enabled" : "Unavailable"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Upload support",
						value: capabilities?.putObject ? "Enabled" : "Unavailable"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Delete support",
						value: capabilities?.deleteObject ? "Enabled" : "Unavailable"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Upload policy",
						value: uploadPolicy?.label || "Not available"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Max upload bytes",
						value: String(uploadPolicy?.maxUploadBytes ?? "Not available")
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Accept",
						value: uploadPolicy?.accept || "Not available"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Allowed content types",
						value: uploadPolicy?.contentTypes?.join(", ") || "Not available"
					})
				]
			})
		]
	});
}
function SettingField({ setting, value, disabled, error, onValueChange }) {
	const options = fieldOptions[setting.key];
	return /* @__PURE__ */ jsxs("label", {
		className: "block rounded-[24px] border border-white/10 bg-black/20 p-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-medium text-white",
					children: fieldLabels[setting.key] ?? setting.key
				}), /* @__PURE__ */ jsx("span", {
					className: setting.source === "env" ? "rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-sky-300" : setting.source === "db" ? "rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-emerald-300" : "rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300",
					children: setting.source
				})]
			}),
			options ? /* @__PURE__ */ jsx("select", {
				name: setting.key,
				value: value || options[0]?.value,
				onChange: (event) => onValueChange(event.target.value),
				disabled,
				className: "mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/40",
				children: options.map((option) => /* @__PURE__ */ jsx("option", {
					value: option.value,
					className: "bg-slate-950 text-slate-100",
					children: option.label
				}, option.value))
			}) : /* @__PURE__ */ jsx("input", {
				name: setting.key,
				type: isSecretField(setting.key) ? "password" : "text",
				value,
				onChange: (event) => onValueChange(event.target.value),
				disabled,
				className: "mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/40"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-xs leading-5 text-slate-400",
				children: fieldHelpText[setting.key] ?? formatFieldSource(setting.source)
			}),
			error?.length ? /* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm text-rose-300",
				children: error.join(" ")
			}) : null
		]
	});
}
function resolveRequestOrigin(request) {
	const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
	const forwardedProto = request.headers.get("x-forwarded-proto");
	if (forwardedHost) return `${forwardedProto?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "") || "https"}://${forwardedHost.split(",")[0].trim()}`;
	return new URL(request.url).origin;
}
async function loader$1({ request }) {
	const focusedCategory = resolveLogicstarterProviderSettingsCategory(new URL(request.url).searchParams.get("category"));
	const firstLogin = await getLogicstarterFirstLoginState();
	const requestOrigin = resolveRequestOrigin(request);
	return {
		email: await getLogicstarterProviderSettingsResponse("email"),
		sms: await getLogicstarterProviderSettingsResponse("sms"),
		storage: await getLogicstarterProviderSettingsResponse("storage"),
		authentication: await getLogicstarterProviderSettingsResponse("authentication"),
		billing: await getLogicstarterProviderSettingsResponse("billing"),
		authMethods: listEnabledLogicstarterAuthMethods(),
		focusedCategory,
		firstLogin,
		requestOrigin
	};
}
var settings_providers_default = UNSAFE_withComponentProps(function SettingsProvidersPage() {
	const data = useLoaderData();
	const allSections = [
		data.email,
		data.sms,
		data.storage,
		data.authentication,
		data.billing
	];
	const sections = data.focusedCategory ? allSections.filter((section) => section.category === data.focusedCategory) : allSections;
	const focusedSection = data.focusedCategory ? allSections.find((section) => section.category === data.focusedCategory) ?? null : null;
	const categoryTabs = [
		{
			label: "All",
			value: null
		},
		{
			label: "Email",
			value: "email"
		},
		{
			label: "SMS",
			value: "sms"
		},
		{
			label: "Storage",
			value: "storage"
		},
		{
			label: "Authentication",
			value: "authentication"
		},
		{
			label: "Billing",
			value: "billing"
		}
	];
	const focusedEnvExport = focusedSection ? Object.values(focusedSection.settings).map((setting) => `${setting.key}=${setting.value}`).join("\n") : null;
	const sourceCounts = allSections.reduce((counts, section) => {
		for (const setting of Object.values(section.settings)) counts[setting.source] = (counts[setting.source] ?? 0) + 1;
		return counts;
	}, {});
	const configuredFieldCount = allSections.reduce((count, section) => count + Object.values(section.settings).filter((setting) => setting.value.trim() !== "").length, 0);
	return /* @__PURE__ */ jsx("main", {
		className: "min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#020617_42%,#020617_100%)] text-white",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14",
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "rounded-[32px] border border-white/10 bg-[rgba(8,15,30,0.78)] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-10",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "max-w-4xl",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs uppercase tracking-[0.24em] text-slate-400",
										children: "Logicstarter operator console"
									}),
									/* @__PURE__ */ jsx("h1", {
										className: "mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl",
										children: "Provider settings"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-5 max-w-3xl text-base leading-8 text-slate-300",
										children: "This page now behaves like an operator workspace instead of a raw form. You can review runtime sources, validate provider input, save DB-backed settings, and export merged values into the runtime env before testing login."
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap gap-3",
								children: [/* @__PURE__ */ jsx(Link, {
									to: "/",
									className: "inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10",
									children: "Back to home"
								}), /* @__PURE__ */ jsx(Link, {
									to: "/settings/providers?category=authentication",
									className: "inline-flex items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20",
									children: "Prepare login test"
								})]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4",
							children: [
								/* @__PURE__ */ jsx(SummaryPanel, {
									label: "Visible categories",
									value: String(allSections.length),
									detail: "Email, SMS, storage, authentication, and billing are all exposed here."
								}),
								/* @__PURE__ */ jsx(SummaryPanel, {
									label: "Configured fields",
									value: String(configuredFieldCount),
									detail: "Non-empty provider values currently resolved into the runtime snapshot."
								}),
								/* @__PURE__ */ jsx(SummaryPanel, {
									label: "DB-backed fields",
									value: String(sourceCounts.db ?? 0),
									detail: "Fields currently resolved from persisted settings instead of env or defaults."
								}),
								/* @__PURE__ */ jsx(SummaryPanel, {
									label: "Env-backed fields",
									value: String(sourceCounts.env ?? 0),
									detail: "Fields currently taking precedence from explicit runtime env values."
								})
							]
						}),
						/* @__PURE__ */ jsx(ProviderRuntimeOverviewCard, {}),
						data.firstLogin.bootstrapAdminSetup ? /* @__PURE__ */ jsx("div", {
							className: "mt-8",
							children: /* @__PURE__ */ jsx(BootstrapAdminCard, {})
						}) : null
					]
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]",
					children: [/* @__PURE__ */ jsxs("aside", {
						className: "rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs uppercase tracking-[0.24em] text-slate-400",
								children: "Navigation"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-5 space-y-3",
								children: categoryTabs.map((tab) => {
									const isActive = tab.value === data.focusedCategory || !tab.value && !data.focusedCategory;
									return /* @__PURE__ */ jsxs(Link, {
										to: tab.value ? `/settings/providers?category=${tab.value}` : "/settings/providers",
										className: isActive ? "block rounded-[22px] border border-sky-400/30 bg-sky-500/10 px-4 py-4 text-sm font-medium text-sky-200" : "block rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white",
										children: [/* @__PURE__ */ jsx("div", { children: tab.label }), /* @__PURE__ */ jsx("p", {
											className: "mt-2 text-xs leading-5 text-slate-400",
											children: tab.value ? categoryMeta[tab.value].description : "Show the full runtime snapshot across all available categories."
										})]
									}, tab.label);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-xs uppercase tracking-[0.18em] text-slate-400",
									children: "Enabled auth methods"
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: data.authMethods.map((method) => /* @__PURE__ */ jsx("span", {
										className: "inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200",
										children: method.label
									}, method.key))
								})]
							})
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-6",
						children: sections.map((section) => /* @__PURE__ */ jsx(ProviderValidationCard, { section }, section.category))
					})]
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "grid gap-6 lg:grid-cols-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs uppercase tracking-[0.24em] text-slate-400",
								children: "Runtime snapshot"
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "mt-4 text-2xl font-semibold tracking-[-0.04em] text-white",
								children: "Full env export"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm leading-6 text-slate-300",
								children: "This export reflects the full merged provider and authentication configuration currently resolved by Logicstarter."
							}),
							/* @__PURE__ */ jsx("pre", {
								className: "mt-6 overflow-x-auto rounded-[24px] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-slate-200",
								children: /* @__PURE__ */ jsx("code", { children: data.email.envExport })
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs uppercase tracking-[0.24em] text-slate-400",
								children: "Focused export"
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "mt-4 text-2xl font-semibold tracking-[-0.04em] text-white",
								children: "Category export preview"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm leading-6 text-slate-300",
								children: focusedSection ? `This export is focused on ${categoryMeta[focusedSection.category].label}. Use it when you only want one category while testing.` : "Select a category tab to preview a focused export for a single configuration group."
							}),
							/* @__PURE__ */ jsx("pre", {
								className: "mt-6 overflow-x-auto rounded-[24px] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-slate-200",
								children: /* @__PURE__ */ jsx("code", { children: focusedEnvExport ?? "Select email, sms, storage, authentication, or billing to preview a focused export." })
							})
						]
					})]
				})
			]
		})
	});
});
function SummaryPanel({ label, value, detail }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.2em] text-slate-400",
				children: label
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-3 text-3xl font-semibold tracking-[-0.05em] text-white",
				children: value
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm leading-6 text-slate-300",
				children: detail
			})
		]
	});
}
function StorageProviderGuide({ provider }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-slate-400",
				children: "Storage guidance"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: provider === "s3" ? "Amazon S3 runtime checklist" : provider === "r2" ? "Cloudflare R2 runtime checklist" : "Local storage runtime checklist"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm leading-6 text-slate-300",
				children: provider === "s3" ? "Use this mode when Logicstarter should write shared uploads into an S3-compatible bucket that works across Node and Worker runtime targets." : provider === "r2" ? "Use this mode for Cloudflare-first object storage while keeping the Logicstarter storage contract aligned with the shared provider model." : "Use this mode for local development and simple Node deployments before shared object storage is configured."
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-4 space-y-3 text-sm leading-6 text-slate-200",
				children: (provider === "s3" ? [
					"Confirm the bucket, region, and IAM credentials are scoped for Logicstarter uploads.",
					"Use a stable public URL or rely on signed GET URLs depending on your distribution model.",
					"Keep signed PUT enabled only when browser direct uploads are part of the deployment plan."
				] : provider === "r2" ? [
					"Confirm the R2 account ID, bucket, and access keys match the active production bucket.",
					"Verify STORAGE_PUBLIC_BASE_URL points at the public file domain when public object delivery is expected.",
					"Use the runtime card to confirm signed PUT support is enabled before validating direct uploads."
				] : [
					"Use STORAGE_LOCAL_BASE_PATH for the writable uploads directory inside the Node runtime.",
					"Expect signed GET support only; signed PUT remains unavailable for local storage.",
					"Move to R2 or S3 before relying on cross-instance shared uploads or browser direct upload flows."
				]).map((item) => /* @__PURE__ */ jsx("div", {
					className: "rounded-2xl border border-white/10 bg-white/5 px-4 py-3",
					children: item
				}, item))
			})
		]
	});
}
function BillingRuntimeStatusCard({}) {
	const fetcher = useFetcher();
	useEffect(() => {
		if (fetcher.state === "idle" && !fetcher.data) fetcher.load("/api/billing/runtime");
	}, [fetcher]);
	const snapshot = fetcher.data?.snapshot;
	const runtimeHealth = fetcher.data?.runtimeHealth ?? "Loading billing runtime...";
	const checkoutReadiness = fetcher.data?.checkoutReadiness ?? "Loading checkout readiness...";
	const webhookReadiness = fetcher.data?.webhookReadiness ?? "Loading webhook readiness...";
	const remediation = fetcher.data?.remediation ?? "Checking Stripe runtime status...";
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-slate-400",
				children: "Billing runtime status"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: "Active Stripe runtime"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-50",
				children: remediation
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime health",
						value: runtimeHealth
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Checkout readiness",
						value: checkoutReadiness
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Webhook readiness",
						value: webhookReadiness
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Provider",
						value: fetcher.data?.provider || "stripe"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime target",
						value: snapshot?.runtimeTarget || "unknown"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Server path mode",
						value: snapshot?.serverPathMode === "node_only" ? "Node-only" : snapshot?.serverPathMode === "worker_unsupported" ? "Worker-safe path required" : "unknown"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Secret key",
						value: snapshot?.stripeSecretKeyConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Publishable key",
						value: snapshot?.stripePublishableKeyConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Webhook secret",
						value: snapshot?.stripeWebhookSecretConfigured ? "Configured" : "Missing"
					})
				]
			})
		]
	});
}
function EmailRuntimeStatusCard() {
	const fetcher = useFetcher();
	useEffect(() => {
		if (fetcher.state === "idle" && !fetcher.data) fetcher.load("/api/email/runtime");
	}, [fetcher]);
	const snapshot = fetcher.data?.snapshot;
	const provider = fetcher.data?.provider || "unknown";
	const runtimeHealth = snapshot?.providerReady ? "Email provider ready" : "Email provider incomplete";
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-slate-400",
				children: "Email runtime status"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: "Active email runtime"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime health",
						value: runtimeHealth
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Provider",
						value: provider
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "From email",
						value: snapshot?.fromConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "From name",
						value: snapshot?.fromNameConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Resend API key",
						value: snapshot?.resendApiKeyConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SMTP host",
						value: snapshot?.smtpHostConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SMTP port",
						value: snapshot?.smtpPortConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SMTP user",
						value: snapshot?.smtpUserConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SMTP password",
						value: snapshot?.smtpPassConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SES region",
						value: snapshot?.sesRegionConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SES access key",
						value: snapshot?.sesAccessKeyIdConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SES secret key",
						value: snapshot?.sesSecretAccessKeyConfigured ? "Configured" : "Missing"
					})
				]
			})
		]
	});
}
function SmsRuntimeStatusCard() {
	const fetcher = useFetcher();
	useEffect(() => {
		if (fetcher.state === "idle" && !fetcher.data) fetcher.load("/api/sms/runtime");
	}, [fetcher]);
	const snapshot = fetcher.data?.snapshot;
	const provider = fetcher.data?.provider || "unknown";
	const runtimeHealth = snapshot?.providerReady ? "SMS provider ready" : "SMS provider incomplete";
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-slate-400",
				children: "SMS runtime status"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: "Active SMS runtime"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Runtime health",
						value: runtimeHealth
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Provider",
						value: provider
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Vonage API key",
						value: snapshot?.vonageApiKeyConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Vonage API secret",
						value: snapshot?.vonageApiSecretConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "Vonage sender",
						value: snapshot?.vonageFromConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SNS region",
						value: snapshot?.amazonSnsRegionConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SNS access key",
						value: snapshot?.amazonSnsAccessKeyIdConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SNS secret key",
						value: snapshot?.amazonSnsSecretAccessKeyConfigured ? "Configured" : "Missing"
					}),
					/* @__PURE__ */ jsx(ValueBlock, {
						label: "SNS sender ID",
						value: snapshot?.amazonSnsSenderIdConfigured ? "Configured" : "Missing"
					})
				]
			})
		]
	});
}
function BootstrapAdminCard() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [status, setStatus] = useState("");
	const [busy, setBusy] = useState(false);
	async function handleSubmit(event) {
		event.preventDefault();
		setBusy(true);
		setError("");
		setStatus("");
		try {
			const response = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password,
					confirmPassword,
					name: email.trim().split("@")[0] || "admin"
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Unable to initialize administrator.");
			setStatus(data.message || "Administrator account created. You can now sign in.");
			setEmail("");
			setPassword("");
			setConfirmPassword("");
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Unable to initialize administrator.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-6",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.24em] text-emerald-200",
				children: "First login"
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "mt-3 text-2xl font-semibold text-white",
				children: "Initialize the first administrator"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 max-w-3xl text-sm leading-6 text-slate-200",
				children: "This Logicstarter runtime does not have any users yet. Create the first administrator here before continuing with provider testing and sign-in validation."
			}),
			/* @__PURE__ */ jsxs("form", {
				className: "mt-6 grid gap-4 md:grid-cols-2",
				onSubmit: handleSubmit,
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-2 md:col-span-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "bootstrap-admin-email",
							children: "Administrator email"
						}), /* @__PURE__ */ jsx(Input, {
							id: "bootstrap-admin-email",
							type: "email",
							value: email,
							onChange: (event) => setEmail(event.target.value),
							placeholder: "admin@example.com"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "bootstrap-admin-password",
							children: "Password"
						}), /* @__PURE__ */ jsx(Input, {
							id: "bootstrap-admin-password",
							type: "password",
							value: password,
							onChange: (event) => setPassword(event.target.value),
							placeholder: "Minimum 8 characters"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "bootstrap-admin-confirm-password",
							children: "Confirm password"
						}), /* @__PURE__ */ jsx(Input, {
							id: "bootstrap-admin-confirm-password",
							type: "password",
							value: confirmPassword,
							onChange: (event) => setConfirmPassword(event.target.value),
							placeholder: "Repeat the password"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "md:col-span-2 flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ jsx(Button, {
							type: "submit",
							disabled: busy || !email.trim() || !password || !confirmPassword,
							children: busy ? "Creating administrator..." : "Create administrator"
						}), /* @__PURE__ */ jsx(Link, {
							to: "/",
							className: "text-sm text-emerald-100 underline-offset-4 hover:underline",
							children: "Back to home"
						})]
					})
				]
			}),
			status ? /* @__PURE__ */ jsx("div", {
				className: "mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100",
				children: status
			}) : null,
			error ? /* @__PURE__ */ jsx("div", {
				className: "mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200",
				children: error
			}) : null
		]
	});
}
function ProviderValidationCard({ section }) {
	const fetcher = useFetcher();
	const isSubmitting = fetcher.state !== "idle";
	const isSaving = fetcher.formData?.get("intent") === "save";
	const isExporting = fetcher.formData?.get("intent") === "export-env";
	const fieldErrors = typeof fetcher.data?.error === "object" && fetcher.data?.error?.fieldErrors ? fetcher.data.error.fieldErrors : void 0;
	const formErrors = typeof fetcher.data?.error === "object" && fetcher.data?.error?.formErrors ? fetcher.data.error.formErrors : void 0;
	const submittedFieldCount = fetcher.data?.ok && fetcher.data.values ? Object.keys(fetcher.data.values).length - 1 : 0;
	const meta = categoryMeta[section.category];
	const settingsList = Object.values(section.settings);
	const dbCount = settingsList.filter((setting) => setting.source === "db").length;
	const envCount = settingsList.filter((setting) => setting.source === "env").length;
	const defaultCount = settingsList.filter((setting) => setting.source === "default").length;
	const { requestOrigin } = useLoaderData();
	const [fieldValues, setFieldValues] = useState(() => getInitialFieldValues(section));
	useEffect(() => {
		setFieldValues(getInitialFieldValues(section));
	}, [section]);
	const visibleSettings = getVisibleSettingKeys(section.category, fieldValues).map((key) => section.settings[key]).filter(Boolean);
	function updateFieldValue(key, value) {
		setFieldValues((current) => ({
			...current,
			[key]: value
		}));
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5 lg:flex-row lg:items-end lg:justify-between",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs uppercase tracking-[0.24em] text-slate-400",
						children: meta.eyebrow
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "mt-3 text-2xl font-semibold capitalize tracking-[-0.04em] text-white",
						children: meta.label
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 max-w-2xl text-sm leading-7 text-slate-300",
						children: meta.description
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "grid gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ jsx(StatusPill, {
							label: "env",
							value: envCount,
							tone: "sky"
						}),
						/* @__PURE__ */ jsx(StatusPill, {
							label: "db",
							value: dbCount,
							tone: "emerald"
						}),
						/* @__PURE__ */ jsx(StatusPill, {
							label: "default",
							value: defaultCount,
							tone: "slate"
						})
					]
				})]
			}),
			section.category === "authentication" ? /* @__PURE__ */ jsx(AuthenticationPlatformGuide, {
				requestOrigin,
				googleEnabled: fieldValues.AUTH_GOOGLE_ENABLED === "true",
				githubEnabled: fieldValues.AUTH_GITHUB_ENABLED === "true"
			}) : null,
			section.category === "authentication" ? /* @__PURE__ */ jsx(AuthenticationRuntimeStatusCard, {}) : null,
			section.category === "billing" ? /* @__PURE__ */ jsx(BillingPlatformGuide, { requestOrigin }) : null,
			section.category === "billing" ? /* @__PURE__ */ jsx(BillingRuntimeStatusCard, {}) : null,
			section.category === "billing" ? /* @__PURE__ */ jsx(BillingApiReferenceCard, { requestOrigin }) : null,
			section.category === "sms" ? /* @__PURE__ */ jsx(SmsRuntimeStatusCard, {}) : null,
			section.category === "sms" ? /* @__PURE__ */ jsx(SmsProviderGuide, { provider: fieldValues.SMS_PROVIDER || "better_auth_infra" }) : null,
			section.category === "email" ? /* @__PURE__ */ jsx(EmailRuntimeStatusCard, {}) : null,
			section.category === "email" ? /* @__PURE__ */ jsx(EmailProviderGuide, { provider: fieldValues.EMAIL_PROVIDER || "better_auth_infra" }) : null,
			section.category === "storage" ? /* @__PURE__ */ jsx(StorageProviderGuide, { provider: fieldValues.STORAGE_PROVIDER || "local" }) : null,
			section.category === "storage" ? /* @__PURE__ */ jsx(StorageRuntimeStatusCard, {}) : null,
			section.category === "storage" ? /* @__PURE__ */ jsx(StorageApiReferenceCard, { requestOrigin }) : null,
			/* @__PURE__ */ jsxs(fetcher.Form, {
				method: "post",
				action: "/api/settings/providers",
				className: "space-y-5",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between gap-4",
						children: [
							/* @__PURE__ */ jsxs("h3", {
								className: "text-lg font-semibold capitalize text-white",
								children: [section.category, " controls"]
							}),
							/* @__PURE__ */ jsx("input", {
								type: "hidden",
								name: "category",
								value: section.category
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-center gap-3",
								children: [
									/* @__PURE__ */ jsx("button", {
										type: "submit",
										name: "intent",
										value: "validate",
										disabled: isSubmitting,
										className: "rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/20",
										children: isSubmitting && !isSaving ? "Validating..." : "Validate current values"
									}),
									/* @__PURE__ */ jsx("button", {
										type: "submit",
										name: "intent",
										value: "save",
										disabled: isSubmitting,
										className: "rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20",
										children: isSubmitting && isSaving ? "Saving..." : "Save current values"
									}),
									/* @__PURE__ */ jsx("button", {
										type: "submit",
										name: "intent",
										value: "export-env",
										disabled: isSubmitting,
										className: "rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20",
										children: isSubmitting && isExporting ? "Exporting..." : "Export to .env"
									})
								]
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "grid gap-4 xl:grid-cols-2",
						children: visibleSettings.map((setting) => /* @__PURE__ */ jsx(SettingField, {
							setting,
							value: fieldValues[setting.key] ?? "",
							disabled: isSubmitting,
							error: fieldErrors?.[setting.key],
							onValueChange: (nextValue) => updateFieldValue(setting.key, nextValue)
						}, setting.key))
					}),
					isSubmitting ? /* @__PURE__ */ jsx("div", {
						className: "rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200",
						children: isSaving ? `Saving ${section.category} settings is in progress.` : isExporting ? `Exporting ${section.category} settings to .env is in progress.` : `Validation is in progress for ${section.category}.`
					}) : null
				]
			}),
			fetcher.data ? /* @__PURE__ */ jsxs("div", {
				className: "mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between gap-4",
						children: [/* @__PURE__ */ jsx("h4", {
							className: "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300",
							children: "Operation status"
						}), /* @__PURE__ */ jsx("span", {
							className: fetcher.data.ok ? "rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200" : "rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-rose-200",
							children: fetcher.data.ok ? fetcher.data.exported ? "Exported" : fetcher.data.saved ? "Saved" : "Schema valid" : "Schema errors"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm leading-6 text-slate-300",
						children: fetcher.data.exported ? `The submitted provider settings were saved and exported to ${fetcher.data.envPath ?? ".env.runtime"}.` : fetcher.data.saved ? "The submitted provider settings were saved to the Logicstarter settings store. Env values still take precedence at runtime." : "This is a validation-only response. No provider settings were saved."
					}),
					fetcher.data.ok ? /* @__PURE__ */ jsx("div", {
						className: "mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200",
						children: fetcher.data.exported ? `Saved ${section.category} settings and exported them to ${fetcher.data.envPath ?? ".env.runtime"}. ${submittedFieldCount} fields were submitted.` : fetcher.data.saved ? `Saved ${section.category} settings successfully. ${submittedFieldCount} fields were submitted.` : `Validation passed for ${section.category}. ${submittedFieldCount} fields were submitted successfully.`
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200",
						children: typeof fetcher.data.error === "string" ? fetcher.data.error : formErrors?.join(" ") || "Validation failed. Review the highlighted fields below."
					})
				]
			}) : null
		]
	});
}
function AuthenticationPlatformGuide({ requestOrigin, googleEnabled, githubEnabled }) {
	const googleRedirectUri = `${requestOrigin}/api/auth/callback/google`;
	const githubCallbackUrl = `${requestOrigin}/api/auth/callback/github`;
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "rounded-[24px] border border-sky-400/20 bg-sky-500/10 p-5",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs uppercase tracking-[0.22em] text-sky-200",
						children: "Current site identity"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-3 text-lg font-semibold text-white",
						children: "Runtime origin"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm leading-6 text-slate-200",
						children: "Logicstarter should use the current reverse-proxied domain. Do not register a fixed container port or internal IP in external OAuth platform settings."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-4",
						children: /* @__PURE__ */ jsx(ValueBlock, {
							label: "Current runtime origin",
							value: requestOrigin
						})
					})
				]
			}),
			googleEnabled ? /* @__PURE__ */ jsxs("div", {
				className: "rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-5",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs uppercase tracking-[0.22em] text-emerald-200",
						children: "Google OAuth setup"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-3 text-lg font-semibold text-white",
						children: "Values to paste into Google Cloud"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-100",
						children: [/* @__PURE__ */ jsx(ValueBlock, {
							label: "Authorized JavaScript origins",
							value: requestOrigin
						}), /* @__PURE__ */ jsx(ValueBlock, {
							label: "Authorized redirect URI",
							value: googleRedirectUri
						})]
					})
				]
			}) : null,
			githubEnabled ? /* @__PURE__ */ jsxs("div", {
				className: "rounded-[24px] border border-violet-400/20 bg-violet-500/10 p-5",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs uppercase tracking-[0.22em] text-violet-200",
						children: "GitHub OAuth app"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-3 text-lg font-semibold text-white",
						children: "Values to paste into GitHub"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-100",
						children: [/* @__PURE__ */ jsx(ValueBlock, {
							label: "Homepage URL",
							value: requestOrigin
						}), /* @__PURE__ */ jsx(ValueBlock, {
							label: "Authorization callback URL",
							value: githubCallbackUrl
						})]
					})
				]
			}) : null
		]
	});
}
function BillingPlatformGuide({ requestOrigin }) {
	const stripeWebhookUrl = `${requestOrigin}/api/billing/webhook`;
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 space-y-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-5",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs uppercase tracking-[0.22em] text-amber-200",
					children: "Stripe runtime"
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "mt-3 text-lg font-semibold text-white",
					children: "How these keys are used"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm leading-6 text-slate-200",
					children: "The Stripe secret key and webhook secret are server-only values. Save them here, then apply them through deployment bindings/secrets on Worker targets or export them into the Node runtime env before validating billing flows."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-4",
					children: /* @__PURE__ */ jsx(ValueBlock, {
						label: "Current runtime origin",
						value: requestOrigin
					})
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-5",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs uppercase tracking-[0.22em] text-emerald-200",
					children: "Stripe Dashboard setup"
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "mt-3 text-lg font-semibold text-white",
					children: "Values to configure in Stripe"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-100",
					children: [
						/* @__PURE__ */ jsx(ValueBlock, {
							label: "Webhook endpoint URL",
							value: stripeWebhookUrl
						}),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium text-white",
							children: "Webhook events"
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 leading-6",
							children: [
								/* @__PURE__ */ jsx("div", { children: "`checkout.session.completed`" }),
								/* @__PURE__ */ jsx("div", { children: "`customer.subscription.created`" }),
								/* @__PURE__ */ jsx("div", { children: "`customer.subscription.updated`" }),
								/* @__PURE__ */ jsx("div", { children: "`customer.subscription.deleted`" })
							]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium text-white",
							children: "Publishable key"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 leading-6 text-slate-200",
							children: "Safe for client-side checkout/bootstrap usage."
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "font-medium text-white",
							children: "Secret key + webhook secret"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 leading-6 text-slate-200",
							children: "Keep server-side only. After updating them, apply them through deployment bindings/secrets or the Node runtime env before restarting the active Logicstarter runtime."
						})] })
					]
				})
			]
		})]
	});
}
function SmsProviderGuide({ provider }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.22em] text-cyan-200",
				children: "Provider-specific settings"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: provider === "vonage" ? "Vonage configuration" : provider === "amazon_sns" ? "Amazon SNS configuration" : "SMS provider configuration"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm leading-6 text-slate-200",
				children: provider === "vonage" ? "Only Vonage fields are shown below. Fill the API key, API secret, and sender name for the selected relay." : provider === "amazon_sns" ? "Only Amazon SNS fields are shown below. Fill the region, AWS credentials, and sender ID for the selected relay." : provider === "console" ? "Console mode does not require external credentials, so no relay-specific fields are shown." : "Better Auth Infra mode does not require extra SMS relay credentials here."
			})
		]
	});
}
function EmailProviderGuide({ provider }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-6 rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-500/10 p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-[0.22em] text-fuchsia-200",
				children: "Provider-specific settings"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-3 text-lg font-semibold text-white",
				children: provider === "resend" ? "Resend configuration" : provider === "smtp" ? "SMTP configuration" : provider === "ses" ? "Amazon SES configuration" : "Email provider configuration"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm leading-6 text-slate-200",
				children: provider === "resend" ? "Only Resend fields are shown below. Provide the API key and sender identity for the selected email provider." : provider === "smtp" ? "Only SMTP fields are shown below. Provide host, port, username, password, and sender identity." : provider === "ses" ? "Only Amazon SES fields are shown below. Provide the region, AWS credentials, and sender identity." : "Better Auth Infra mode does not require extra email relay credentials here."
			})
		]
	});
}
function StatusPill({ label, value, tone }) {
	return /* @__PURE__ */ jsxs("div", {
		className: tone === "sky" ? "rounded-[20px] border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-center" : tone === "emerald" ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center" : "rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-center",
		children: [/* @__PURE__ */ jsx("div", {
			className: tone === "sky" ? "text-[11px] uppercase tracking-[0.22em] text-sky-200" : tone === "emerald" ? "text-[11px] uppercase tracking-[0.22em] text-emerald-200" : "text-[11px] uppercase tracking-[0.22em] text-slate-300",
			children: label
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-2 text-2xl font-semibold tracking-[-0.05em] text-white",
			children: value
		})]
	});
}
//#endregion
//#region app/routes/uploads.$.tsx
var uploads_$_exports = /* @__PURE__ */ __exportAll({ loader: () => loader });
async function loader({ params }) {
	const wildcard = typeof params["*"] === "string" ? params["*"] : "";
	if (!wildcard) throw new Response("Not found", { status: 404 });
	if (getLogicstarterStorageRuntimeSnapshot().provider !== "local") throw new Response("Not found", { status: 404 });
	let absolutePath;
	try {
		absolutePath = resolveLogicstarterLocalStoragePath(wildcard);
	} catch {
		throw new Response("Not found", { status: 404 });
	}
	try {
		await access(absolutePath, constants.R_OK);
	} catch {
		throw new Response("Not found", { status: 404 });
	}
	const body = await readFile(absolutePath);
	return new Response(new Uint8Array(body), { headers: {
		"Content-Type": getLogicstarterStorageContentType(absolutePath),
		"Cache-Control": "public, max-age=3600"
	} });
}
//#endregion
//#region \0virtual:react-router/server-manifest
var server_manifest_default = {
	"entry": {
		"module": "/assets/entry.client-DALdhYZd.js",
		"imports": ["/assets/jsx-runtime-DaBBt3-w.js", "/assets/react-dom-BlJRwwqJ.js"],
		"css": []
	},
	"routes": {
		"root": {
			"id": "root",
			"parentId": void 0,
			"path": "",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/root-oed1UiGF.js",
			"imports": ["/assets/jsx-runtime-DaBBt3-w.js", "/assets/react-dom-BlJRwwqJ.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/_index": {
			"id": "routes/_index",
			"parentId": "root",
			"path": void 0,
			"index": true,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/_index-BUpaZDaO.js",
			"imports": [
				"/assets/jsx-runtime-DaBBt3-w.js",
				"/assets/label-CEgq5aRu.js",
				"/assets/react-dom-BlJRwwqJ.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.auth.runtime": {
			"id": "routes/api.auth.runtime",
			"parentId": "root",
			"path": "api/auth/runtime",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.auth.runtime-BfOOKcE3.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.billing.checkout": {
			"id": "routes/api.billing.checkout",
			"parentId": "root",
			"path": "api/billing/checkout",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.billing.checkout-C5ao-g-t.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.billing.portal": {
			"id": "routes/api.billing.portal",
			"parentId": "root",
			"path": "api/billing/portal",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.billing.portal-RjIBM6cN.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.billing.runtime": {
			"id": "routes/api.billing.runtime",
			"parentId": "root",
			"path": "api/billing/runtime",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.billing.runtime-viYHx8BM.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.billing.state": {
			"id": "routes/api.billing.state",
			"parentId": "root",
			"path": "api/billing/state",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.billing.state-6s9-fCcE.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.billing.sync": {
			"id": "routes/api.billing.sync",
			"parentId": "root",
			"path": "api/billing/sync",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.billing.sync-ZyU7Ye50.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.billing.webhook": {
			"id": "routes/api.billing.webhook",
			"parentId": "root",
			"path": "api/billing/webhook",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.billing.webhook-oIn4HAvv.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.check-email": {
			"id": "routes/api.check-email",
			"parentId": "root",
			"path": "api/check-email",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.check-email-DHVsiZmi.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.email.runtime": {
			"id": "routes/api.email.runtime",
			"parentId": "root",
			"path": "api/email/runtime",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.email.runtime-WmgCQFwk.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.providers.runtime": {
			"id": "routes/api.providers.runtime",
			"parentId": "root",
			"path": "api/providers/runtime",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.providers.runtime-C7pD2dwt.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.register": {
			"id": "routes/api.register",
			"parentId": "root",
			"path": "api/register",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.register-B7d47sIV.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.auth.methods": {
			"id": "routes/api.auth.methods",
			"parentId": "root",
			"path": "api/auth/methods",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.auth.methods-Be2KbrNh.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.sms.runtime": {
			"id": "routes/api.sms.runtime",
			"parentId": "root",
			"path": "api/sms/runtime",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.sms.runtime-CGH_gj4S.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.auth.$": {
			"id": "routes/api.auth.$",
			"parentId": "root",
			"path": "api/auth/*",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.auth._-DtFYnWEi.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.storage.delete": {
			"id": "routes/api.storage.delete",
			"parentId": "root",
			"path": "api/storage/delete",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.storage.delete-BygU3Ik8.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.storage.runtime": {
			"id": "routes/api.storage.runtime",
			"parentId": "root",
			"path": "api/storage/runtime",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.storage.runtime-Df31ZJKG.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.storage.signed-url": {
			"id": "routes/api.storage.signed-url",
			"parentId": "root",
			"path": "api/storage/signed-url",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.storage.signed-url-BLnFlaqu.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.storage.upload": {
			"id": "routes/api.storage.upload",
			"parentId": "root",
			"path": "api/storage/upload",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.storage.upload-1zpVc164.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/api.settings.providers": {
			"id": "routes/api.settings.providers",
			"parentId": "root",
			"path": "api/settings/providers",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": true,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/api.settings.providers-CoehA-V3.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/settings.providers": {
			"id": "routes/settings.providers",
			"parentId": "root",
			"path": "settings/providers",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/settings.providers-gyMgS9xm.js",
			"imports": [
				"/assets/jsx-runtime-DaBBt3-w.js",
				"/assets/label-CEgq5aRu.js",
				"/assets/react-dom-BlJRwwqJ.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/uploads.$": {
			"id": "routes/uploads.$",
			"parentId": "root",
			"path": "uploads/*",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": true,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": false,
			"hasErrorBoundary": false,
			"module": "/assets/uploads._-COvZkj0c.js",
			"imports": [],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		}
	},
	"url": "/assets/manifest-2b0b9d87.js",
	"version": "2b0b9d87",
	"sri": void 0
};
//#endregion
//#region \0virtual:react-router/server-build
var assetsBuildDirectory = "build/client";
var basename = "/";
var future = {
	"unstable_optimizeDeps": false,
	"unstable_subResourceIntegrity": false,
	"unstable_trailingSlashAwareDataRequests": false,
	"unstable_previewServerPrerendering": false,
	"v8_middleware": false,
	"v8_splitRouteModules": false,
	"v8_viteEnvironmentApi": false
};
var ssr = true;
var isSpaMode = false;
var prerender = [];
var routeDiscovery = {
	"mode": "lazy",
	"manifestPath": "/__manifest"
};
var publicPath = "/";
var entry = { module: entry_server_exports };
var routes = {
	"root": {
		id: "root",
		parentId: void 0,
		path: "",
		index: void 0,
		caseSensitive: void 0,
		module: root_exports
	},
	"routes/_index": {
		id: "routes/_index",
		parentId: "root",
		path: void 0,
		index: true,
		caseSensitive: void 0,
		module: _index_exports
	},
	"routes/api.auth.runtime": {
		id: "routes/api.auth.runtime",
		parentId: "root",
		path: "api/auth/runtime",
		index: void 0,
		caseSensitive: void 0,
		module: api_auth_runtime_exports
	},
	"routes/api.billing.checkout": {
		id: "routes/api.billing.checkout",
		parentId: "root",
		path: "api/billing/checkout",
		index: void 0,
		caseSensitive: void 0,
		module: api_billing_checkout_exports
	},
	"routes/api.billing.portal": {
		id: "routes/api.billing.portal",
		parentId: "root",
		path: "api/billing/portal",
		index: void 0,
		caseSensitive: void 0,
		module: api_billing_portal_exports
	},
	"routes/api.billing.runtime": {
		id: "routes/api.billing.runtime",
		parentId: "root",
		path: "api/billing/runtime",
		index: void 0,
		caseSensitive: void 0,
		module: api_billing_runtime_exports
	},
	"routes/api.billing.state": {
		id: "routes/api.billing.state",
		parentId: "root",
		path: "api/billing/state",
		index: void 0,
		caseSensitive: void 0,
		module: api_billing_state_exports
	},
	"routes/api.billing.sync": {
		id: "routes/api.billing.sync",
		parentId: "root",
		path: "api/billing/sync",
		index: void 0,
		caseSensitive: void 0,
		module: api_billing_sync_exports
	},
	"routes/api.billing.webhook": {
		id: "routes/api.billing.webhook",
		parentId: "root",
		path: "api/billing/webhook",
		index: void 0,
		caseSensitive: void 0,
		module: api_billing_webhook_exports
	},
	"routes/api.check-email": {
		id: "routes/api.check-email",
		parentId: "root",
		path: "api/check-email",
		index: void 0,
		caseSensitive: void 0,
		module: api_check_email_exports
	},
	"routes/api.email.runtime": {
		id: "routes/api.email.runtime",
		parentId: "root",
		path: "api/email/runtime",
		index: void 0,
		caseSensitive: void 0,
		module: api_email_runtime_exports
	},
	"routes/api.providers.runtime": {
		id: "routes/api.providers.runtime",
		parentId: "root",
		path: "api/providers/runtime",
		index: void 0,
		caseSensitive: void 0,
		module: api_providers_runtime_exports
	},
	"routes/api.register": {
		id: "routes/api.register",
		parentId: "root",
		path: "api/register",
		index: void 0,
		caseSensitive: void 0,
		module: api_register_exports
	},
	"routes/api.auth.methods": {
		id: "routes/api.auth.methods",
		parentId: "root",
		path: "api/auth/methods",
		index: void 0,
		caseSensitive: void 0,
		module: api_auth_methods_exports
	},
	"routes/api.sms.runtime": {
		id: "routes/api.sms.runtime",
		parentId: "root",
		path: "api/sms/runtime",
		index: void 0,
		caseSensitive: void 0,
		module: api_sms_runtime_exports
	},
	"routes/api.auth.$": {
		id: "routes/api.auth.$",
		parentId: "root",
		path: "api/auth/*",
		index: void 0,
		caseSensitive: void 0,
		module: api_auth_$_exports
	},
	"routes/api.storage.delete": {
		id: "routes/api.storage.delete",
		parentId: "root",
		path: "api/storage/delete",
		index: void 0,
		caseSensitive: void 0,
		module: api_storage_delete_exports
	},
	"routes/api.storage.runtime": {
		id: "routes/api.storage.runtime",
		parentId: "root",
		path: "api/storage/runtime",
		index: void 0,
		caseSensitive: void 0,
		module: api_storage_runtime_exports
	},
	"routes/api.storage.signed-url": {
		id: "routes/api.storage.signed-url",
		parentId: "root",
		path: "api/storage/signed-url",
		index: void 0,
		caseSensitive: void 0,
		module: api_storage_signed_url_exports
	},
	"routes/api.storage.upload": {
		id: "routes/api.storage.upload",
		parentId: "root",
		path: "api/storage/upload",
		index: void 0,
		caseSensitive: void 0,
		module: api_storage_upload_exports
	},
	"routes/api.settings.providers": {
		id: "routes/api.settings.providers",
		parentId: "root",
		path: "api/settings/providers",
		index: void 0,
		caseSensitive: void 0,
		module: api_settings_providers_exports
	},
	"routes/settings.providers": {
		id: "routes/settings.providers",
		parentId: "root",
		path: "settings/providers",
		index: void 0,
		caseSensitive: void 0,
		module: settings_providers_exports
	},
	"routes/uploads.$": {
		id: "routes/uploads.$",
		parentId: "root",
		path: "uploads/*",
		index: void 0,
		caseSensitive: void 0,
		module: uploads_$_exports
	}
};
var allowedActionOrigins = false;
//#endregion
export { allowedActionOrigins, server_manifest_default as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
