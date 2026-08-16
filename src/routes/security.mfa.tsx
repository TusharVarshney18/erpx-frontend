import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff, KeyRound, Copy } from "lucide-react";

export const Route = createFileRoute("/security/mfa")({
  head: () => ({ meta: [{ title: "Two-factor authentication — ERPX" }] }),
  component: MfaPage,
});

function MfaPage() {
  const { mfaStatus, startMfaEnroll, confirmMfaEnroll, regenerateMfaBackupCodes, disableMfa } =
    useAuth();

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [enroll, setEnroll] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [manageCode, setManageCode] = useState("");
  const [showBackup, setShowBackup] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const s = await mfaStatus();
      setEnabled(s.enabled);
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartEnroll = async () => {
    setBusy(true);
    try {
      const res = await startMfaEnroll();
      setEnroll(res);
      setShowBackup(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to start enrollment");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enroll) return;
    setBusy(true);
    try {
      const res = await confirmMfaEnroll(enroll.secret, confirmCode);
      setBackupCodes(res.backupCodes);
      setShowBackup(true);
      setEnroll(null);
      setConfirmCode("");
      setEnabled(true);
      toast.success("Two-factor authentication enabled");
    } catch (err: any) {
      toast.error(err.message ?? "Invalid verification code");
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await regenerateMfaBackupCodes(manageCode);
      setBackupCodes(res.backupCodes);
      setShowBackup(true);
      setManageCode("");
      toast.success("Backup codes regenerated");
    } catch (err: any) {
      toast.error(err.message ?? "Invalid verification code");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await disableMfa(manageCode);
      setEnabled(false);
      setBackupCodes([]);
      setShowBackup(false);
      setManageCode("");
      toast.success("Two-factor authentication disabled");
    } catch (err: any) {
      toast.error(err.message ?? "Invalid verification code");
    } finally {
      setBusy(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard?.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Two-factor authentication"
        subtitle="Protect your account with an authenticator app"
      />

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {enabled ? (
                    <>
                      <ShieldCheck className="h-5 w-5 text-success" /> Enabled
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-5 w-5 text-muted-foreground" /> Disabled
                    </>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {enabled
                    ? "Your account requires a verification code when signing in."
                    : "Add an extra layer of security to your account."}
                </CardDescription>
              </div>
              <Badge
                variant={enabled ? "default" : "secondary"}
                className={enabled ? "bg-success/15 text-success" : ""}
              >
                {enabled ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </CardHeader>
          </Card>

          {!enabled && !enroll && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleStartEnroll}
                  disabled={busy}
                  className="gradient-primary text-white"
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ShieldCheck className="mr-2 h-4 w-4" /> Enable two-factor authentication
                </Button>
              </CardContent>
            </Card>
          )}

          {enroll && (
            <Card>
              <CardHeader>
                <CardTitle>Scan with your authenticator app</CardTitle>
                <CardDescription>
                  Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR
                  code, or enter the secret manually.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <a
                    href={enroll.otpauthUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm"
                  >
                    <KeyRound className="h-4 w-4" /> Open authenticator setup
                  </a>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center font-mono text-sm tracking-widest">
                  {enroll.secret}
                </div>
                <form onSubmit={handleConfirmEnroll} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="confirmCode">Enter the 6-digit code from your app</Label>
                    <Input
                      id="confirmCode"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      placeholder="000000"
                      required
                      maxLength={6}
                      className="text-center text-lg tracking-[0.4em]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy} className="gradient-primary text-white">
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify & enable
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEnroll(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {enabled && (
            <Card>
              <CardHeader>
                <CardTitle>Manage</CardTitle>
                <CardDescription>
                  Regenerate backup codes or disable two-factor authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRegenerateBackup} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="manageCode">Current verification code</Label>
                    <Input
                      id="manageCode"
                      value={manageCode}
                      onChange={(e) => setManageCode(e.target.value)}
                      placeholder="000000"
                      required
                      maxLength={16}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy} variant="outline">
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <KeyRound className="mr-2 h-4 w-4" /> Regenerate backup codes
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDisable}
                      disabled={busy}
                      variant="destructive"
                    >
                      <ShieldOff className="mr-2 h-4 w-4" /> Disable
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {showBackup && backupCodes.length > 0 && (
            <Card className="border-warning/40">
              <CardHeader>
                <CardTitle>Your backup codes</CardTitle>
                <CardDescription>
                  Store these somewhere safe. Each code can be used once to sign in if you lose
                  access to your authenticator app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-3">
                    {backupCodes.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                </div>
                <Button type="button" variant="outline" className="mt-3" onClick={copyCodes}>
                  <Copy className="mr-2 h-4 w-4" /> Copy codes
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
