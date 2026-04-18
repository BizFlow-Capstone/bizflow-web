"use client";

import { authFetch } from "@/lib/auth/tokenManager";
import { firebaseApp } from "@/lib/firebase/client";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

export type DashboardNotificationItem = {
  id: string;
  title: string;
  body: string;
  route: string;
  receivedAt: string;
  isRead: boolean;
};

const DEVICE_TOKEN_KEY = "bizflow_device_token_web";
const NOTIFICATION_ITEMS_KEY = "bizflow_notification_items";
const NOTIFICATION_UPDATED_EVENT = "bizflow-notifications-updated";
const NOTIFICATION_INCOMING_EVENT = "bizflow-notification-incoming";
const MAX_NOTIFICATION_ITEMS = 30;

let foregroundUnsubscribe: (() => void) | null = null;
let isForegroundListenerAttached = false;

function canUseBrowserApis(): boolean {
  return typeof window !== "undefined";
}

function emitNotificationUpdatedEvent() {
  if (!canUseBrowserApis()) return;
  window.dispatchEvent(new Event(NOTIFICATION_UPDATED_EVENT));
}

function emitIncomingNotificationEvent(item: DashboardNotificationItem) {
  if (!canUseBrowserApis()) return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_INCOMING_EVENT, {
      detail: item,
    }),
  );
}

function readRawItems(): DashboardNotificationItem[] {
  if (!canUseBrowserApis()) return [];

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DashboardNotificationItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeRawItems(items: DashboardNotificationItem[]) {
  if (!canUseBrowserApis()) return;
  window.localStorage.setItem(NOTIFICATION_ITEMS_KEY, JSON.stringify(items));
  emitNotificationUpdatedEvent();
}

export function getStoredNotifications(): DashboardNotificationItem[] {
  return readRawItems();
}

export async function fetchNotifications(page = 1, pageSize = 30) {
  try {
    const response = await authFetch(
      `/api/notifications?page=${page}&pageSize=${pageSize}`,
    );
    if (!response.ok) return null;

    const raw = (await response.json()) as {
      success?: boolean;
      data?: { items?: unknown[] };
    };

    if (raw.success && Array.isArray(raw.data?.items)) {
      const items = raw.data.items.map((srv: any) => ({
        id: (srv.userNotificationId ?? srv.id)?.toString() || "",
        title: srv.title || "",
        body: srv.content || srv.body || "",
        route: srv.route || "/dashboard/employees?tab=invitations",
        receivedAt: srv.createdAt || srv.receivedAt || new Date().toISOString(),
        isRead: srv.readAt != null,
      })) as DashboardNotificationItem[];

      writeRawItems(items);
      return items;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch notifications from backend:", error);
    return null;
  }
}

export async function fetchUnreadCount() {
  try {
    const response = await authFetch("/api/notifications/unread-count");
    if (!response.ok) return 0;
    const raw = (await response.json()) as {
      success?: boolean;
      data?: { unreadCount?: number };
    };
    return raw.data?.unreadCount ?? 0;
  } catch {
    return 0;
  }
}

export async function markAllNotificationsAsRead() {
  const items = readRawItems();
  if (items.length === 0) return;

  const nextItems = items.map((item) => ({ ...item, isRead: true }));
  writeRawItems(nextItems);

  try {
    const response = await authFetch("/api/notifications/read-all", {
      method: "PUT",
    });
    return response.ok;
  } catch (error) {
    console.error(
      "Failed to mark all notifications as read on backend:",
      error,
    );
    return false;
  }
}

export async function markNotificationAsRead(userNotificationId: string) {
  if (!userNotificationId) return false;

  const items = readRawItems();
  const index = items.findIndex((item) => item.id === userNotificationId);

  if (index !== -1) {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], isRead: true };
    writeRawItems(nextItems);
  }

  try {
    const response = await authFetch(
      `/api/notifications/${userNotificationId}/read`,
      {
        method: "PUT",
      },
    );
    return response.ok;
  } catch (error) {
    console.error(
      `Failed to mark notification ${userNotificationId} as read:`,
      error,
    );
    return false;
  }
}

