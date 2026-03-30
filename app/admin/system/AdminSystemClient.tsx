"use client";

import { useState } from "react";
import {
  Pencil,
  Save,
  Database,
  Globe,
  FileSpreadsheet,
  Tag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Mock Data ──────────────────────────────────────────────────────────────────

interface BusinessType {
  id: number;
  name: string;
  code: string;
  vatRate: number;
  isActive: boolean;
}

const mockBusinessTypes: BusinessType[] = [
  {
    id: 1,
    name: "Bán lẻ hàng hoá",
    code: "RETAIL",
    vatRate: 1,
    isActive: true,
  },
  {
    id: 2,
    name: "Vật liệu xây dựng",
    code: "CONSTRUCTION_MATERIAL",
    vatRate: 1,
    isActive: true,
  },
  {
    id: 3,
    name: "Dịch vụ ăn uống (F&B)",
    code: "FNB",
    vatRate: 2,
    isActive: true,
  },
  {
    id: 4,
    name: "Dịch vụ sửa chữa",
    code: "REPAIR_SERVICE",
    vatRate: 2,
    isActive: true,
  },
  {
    id: 5,
    name: "Sản xuất nhỏ",
    code: "SMALL_MANUFACTURING",
    vatRate: 1.5,
    isActive: false,
  },
];

interface TaxRate {
  group: string;
  revenueRange: string;
  vatRate: string;
  pitMethod: string;
  books: string;
}

const mockTaxRates: TaxRate[] = [
  {
    group: "Nhóm 1",
    revenueRange: "< 500 triệu/năm",
    vatRate: "Không chịu thuế",
    pitMethod: "Không chịu thuế",
    books: "S1a-HKD",
  },
  {
    group: "Nhóm 2",
    revenueRange: "500 triệu - 3 tỷ",
    vatRate: "% DT theo ngành",
    pitMethod: "Cách 1 hoặc Cách 2 (15%)",
    books: "S2a hoặc S2b+S2c+S2d+S2e",
  },
  {
    group: "Nhóm 3",
    revenueRange: "3 tỷ - 50 tỷ",
    vatRate: "% DT theo ngành",
    pitMethod: "(DT - CP) × 17%",
    books: "S2b+S2c+S2d+S2e",
  },
  {
    group: "Nhóm 4",
    revenueRange: "> 50 tỷ",
    vatRate: "% DT theo ngành",
    pitMethod: "(DT - CP) × 20%",
    books: "S2b+S2c+S2d+S2e",
  },
];

interface SystemSetting {
  key: string;
  label: string;
  value: string;
  type: "text" | "toggle";
}

const mockSettings: SystemSetting[] = [
  {
    key: "platform_name",
    label: "Tên nền tảng",
    value: "BizFlow",
    type: "text",
  },
  {
    key: "support_email",
    label: "Email hỗ trợ",
    value: "support@bizflow.vn",
    type: "text",
  },
  {
    key: "max_free_products",
    label: "Số sản phẩm tối đa (Free)",
    value: "50",
    type: "text",
  },
  {
    key: "max_free_locations",
    label: "Số địa điểm tối đa (Free)",
    value: "1",
    type: "text",
  },
  {
    key: "ai_voice_enabled",
    label: "AI Voice Order",
    value: "true",
    type: "toggle",
  },
  {
    key: "maintenance_mode",
    label: "Chế độ bảo trì",
    value: "false",
    type: "toggle",
  },
];

// ────────────────────────────────────────────────────────────────────────────────

export default function AdminSystemClient() {
  const [settings, setSettings] = useState(mockSettings);
  const [activeTab, setActiveTab] = useState("general");

  function toggleSetting(key: string) {
    setSettings((prev) =>
      prev.map((s) =>
        s.key === key
          ? { ...s, value: s.value === "true" ? "false" : "true" }
          : s,
      ),
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Cấu Hình Hệ Thống
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý cấu hình platform, loại hình kinh doanh và thuế suất.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="general" className="gap-1.5">
            <Globe className="w-4 h-4" />
            Cài Đặt Chung
          </TabsTrigger>
          <TabsTrigger value="business-types" className="gap-1.5">
            <Tag className="w-4 h-4" />
            Loại Hình KD
          </TabsTrigger>
          <TabsTrigger value="tax-rates" className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            Thuế Suất (TT152)
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-1.5">
            <Database className="w-4 h-4" />
            Database
          </TabsTrigger>
        </TabsList>

        {/* ────────── General Settings ────────── */}
        <TabsContent value="general" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Cài Đặt Chung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {settings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {setting.label}
                    </p>
                    <p className="text-xs text-gray-400">{setting.key}</p>
                  </div>
                  {setting.type === "toggle" ? (
                    <Switch
                      checked={setting.value === "true"}
                      onCheckedChange={() => toggleSetting(setting.key)}
                    />
                  ) : (
                    <Input
                      className="w-64"
                      value={setting.value}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev.map((s) =>
                            s.key === setting.key
                              ? { ...s, value: e.target.value }
                              : s,
                          ),
                        )
                      }
                    />
                  )}
                </div>
              ))}

              <Button className="gap-1.5 bg-teal-600 hover:bg-teal-700 mt-4">
                <Save className="w-4 h-4" />
                Lưu Thay Đổi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────── Business Types ────────── */}
        <TabsContent value="business-types" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Loại Hình Kinh Doanh
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Thêm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead>Thuế GTGT (%)</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBusinessTypes.map((bt) => (
                    <TableRow key={bt.id}>
                      <TableCell className="font-medium text-gray-800">
                        {bt.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {bt.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {bt.vatRate}%
                      </TableCell>
                      <TableCell>
                        {bt.isActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-500 hover:bg-gray-100"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────── Tax Rates ────────── */}
        <TabsContent value="tax-rates" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Thuế Suất Theo Thông Tư 152/2025/TT-BTC
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                Phân loại nhóm HKD theo doanh thu và phương thức nộp thuế
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhóm</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Thuế GTGT</TableHead>
                    <TableHead>Thuế TNCN</TableHead>
                    <TableHead>Sổ KT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTaxRates.map((tax) => (
                    <TableRow key={tax.group}>
                      <TableCell>
                        <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">
                          {tax.group}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 font-medium">
                        {tax.revenueRange}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {tax.vatRate}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px]">
                        {tax.pitMethod}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {tax.books}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────── Database Info ────────── */}
        <TabsContent value="database" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Thông Tin Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Engine", value: "MySQL 8.0" },
                { label: "Host", value: "db.bizflow.vn:3306" },
                { label: "Database", value: "bizflow_production" },
                { label: "Total Tables", value: "42" },
                { label: "Storage Used", value: "1.2 GB" },
                { label: "Last Backup", value: "28/03/2026 02:00 AM" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {row.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
