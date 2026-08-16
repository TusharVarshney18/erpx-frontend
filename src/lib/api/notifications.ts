import { api } from "@/lib/api/client";

export type AppNotification = {
  id: string;
  organizationId: string;
  userId: string | null;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListNotificationsParams = {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
};

export const notificationsApi = {
  list: async (params: ListNotificationsParams = {}) => {
    const search = new URLSearchParams();
    if (params.page !== undefined) search.set("page", String(params.page));
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    if (params.isRead !== undefined) search.set("isRead", String(params.isRead));
    if (params.type) search.set("type", params.type);
    const qs = search.toString();
    return api.get<AppNotification[]>(`/notifications${qs ? `?${qs}` : ""}`);
  },

  unreadCount: async () => {
    return api.get<{ count: number }>("/notifications/unread-count");
  },

  markRead: async (id: string) => {
    return api.patch<AppNotification>(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    return api.patch<{ count: number }>("/notifications/read-all");
  },

  remove: async (id: string) => {
    return api.delete<{ message: string }>(`/notifications/${id}`);
  },
};
