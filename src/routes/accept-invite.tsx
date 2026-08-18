import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MailCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/accept-invite")({
  head: () => ({ meta: [{ title: "Accept invitation — ERPX" }] }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const nav = useNavigate();
  const { resendInvite, acceptInvite } = useAuth();

  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [masked, setMasked] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await resendInvite(email);
      setMasked(res.maskedEmail);
      setStep("code");
      if (res.deliveredVia === "console") {
        toast.error(
          "Account found, but the invitation email could not be sent (SMTP is not configured).",
        );
      } else {
        toast.success(`We sent a code to ${res.maskedEmail}`);
      }
      startCooldown();
    } catch (err: any) {
      toast.error(err.message ?? "No invitation found for this email");
    } finally {
      setBusy(false);
    }
  };

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    try {
      const res = await resendInvite(email);
      if (res.deliveredVia === "console") {
        toast.error("Could not resend — the invitation email service is not configured.");
      } else {
        toast.success("Code resent");
      }
      startCooldown();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to resend");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await acceptInvite(email, code, password);
      setStep("done");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to accept invitation");
    } finally {
      setBusy(false);
    }
  };

  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-success/15 text-success">
              <MailCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Invitation accepted</CardTitle>
            <CardDescription>You can now sign in with your new password.</CardDescription>
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
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Accept your invitation</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter the email you were invited with. We'll send you a verification code."
              : `We sent a code to ${masked}. Enter it below and choose a password.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
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
              <Button
                type="submit"
                disabled={busy}
                className="w-full gradient-primary text-white shadow-glow"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send verification code
              </Button>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="text-center text-lg tracking-[0.4em]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full gradient-primary text-white shadow-glow"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept invitation
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={cooldown > 0 || busy}
                onClick={resend}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