function buildNotificationRoute(payload?: MessagePayload): string {
  const type = payload?.data?.type;
  if (
    type === "employee_invite" ||
    type === "employee_removed" ||
    type === "employee_invitation_accepted"
  ) {
    return "/dashboard/employees?tab=invitations";
  }
  return payload?.data?.route || "/dashboard/employees?tab=invitations";
}

function toDashboardNotification(
  payload: MessagePayload,
): DashboardNotificationItem {
  const title = payload.notification?.title?.trim() || "Thông báo mới";
  const body = payload.notification?.body?.trim() || "Bạn có thông báo mới";
  const id =
    payload.data?.userNotificationId ||
    payload.data?.id ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    title,
    body,
    route: buildNotificationRoute(payload),
    receivedAt: new Date().toISOString(),
    isRead: false,
  };
}

function normalizeMessagePayload(payload: unknown): MessagePayload {
  const source = (payload ?? {}) as {
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  };

  return {
    notification: {
      title: source.notification?.title,
      body: source.notification?.body,
    },
    data: source.data,
  } as MessagePayload;
}

export function appendIncomingNotification(
  payload: unknown,
): DashboardNotificationItem {
  const item = toDashboardNotification(normalizeMessagePayload(payload));
  const current = readRawItems();
  const next = [item, ...current].slice(0, MAX_NOTIFICATION_ITEMS);
  writeRawItems(next);
  emitIncomingNotificationEvent(item);
  return item;
}

function getStoredDeviceToken(): string {
  if (!canUseBrowserApis()) return "";
  return window.localStorage.getItem(DEVICE_TOKEN_KEY) ?? "";
}

function setStoredDeviceToken(token: string) {
  if (!canUseBrowserApis()) return;
  if (!token) {
    window.localStorage.removeItem(DEVICE_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(DEVICE_TOKEN_KEY, token);
}

function getPlatformName() {
  return "web";
}

function getDeviceName() {
  if (!canUseBrowserApis()) return "web";
  return window.navigator.userAgent;
}

async function registerDeviceTokenToBackend(token: string) {
  await authFetch("/api/notifications/register-device-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      deviceName: getDeviceName(),
      platform: getPlatformName(),
    }),
  });
}

export async function unregisterWebPushToken() {
  if (!canUseBrowserApis()) return;

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    setStoredDeviceToken("");
    return;
  }

  const existingToken = getStoredDeviceToken();
  if (!existingToken) return;

  try {
    await authFetch("/api/notifications/unregister-device-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: existingToken }),
    });
  } catch {
    // Ignore backend errors during logout flow
  }

  try {
    const messaging = getMessaging(firebaseApp);
    await deleteToken(messaging);
  } catch {
    // Ignore local token deletion errors
  }

  setStoredDeviceToken("");
}

export async function setupWebPushNotifications() {
  if (!canUseBrowserApis()) return;
  if (!window.isSecureContext) return;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  const supported = await isSupported().catch(() => false);
  if (!supported) return;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return;

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== "granted") return;

  const serviceWorkerRegistration =
    await navigator.serviceWorker.register("/push-sw.js");

  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  if (!token) return;

  const existingToken = getStoredDeviceToken();
  if (existingToken !== token) {
    await registerDeviceTokenToBackend(token);
    setStoredDeviceToken(token);
  }

  if (!isForegroundListenerAttached) {
    foregroundUnsubscribe = onMessage(messaging, (payload) => {
      appendIncomingNotification(payload);
    });
    isForegroundListenerAttached = true;
  }
}

export function cleanupWebPushForegroundListener() {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
  }
  isForegroundListenerAttached = false;
}

export const notificationEvents = {
  updated: NOTIFICATION_UPDATED_EVENT,
  incoming: NOTIFICATION_INCOMING_EVENT,
};
