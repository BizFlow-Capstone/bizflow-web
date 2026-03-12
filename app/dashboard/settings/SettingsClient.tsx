"use client";

import { useState } from "react";
import { Settings, MapPin, Loader2, Calendar, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocations";

export default function SettingsClient() {
  const { data: locations, isLoading } = useLocations();
  const [locationId, setLocationId] = useState<number>(0);

  // Accounting settings state
  const [fiscalYearStart, setFiscalYearStart] = useState("1");
  const [currency, setCurrency] = useState("VND");

  const activeLocationId =
    locationId > 0
      ? locationId
      : locations && locations.length > 0
        ? locations[0].id
        : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Cài Đặt</h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý cấu hình hệ thống và kế toán
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <Select
              value={String(activeLocationId)}
              onValueChange={(v) => setLocationId(Number(v))}
            >
              <SelectTrigger className="w-55">
                <SelectValue placeholder="Chọn cửa hàng" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 bg-gray-50 overflow-auto">
        <div className="max-w-2xl space-y-6">
          {/* Accounting Settings */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-[#23C4C1]" />
              <h2 className="font-semibold text-gray-800">Cấu hình kế toán</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Tháng bắt đầu năm tài chính
                </label>
                <Select
                  value={fiscalYearStart}
                  onValueChange={setFiscalYearStart}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Mặc định: Tháng 1. Ảnh hưởng đến kỳ kế toán tự động.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Đơn vị tiền tệ mặc định
                </label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND — Việt Nam Đồng</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-4" />

            <Button className="bg-[#23C4C1] hover:bg-[#1ba8a6]">
              <Save className="w-4 h-4 mr-1" />
              Lưu cài đặt
            </Button>
          </div>

          {/* Location Info */}
          {locations && activeLocationId > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Thông tin cửa hàng
              </h2>
              {(() => {
                const loc = locations.find((l) => l.id === activeLocationId);
                if (!loc) return null;
                return (
                  <div className="space-y-3 text-sm">
                    <InfoRow label="Tên" value={loc.name} />
                    <InfoRow label="Địa chỉ" value={loc.address} />
                    <InfoRow label="Quận/Huyện" value={loc.district} />
                    <InfoRow label="Thành phố" value={loc.city} />
                    <InfoRow label="Điện thoại" value={loc.phone} />
                    <InfoRow label="Chủ sở hữu" value={loc.ownerName} />
                    <InfoRow
                      label="Trạng thái"
                      value={loc.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                    />
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-32 text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
