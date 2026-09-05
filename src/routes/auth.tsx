import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, type Variants } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { SsoSection } from "@/components/auth/social-buttons";
import { PasswordStrength } from "@/components/auth/password-strength";
import { SignInCodePanel } from "@/components/auth/sign-in-code";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    email: z.string().optional(),
    oauth_grant: z.string().optional(),
    oauth_error: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Sign in — Tushar Erp" }] }),
  component: AuthPage,
});

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Wallet, title: "Accounting", desc: "Ledger, billing & GST-ready reports." },
  { icon: Package, title: "Inventory", desc: "Live stock & warehouse visibility." },
  { icon: ShoppingCart, title: "Sales & Billing", desc: "Quotes, invoices & payments." },
  { icon: Users, title: "CRM & People", desc: "Leads, customers & HR in sync." },
];

const METRICS: { value: string; label: string }[] = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "10+", label: "Modules included" },
  { value: "24/7", label: "Expert support" },
];

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <BrandPanel />
      <main className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 py-10 sm:px-8 lg:w-[54%] lg:py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-[-12%] h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-18%] left-[-8%] h-[26rem] w-[26rem] rounded-full bg-[#6366f1]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="mb-7 flex flex-col items-center gap-2 text-center lg:hidden">
            <LogoLockup />
            <p className="text-xs text-muted-foreground">
              Accounting, sales, inventory, CRM & people — in one suite
            </p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function LogoLockup() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl gradient-primary text-white shadow-glow">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="text-left leading-tight">
        <p className="text-base font-semibold tracking-tight text-foreground">Tushar Erp</p>
        <p className="text-[11px] text-muted-foreground">Enterprise suite</p>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#6366f1]/30 blur-[120px]" />
        <div className="absolute -bottom-32 -left-24 h-[30rem] w-[30rem] rounded-full bg-[#a855f7]/20 blur-[140px]" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0ea5e9]/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />
      </div>

      <motion.header
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative flex items-center justify-between"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-xl gradient-primary text-white shadow-glow">
            <Building2 className="h-6 w-6" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-sidebar" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-white">Tushar Erp</p>
            <p className="text-xs text-white/50">Enterprise suite</p>
          </div>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/70 backdrop-blur"
        >
          <Sparkles className="h-3 w-3 text-sky-300" />
          All-in-one ERP
        </motion.div>
      </motion.header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative my-10 space-y-7 xl:my-12"
      >
        <motion.div variants={fadeUp} className="space-y-4">
          <h1 className="max-w-xl text-[2rem] font-semibold leading-[1.12] tracking-tight text-white xl:text-[2.6rem]">
            Run your entire business on <span className="text-sky-300">one platform</span>.
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-white/60">
            Everything your team needs to sell, bill, track and grow — accounting, sales, inventory,
            CRM and HR in a single source of truth.
          </p>
        </motion.div>

        <motion.ul variants={fadeUp} className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-sky-300">
                <f.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-white">{f.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-white/55">{f.desc}</span>
              </span>
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.footer
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative space-y-6"
      >
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
        >
          <div className="flex items-center gap-0.5 text-amber-400">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <p className="mt-3 text-sm italic leading-relaxed text-white/80">
            &ldquo;We replaced three disconnected tools with Tushar Erp — month-end close used to
            take a week, now it takes a day.&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-white/50">
            Finance Director, mid-market manufacturing
          </p>
        </motion.div>

        <motion.dl
          variants={fadeUp}
          className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6"
        >
          {METRICS.map((m) => (
            <div key={m.label}>
              <dd className="text-xl font-semibold tracking-tight text-white xl:text-2xl">
                {m.value}
              </dd>
              <dt className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">
                {m.label}
              </dt>
            </div>
          ))}
        </motion.dl>

        <motion.p
          variants={fadeUp}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/45"
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Bank-grade encryption
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Fingerprint className="h-3.5 w-3.5" /> SSO &amp; MFA ready
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> GDPR compliant
          </span>
        </motion.p>
      </motion.footer>
    </aside>
  );
}

