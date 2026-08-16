import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings,
  Shield,
  Bell,
  Globe,
  Save,
  KeyRound,
  Laptop,
  LogOut,
} from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Company Settings — Acme ERP" }] }),
  component: CompanySettingsPage,
});

type Organization = {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl: string | null;
  domain: string | null;
  plan: string;
  status: string;
  roleVersion: number;
  createdAt: string;
  updatedAt: string;
};

type SessionInfo = {
  id: string;
  userId: string;
  organizationId: string;
  deviceName: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
};

type OrgSettings = {
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
  numberFormat: string;
  sessionTimeout: number;
  minPasswordLength: number;
  requireMfa: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
};

const DEFAULT_SETTINGS: OrgSettings = {
  timezone: "Asia/Kolkata",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  language: "en",
  numberFormat: "en-IN",
  sessionTimeout: 60,
  minPasswordLength: 8,
  requireMfa: false,
  emailNotifications: true,
  inAppNotifications: true,
};

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

const CURRENCIES = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "AED", label: "AED (د.إ)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "AUD", label: "AUD (A$)" },
];

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD.MM.YYYY"];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "bn", label: "Bengali (বাংলা)" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "mr", label: "Marathi (मराठी)" },
  { value: "gu", label: "Gujarati (ગુજરાતી)" },
  { value: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { value: "ml", label: "Malayalam (മലയാളം)" },
];

const NUMBER_FORMATS = [
  { value: "en-IN", label: "Indian (1,23,456.78)" },
  { value: "en-US", label: "US (123,456.78)" },
  { value: "de-DE", label: "German (123.456,78)" },
  { value: "fr-FR", label: "French (123 456,78)" },
];

