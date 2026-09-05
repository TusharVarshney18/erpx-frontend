import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck, RefreshCw } from "lucide-react";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export function SignInCodePanel({
  email,
  onMfaRequired,
  onBack,
}: {
  email: string;
  onMfaRequired: (challenge: string) => void;
  onBack: () => void;
}) {
  const nav = useNavigate();
  const { requestLoginCode, verifyLoginCode } = useAuth();
  const { secondsLeft, start, stop, format } = useCountdown(0);

  const [sent, setSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendCode = async (showWait = true) => {
    if (!email || !email.includes("@")) {
      toast.error("Enter your email address first.");
      return;
    }
    if (secondsLeft > 0 && showWait) {
      toast.error(`Please wait ${secondsLeft}s before requesting another code.`);
      return;
    }
    setSending(true);
    try {
      const res = await requestLoginCode(email);
      setMaskedEmail(res.maskedEmail);
      setCode("");
      setSent(true);
      start(60);
      if (res.deliveredVia === "console") {
        toast.error(
          "Development mode: email sending is not configured — check the backend console for your sign-in code.",
        );
      } else if (res.deliveredVia === "none" || !res.maskedEmail) {
        toast.success("If an account exists for this email, a sign-in code is on its way.");
      } else {
        toast.success(`Sign-in code sent to ${res.maskedEmail}.`);
      }
    } catch (err) {
      const match = String(err instanceof Error ? err.message : err).match(/(\d+)s/);
      if (match) start(Number(match[1]));
      toast.error(errorMessage(err, "Could not send a code. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const verify = async (value: string) => {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    try {
      const result = await verifyLoginCode(email, value);
      if (result.mfaRequired) {
        onMfaRequired(result.mfaChallenge);
        return;
      }
      toast.success("Welcome back!");
      nav({ to: "/" });
    } catch (err) {
      setCode("");
      toast.error(errorMessage(err, "Invalid or expired code. Please try again."));
    } finally {
      setVerifying(false);
    }
  };

  const changeEmail = () => {
    stop();
    setSent(false);
    setCode("");
    setMaskedEmail(null);
  };

  return (
    <div className="space-y-4">
      {!sent ? (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;ll email you a one-time sign-in code. No password needed.
          </p>
          <Button
            type="button"
            onClick={() => sendCode()}
            disabled={sending}
            className="group h-11 w-full rounded-lg gradient-primary text-base text-white shadow-glow transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Email me a sign-in code
                <RefreshCw className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Check your inbox</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {maskedEmail ? (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-foreground">{maskedEmail}</span>. It expires
                    in 10 minutes.
                  </>
                ) : (
                  <>
                    If an account exists for{" "}
                    <span className="font-semibold text-foreground">{email}</span>, a code is on its
                    way. It expires in 10 minutes.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Sign-in code</Label>
            <div className="flex justify-center py-1">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(v) => {
                  setCode(v);
                  if (v.length === 6) verify(v);
                }}
                disabled={verifying}
                pattern="^[0-9]+$"
                inputMode="numeric"
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-11 w-9 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {verifying && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Signing you in…
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {secondsLeft > 0 ? (
              <span>Resend code in {format()}</span>
            ) : (
              <button
                type="button"
                onClick={() => sendCode()}
                className="font-medium text-primary hover:underline"
              >
                Resend code
              </button>
            )}
            <button
              type="button"
              onClick={changeEmail}
              className="font-medium text-primary hover:underline"
            >
              Use a different email
            </button>
          </div>
        </>
      )}

      <Button
        type="button"
        variant="ghost"
        className="h-9 w-full rounded-lg text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to password sign in
      </Button>
    </div>
  );
}
