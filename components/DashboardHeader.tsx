"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Check, LogOut, MapPin, Settings, Sun, User } from "lucide-react";
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
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import type { Location } from "@/lib/types/location";
import type { AuthAccount, AuthCredentialsData } from "@/lib/types/auth";

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

const AUTH_ACCOUNT_KEY = "bizflow_auth_account";
const AUTH_CREDENTIALS_KEY = "bizflow_auth_credentials";
const AUTH_UPDATED_EVENT = "bizflow-auth-updated";

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
      title: "Quản Lý Sản Phẩm",
      description:
        "Quản lý danh mục, tồn kho và thông tin sản phẩm kinh doanh.",
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
        title: "Chi Tiết Địa Điểm Kinh Doanh",
        description:
          "Xem thông tin chi tiết và hoạt động của địa điểm đã chọn.",
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
  const content = useMemo(() => getHeaderContent(pathname), [pathname]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<HeaderProfile>(defaultProfile);
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

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{content.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{content.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Sun className="w-5 h-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5 text-gray-600" />
          </Button>
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
                    <p className="text-sm text-gray-600">{profile.subtitle}</p>
                  </div>
                </div>

                <div className="px-4 py-3 space-y-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-lg px-2 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </span>
                  </button>
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
  );
}
