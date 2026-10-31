import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isMarketingPath } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MfaSetupDialog } from "./MfaSetupDialog";

const SHOWN_KEY = "erpx_mfa_prompt_shown";

/**
 * One-time opt-in nudge shown after sign-in. Never rendered on auth or
 * marketing pages, and at most once per browser-tab session.
 */
export function MfaPromptDialog() {
  const { user, loading, setMfaPrompt } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const isAuthPath =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/verify-email") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname.startsWith("/invite") ||
    location.pathname.startsWith("/accept-invite");

  const snoozedUntil = user?.mfaPromptSnoozedUntil
    ? new Date(user.mfaPromptSnoozedUntil).getTime()
    : 0;
  const eligible =
    !loading &&
    !!user &&
    !isAuthPath &&
    !isMarketingPath(location.pathname) &&
    user.mfaEnabled !== true &&
    user.mfaPromptDismissed !== true &&
    user.mfaRequired !== true &&
    snoozedUntil <= Date.now();

  useEffect(() => {
    if (!eligible) return;
    try {
      if (sessionStorage.getItem(SHOWN_KEY) === "1") return;
      sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* private mode: still show once for this render */
    }
    setOpen(true);
  }, [eligible]);

  const snooze = () => {
    setOpen(false);
    void setMfaPrompt("snooze");
  };

  const dismiss = () => {
    setOpen(false);
    void setMfaPrompt("dismiss");
  };

  if (!eligible && !setupOpen) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) snooze();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">
              Secure your account with two-factor authentication
            </DialogTitle>
            <DialogDescription className="text-center">
              Add a 6-digit code from an authenticator app as a second step when you sign in. It
              takes about a minute to set up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="w-full gradient-primary text-white"
              onClick={() => {
                setOpen(false);
                setSetupOpen(true);
              }}
            >
              Enable now
            </Button>
            <Button variant="outline" className="w-full" onClick={snooze}>
              Remind me later
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={dismiss}>
              Don&apos;t ask again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MfaSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onEnabled={() => setSetupOpen(false)}
      />
    </>
  );
}
