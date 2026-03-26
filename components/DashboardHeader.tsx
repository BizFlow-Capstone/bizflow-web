"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BellRing,
  Check,
  LogOut,
  MapPin,
  Settings,
  Sun,
  UserCircle,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import type { Location } from "@/lib/types/location";
import type { AuthAccount, AuthCredentialsData } from "@/lib/types/auth";
import {
  appendIncomingNotification,
  cleanupWebPushForegroundListener,
  fetchNotifications,
  getStoredNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationEvents,
  setupWebPushNotifications,
  type DashboardNotificationItem,
} from "@/lib/notifications/pushClient";

type HeaderContent = {
  title: string;
  description: string;
};

type HeaderProfile = {
  fullName: string;
  avatarUrl: string;
  subtitle: string;
  initials: string;
};

type FloatingToast = DashboardNotificationItem & {
  toastId: string;
  createdAt: number;
  durationMs: number;
};

const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";
const TOAST_DURATION_MS = 6500;
const MAX_FLOATING_TOASTS = 3;

const defaultProfile: HeaderProfile = {
  fullName: "Tài khoản BizFlow",
  avatarUrl: "",
  subtitle: "Tài khoản Google",
  initials: "BF",
};

const defaultHeader: HeaderContent = {
  title: "Tổng Quan Hệ Thống",
  description: "Theo dõi hoạt động kinh doanh và quản lý dữ liệu tập trung.",
};

type LocationWithRole = Location & {
  isOwner?: boolean;
  IsOwner?: boolean;
};

function getLocationOwnerRole(
  location?: LocationWithRole,
): "Chủ" | "Nhân viên" {
  if (!location) return "Nhân viên";
  return (location.isOwner ?? location.IsOwner) ? "Chủ" : "Nhân viên";
}

function getInitials(fullName?: string): string {
  const name = (fullName ?? "").trim();
  if (!name) return defaultProfile.initials;

  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || defaultProfile.initials;
}

function getSubtitle(
  account?: AuthAccount,
  credentials?: AuthCredentialsData,
): string {
  const combinedIdentifiers = [
    ...(account?.credentials ?? []).map((item) => item.identifier),
    ...((credentials?.credentials ?? []).map((item) => item.identifier) ?? []),
  ];

  const preferred = combinedIdentifiers.find(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0 &&
      value.trim().toLowerCase() !== "connected" &&
      value.includes("@"),
  );

  const fallback = combinedIdentifiers.find(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0 &&
      value.trim().toLowerCase() !== "connected",
  );

  return preferred ?? fallback ?? defaultProfile.subtitle;
}

