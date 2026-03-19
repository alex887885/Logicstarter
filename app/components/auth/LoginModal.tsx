import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { signIn } from "~/lib/auth.client";
import type { LogicstarterAuthMethodDefinition } from "~/lib/logicstarter/auth-methods";

type View = "login" | "password" | "register";

type ExistingUserInfo = {
  name?: string | null;
  hasSocialAccount?: boolean;
  linkedProviders?: string[];
  emailVerified?: boolean;
  bootstrapAdminSetup?: boolean;
  hasPassword?: boolean;
};

const SOCIAL_LABELS: Partial<Record<LogicstarterAuthMethodDefinition["key"], string>> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginModal({
  open,
  onClose,
  loginMethods,
}: {
  open: boolean;
  onClose: () => void;
  loginMethods: LogicstarterAuthMethodDefinition[];
}) {
  const backdropDown = useRef(false);
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState<string | null>(null);
  const [existingUserInfo, setExistingUserInfo] = useState<ExistingUserInfo>({});

  const enabledSocialMethods = useMemo(
    () => loginMethods.filter((method) => method.kind === "social"),
    [loginMethods],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  });

  if (!open) {
    return null;
  }

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

  const openPasswordStep = async (nextEmail: string) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Email check failed");
      }
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
        hasPassword: Boolean(data.hasPassword),
      });
      if (data.hasPassword) {
        setView("password");
        return;
      }
      setView("register");
      setNotice(
        data.hasSocialAccount
          ? "This email is already linked to a social account. Complete password setup to use email sign-in too."
          : "This email exists but does not have a password yet. Finish password setup below.",
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to verify email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "github") => {
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
          Accept: "application/json",
        },
        body: JSON.stringify({
          provider,
          callbackURL: callbackUrl.toString(),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data && typeof data === "object" && "message" in data && typeof data.message === "string" ? data.message : null) ?? `${provider} sign-in failed.`);
      }
      const redirectUrl = data && typeof data === "object" && "url" in data && typeof data.url === "string"
        ? data.url
        : null;
      if (!redirectUrl) {
        throw new Error("Social sign-in did not return a redirect URL.");
      }
      window.location.href = redirectUrl;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : `${provider} sign-in failed.`);
      setLoadingSocial(null);
    }
  };

  const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
      });
      if (result.error) {
        throw new Error(result.error.message || "Invalid email or password.");
      }
      close();
      window.location.reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
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
          name: email.trim().split("@")[0] || "user",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to complete registration.");
      }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onMouseDown={() => {
          backdropDown.current = true;
        }}
        onMouseUp={() => {
          if (backdropDown.current) {
            close();
          }
          backdropDown.current = false;
        }}
      />
      <div className="relative z-10 w-full max-w-xl rounded-[28px] border border-white/10 bg-[rgba(8,15,30,0.96)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">Logicstarter access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {view === "login" ? "Sign in" : view === "password" ? "Enter your password" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {view === "login"
                ? "Use email and password or continue with any enabled social provider."
                : view === "password"
                  ? "Continue with your email and password."
                  : existingUserInfo.bootstrapAdminSetup
                    ? "This fresh installation will initialize the first administrator account."
                    : "Create password access for this email address."}
            </p>
          </div>
          <button type="button" onClick={close} className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {view !== "login" ? (
          <button type="button" onClick={() => { setError(""); setNotice(""); setView("login"); }} className="mt-5 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : null}

        {view === "login" ? (
          <div className="mt-6 space-y-5">
            {enabledSocialMethods.length ? (
              <div className="space-y-3">
                {enabledSocialMethods.map((method) => (
                  <Button
                    key={method.key}
                    type="button"
                    variant="outline"
                    className="h-12 w-full justify-center bg-white/5 text-slate-100 hover:bg-white/10"
                    onClick={() => handleSocial(method.key as "google" | "github")}
                    disabled={loading || loadingSocial !== null}
                  >
                    {loadingSocial === method.key ? <Loader2 className="h-4 w-4 animate-spin" /> : method.key === "google" ? <GoogleIcon className="h-4 w-4" /> : null}
                    {SOCIAL_LABELS[method.key] ?? `Continue with ${method.label}`}
                  </Button>
                ))}
                <p className="px-1 text-center text-xs leading-6 text-slate-400">
                  Social sign-in will return you to this page and keep your Logicstarter session active.
                </p>
              </div>
            ) : null}

            {enabledSocialMethods.length ? (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.24em]">
                  <span className="bg-[rgba(8,15,30,0.96)] px-3 text-slate-500">or</span>
                </div>
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void openPasswordStep(email.trim()); }}>
              <div className="space-y-2">
                <Label htmlFor="login-modal-email">Email</Label>
                <Input id="login-modal-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading || !email.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continue with email
              </Button>
            </form>
          </div>
        ) : null}

        {view === "password" ? (
          <form className="mt-6 space-y-4" onSubmit={handlePasswordSignIn}>
            <div className="space-y-2">
              <Label htmlFor="login-modal-email-password">Email</Label>
              <Input id="login-modal-email-password" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-modal-password">Password</Label>
              <Input id="login-modal-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading || !email.trim() || !password}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>
        ) : null}

        {view === "register" ? (
          <form className="mt-6 space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="register-modal-email">Email</Label>
              <Input id="register-modal-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-modal-password">Password</Label>
              <Input id="register-modal-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-modal-confirm-password">Confirm password</Label>
              <Input id="register-modal-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading || !email.trim() || !password || !confirmPassword}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {existingUserInfo.bootstrapAdminSetup ? "Create administrator" : "Create account"}
            </Button>
          </form>
        ) : null}

        {notice ? <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
      </div>
    </div>
  );
}
