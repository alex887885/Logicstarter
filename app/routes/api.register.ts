import type { ActionFunctionArgs } from "react-router";
import { isAPIError } from "better-auth/api";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { getLogicstarterFirstLoginState } from "~/lib/logicstarter/first-login.server";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email, password, confirmPassword, name } = await request.json() as {
      email?: string;
      password?: string;
      confirmPassword?: string;
      name?: string;
    };

    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedName = String(name ?? "").trim();
    const normalizedPassword = String(password ?? "");
    const normalizedConfirmPassword = String(confirmPassword ?? "");
    const { bootstrapAdminSetup } = await getLogicstarterFirstLoginState();

    if (!normalizedEmail || !normalizedPassword) {
      return Response.json({ error: bootstrapAdminSetup ? "Admin email and password are required" : "Email, password, and name are required" }, { status: 400 });
    }

    if (!isValidEmail(normalizedEmail)) {
      return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (normalizedPassword.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (bootstrapAdminSetup) {
      if (!normalizedConfirmPassword) {
        return Response.json({ error: "Please confirm the admin password" }, { status: 400 });
      }
      if (normalizedPassword !== normalizedConfirmPassword) {
        return Response.json({ error: "Passwords do not match" }, { status: 400 });
      }
    }

    if (!bootstrapAdminSetup && !normalizedName) {
      return Response.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

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
        callbackURL: callbackUrl.toString(),
      },
    });

    const responseHeaders = new Headers();
    const setCookieHeaders = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [];

    for (const value of setCookieHeaders) {
      responseHeaders.append("set-cookie", value);
    }

    const singleCookieHeader = headers.get("set-cookie");
    if (singleCookieHeader && setCookieHeaders.length === 0) {
      responseHeaders.append("set-cookie", singleCookieHeader);
    }

    return Response.json({
      success: true,
      bootstrapAdminSetup,
      requireVerification: true,
      message: bootstrapAdminSetup
        ? "Administrator account created with Better Auth. Please verify the email before first password sign-in."
        : "Registration successful. Please check your email to verify your account.",
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
