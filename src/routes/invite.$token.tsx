import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api, API_BASE } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { GoogleIcon } from "@/components/auth/google-icon";
import { toast } from "sonner";
import { AlertCircle, Building2, Loader2, MailCheck, ShieldCheck, UserRound } from "lucide-react";

type InviteDetails = {
  organization: { name: string };
  role: string;
  inviter: { name: string; email: string };
  email: string;
  expiresAt: string;
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [{ title: "Accept invitation — ERPX" }, { name: "referrer", content: "no-referrer" }],
  }),
  component: InviteAcceptPage,
});

function InviteAcceptPage() {
  const nav = useNavigate();
  const { token } = useParams({ from: "/invite/$token" });

  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const oauthHandled = useRef(false);

  useEffect(() => {
    let active = true;
    api
      .get<InviteDetails>(`/invites/${token}`)
      .then((d) => {
        if (active) setDetails(d);
      })
      .catch((err) => {
        if (active) setInvalid(errorMessage(err, "This invitation is invalid or has expired"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const acceptViaGoogle = async (grant: string) => {
    setBusy(true);
    try {
      await api.post(`/invites/${token}/accept`, { oauthGrant: grant });
      setDone(true);
    } catch (err) {
      toast.error(errorMessage(err, "Could not accept this invitation with Google"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (oauthHandled.current) return;
    const grant = new URLSearchParams(window.location.search).get("oauth_grant");
    if (grant) {
      oauthHandled.current = true;
      void acceptViaGoogle(grant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogle = () => {
    const origin = encodeURIComponent(window.location.origin);
    window.location.assign(`${API_BASE}/auth/google?origin=${origin}&invite=${token}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/invites/${token}/accept`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });
      setDone(true);
    } catch (err) {
      toast.error(errorMessage(err, "Could not accept this invitation"));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-success/15 text-success">
              <MailCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Invitation accepted</CardTitle>
            <CardDescription>You can now sign in to your organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full gradient-primary text-white"
              onClick={() => nav({ to: "/auth" })}
            >
              Go to sign in
            </Button>
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
          <CardTitle className="text-2xl">You've been invited</CardTitle>
          <CardDescription>
            {loading ? (
              "Loading invitation…"
            ) : invalid ? (
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-4 w-4" /> {invalid}
              </span>
            ) : (
              <>
                Join{" "}
                <span className="font-medium text-foreground">{details?.organization.name}</span> as{" "}
                <span className="font-medium text-foreground">{details?.role}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>

        {!loading && !invalid && details && (
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <UserRound className="h-4 w-4" />
                Invited by {details.inviter.name || details.inviter.email}
              </p>
              <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                For {details.email}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={busy}
              className="h-11 w-full rounded-lg border-border bg-card/60 font-medium shadow-sm"
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <span className="h-px flex-1 bg-border/70" />
              or set a password
              <span className="h-px flex-1 bg-border/70" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                  />
                </div>
                <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <PasswordStrength password={password} />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="h-11 w-full rounded-lg gradient-primary text-base text-white shadow-glow"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept invitation
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
