import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useRouteLoaderData } from "react-router";
import { ArrowRight, BookOpen, ChevronDown, Github, LogOut, Menu, Settings, Shield, Sparkles, Upload, Wallet } from "lucide-react";
import { LoginModal } from "~/components/auth/LoginModal";
import { Button } from "~/components/ui/button";
import { getSession, signOut } from "~/lib/auth-client";
import { listEnabledLogicstarterAuthMethods } from "~/lib/logicstarter/auth-methods.server";
import { getLogicstarterStorageRuntimeSnapshot } from "~/lib/logicstarter/storage.server";
import {
  logicstarterStorageMaxUploadBytes,
  logicstarterStorageUploadAccept,
  logicstarterStorageUploadPolicyLabel,
} from "~/lib/logicstarter/storage-upload-policy";

export async function loader(_: LoaderFunctionArgs) {
  return {
    authMethods: listEnabledLogicstarterAuthMethods(),
    storageRuntime: getLogicstarterStorageRuntimeSnapshot(),
  };
}

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
  accent?: "green" | "default";
};

const navigationItems: NavigationItem[] = [
  { label: "Docs", href: "https://starter.logicm8.com/docs/introduction", external: true, icon: BookOpen, accent: "green" },
  { label: "Provider Console", href: "/settings/providers", icon: Shield },
  { label: "GitHub", href: "https://github.com/alex887885/Logicstarter", external: true, icon: Github },
  { label: "Billing", href: "/settings/providers?category=billing", icon: Wallet },
  { label: "Login", href: "#login", icon: Sparkles },
];

const coreItems = [
  "Auth · identity · provider runtime",
  "Operator settings · validation · export",
  "Billing checkout · portal · webhook · sync",
  "Storage runtime · upload · public URL",
  "Email · SMS delivery abstractions",
  "Node and Cloudflare deployment model",
  "Runtime snapshots for operators",
  "PostgreSQL-backed persistence",
  "Release-candidate migration path",
] as const;

const operatorLinks = [
  {
    label: "Provider settings",
    href: "/settings/providers",
    description: "Review, validate, save, and export runtime provider configuration.",
  },
  {
    label: "Focused authentication settings",
    href: "/settings/providers?category=authentication",
    description: "Jump straight into Google and GitHub login configuration before testing sign-in.",
  },
  {
    label: "Focused SMS settings",
    href: "/settings/providers?category=sms",
    description: "Inspect DB-backed SMS provider state and export it into the runtime .env file.",
  },
] as const;

const capabilityGroups = [
  {
    eyebrow: "Authentication suite",
    title: "Authentication already lands on a serious starter core.",
    description: "Better Auth, email onboarding, and social providers are already shaped into the foundational runtime.",
    items: ["Better Auth", "Google", "GitHub"],
  },
  {
    eyebrow: "Communication runtime",
    title: "Email and SMS delivery stay centralized in the starter runtime.",
    description: "Resend, SES, Vonage, Amazon SNS, and console fallback stay configurable without rebuilding delivery layers.",
    items: ["Resend", "Amazon SES", "Vonage"],
  },
  {
    eyebrow: "Commercial rollout",
    title: "Worker-safe billing is already wired into the service layer.",
    description: "Checkout, webhook, portal, state, and repair are present so products can reuse billing infrastructure instead of rebuilding it.",
    items: ["Stripe", "Storage runtime"],
  },
  {
    eyebrow: "Operator flow",
    title: "Settings validate, save to DB, read back, and export into runtime env.",
    description: "This gives Logicstarter a real control-plane direction rather than a static starter shell.",
    items: ["Provider settings", "Validation", "Runtime export"],
  },
] as const;

