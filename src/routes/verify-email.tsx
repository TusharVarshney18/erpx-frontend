import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Building2, Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  validateSearch: z.object({ email: z.string().optional() }),
  head: () => ({ meta: [{ title: "Verify email — ERPX" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const nav = useNavigate();
  const { email } = useSearch({ from: "/verify-email" });
  const { verifyEmail, resendVerification, signIn, user, loading } = useAuth();
  const [pendingEmail, setPendingEmail] = useState(email ?? "");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [masked, setMasked] = useState<string | null>(null);
  const { secondsLeft, start, format } = useCountdown(0);

  useEffect(() => {
    if (!loading && user) {
      nav({ to: "/" });
    }
  }, [loading, user, nav]);

  useEffect(() => {
    if (!pendingEmail) {
      const stored = sessionStorage.getItem("erpx_pending_email");
      if (stored) setPendingEmail(stored);
    }
    start(60);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (code: string) => {
    if (!pendingEmail || code.length !== 6 || busy) return;
    setBusy(true);
    try {
      await verifyEmail(pendingEmail, code);
      sessionStorage.removeItem("erpx_pending_email");
      toast.success("Email verified successfully. Please sign in.");
      nav({ to: "/auth", search: { email: pendingEmail } });
    } catch (e: any) {
      setOtp("");
      toast.error(e?.message ?? "Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!pendingEmail) return;
    setBusy(true);
    try {
      const result = await resendVerification(pendingEmail, "EMAIL_VERIFICATION");
      setMasked(result.maskedEmail);
      start(60);
      if (result.deliveredVia === "console") {
        toast.error(
          "Email couldn't be delivered — the verification code is in the server console/logs.",
        );
      } else {
        toast.success("A new code has been sent.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not resend the code. Please wait and try again.");
      const match = e?.message?.match(/(\d+)s/);
      if (match) start(Number(match[1]));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl gradient-primary text-white shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-foreground">{masked ?? pendingEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {!pendingEmail ? (
              <div className="space-y-2">
                <Label htmlFor="verify-email">Email</Label>
                <input
                  id="verify-email"
                  type="email"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="you@company.com"
                  value={pendingEmail}
                  onChange={(e) => setPendingEmail(e.target.value)}
                />
                <Button
                  className="w-full gradient-primary text-white shadow-glow"
                  onClick={resend}
                  disabled={busy}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send code
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(v) => {
                      setOtp(v);
                      if (v.length === 6) submit(v);
                    }}
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
                <Button
                  className="w-full gradient-primary text-white shadow-glow"
                  onClick={() => submit(otp)}
                  disabled={busy || otp.length !== 6}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {secondsLeft > 0 ? `Resend code in ${format()}` : "Didn't receive it?"}
                  </span>
                  {secondsLeft === 0 && (
                    <button
                      className="font-medium text-primary hover:underline"
                      onClick={resend}
                      disabled={busy}
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </>
            )}
            <Button variant="link" className="w-full" onClick={() => nav({ to: "/auth" })}>
              <Building2 className="mr-1.5 h-3.5 w-3.5" /> Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
