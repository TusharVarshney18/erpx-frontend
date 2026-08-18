import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ERPX" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading, signIn, signUp, completeMfaLogin } = useAuth();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [busy, setBusy] = useState(false);

  // MFA step state
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (!loading && user) {
      nav({ to: "/" });
    }
  }, [loading, user, nav]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await signIn(email, password);
      if (result.mfaRequired) {
        setMfaChallenge(result.mfaChallenge);
        setMfaCode("");
        return;
      }
      toast.success("Welcome back!");
      nav({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Invalid email or password");
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
    } catch (err: any) {
      toast.error(err.message ?? "Invalid verification code");
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
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  if (mfaChallenge) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Two-factor authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app (or a backup code) to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfaCode">Verification code</Label>
                <Input
                  id="mfaCode"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000"
                  autoFocus
                  required
                  maxLength={16}
                  className="text-center text-lg tracking-[0.4em]"
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full gradient-primary text-white shadow-glow"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMfaChallenge(null);
                  setMfaCode("");
                }}
              >
                Back to sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl gradient-primary text-white shadow-glow">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">ERPX</CardTitle>
          <CardDescription>
            Enterprise suite for accounting, sales, inventory & more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <form
              onSubmit={tab === "signin" ? handleSignIn : handleSignUp}
              className="mt-4 space-y-4"
            >
              <TabsContent value="signup" className="m-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Inc"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgCode">Organization code</Label>
                  <Input
                    id="orgCode"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    placeholder="acme-inc"
                    pattern="^[a-z0-9-]+$"
                    title="Lowercase letters, numbers, and hyphens only"
                    required
                  />
                </div>
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {tab === "signin" && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary"
                      onClick={() => nav({ to: "/forgot-password" })}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="w-full gradient-primary text-white shadow-glow"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tab === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
