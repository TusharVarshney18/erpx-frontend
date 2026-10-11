import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { registerMfaStepUpPrompt } from "@/lib/api/client";
import { Loader2, ShieldCheck } from "lucide-react";

/**
 * Global step-up MFA dialog. Registers a prompt with the API client so that a
 * 403 `MFA_STEP_UP_REQUIRED` response opens this dialog; the entered 6-digit
 * code resolves the pending request, which then retries automatically.
 */
export function MfaStepUpDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const resolverRef = useRef<((value: string | null) => void) | null>(null);

  useEffect(() => {
    registerMfaStepUpPrompt(
      () =>
        new Promise<string | null>((resolve) => {
          resolverRef.current = resolve;
          setCode("");
          setSubmitting(false);
          setOpen(true);
        }),
    );
    return () => registerMfaStepUpPrompt(null);
  }, []);

  const finish = (value: string | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    resolve?.(value);
  };

  const submit = () => {
    if (code.length !== 6) return;
    setSubmitting(true);
    finish(code);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish(null);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Confirm it&apos;s you</DialogTitle>
          <DialogDescription className="text-center">
            This is a sensitive action. Enter the 6-digit code from your authenticator app to
            continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            pattern="^[0-9]+$"
            inputMode="numeric"
            disabled={submitting}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-11 w-9 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full gradient-primary text-white"
          onClick={submit}
          disabled={code.length !== 6 || submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