function getHeaderContent(pathname: string): HeaderContent {
  if (pathname === "/dashboard") {
    return {
      title: "Trang Chủ",
      description: "Xem nhanh tình hình kinh doanh và các chỉ số quan trọng.",
    };
  }

  if (pathname.startsWith("/dashboard/orders")) {
    if (pathname.includes("/create")) {
      return {
        title: "Tạo Đơn Hàng",
        description: "Khởi tạo đơn hàng mới và cập nhật thông tin bán hàng.",
      };
    }

    if (pathname.includes("/payment")) {
      return {
        title: "Thanh Toán Đơn Hàng",
        description: "Ghi nhận thanh toán và theo dõi công nợ đơn hàng.",
      };
    }

    if (pathname.includes("/edit")) {
      return {
        title: "Chỉnh Sửa Đơn Hàng",
        description: "Cập nhật thông tin chi tiết của đơn hàng hiện tại.",
      };
    }

    if (/^\/dashboard\/orders\/[^/]+$/.test(pathname)) {
      return {
        title: "Chi Tiết Đơn Hàng",
        description: "Theo dõi trạng thái và thông tin chi tiết của đơn hàng.",
      };
    }

    return {
      title: "Quản Lý Đơn Hàng",
      description: "Theo dõi, xử lý và tra cứu toàn bộ đơn hàng của bạn.",
    };
  }

  if (pathname.startsWith("/dashboard/imports")) {
    if (pathname.includes("/create")) {
      return {
        title: "Tạo Phiếu Nhập",
        description: "Tạo phiếu nhập kho mới và cập nhật hàng hóa nhập.",
      };
    }

    if (pathname.includes("/edit")) {
      return {
        title: "Chỉnh Sửa Phiếu Nhập",
        description: "Điều chỉnh thông tin phiếu nhập kho hiện tại.",
      };
    }

    if (/^\/dashboard\/imports\/[^/]+$/.test(pathname)) {
      return {
        title: "Chi Tiết Phiếu Nhập",
        description: "Xem chi tiết thông tin và trạng thái của phiếu nhập.",
      };
    }

    return {
      title: "Quản Lý Nhập Kho",
      description: "Kiểm soát các phiếu nhập và luồng hàng vào kho.",
    };
  }

  if (pathname.startsWith("/dashboard/products")) {
    return {
      title: "Quản Lý Kinh Doanh Tổng Hợp",
      description:
        "Quản lý sản phẩm theo mô hình đa địa điểm và điều phối vận hành chung.",
    };
  }

  if (pathname.startsWith("/dashboard/customers")) {
    if (pathname.includes("/create")) {
      return {
        title: "Tạo Khách Hàng Mới",
        description: "Thêm hồ sơ khách hàng và thiết lập thông tin ban đầu.",
      };
    }

    if (pathname.includes("/payment")) {
      return {
        title: "Ghi Nhận Thanh Toán",
        description: "Cập nhật thanh toán và theo dõi công nợ khách hàng.",
      };
    }

    if (/^\/dashboard\/customers\/[^/]+$/.test(pathname)) {
      return {
        title: "Chi Tiết Khách Hàng",
        description: "Theo dõi lịch sử giao dịch và thông tin khách hàng.",
      };
    }

    return {
      title: "Quản Lý Khách Hàng",
      description:
        "Quản lý danh sách khách hàng và chăm sóc khách hàng thân thiết.",
    };
  }

  if (pathname.startsWith("/dashboard/locations")) {
    if (pathname.includes("/products/new")) {
      return {
        title: "Thêm Sản Phẩm Vào Địa Điểm",
        description: "Tạo mới sản phẩm và gắn vào địa điểm kinh doanh cụ thể.",
      };
    }

    if (/^\/dashboard\/locations\/[^/]+$/.test(pathname)) {
      return {
        title: "Quản Lý Kinh Doanh Theo Địa Điểm",
        description:
          "Theo dõi và vận hành sản phẩm tại một địa điểm kinh doanh cụ thể.",
      };
    }

    return {
      title: "Quản lý Địa Điểm Kinh Doanh",
      description:
        "Quản lý trạng thái và thông tin các điểm kinh doanh của bạn",
    };
  }

  if (pathname.startsWith("/dashboard/employees")) {
    return {
      title: "Quản Lý Nhân Viên",
      description: "Theo dõi thông tin, vai trò và trạng thái nhân sự.",
    };
  }

  if (pathname.startsWith("/dashboard/reports")) {
    return {
      title: "Báo Cáo & Thống Kê",
      description:
        "Phân tích dữ liệu kinh doanh và theo dõi hiệu suất hoạt động.",
    };
  }

  if (pathname.startsWith("/dashboard/profile")) {
    return {
      title: "Cài Đặt Tài Khoản",
      description:
        "Quản lý phương thức đăng nhập và bảo mật tài khoản của bạn.",
    };
  }

  if (pathname.startsWith("/dashboard/settings")) {
    return {
      title: "Cài Đặt Hệ Thống",
      description: "Tùy chỉnh cấu hình và thông tin hệ thống của doanh nghiệp.",
    };
  }

  return defaultHeader;
}

