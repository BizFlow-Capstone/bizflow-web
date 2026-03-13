"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Bell, Settings, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type HeaderContent = {
  title: string;
  description: string;
};

const defaultHeader: HeaderContent = {
  title: "Tổng Quan Hệ Thống",
  description: "Theo dõi hoạt động kinh doanh và quản lý dữ liệu tập trung.",
};

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
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-blue-600 text-white">
                LV
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Lê Văn A
              </div>
              <div className="text-xs text-gray-600">Chủ Kho</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
