import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  CalendarClock,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminAnnouncements />
    </RequireSuperAdmin>
  ),
});

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  severity: "INFO" | "WARN" | "CRITICAL";
  startsAt: string;
  endsAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type AnnouncementStatus = "Published" | "Scheduled" | "Draft";

const SEVERITY_OPTIONS = ["INFO", "WARN", "CRITICAL"] as const;

const SEVERITY_STYLES: Record<string, string> = {
  INFO: "bg-primary/15 text-primary",
  WARN: "bg-warning/15 text-warning",
  CRITICAL: "bg-destructive/15 text-destructive",
};

const STATUS_STYLES: Record<string, string> = {
  Published: "bg-success/15 text-success",
  Scheduled: "bg-primary/15 text-primary",
  Draft: "bg-muted text-muted-foreground",
};

const toDateTimeLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const statusOf = (a: Announcement): AnnouncementStatus => {
  if (a.isPublished) return "Published";
  if (new Date(a.startsAt).getTime() > Date.now()) return "Scheduled";
  return "Draft";
};

function SuperAdminAnnouncements() {
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newSeverity, setNewSeverity] = useState<string>("INFO");
  const [newStartsAt, setNewStartsAt] = useState(() => toDateTimeLocal(new Date()));

  const [scheduling, setScheduling] = useState<Announcement | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  const { data: announcements = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-announcements"],
    queryFn: () => api.get<Announcement[]>("/super-admin/announcements"),
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      return api.post("/super-admin/announcements", {
        title: newTitle.trim(),
        body: newBody.trim() || undefined,
        severity: newSeverity,
        startsAt: new Date(newStartsAt).toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-announcements"] });
      toast.success("Announcement created");
      setShowCreate(false);
      setNewTitle("");
      setNewBody("");
      setNewSeverity("INFO");
      setNewStartsAt(toDateTimeLocal(new Date()));
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const publishAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/super-admin/announcements/${id}/publish`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-announcements"] });
      toast.success("Announcement published");
    },
    onError: (e: any) => toast.error(e.message ?? "Publish failed"),
  });

  const scheduleAnnouncement = useMutation({
    mutationFn: async ({ id, startsAt }: { id: string; startsAt: string }) => {
      return api.patch(`/super-admin/announcements/${id}/schedule`, { startsAt });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-announcements"] });
      toast.success("Announcement scheduled");
      setScheduling(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Schedule failed"),
  });

  const openSchedule = (a: Announcement) => {
    setScheduling(a);
    setScheduleDate(toDateTimeLocal(new Date(a.startsAt)));
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Publish and schedule platform-wide announcements"
        actions={
          <Button size="sm" className="gradient-primary text-white" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Announcement
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load announcements</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Megaphone className="h-6 w-6" />
              </div>
              <p className="font-semibold">No announcements yet</p>
              <p className="text-sm text-muted-foreground">
                Create announcements to notify users across the platform.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Starts At</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => {
                  const status = statusOf(a);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{a.title}</span>
                          {a.body && (
                            <span className="max-w-[320px] truncate text-xs text-muted-foreground">
                              {a.body}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_STYLES[a.severity]}>{a.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_STYLES[status]}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(a.startsAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(a.createdAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {status !== "Published" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => publishAnnouncement.mutate(a.id)}
                              disabled={publishAnnouncement.isPending}
                            >
                              {publishAnnouncement.isPending ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => openSchedule(a)}
                              disabled={scheduleAnnouncement.isPending}
                            >
                              <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                              Schedule
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setNewTitle(""); setNewBody(""); setNewSeverity("INFO"); setNewStartsAt(toDateTimeLocal(new Date())); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Compose a new platform-wide announcement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. Scheduled maintenance" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Input placeholder="e.g. The platform will be down on Saturday 11 PM IST" value={newBody} onChange={(e) => setNewBody(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Severity *</Label>
                <Select value={newSeverity} onValueChange={setNewSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Starts At *</Label>
                <Input type="datetime-local" value={newStartsAt} onChange={(e) => setNewStartsAt(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              className="gradient-primary text-white"
              disabled={createAnnouncement.isPending || !newTitle.trim() || !newStartsAt}
              onClick={() => createAnnouncement.mutate()}
            >
              {createAnnouncement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!scheduling} onOpenChange={(o) => { if (!o) setScheduling(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Announcement</DialogTitle>
            <DialogDescription>
              Set a future start time for "{scheduling?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-4">
            <Label>Starts At *</Label>
            <Input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduling(null)}>Cancel</Button>
            <Button
              className="gradient-primary text-white"
              disabled={scheduleAnnouncement.isPending || !scheduleDate || !scheduling}
              onClick={() => scheduling && scheduleAnnouncement.mutate({ id: scheduling.id, startsAt: new Date(scheduleDate).toISOString() })}
            >
              {scheduleAnnouncement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