const stackItems = [
  { label: "React Router 7", short: "RR" },
  { label: "TypeScript", short: "TS" },
  { label: "Tailwind CSS", short: "TW" },
  { label: "shadcn/ui patterns", short: "UI" },
  { label: "Better Auth", short: "BA" },
  { label: "Drizzle ORM", short: "DR" },
  { label: "PostgreSQL", short: "PG" },
  { label: "Stripe", short: "ST" },
  { label: "Resend", short: "RS" },
  { label: "Amazon SES", short: "SES" },
  { label: "Vonage", short: "VN" },
  { label: "R2 / S3", short: "S3" },
] as const;

function getUserInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  if (!source) {
    return "U";
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function UserMenu({
  name,
  email,
  onSignOut,
}: {
  name: string;
  email: string;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = useMemo(() => getUserInitials(name, email), [email, name]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-2 py-1.5 text-left transition-colors hover:border-white/20 hover:bg-white/10"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-fuchsia-500 to-cyan-400 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20">
          {initials}
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold text-white">{name || email}</p>
          <p className="truncate text-xs text-slate-400">Account</p>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-[20px] border border-white/12 bg-slate-950/95 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{name || email}</p>
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>
          <div className="py-2">
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </Link>
          </div>
          <div className="border-t border-white/10 py-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LogoBadge({ label }: { label: string }) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);

  return (
    <div className="group rounded-[28px] border border-white/10 bg-white/3 p-4 transition-transform duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.14] to-white/4 text-xs font-semibold text-white">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-500">Capability</p>
        </div>
      </div>
    </div>
  );
}

type AuthMethod = ReturnType<typeof listEnabledLogicstarterAuthMethods>[number];
type HomeSessionUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
} | null;
type HomeSession = {
  user?: HomeSessionUser;
} | null;

type UploadResult = {
  key: string;
  url: string | null;
  contentType: string | null;
  size: number;
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const rootData = useRouteLoaderData("root") as {
    session: HomeSession;
  } | undefined;
  const [clientSession, setClientSession] = useState<HomeSession | undefined>(undefined);
  const fallbackSession: HomeSession = rootData?.session ?? null;
  const authReturnRef = useRef(typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("authReturn") : null);
  const storageFileInputRef = useRef<HTMLInputElement | null>(null);
  const effectiveSession = clientSession === undefined ? fallbackSession : clientSession ?? null;
  const effectiveSessionUser = effectiveSession?.user ?? null;
  const sessionDisplayName = effectiveSessionUser?.name?.trim() || effectiveSessionUser?.email?.trim() || "user";
  const sessionEmail = effectiveSessionUser?.email?.trim() || "";
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const result = await getSession();
        const nextSession = (result && typeof result === "object" && "data" in result ? result.data : result) as typeof fallbackSession;
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
        if (active) {
          setClientSession(fallbackSession);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [fallbackSession]);

  const sessionLabel = effectiveSessionUser
    ? `Signed in as ${effectiveSessionUser.name || effectiveSessionUser.email || "user"}`
    : "No active session yet.";

  const accentColor = "#10b981";
  const accentBadgeStyle = { borderColor: `${accentColor}33`, background: `${accentColor}1f`, color: "hsl(210 20% 96%)" };
  const accentPanelStyle = { borderColor: `${accentColor}33`, background: `linear-gradient(180deg, ${accentColor}1f, rgba(255,255,255,0.03))` };
  const accentTextStyle = { color: accentColor };

  function renderNavigationItem(item: NavigationItem, mobile = false) {
    const Icon = item.icon;
    const className = mobile
      ? item.accent === "green"
        ? "flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
        : "flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
      : item.accent === "green"
        ? "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
        : "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/6 hover:text-white";

    const content = (
      <>
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </>
    );

    return item.external ? (
      <a key={item.label} href={item.href} className={className} style={item.accent === "green" ? { background: `linear-gradient(90deg, ${accentColor}, rgba(255,255,255,0.82))`, boxShadow: `0 12px 32px ${accentColor}38` } : undefined}>
        {content}
      </a>
    ) : (
      <Link key={item.label} to={item.href} className={className} style={item.accent === "green" ? { background: `linear-gradient(90deg, ${accentColor}, rgba(255,255,255,0.82))`, boxShadow: `0 12px 32px ${accentColor}38` } : undefined}>
        {content}
      </Link>
    );
  }

  const handleStorageDelete = async () => {
    if (!uploadResult?.key) {
      return;
    }

    setUploadPending(true);
    setUploadError("");

    try {
      const response = await fetch("/api/storage/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: uploadResult.key }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Storage delete failed.");
      }
      setUploadResult(null);
      if (storageFileInputRef.current) {
        storageFileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Storage delete failed.");
    } finally {
      setUploadPending(false);
    }
  };

  const handleStorageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadPending(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("prefix", "homepage");

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json() as {
        ok?: boolean;
        error?: string;
        key?: string;
        url?: string | null;
        contentType?: string | null;
        size?: number;
      };

      if (!response.ok || !payload.ok || typeof payload.key !== "string") {
        throw new Error(payload.error || "Storage upload failed.");
      }

      setUploadResult({
        key: payload.key,
        url: typeof payload.url === "string" ? payload.url : null,
        contentType: typeof payload.contentType === "string" ? payload.contentType : null,
        size: typeof payload.size === "number" ? payload.size : file.size,
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Storage upload failed.");
    } finally {
      setUploadPending(false);
      if (storageFileInputRef.current) {
        storageFileInputRef.current.value = "";
      }
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070311] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(132,56,255,0.22),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(65,196,255,0.12),transparent_22%),linear-gradient(180deg,#070311_0%,#090414_45%,#060812_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.06),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <header className="pointer-events-none absolute inset-x-4 top-5 z-30 sm:inset-x-6 lg:inset-x-10 lg:top-8">
          <div className="pointer-events-auto mx-auto max-w-5xl rounded-full border border-white/10 bg-white/8 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm font-semibold text-white">LS</div>
                <div>
                  <p className="text-base font-semibold text-white">LogicStarter</p>
                  <p className="text-xs text-slate-400">Starter baseline with runtime control plane</p>
                </div>
              </div>

              <nav className="hidden items-center gap-2 lg:flex">
                {navigationItems.filter((item) => item.label !== "Login").map((item) => renderNavigationItem(item))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                {effectiveSessionUser ? (
                  <UserMenu name={sessionDisplayName} email={sessionEmail} onSignOut={handleSignOut} />
                ) : (
                  <Button variant="ghost" type="button" id="login" onClick={() => setLoginOpen(true)}>
                    Login
                  </Button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {mobileMenuOpen ? (
              <div className="mt-3 space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4 lg:hidden">
                <div className="flex flex-col gap-2">
                  {navigationItems.map((item) => renderNavigationItem(item, true))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {!effectiveSessionUser ? (
                    <Button variant="ghost" type="button" onClick={() => setLoginOpen(true)}>
                      Login
                    </Button>
                  ) : (
                    <Button variant="ghost" type="button" onClick={() => void handleSignOut()} disabled={signingOut}>
                      {signingOut ? "Signing out..." : "Sign out"}
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <section className="pt-20 lg:pt-28">
          <div
            className="marketing-orb-hero relative overflow-hidden rounded-[42px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,10,30,0.94),rgba(8,7,18,0.96))] shadow-[0_40px_140px_rgba(0,0,0,0.55)]"
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}
          >
            <div className={`pointer-events-none absolute -left-[12%] top-[10%] h-[480px] w-[480px] rounded-full border transition-all duration-500 ${heroHovered ? "scale-110 opacity-95" : "scale-100 opacity-70"}`} style={{ borderColor: `${accentColor}66` }} />
            <div className={`pointer-events-none absolute right-[-8%] top-[-18%] h-[560px] w-[560px] rounded-full border transition-all duration-500 ${heroHovered ? "scale-[1.06] opacity-100" : "scale-100 opacity-80"}`} style={{ borderColor: `${accentColor}4d` }} />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_46%,transparent_0%,rgba(10,5,18,0.08)_28%,rgba(7,3,17,0.82)_76%)]" />
            <div className="relative z-20 flex min-h-[640px] flex-col justify-center px-6 py-16 md:px-10 lg:px-16 lg:py-18">
              <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
                <div className="max-w-3xl">
                  <div className="rb-fade-up rb-delay-1 inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em]" style={accentBadgeStyle}>
                    Logicstarter release candidate
                  </div>
                  <h1 className="rb-fade-up rb-delay-3 mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.08em] text-white md:text-7xl lg:text-[6rem] lg:leading-[0.94]">
                    Next-generation SaaS starter baseline.
                  </h1>
                  <p className="rb-fade-up rb-delay-4 mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl md:leading-9">
                    Match the original starter homepage first, then evolve details on top of a cleaner foundation with provider runtime, Worker-safe billing, and operator-ready settings.
                  </p>

                  <div className="rb-fade-up rb-delay-5 mt-10 flex flex-wrap items-center justify-center gap-4">
                    <Button size="lg" asChild>
                      <Link to="/settings/providers">
                        Provider Console
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="secondary" asChild>
                      <Link to="/settings/providers?category=billing">
                        Billing Runtime
                        <Wallet className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="ghost" type="button" onClick={() => setLoginOpen(true)}>
                      <Sparkles className="h-4 w-4" />
                      Login
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                <a href="#features" className="rb-fade-up rb-delay-5 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
                  Scroll to explore
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 lg:grid-cols-2">
          {capabilityGroups.map((group, index) => (
            <div key={group.title} className="flex h-full flex-col rounded-[34px] border border-white/10 bg-white/3 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur-sm">
              <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.22em] text-violet-200/85">
                {group.eyebrow}
              </div>
              <div className="space-y-3 min-h-[148px]">
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">{group.title}</h2>
                <p className="text-sm leading-7 text-slate-300">{group.description}</p>
              </div>
              <div className={`mt-7 grid flex-1 content-start gap-3 ${index === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {group.items.map((item) => (
                  <LogoBadge key={item} label={item} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="stack" className="rounded-[34px] border border-white/10 bg-white/3 px-6 py-8 backdrop-blur-sm sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-white">Technical stack</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Modern stack.</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-300">Current tools. Real integrations. Production-minded defaults.</p>
            </div>
            <div className="text-sm text-slate-500">React + Router + Auth + Runtime + Billing + Delivery</div>
          </div>
          <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-black/20 py-4">
            <div className="flex min-w-max animate-[marquee_26s_linear_infinite] gap-3 px-4">
              {[...stackItems, ...stackItems].map((item, index) => (
                <span key={`${item.label}-${index}`} className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/6 text-[11px] font-semibold text-slate-200">
                    {item.short}
                  </span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid auto-rows-fr gap-6 lg:grid-cols-2">
          <div className="rounded-[34px] border border-white/10 bg-white/3 p-8 backdrop-blur-sm">
            <div className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-white">Core</div>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white">The most stable infrastructure should already exist before product work starts.</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">Reusable core first. Product details later. That is the baseline we are restoring from starter.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {coreItems.map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-full flex-col gap-6">
            <div className="rounded-[34px] border p-8 backdrop-blur-sm" style={accentPanelStyle}>
              <p className="text-xs uppercase tracking-[0.24em]" style={accentTextStyle}>Commercial rollout</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Billing, auth, and provider settings are already shaped into the starter runtime.</h2>
              <p className="mt-4 text-base leading-8 text-slate-200">Use this homepage as the parity baseline, then refine product details on top of Logicstarter instead of rebuilding the shell.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/settings/providers?category=billing">
                    Billing settings
                    <Wallet className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/settings/providers?category=authentication">
                    <Shield className="h-4 w-4" />
                    Auth settings
                  </Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[34px] border border-white/10 bg-white/3 p-8 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Release baseline</p>
              <p className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white">RC</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">Node-first runtime, provider-backed capabilities, Worker-safe billing path, and a starter-style landing page baseline.</p>
              <p className="mt-4 text-sm leading-7 text-slate-400">{sessionLabel}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[34px] border border-violet-400/20 bg-violet-500/10 p-8 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-200">Operator actions</p>
            <div className="mt-5 space-y-4">
              {operatorLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block rounded-[24px] border border-white/10 bg-black/20 p-5 transition hover:border-cyan-400/30 hover:bg-cyan-500/10"
                >
                  <div className="flex items-center gap-2 text-base font-semibold text-white">
                    <Settings className="h-4 w-4 text-slate-400" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-cyan-400/20 bg-cyan-500/10 p-8 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Storage upload</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">Test the storage runtime without leaving the homepage.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-200">Keep the starter landing layout, but preserve a direct runtime sanity check for uploads while this project is still being refined.</p>
            <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
              <div><span className="text-slate-400">Provider:</span> {data.storageRuntime.provider}</div>
              <div className="mt-2 break-all"><span className="text-slate-400">Local path:</span> {data.storageRuntime.localBasePath}</div>
              <div className="mt-2 break-all"><span className="text-slate-400">Public base URL:</span> {data.storageRuntime.publicBaseUrl || "/uploads"}</div>
              <div className="mt-2 break-all"><span className="text-slate-400">Upload policy:</span> {logicstarterStorageUploadPolicyLabel}</div>
              <div className="mt-2 break-all"><span className="text-slate-400">Max upload bytes:</span> {logicstarterStorageMaxUploadBytes}</div>
              <div className="mt-2 break-all"><span className="text-slate-400">Accept:</span> {logicstarterStorageUploadAccept}</div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className={`inline-flex cursor-pointer items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${effectiveSessionUser ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20" : "cursor-not-allowed border-white/10 bg-white/5 text-slate-400"}`}>
                <input
                  ref={storageFileInputRef}
                  type="file"
                  className="sr-only"
                  accept={logicstarterStorageUploadAccept}
                  disabled={!effectiveSessionUser || uploadPending}
                  onChange={(event) => void handleStorageUpload(event)}
                />
                <Upload className="h-4 w-4" />
                {uploadPending ? "Uploading..." : "Choose file"}
              </label>
              <span className="text-sm text-slate-300">
                {effectiveSessionUser ? "Uploads use /api/storage/upload with the signed-in Better Auth session." : "Sign in to enable uploads."}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/settings/providers?category=storage" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10">
                Open storage settings
              </Link>
              <a href="/api/storage/runtime" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20">
                Open runtime JSON
              </a>
            </div>
            {uploadError ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {uploadError}
              </div>
            ) : null}
            {uploadResult ? (
              <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                <div><span className="text-slate-400">Key:</span> {uploadResult.key}</div>
                <div className="mt-2"><span className="text-slate-400">Content type:</span> {uploadResult.contentType || "unknown"}</div>
                <div className="mt-2"><span className="text-slate-400">Size:</span> {uploadResult.size} bytes</div>
                {uploadResult.url ? (
                  <div className="mt-2 break-all">
                    <span className="text-slate-400">URL:</span>{" "}
                    <a href={uploadResult.url} target="_blank" rel="noreferrer" className="text-cyan-200 underline decoration-cyan-400/40 underline-offset-4 hover:text-cyan-100">
                      {uploadResult.url}
                    </a>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleStorageDelete()}
                    disabled={uploadPending}
                    className="inline-flex items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadPending ? "Working..." : "Delete uploaded file"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[34px] border border-white/10 bg-white/3 p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick links</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">Use the starter-style homepage as the base, then refine product details from here.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/settings/providers">
                  <Settings className="h-4 w-4" />
                  Provider Console
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <a href="https://github.com/alex887885/Logicstarter" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/settings/providers?category=billing">
                  <Shield className="h-4 w-4" />
                  Billing Runtime
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} loginMethods={data.authMethods} />
    </main>
  );
}
