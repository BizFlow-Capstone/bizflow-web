"use client";

import { ShieldOff } from "lucide-react";

interface OwnerOnlyScreenProps {
  featureName?: string;
}

/**
 * Shown when an employee navigates to an owner-only section.
 * Employees can still see the screen exists but cannot interact with it.
 */
export default function OwnerOnlyScreen({
  featureName = "tính năng này",
}: OwnerOnlyScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-slate-500 select-none">
      <div className="rounded-full bg-slate-100 p-5">
        <ShieldOff className="w-10 h-10 text-slate-400" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-base font-semibold text-slate-700">
          Không có quyền truy cập
        </h2>
        <p className="text-sm max-w-xs">
          Chỉ chủ địa điểm mới có thể sử dụng{" "}
          <span className="font-medium">{featureName}</span>. Vui lòng liên hệ
          chủ cửa hàng nếu cần hỗ trợ.
        </p>
      </div>
    </div>
  );
}