function CompanySettingsPage() {
  const qc = useQueryClient();
  const { activeOrganizationId, switchOrganization } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");

  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["admin-organizations", activeOrganizationId],
    queryFn: () => api.get<Organization[]>("/organizations?limit=100"),
  });

  const { isLoading: settingsLoading } = useQuery({
    queryKey: ["org-settings", activeOrganizationId],
    queryFn: async () => {
      const data = await api.get<OrgSettings>(`/organizations/${activeOrganizationId}/settings`);
      if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        setSettingsLoaded(true);
      }
      return data;
    },
    enabled: !!activeOrganizationId,
  });

  const createOrg = useMutation({
    mutationFn: async () => {
      return api.post("/organizations", {
        name: newName.trim(),
        code: newCode
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, ""),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast.success("Company created");
      setShowCreate(false);
      setNewName("");
      setNewCode("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const updateOrg = useMutation({
    mutationFn: async (org: Organization) => {
      return api.patch(`/organizations/${org.id}`, {
        name: editName.trim(),
        domain: editDomain.trim() || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast.success("Company updated");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const deleteOrg = useMutation({
    mutationFn: async (org: Organization) => {
      return api.delete(`/organizations/${org.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast.success("Company deleted");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const saveSettings = useMutation({
    mutationFn: async (values: OrgSettings) => {
      return api.patch(`/organizations/${activeOrganizationId}/settings`, values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-settings", activeOrganizationId] });
      toast.success("Settings saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: ["security-sessions"],
    queryFn: () => api.get<SessionInfo[]>("/security/sessions"),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      return api.post("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password changed");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (e: any) => toast.error(e.message ?? "Password change failed"),
  });

  const revokeSession = useMutation({
    mutationFn: async (id: string) => api.delete(`/security/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-sessions"] });
      toast.success("Session revoked");
    },
    onError: (e: any) => toast.error(e.message ?? "Revoke failed"),
  });

  const revokeAllSessions = useMutation({
    mutationFn: async () => api.post("/security/sessions/logout-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-sessions"] });
      toast.success("All other sessions revoked");
    },
    onError: (e: any) => toast.error(e.message ?? "Revoke failed"),
  });

  const newPasswordError =
    pwForm.newPassword.length > 0 && pwForm.newPassword.length < 8
      ? "New password must be at least 8 characters"
      : "";
  const confirmError =
    pwForm.confirmPassword.length > 0 && pwForm.confirmPassword !== pwForm.newPassword
      ? "Passwords do not match"
      : "";
  const canChangePassword =
    pwForm.currentPassword.length > 0 &&
    pwForm.newPassword.length >= 8 &&
    pwForm.newPassword === pwForm.confirmPassword;

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const activeOrg = orgs.find((o) => o.id === activeOrganizationId);

  const updateSetting = <K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Company Settings"
        subtitle="Manage organizations and configure global preferences."
        actions={
          <Button
            size="sm"
            className="gradient-primary text-white"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Company
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => (
            <Card
              key={org.id}
              className={org.id === activeOrganizationId ? "ring-1 ring-primary/30" : ""}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{org.name}</span>
                    {org.id === activeOrganizationId && (
                      <Badge variant="secondary" className="text-[10px]">
                        Active
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {org.plan}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-0.5">
                    <span>Code: {org.code}</span>
                    {org.domain && <span>Domain: {org.domain}</span>}
                    <span>Status: {org.status}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditing(org);
                      setEditName(org.name);
                      setEditDomain(org.domain ?? "");
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleting(org)}
                    disabled={org.id === activeOrganizationId}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              {activeOrg.name} Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="general" className="gap-1.5">
                    <Building2 className="h-4 w-4" /> General
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-1.5">
                    <Shield className="h-4 w-4" /> Security
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-1.5">
                    <Bell className="h-4 w-4" /> Notifications
                  </TabsTrigger>
                  <TabsTrigger value="localization" className="gap-1.5">
                    <Globe className="h-4 w-4" /> Localization
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Company Name</Label>
                      <Input value={activeOrg.name} disabled className="bg-muted/50" />
                      <p className="text-xs text-muted-foreground">
                        Edit using the pencil icon above.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Domain</Label>
                      <Input value={activeOrg.domain ?? ""} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Timezone</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(v) => updateSetting("timezone", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Currency</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={(v) => updateSetting("currency", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(v) => updateSetting("dateFormat", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_FORMATS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      className="gradient-primary text-white"
                      disabled={saveSettings.isPending}
                      onClick={() => saveSettings.mutate(settings)}
                    >
                      {saveSettings.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Save General Settings
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Minimum Password Length</Label>
                      <Input
                        type="number"
                        min={4}
                        max={128}
                        value={settings.minPasswordLength}
                        onChange={(e) =>
                          updateSetting(
                            "minPasswordLength",
                            Math.max(4, Math.min(128, Number(e.target.value) || 8)),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Session Timeout (minutes)</Label>
                      <Input
                        type="number"
                        min={5}
                        max={1440}
                        value={settings.sessionTimeout}
                        onChange={(e) =>
                          updateSetting(
                            "sessionTimeout",
                            Math.max(5, Math.min(1440, Number(e.target.value) || 60)),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="text-sm font-medium">Require Multi-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">
                          Enforce MFA for all users in this organization.
                        </p>
                      </div>
                      <Switch
                        checked={settings.requireMfa}
                        onCheckedChange={(v) => updateSetting("requireMfa", v)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <KeyRound className="h-4 w-4" /> Change Password
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Current Password</Label>
                          <Input
                            type="password"
                            value={pwForm.currentPassword}
                            onChange={(e) =>
                              setPwForm((p) => ({
                                ...p,
                                currentPassword: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>New Password</Label>
                          <Input
                            type="password"
                            value={pwForm.newPassword}
                            onChange={(e) =>
                              setPwForm((p) => ({
                                ...p,
                                newPassword: e.target.value,
                              }))
                            }
                          />
                          {newPasswordError && (
                            <p className="text-xs text-destructive">{newPasswordError}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Confirm New Password</Label>
                          <Input
                            type="password"
                            value={pwForm.confirmPassword}
                            onChange={(e) =>
                              setPwForm((p) => ({
                                ...p,
                                confirmPassword: e.target.value,
                              }))
                            }
                          />
                          {confirmError && (
                            <p className="text-xs text-destructive">{confirmError}</p>
                          )}
                        </div>
                        <Button
                          className="gradient-primary text-white"
                          disabled={!canChangePassword || changePassword.isPending}
                          onClick={() => changePassword.mutate()}
                        >
                          {changePassword.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Change Password
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Laptop className="h-4 w-4" /> Active Sessions
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={revokeAllSessions.isPending}
                          onClick={() => revokeAllSessions.mutate()}
                        >
                          {revokeAllSessions.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <LogOut className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Revoke all other sessions
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {sessionsLoading ? (
                          <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-10 w-full" />
                            ))}
                          </div>
                        ) : sessionsError ? (
                          <p className="text-sm text-destructive">
                            Failed to load sessions:{" "}
                            {(sessionsError as Error)?.message ?? "Unknown error"}
                          </p>
                        ) : sessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No active sessions.</p>
                        ) : (
                          <div className="space-y-2">
                            {sessions.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {s.deviceName || "Unknown device"}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {s.ipAddress || "—"} · Last active {formatDate(s.lastActiveAt)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0 text-destructive"
                                  disabled={revokeSession.isPending}
                                  onClick={() => revokeSession.mutate(s.id)}
                                >
                                  <LogOut className="mr-1.5 h-3.5 w-3.5" /> Revoke
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      className="gradient-primary text-white"
                      disabled={saveSettings.isPending}
                      onClick={() => saveSettings.mutate(settings)}
                    >
                      {saveSettings.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Save Security Settings
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="text-sm font-medium">Email Notifications</p>
                        <p className="text-xs text-muted-foreground">
                          Send email notifications for invoices, reports, and alerts.
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(v) => updateSetting("emailNotifications", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="text-sm font-medium">In-App Notifications</p>
                        <p className="text-xs text-muted-foreground">
                          Show notifications inside the application.
                        </p>
                      </div>
                      <Switch
                        checked={settings.inAppNotifications}
                        onCheckedChange={(v) => updateSetting("inAppNotifications", v)}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      className="gradient-primary text-white"
                      disabled={saveSettings.isPending}
                      onClick={() => saveSettings.mutate(settings)}
                    >
                      {saveSettings.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Save Notification Settings
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="localization" className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Language</Label>
                      <Select
                        value={settings.language}
                        onValueChange={(v) => updateSetting("language", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(v) => updateSetting("dateFormat", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_FORMATS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Number Format</Label>
                      <Select
                        value={settings.numberFormat}
                        onValueChange={(v) => updateSetting("numberFormat", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NUMBER_FORMATS.map((nf) => (
                            <SelectItem key={nf.value} value={nf.value}>
                              {nf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      className="gradient-primary text-white"
                      disabled={saveSettings.isPending}
                      onClick={() => saveSettings.mutate(settings)}
                    >
                      {saveSettings.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Save Localization Settings
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={showCreate}
        onOpenChange={(o) => {
          if (!o) {
            setShowCreate(false);
            setNewName("");
            setNewCode("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Company</DialogTitle>
            <DialogDescription>Create a new organization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                placeholder="e.g. Acme Corp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company Code *</Label>
              <Input
                placeholder="e.g. acme-corp"
                value={newCode}
                onChange={(e) =>
                  setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={createOrg.isPending}
              onClick={() => createOrg.mutate()}
            >
              {createOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update company details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input
                placeholder="e.g. acme.com"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={updateOrg.isPending}
              onClick={() => editing && updateOrg.mutate(editing)}
            >
              {updateOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete <strong>{deleting?.name}</strong>. You can restore it later via
              the API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleting && deleteOrg.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