export default function DashboardHeader() {
  const pathname = usePathname();
  const shouldHideHeader = useMemo(
    () =>
      /^\/dashboard\/locations\/[^/]+\/products\/(?!new(?:\/|$))[^/]+(?:\/|$)/.test(
        pathname,
      ),
    [pathname],
  );
  const content = useMemo(() => getHeaderContent(pathname), [pathname]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<HeaderProfile>(defaultProfile);
  const [notifications, setNotifications] = useState<
    DashboardNotificationItem[]
  >([]);
  const [floatingToasts, setFloatingToasts] = useState<FloatingToast[]>([]);
  const [toastTick, setToastTick] = useState(Date.now());
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const floatingTimerRef = useRef<Record<string, number>>({});
  const { selectedLocationId, switchLocation } = useDashboardLocation();
  const { data: locations = [], isLoading: isLoadingLocations } =
    useLocations();

  const typedLocations = locations as LocationWithRole[];

  const activeLocation = useMemo(() => {
    if (typedLocations.length === 0) return undefined;
    if (!selectedLocationId || selectedLocationId <= 0)
      return typedLocations[0];
    return (
      typedLocations.find((location) => location.id === selectedLocationId) ??
      typedLocations[0]
    );
  }, [typedLocations, selectedLocationId]);

  const roleLabel = getLocationOwnerRole(activeLocation);
  const locationLabel = activeLocation?.name ?? "Chưa chọn địa điểm";
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const refreshNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  const clearFloatingTimer = (toastId?: string) => {
    if (toastId) {
      const timerId = floatingTimerRef.current[toastId];
      if (timerId) {
        window.clearTimeout(timerId);
        delete floatingTimerRef.current[toastId];
      }
      return;
    }

    Object.values(floatingTimerRef.current).forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    floatingTimerRef.current = {};
  };

  const dismissFloatingToast = (toastId: string) => {
    setFloatingToasts((prev) =>
      prev.filter((toast) => toast.toastId !== toastId),
    );
    clearFloatingTimer(toastId);
  };

  const showFloatingNotification = (item: DashboardNotificationItem) => {
    const toast: FloatingToast = {
      ...item,
      toastId: `${item.id}-${Date.now()}`,
      createdAt: Date.now(),
      durationMs: TOAST_DURATION_MS,
    };

    setFloatingToasts((prev) => {
      const next = [toast, ...prev].slice(0, MAX_FLOATING_TOASTS);
      const nextIds = new Set(next.map((item) => item.toastId));

      prev.forEach((item) => {
        if (!nextIds.has(item.toastId)) {
          clearFloatingTimer(item.toastId);
        }
      });

      return next;
    });

    floatingTimerRef.current[toast.toastId] = window.setTimeout(() => {
      dismissFloatingToast(toast.toastId);
    }, toast.durationMs);
  };

  const navigateToNotificationRoute = (
    route?: string,
    toastId?: string,
    notificationId?: string,
  ) => {
    const targetRoute =
      route?.trim() || "/dashboard/employees?tab=invitations";
    setIsNotificationMenuOpen(false);

    if (notificationId) {
      void markNotificationAsRead(notificationId);
    } else if (toastId && toastId.includes("-")) {
      // Best-effort to try and get original ID from floating toast if not provided.
      const originalId = toastId.split("-")[0];
      if (originalId) {
        void markNotificationAsRead(originalId);
      }
    }

    if (toastId) {
      dismissFloatingToast(toastId);
    } else {
      setFloatingToasts([]);
      clearFloatingTimer();
    }

    const currentRoute = `${window.location.pathname}${window.location.search}`;
    if (currentRoute === targetRoute) {
      window.location.reload();
      return;
    }

    window.location.assign(targetRoute);
  };

  const getToastProgress = (toast: FloatingToast) => {
    const elapsed = toastTick - toast.createdAt;
    const remaining = Math.max(0, toast.durationMs - elapsed);
    return (remaining / toast.durationMs) * 100;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncProfileFromStorage = () => {
      try {
        const rawAccount = window.localStorage.getItem(AUTH_ACCOUNT_KEY);
        const rawCredentials =
          window.localStorage.getItem(AUTH_CREDENTIALS_KEY);

        const account = rawAccount
          ? (JSON.parse(rawAccount) as AuthAccount)
          : undefined;
        const credentials = rawCredentials
          ? (JSON.parse(rawCredentials) as AuthCredentialsData)
          : undefined;

        const fullName = account?.fullName?.trim() || defaultProfile.fullName;

        setProfile({
          fullName,
          avatarUrl: account?.avatarUrl?.trim() || "",
          subtitle: getSubtitle(account, credentials),
          initials: getInitials(fullName),
        });
      } catch {
        setProfile(defaultProfile);
      }
    };

    syncProfileFromStorage();

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === AUTH_ACCOUNT_KEY ||
        event.key === AUTH_CREDENTIALS_KEY ||
        event.key === null
      ) {
        syncProfileFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_UPDATED_EVENT, syncProfileFromStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_UPDATED_EVENT, syncProfileFromStorage);
    };
  }, []);

  useEffect(() => {
    if (floatingToasts.length === 0) return;

    const intervalId = window.setInterval(() => {
      setToastTick(Date.now());
    }, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [floatingToasts.length]);

  useEffect(() => {
    refreshNotifications();
    void fetchNotifications();

    void setupWebPushNotifications().catch(() => {
      // Ignore push setup failures to keep header stable.
    });

    const handleNotificationUpdated = () => {
      refreshNotifications();
    };

    const handleIncomingNotification = (event: Event) => {
      const incomingItem = (event as CustomEvent<DashboardNotificationItem>)
        .detail;
      if (!incomingItem) return;
      showFloatingNotification(incomingItem);
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; payload?: unknown; route?: string }
        | undefined;

      if (!data?.type) return;

      if (data.type === "BIZFLOW_PUSH" && data.payload) {
        appendIncomingNotification(data.payload);
        return;
      }

      if (data.type === "BIZFLOW_PUSH_CLICK" && data.route) {
        navigateToNotificationRoute(data.route);
      }
    };

    window.addEventListener(
      notificationEvents.updated,
      handleNotificationUpdated,
    );
    window.addEventListener(
      notificationEvents.incoming,
      handleIncomingNotification,
    );
    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );

    return () => {
      window.removeEventListener(
        notificationEvents.updated,
        handleNotificationUpdated,
      );
      window.removeEventListener(
        notificationEvents.incoming,
        handleIncomingNotification,
      );
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
      clearFloatingTimer();
      cleanupWebPushForegroundListener();
    };
  }, []);

  const handleNotificationMenuOpenChange = (open: boolean) => {
    setIsNotificationMenuOpen(open);
    if (open) {
      refreshNotifications();
    }
  };

  if (shouldHideHeader) {
    return null;
  }

  return (
    <>
      {floatingToasts.length > 0 && (
        <div className="fixed right-4 top-20 z-90 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3">
          {floatingToasts.map((toast) => (
            <button
              key={toast.toastId}
              type="button"
              onClick={() =>
                navigateToNotificationRoute(toast.route, toast.toastId)
              }
              className="group w-full overflow-hidden rounded-2xl border border-cyan-100 bg-white/95 p-4 text-left shadow-[0_20px_45px_-18px_rgba(17,24,39,0.35)] backdrop-blur transition hover:border-cyan-200 hover:shadow-[0_24px_55px_-18px_rgba(14,116,144,0.35)]"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <BellRing className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Thông báo mới
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 line-clamp-1">
                    {toast.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {toast.body}
                  </p>
                  <p className="mt-2 text-xs font-medium text-cyan-700 group-hover:underline">
                    Mở trang Nhân viên
                  </p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissFloatingToast(toast.toastId);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      dismissFloatingToast(toast.toastId);
                    }
                  }}
                  aria-label="Đóng thông báo nổi"
                >
                  <X className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-cyan-100/60">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-[width] duration-200"
                  style={{ width: `${getToastProgress(toast)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {content.title}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{content.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Sun className="w-5 h-5 text-gray-600" />
            </Button>

            <DropdownMenu
              open={isNotificationMenuOpen}
              onOpenChange={handleNotificationMenuOpenChange}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-90 p-0">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Thông báo
                    </p>
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-cyan-50 text-[10px] font-bold text-cyan-700 border border-cyan-100/50">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void markAllNotificationsAsRead().then(() =>
                          refreshNotifications(),
                        );
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#23C4C1] hover:text-[#1ba8a5] transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    Chưa có thông báo mới.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          item.isRead ? "bg-white" : "bg-cyan-50/40"
                        }`}
                        onClick={() => {
                          navigateToNotificationRoute(item.route, undefined, item.id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                              {item.body}
                            </p>
                          </div>
                          {!item.isRead && (
                            <span className="w-2 h-2 mt-1 rounded-full bg-[#23C4C1] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(item.receivedAt).toLocaleString("vi-VN")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>

            <div className="flex items-center gap-3 ml-4">
              <Dialog
                open={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#23C4C1]/50"
                    aria-label="Mở hồ sơ tài khoản"
                  >
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={profile.avatarUrl || undefined} />
                    </Avatar>
                  </button>
                </DialogTrigger>

                <DialogContent
                  overlayClassName="bg-transparent"
                  className="sm:max-w-105 p-0 overflow-hidden sm:left-auto! sm:right-8! sm:top-20! sm:translate-x-0! sm:translate-y-0!"
                >
                  <DialogHeader className="sr-only">
                    <DialogTitle>Thông tin tài khoản</DialogTitle>
                    <DialogDescription>
                      Hồ sơ, địa điểm làm việc và thao tác tài khoản.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-4 bg-gray-50">
                    <div className="rounded-xl bg-slate-100 px-4 py-5 text-center">
                      <Avatar className="mx-auto h-14 w-14 mb-3">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {profile.initials}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-base font-semibold text-gray-900">
                        {profile.fullName} · {locationLabel}
                      </p>
                      <p className="text-sm text-gray-600">
                        {profile.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-2">
                    <Link
                      href="/dashboard/profile"
                      className="w-full inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileModalOpen(false)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-gray-500" />
                        <span>Tài Khoản</span>
                      </span>
                    </Link>
                  </div>

                  <Separator />

                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      Danh sách địa điểm
                    </p>
                    <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                      {isLoadingLocations && (
                        <p className="text-sm text-gray-500 px-2 py-1">
                          Đang tải địa điểm...
                        </p>
                      )}

                      {!isLoadingLocations && typedLocations.length === 0 && (
                        <p className="text-sm text-gray-500 px-2 py-1">
                          Chưa có địa điểm khả dụng.
                        </p>
                      )}

                      {typedLocations.map((location) => {
                        const isActive =
                          (selectedLocationId === null &&
                            activeLocation?.id === location.id) ||
                          selectedLocationId === location.id;
                        const locationRole = getLocationOwnerRole(location);

                        return (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => {
                              if (selectedLocationId !== location.id) {
                                switchLocation(location.id);
                              }
                              setIsProfileModalOpen(false);
                            }}
                            className="w-full flex items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-gray-50"
                          >
                            <span className="inline-flex items-center gap-2 min-w-0">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="truncate text-sm text-gray-800">
                                {location.name}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-2 shrink-0">
                              <span className="text-xs text-gray-500">
                                {locationRole}
                              </span>
                              {isActive && (
                                <Check className="h-4 w-4 text-emerald-600" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="px-4 py-3 space-y-1">
                    <Link
                      href="/dashboard/settings"
                      className="w-full inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileModalOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Setting
                    </Link>
                    <Link
                      href="/auth/logout"
                      className="w-full inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>

              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {locationLabel}
                </div>
                <div className="text-xs text-gray-600">{roleLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
