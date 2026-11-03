import { api } from "@/lib/api/client";

/**
 * Employee self-service API (the same endpoints the mobile app uses).
 * Every call acts on the signed-in user's own employee record, so no HR
 * permission is needed.
 */

export type MyEmployee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  employmentStatus: "ACTIVE" | "INACTIVE" | "TERMINATED";
  joiningDate: string | null;
  department: { id: string; name: string } | null;
  designation: { id: string; name: string } | null;
};

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | string;

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
};

export type AttendanceMode = "ANYWHERE" | "GEOFENCE" | "SELFIE_GEOFENCE" | "DISABLED";

export type AttendancePolicy = {
  mode: AttendanceMode;
  requiresLocation: boolean;
  requiresSelfie: boolean;
  officeConfigured: boolean;
  officeRadiusMeters: number;
};

export type PunchLocation = { latitude?: number; longitude?: number; accuracy?: number };

/** Browser geolocation as a promise; throws a readable message. */
export function browserLocation(): Promise<Required<PunchLocation>> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This browser can't share your location. Use the ERPX mobile app."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      () => reject(new Error("Allow location access in your browser to check in.")),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

export type LeaveType = "CASUAL" | "SICK" | "ANNUAL" | "UNPAID";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveRequest = {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  rejectionReason: string | null;
  createdAt: string;
};

const base = (orgId: string) => `/hrms/organizations/${orgId}/self`;

export const selfServiceApi = {
  employee: (orgId: string) => api.get<MyEmployee | null>(`${base(orgId)}/employee`),

  today: (orgId: string) => api.get<AttendanceRecord | null>(`${base(orgId)}/attendance/today`),

  attendance: (orgId: string, from: string, to: string) =>
    api.get<AttendanceRecord[]>(`${base(orgId)}/attendance`, { params: { from, to } }),

  policy: (orgId: string) => api.get<AttendancePolicy>(`${base(orgId)}/attendance/policy`),

  checkIn: (orgId: string, location: PunchLocation = {}) =>
    api.post<AttendanceRecord>(`${base(orgId)}/attendance/check-in`, {
      ...location,
      source: "WEB",
    }),

  checkOut: (orgId: string, location: PunchLocation = {}) =>
    api.post<AttendanceRecord>(`${base(orgId)}/attendance/check-out`, {
      ...location,
      source: "WEB",
    }),

  leave: (orgId: string) => api.get<LeaveRequest[]>(`${base(orgId)}/leave`),

  applyLeave: (
    orgId: string,
    body: { leaveType: LeaveType; startDate: string; endDate: string; reason?: string },
  ) => api.post<LeaveRequest>(`${base(orgId)}/leave`, body),
};

export const leaveApprovalApi = {
  approve: (orgId: string, id: string) =>
    api.post(`/hrms/organizations/${orgId}/leave/${id}/approve`),
  reject: (orgId: string, id: string, reason?: string) =>
    api.post(`/hrms/organizations/${orgId}/leave/${id}/reject`, reason ? { reason } : {}),
};

export type LinkableUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  linkedEmployee: { id: string; name: string; employeeCode: string } | null;
};

export const employeeLinkApi = {
  linkableUsers: (orgId: string) =>
    api.get<LinkableUser[]>(`/hrms/organizations/${orgId}/employees/linkable-users`),
  setUser: (orgId: string, employeeId: string, userId: string | null) =>
    api.patch(`/hrms/organizations/${orgId}/employees/${employeeId}`, { userId }),
};
