import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type OrganizationOption } from "@/lib/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageSquareText, Phone, RefreshCw } from "lucide-react";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export function SignInPhonePanel({
  onMfaRequired,
  onMfaSetupRequired,
  onOrgSelectionRequired,
  onBack,
}: {
  onMfaRequired: (challenge: string) => void;
  onMfaSetupRequired: () => void;
  onOrgSelectionRequired: (selectionToken: string, organizations: OrganizationOption[]) => void;
  onBack: () => void;
}) {
  const nav = useNavigate();
  const { requestPhoneLoginCode, verifyPhoneLoginCode } = useAuth();
  const { secondsLeft, start, stop, format } = useCountdown(0);

  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendCode = async (showWait = true) => {
    const trimmed = phone.trim();
    if (!/^\+?[1-9]\d{6,14}$/.test(trimmed)) {
      toast.error("Enter a valid phone number in international format, e.g. +919876543210.");
      return;
    }
    if (secondsLeft > 0 && showWait) {
      toast.error(`Please wait ${secondsLeft}s before requesting another code.`);
      return;
    }
    setSending(true);
    try {
      const res = await requestPhoneLoginCode(trimmed);
      setMaskedPhone(res.maskedPhone);
      setCode("");
      setSent(true);
      start(60);
      if (res.deliveredVia === "console") {
        toast.error("SMS couldn't be delivered — the sign-in code is in the server console/logs.");
      } else if (res.deliveredVia === "none" || !res.maskedPhone) {
        toast.success("If an account exists for this number, a sign-in code is on its way.");
      } else {
        toast.success(`Sign-in code sent to ${res.maskedPhone}.`);
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
      const result = await verifyPhoneLoginCode(phone.trim(), value);
      if (result.step === "org-selection") {
        onOrgSelectionRequired(result.selectionToken, result.organizations);
        return;
      }
      if (result.step === "mfa") {
        onMfaRequired(result.mfaChallenge);
        return;
      }
      if (result.step === "mfa-setup") {
        onMfaSetupRequired();
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

  const changePhone = () => {
    stop();
    setSent(false);
    setCode("");
    setMaskedPhone(null);
  };

  return (
    <div className="space-y-4">
      {!sent ? (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;ll text you a one-time sign-in code. No password needed.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-[13px]">
              Phone number
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                className="h-11 rounded-lg pl-10"
              />
            </div>
          </div>
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
                Text me a sign-in code
                <RefreshCw className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5">
            <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Check your messages</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {maskedPhone ? (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-foreground">{maskedPhone}</span>. It expires
                    in 10 minutes.
                  </>
                ) : (
                  <>
                    If an account exists for this number, a code is on its way. It expires in 10
                    minutes.
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
              onClick={changePhone}
              className="font-medium text-primary hover:underline"
            >
              Use a different number
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