function AuthPage() {
  const nav = useNavigate();
  const { email: initialEmail, oauth_grant, oauth_error } = useSearch({ from: "/auth" });
  const { user, loading, signIn, signUp, completeMfaLogin, completeOAuthLogin } = useAuth();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  // OAuth redirect-result state
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthNotice, setOauthNotice] = useState("");
  const oauthProcessed = useRef(false);

  // MFA step state
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (!loading && user) {
      nav({ to: "/" });
    }
  }, [loading, user, nav]);

  useEffect(() => {
    if (email || typeof localStorage === "undefined") return;
    const remembered = localStorage.getItem("erpx_remembered_email");
    if (remembered) setEmail(remembered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (oauthProcessed.current) return;
    if (!oauth_grant && !oauth_error) return;
    oauthProcessed.current = true;

    const clearParams = () =>
      nav({
        to: "/auth",
        search: { email: initialEmail ?? undefined },
        replace: true,
      });

    if (oauth_grant) {
      setOauthBusy(true);
      completeOAuthLogin(oauth_grant)
        .then((result) => {
          if (result.mfaRequired) {
            setMfaChallenge(result.mfaChallenge);
            setMfaCode("");
          } else {
            toast.success("Signed in with Google");
            nav({ to: "/" });
          }
        })
        .catch((err) => {
          toast.error(errorMessage(err, "Could not complete Google sign-in. Please try again."));
          clearParams();
        })
        .finally(() => setOauthBusy(false));
    } else if (oauth_error === "no_account") {
      setOauthNotice(
        "No workspace was found for this Google account. Ask your admin to invite you, or create an account instead.",
      );
      clearParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = () => {
    if (oauthBusy) return;
    const origin = encodeURIComponent(window.location.origin);
    window.location.assign(`${API_BASE}/auth/google?origin=${origin}`);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await signIn(email, password);
      if (rememberEmail) {
        localStorage.setItem("erpx_remembered_email", email.trim());
      } else {
        localStorage.removeItem("erpx_remembered_email");
      }
      if (result.mfaRequired) {
        setMfaChallenge(result.mfaChallenge);
        setMfaCode("");
        return;
      }
      toast.success("Welcome back!");
      nav({ to: "/" });
    } catch (err) {
      toast.error(errorMessage(err, "Invalid email or password"));
    } finally {
      setBusy(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge) return;
    setBusy(true);
    try {
      await completeMfaLogin(mfaChallenge, mfaCode);
      toast.success("Welcome back!");
      nav({ to: "/" });
    } catch (err) {
      toast.error(errorMessage(err, "Invalid verification code"));
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await signUp({
        email,
        password,
        firstName,
        lastName,
        organizationName: orgName,
        organizationCode: orgCode,
      });
      if (result.requiresEmailVerification) {
        if (result.deliveredVia === "console") {
          toast.error(
            "Account created, but the verification email could not be sent (SMTP is not configured).",
          );
        } else {
          toast.success("Account created. Check your inbox for a verification code.");
        }
        nav({ to: "/verify-email", search: { email } });
      } else {
        toast.success("Account created. Welcome!");
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error(errorMessage(err, "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  const isSignUp = tab === "signup";

  return (
    <AuthShell>
      {mfaChallenge ? (
        <MfaCard
          busy={busy}
          mfaCode={mfaCode}
          onCodeChange={setMfaCode}
          onVerify={handleMfaVerify}
          onBack={() => {
            setMfaChallenge(null);
            setMfaCode("");
          }}
        />
      ) : oauthBusy ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-glass backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Completing Google sign-in…</p>
            <p className="text-xs text-muted-foreground">Hold tight, this takes a moment.</p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-glass backdrop-blur-xl sm:p-8">
            {oauthNotice && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="flex-1 leading-relaxed text-foreground">{oauthNotice}</p>
                <button
                  type="button"
                  onClick={() => setOauthNotice("")}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v);
                if (v === "signup") setCodeMode(false);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 gap-1 rounded-xl bg-muted/80 p-1">
                <TabsTrigger
                  value="signin"
                  className="flex h-10 items-center gap-2 rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="flex h-10 items-center gap-2 rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </TabsTrigger>
              </TabsList>

              <div className="mt-7 space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {isSignUp ? "Create your workspace" : "Welcome back"}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {isSignUp
                    ? "Set up your organization and invite your team to get started."
                    : "Enter your details to access your organization dashboard."}
                </p>
              </div>

              {!isSignUp && <SsoSection onGoogle={handleGoogleSignIn} />}

              <form
                onSubmit={(e) => {
                  if (isSignUp) return handleSignUp(e);
                  if (codeMode) {
                    e.preventDefault();
                    return;
                  }
                  return handleSignIn(e);
                }}
                className="mt-7 space-y-5"
              >
                <TabsContent value="signup" className="m-0 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-[13px]">
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        className="h-11 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-[13px]">
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="h-11 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="orgName" className="text-[13px]">
                      Organization name
                    </Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Inc"
                      className="h-11 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="orgCode" className="text-[13px]">
                      Organization code
                    </Label>
                    <Input
                      id="orgCode"
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value)}
                      placeholder="acme-inc"
                      pattern="^[a-z0-9-]+$"
                      title="Lowercase letters, numbers, and hyphens only"
                      className="h-11 rounded-lg"
                      required
                    />
                  </div>
                </TabsContent>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px]">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="h-11 rounded-lg pl-10"
                      required
                    />
                  </div>
                </div>

                {!codeMode && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[13px]">
                        Password
                      </Label>
                      {!isSignUp && (
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline"
                          onClick={() => nav({ to: "/forgot-password" })}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        className="h-11 rounded-lg pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {isSignUp && !codeMode && <PasswordStrength password={password} />}

                {codeMode ? (
                  <SignInCodePanel
                    email={email}
                    onMfaRequired={(challenge) => {
                      setMfaChallenge(challenge);
                      setMfaCode("");
                    }}
                    onBack={() => setCodeMode(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    {!isSignUp && (
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Checkbox
                          id="remember"
                          checked={rememberEmail}
                          onCheckedChange={(v) => setRememberEmail(v === true)}
                          className="h-4 w-4 rounded-[4px]"
                        />
                        <span
                          className="cursor-pointer select-none"
                          onClick={() => setRememberEmail((v) => !v)}
                        >
                          Remember email on this device
                        </span>
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={busy}
                      className="group h-11 w-full rounded-lg gradient-primary text-base text-white shadow-glow transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {isSignUp ? "Create account" : "Sign in"}
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                    {!isSignUp && (
                      <p className="!mt-0 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                          onClick={() => setCodeMode(true)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Prefer no password? Get a sign-in code instead
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </form>
            </Tabs>

            <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border/60 pt-5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Protected with TLS encryption, SSO &amp; MFA
            </div>
          </div>
        </motion.div>
      )}
    </AuthShell>
  );
}

function MfaCard({
  busy,
  mfaCode,
  onCodeChange,
  onVerify,
  onBack,
}: {
  busy: boolean;
  mfaCode: string;
  onCodeChange: (v: string) => void;
  onVerify: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-glass backdrop-blur-xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <span className="absolute inset-0 -m-1.5 animate-ping rounded-2xl bg-primary/20" />
            <div className="relative grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-white shadow-glow">
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Two-factor authentication</h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Enter the 6-digit code from your authenticator app (or a backup code) to continue.
          </p>
        </div>

        <form onSubmit={onVerify} className="mt-7 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="mfaCode" className="text-[13px]">
              Verification code
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mfaCode"
                value={mfaCode}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="000000"
                autoFocus
                required
                maxLength={16}
                className="h-11 rounded-lg pl-10 text-center text-base tracking-[0.35em]"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="group h-11 w-full rounded-lg gradient-primary text-base text-white shadow-glow transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Verify
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
          <Button type="button" variant="ghost" className="h-10 w-full rounded-lg" onClick={onBack}>
            Back to sign in
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
