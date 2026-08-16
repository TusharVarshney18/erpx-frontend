import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({
    email: z.string().optional(),
    maskedEmail: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Reset password — ERPX" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const { email: searchEmail, maskedEmail } = useSearch({ from: "/reset-password" });
  const { resetPassword, resendVerification } = useAuth();
  const [email, setEmail] = useState(searchEmail ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { secondsLeft, start, format } = useCountdown(0);

  useEffect(() => {
    start(60);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otp.length !== 6) {
      toast.error("Enter your email and the 6-digit code.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email, otp, password);
      setDone(true);
      toast.success("Password updated. Please sign in.");
    } catch (err: any) {
      setOtp("");
      toast.error(err?.message ?? "Reset failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setBusy(true);
    try {
      await resendVerification(email, "PASSWORD_RESET");
      start(60);
      toast.success("A new code has been sent.");
    } catch (err: any) {
      const match = err?.message?.match(/(\d+)s/);
      if (match) start(Number(match[1]));
      toast.error(err?.message ?? "Could not resend the code.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl gradient-primary text-white shadow-glow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Password Updated</CardTitle>
            <CardDescription>Your password has been reset successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gradient-primary text-white shadow-glow" onClick={() => nav({ to: "/auth", search: { email } })}>
              Sign in
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
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-foreground">{maskedEmail ?? email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Verification code</Label>
              <div className="flex justify-center py-1">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={busy}
                  pattern="^[0-9]+$"
                  inputMode="numeric"
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-11 w-10 text-base" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex items-center justify-end text-xs text-muted-foreground">
                {secondsLeft > 0 ? (
                  <span>Resend code in {format()}</span>
                ) : (
                  <button type="button" className="font-medium text-primary hover:underline" onClick={resend} disabled={busy}>
                    Resend code
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={busy} className="w-full gradient-primary text-white shadow-glow">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
            <Button type="button" variant="link" className="w-full" onClick={() => nav({ to: "/auth" })}>
              Back to sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
