"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  Globe,
  Loader2,
  MonitorCog,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getStoredLocale,
  LOCALE_CHANGED_EVENT,
  setStoredLocale,
  type AppLocale,
} from "@/lib/auth/tokenManager";
import {
  fetchNotifications,
  getStoredNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationEvents,
  type DashboardNotificationItem,
} from "@/lib/notifications/pushClient";

type ThemePreference = "system" | "light" | "dark";

const THEME_PREFERENCE_KEY = "bizflow_theme_preference";

function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  const stored = window.localStorage.getItem(THEME_PREFERENCE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system";
}

function applyThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark =
    preference === "dark" || (preference === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", shouldUseDark);
}

function persistThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  applyThemePreference(preference);
}

export default function SettingsClient() {
  const [locale, setLocale] = useState<AppLocale>(() => getStoredLocale());
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [notifications, setNotifications] = useState<
    DashboardNotificationItem[]
  >([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isRefreshingNotifications, setIsRefreshingNotifications] =
    useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );
  const localeLabel = locale === "vi" ? "Tiếng Việt" : "English";
  const themeLabel =
    themePreference === "system"
      ? "Theo hệ thống"
      : themePreference === "dark"
        ? "Tối"
        : "Sáng";

  const refreshNotifications = async (showLoader: boolean) => {
    if (showLoader) {
      setIsLoadingNotifications(true);
    } else {
      setIsRefreshingNotifications(true);
    }

    await fetchNotifications();
    setNotifications(getStoredNotifications());

    if (showLoader) {
      setIsLoadingNotifications(false);
    } else {
      setIsRefreshingNotifications(false);
    }
  };

  useEffect(() => {
    const savedThemePreference = getStoredThemePreference();
    setThemePreference(savedThemePreference);
    applyThemePreference(savedThemePreference);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() === "system") {
        applyThemePreference("system");
      }
    };

    media.addEventListener("change", handleSystemThemeChange);

    return () => {
      media.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    const onLocaleChanged = (event: Event) => {
      setLocale((event as CustomEvent<AppLocale>).detail);
    };

    window.addEventListener(LOCALE_CHANGED_EVENT, onLocaleChanged);

    return () => {
      window.removeEventListener(LOCALE_CHANGED_EVENT, onLocaleChanged);
    };
  }, []);

  useEffect(() => {
    setNotifications(getStoredNotifications());
    void refreshNotifications(true);

    const handleNotificationUpdated = () => {
      setNotifications(getStoredNotifications());
    };

    window.addEventListener(
      notificationEvents.updated,
      handleNotificationUpdated,
    );

    return () => {
      window.removeEventListener(
        notificationEvents.updated,
        handleNotificationUpdated,
      );
    };
  }, []);

  const handleChangeLocale = (nextLocale: AppLocale) => {
    setStoredLocale(nextLocale);
    setLocale(nextLocale);
    toast.success("Đã cập nhật ngôn ngữ hiển thị mặc định");
  };

  const handleChangeTheme = (nextTheme: ThemePreference) => {
    persistThemePreference(nextTheme);
    setThemePreference(nextTheme);
    toast.success("Đã cập nhật giao diện mặc định");
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    await markAllNotificationsAsRead();
    await fetchNotifications();
    setNotifications(getStoredNotifications());
    setIsMarkingAllRead(false);
    toast.success("Đã đánh dấu toàn bộ thông báo là đã đọc");
  };

  const handleOpenNotification = async (item: DashboardNotificationItem) => {
    if (!item.isRead) {
      await markNotificationAsRead(item.id);
      setNotifications(getStoredNotifications());
    }

    if (item.route) {
      window.location.assign(item.route);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 overflow-auto bg-linear-to-b from-[#f6fbfb] via-gray-50 to-gray-50">
        <div className="mx-auto w-full max-w-7xl p-5 sm:p-6 lg:p-8 space-y-6">
          <section className="rounded-2xl border border-cyan-100/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Cài đặt hệ thống
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Quản lý ngôn ngữ, giao diện và theo dõi toàn bộ thông báo hệ
                  thống.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <span className="inline-flex items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Tổng: {notifications.length}
                </span>
                <span className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Chưa đọc: {unreadCount}
                </span>
                <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  Ngôn ngữ: {localeLabel}
                </span>
                <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  Giao diện: {themeLabel}
                </span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="space-y-6 xl:col-span-4">
              <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-[#23C4C1]" />
                  <h2 className="font-semibold text-gray-800">Hiển thị</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngôn ngữ mặc định
                    </label>
                    <Select
                      value={locale}
                      onValueChange={(value) =>
                        handleChangeLocale(value as AppLocale)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-gray-500">
                      Áp dụng cho các nội dung có hỗ trợ đa ngôn ngữ.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giao diện mặc định
                    </label>
                    <Select
                      value={themePreference}
                      onValueChange={(value) =>
                        handleChangeTheme(value as ThemePreference)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <span className="inline-flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            Sáng
                          </span>
                        </SelectItem>
                        <SelectItem value="dark">
                          <span className="inline-flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            Tối
                          </span>
                        </SelectItem>
                        <SelectItem value="system">
                          <span className="inline-flex items-center gap-2">
                            <MonitorCog className="w-4 h-4" />
                            Theo hệ thống
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-gray-500">
                      Theo hệ thống sẽ tự động đổi sáng/tối theo thiết bị.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <h2 className="font-semibold text-gray-800 mb-2">
                  Gợi ý thêm cho cài đặt hệ thống
                </h2>
                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                  <li>Bật/tắt thông báo âm thanh khi có cảnh báo mới.</li>
                  <li>Ẩn hiện thông báo đã đọc sau một khoảng thời gian.</li>
                  <li>Tùy chỉnh tab mặc định khi vào trang Dashboard.</li>
                </ul>
              </div>
            </section>

            <section className="xl:col-span-8">
              <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#23C4C1]" />
                    <h2 className="font-semibold text-gray-800">
                      Thông báo hệ thống
                    </h2>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700 border border-cyan-100">
                      {notifications.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => void refreshNotifications(false)}
                      disabled={isRefreshingNotifications}
                    >
                      {isRefreshingNotifications ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      )}
                      Làm mới
                    </Button>

                    <Button
                      size="sm"
                      className="h-8 bg-[#23C4C1] hover:bg-[#1ba8a6]"
                      onClick={() => void handleMarkAllAsRead()}
                      disabled={isMarkingAllRead || unreadCount === 0}
                    >
                      {isMarkingAllRead ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      )}
                      Đánh dấu đã đọc tất cả
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải thông báo...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Chưa có thông báo nào từ hệ thống.
                  </div>
                ) : (
                  <div className="max-h-120 overflow-y-auto divide-y divide-gray-100">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleOpenNotification(item)}
                        className={`w-full text-left px-2 py-3 transition-colors hover:bg-gray-50 ${
                          item.isRead ? "bg-white" : "bg-cyan-50/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                            <Bell className="w-4 h-4" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {item.title || "Thông báo hệ thống"}
                              </p>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#23C4C1] shrink-0" />
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.body ||
                                "Bạn có một thông báo mới từ hệ thống."}
                            </p>

                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(item.receivedAt).toLocaleString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
