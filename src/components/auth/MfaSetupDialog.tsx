import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Self-service TOTP enrollment flow used by the opt-in prompt and Settings.
 * TOTP/backup-code verification itself lives entirely on the backend.
 */
export function MfaSetupDialog({
  open,
  onOpenChange,
  onEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled?: () => void;
}) {
  const { startMfaEnroll, confirmMfaEnroll, refreshUser } = useAuth();
  const [enroll, setEnroll] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || enroll || backupCodes) return;
    let active = true;
    setBusy(true);
    startMfaEnroll()
      .then((result) => {
        if (active) setEnroll(result);
      })
      .catch((error: Error) => toast.error(error.message || "Could not start 2FA setup"))
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    setEnroll(null);
    setCode("");
    setBackupCodes(null);
    setAcknowledged(false);
    setBusy(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!enroll) return;
    setBusy(true);
    try {
      const result = await confirmMfaEnroll(enroll.secret, code);
      setBackupCodes(result.backupCodes);
      setEnroll(null);
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid verification code";
      toast.error(message);
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const copyCodes = () => {
    if (!backupCodes) return;
    navigator.clipboard?.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied");
  };

  const downloadCodes = () => {
    if (!backupCodes) return;
    const blob = new Blob(
      [
        "ERPX two-factor backup codes\n",
        "Each code can be used once. Store these somewhere safe.\n\n",
        backupCodes.join("\n"),
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "erpx-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const finish = () => {
    onEnabled?.();
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">
            {backupCodes ? "Save your backup codes" : "Set up two-factor authentication"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {backupCodes
              ? "You will not see these again. Download or copy them before continuing."
              : "Scan the QR code with your authenticator app, then enter the 6-digit code."}
          </DialogDescription>
        </DialogHeader>

        {backupCodes ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm sm:grid-cols-3">
              {backupCodes.map((backupCode) => (
                <span key={backupCode}>{backupCode}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={copyCodes}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={downloadCodes}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
            <label className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>I&apos;ve saved these backup codes in a safe place.</span>
            </label>
            <Button
              type="button"
              className="w-full gradient-primary text-white"
              disabled={!acknowledged}
              onClick={finish}
            >
              <Check className="mr-2 h-4 w-4" /> Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {!enroll ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing authenticator setup…
              </p>
            ) : (
              <>
                <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm">
                  <QRCodeSVG value={enroll.otpauthUrl} size={180} level="M" />
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Can&apos;t scan? Enter this key in your authenticator app
                  </p>
                  <code className="mt-2 block break-all font-mono text-sm tracking-wider">
                    {(enroll.secret.match(/.{1,4}/g) ?? []).join(" ")}
                  </code>
                </div>
                <form onSubmit={handleConfirm} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="prompt-setup-code">Verification code</Label>
                    <Input
                      id="prompt-setup-code"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="000000"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      className="text-center text-base tracking-[0.35em]"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={busy || code.length !== 6}
                    className="w-full gradient-primary text-white"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & enable"}
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
