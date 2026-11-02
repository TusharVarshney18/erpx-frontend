import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, LocateFixed, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export type AttendanceMode = "ANYWHERE" | "GEOFENCE" | "SELFIE_GEOFENCE" | "DISABLED";

export type AttendancePolicyValues = {
  attendanceMode?: AttendanceMode;
  officeLatitude?: number | string | null;
  officeLongitude?: number | string | null;
  officeRadiusMeters?: number;
  workdayStartTime?: string;
  lateGraceMinutes?: number;
};

const MODES: { value: AttendanceMode; title: string; description: string }[] = [
  {
    value: "ANYWHERE",
    title: "Anywhere",
    description: "Employees can check in from anywhere. Location is recorded when shared.",
  },
  {
    value: "GEOFENCE",
    title: "At the office (geofence)",
    description: "Check-in only works within the radius of the office location.",
  },
  {
    value: "SELFIE_GEOFENCE",
    title: "At the office + selfie",
    description:
      "Geofence plus a front-camera selfie on every check-in and check-out (mobile app).",
  },
  {
    value: "DISABLED",
    title: "Off: HR records attendance",
    description: "Employees can't check in themselves. They can still request corrections.",
  },
];

const str = (v: number | string | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

/** Company Settings → Attendance: how employees may check in. */
export function AttendancePolicySettings({
  orgId,
  initial,
}: {
  orgId: string;
  initial: AttendancePolicyValues;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<AttendanceMode>(initial.attendanceMode ?? "ANYWHERE");
  const [lat, setLat] = useState(str(initial.officeLatitude));
  const [lng, setLng] = useState(str(initial.officeLongitude));
  const [radius, setRadius] = useState(str(initial.officeRadiusMeters ?? 200));
  const [start, setStart] = useState(initial.workdayStartTime ?? "09:30");
  const [grace, setGrace] = useState(str(initial.lateGraceMinutes ?? 15));
  const [locating, setLocating] = useState(false);
  // `initial` seeds the form once; the parent remounts (via `key`) when the
  // organization's settings are (re)loaded.

  const geofence = mode === "GEOFENCE" || mode === "SELFIE_GEOFENCE";

  const validate = (): string | null => {
    const la = lat.trim() === "" ? null : Number(lat);
    const lo = lng.trim() === "" ? null : Number(lng);
    if (la !== null && (!Number.isFinite(la) || la < -90 || la > 90))
      return "Latitude must be between -90 and 90.";
    if (lo !== null && (!Number.isFinite(lo) || lo < -180 || lo > 180))
      return "Longitude must be between -180 and 180.";
    if (geofence && (la === null || lo === null))
      return "Set the office location to use geofenced check-in.";
    const r = Number(radius);
    if (!Number.isInteger(r) || r < 20 || r > 5000)
      return "Radius must be a whole number between 20 and 5000 m.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) return "Workday start must be HH:mm (24-hour).";
    const g = Number(grace);
    if (!Number.isInteger(g) || g < 0 || g > 240) return "Grace must be between 0 and 240 minutes.";
    return null;
  };

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/organizations/${orgId}/settings`, {
        attendanceMode: mode,
        officeLatitude: lat.trim() === "" ? null : Number(lat),
        officeLongitude: lng.trim() === "" ? null : Number(lng),
        officeRadiusMeters: Number(radius),
        workdayStartTime: start,
        lateGraceMinutes: Number(grace),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-settings", orgId] });
      toast.success("Attendance policy saved");
    },
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("This browser can't share its location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(6));
        setLng(p.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success(`Location captured (±${Math.round(p.coords.accuracy)} m). Save to apply.`);
      },
      () => {
        setLocating(false);
        toast.error("Allow location access in your browser, or type the coordinates.");
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Check-in mode</Label>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                mode === m.value && "border-primary ring-1 ring-primary",
              )}
            >
              <p className="font-medium">{m.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={cn("space-y-3", !geofence && "opacity-70")}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <Label>Office location</Label>
            <p className="text-xs text-muted-foreground">
              {geofence ? "Required for geofenced check-in." : "Optional in this mode."} Tip: open
              the office in Google Maps, right-click the building and copy the coordinates.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
            )}
            Use my current location
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="office-lat">Latitude</Label>
            <Input
              id="office-lat"
              inputMode="decimal"
              placeholder="12.971599"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="office-lng">Longitude</Label>
            <Input
              id="office-lng"
              inputMode="decimal"
              placeholder="77.594566"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="office-radius">Allowed radius (m)</Label>
            <Input
              id="office-radius"
              type="number"
              min={20}
              max={5000}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="workday-start">Workday starts at</Label>
          <Input
            id="workday-start"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="late-grace">Late after (grace, minutes)</Label>
          <Input
            id="late-grace"
            type="number"
            min={0}
            max={240}
            value={grace}
            onChange={(e) => setGrace(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            A check-in after start + grace (company timezone) is marked late.
          </p>
        </div>
      </div>

      <Separator />
      <div className="flex justify-end">
        <Button
          className="gradient-primary text-white"
          disabled={save.isPending}
          onClick={() => {
            const error = validate();
            if (error) toast.error(error);
            else save.mutate();
          }}
        >
          {save.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Save Attendance Policy
        </Button>
      </div>
    </div>
  );
}
