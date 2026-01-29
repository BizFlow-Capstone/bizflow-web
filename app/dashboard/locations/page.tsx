"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sun,
  Bell,
  Settings,
  MapPin,
  User,
  Plus,
  Search,
  Building2,
  MoreHorizontal,
  LayoutGrid,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Component Badge tùy chỉnh cho đẹp hơn
const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
      isActive
        ? "bg-green-50 text-green-700 ring-green-600/20"
        : "bg-gray-50 text-gray-600 ring-gray-500/10"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-green-600" : "bg-gray-500"}`}
    ></span>
    {isActive ? "Đang hoạt động" : "Đã đóng"}
  </span>
);

export default function LocationsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    manager: "",
  });

  const [locations, setLocations] = useState([
    {
      id: 1,
      name: "ĐBKD Quận 1",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      manager: "Nguyễn Văn A",
      isActive: true,
    },
    {
      id: 2,
      name: "ĐBKD Thủ Đức",
      address: "456 Võ Văn Ngân, Thủ Đức, TP.HCM",
      manager: "Trần Thị B",
      isActive: false,
    },
    {
      id: 3,
      name: "ĐBKD Bình Thạnh (Kho Phụ)",
      address: "789 Xô Viết Nghệ Tĩnh, Bình Thạnh",
      manager: "Lê Văn C",
      isActive: true,
    },
  ]);

  const setLocationActive = (id: number, isActive: boolean) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, isActive } : loc)),
    );
  };

  // Logic lọc dữ liệu
  const filteredLocations = locations.filter((loc) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "ACTIVE"
          ? loc.isActive
          : !loc.isActive;

    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const stats = {
    total: locations.length,
    active: locations.filter((l) => l.isActive).length,
    inactive: locations.filter((l) => !l.isActive).length,
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Địa Điểm Kinh Doanh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý trạng thái và thông tin các điểm kinh doanh của bạn
            </p>
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

      <main className="flex-1 p-8 bg-gray-50">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Danh sách kho hàng
            </h2>
            <p className="text-gray-600">
              Quản lý trạng thái và thông tin các điểm kinh doanh.
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white shadow-lg shadow-[#23C4C1]/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo kho mới
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-2">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100/50 rounded-lg sm:w-auto w-full">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "ALL"
                  ? "bg-white text-[#23C4C1] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tất cả{" "}
              <span className="ml-1 text-xs opacity-70 bg-gray-200 px-1.5 py-0.5 rounded-full text-gray-700">
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "ACTIVE"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Hoạt động{" "}
              <span className="ml-1 text-xs opacity-70 bg-green-100 px-1.5 py-0.5 rounded-full text-green-700">
                {stats.active}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("INACTIVE")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "INACTIVE"
                  ? "bg-white text-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Đã đóng{" "}
              <span className="ml-1 text-xs opacity-70 bg-gray-200 px-1.5 py-0.5 rounded-full text-gray-700">
                {stats.inactive}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex-1 flex items-center relative">
            <Search className="w-4 h-4 absolute left-4 text-gray-400 z-10 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
              className="pl-10 border-0 rounded-none focus:border-0 focus:ring-0 shadow-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-gray-200 pl-2">
            <Button variant="ghost" size="icon" className="text-gray-400">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400">
              <ListFilter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Grid Content */}
        {filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card
                key={location.id}
                className={`group relative overflow-hidden transition-all duration-300 border-gray-200 hover:border-[#23C4C1] hover:shadow-lg hover:shadow-[#23C4C1]/10 ${
                  !location.isActive ? "bg-gray-50/50" : "bg-white"
                }`}
              >
                {/* Decorative top bar */}
                <div
                  className={`h-1 w-full absolute top-0 left-0 ${location.isActive ? "bg-[#23C4C1]" : "bg-gray-300"}`}
                ></div>

                <CardContent className="p-6">
                  {/* Header: Name & Switch */}
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-bold ${location.isActive ? "text-gray-800" : "text-gray-500"}`}
                    >
                      {location.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* <span className="text-xs font-medium text-gray-500">
                         tháTrạngi
                      </span> */}
                      <Switch
                        checked={location.isActive}
                        onCheckedChange={(checked) =>
                          setLocationActive(location.id, checked)
                        }
                        className="scale-150 data-[state=checked]:bg-[#23C4C1]"
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <StatusBadge isActive={location.isActive} />
                  </div>

                  {/* Info List */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span className="text-gray-600 leading-snug">
                        {location.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300 delay-75">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600 font-medium">
                        {location.manager}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-end justify-end pt-4 border-t border-gray-100">
                    <Link href={`/dashboard/locations/${location.id}`}>
                      <Button
                        variant="link"
                        className="text-[#23C4C1] hover:text-[#1da8a5] font-semibold p-0 h-auto"
                      >
                        Chi tiết &rarr;
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-600">
              Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
            </p>
          </div>
        )}
      </main>

      {/* Dialog Tạo Kho Mới */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Tạo Địa điểm kinh doanh Mới
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Nhập thông tin chi tiết cho địa điểm kinh doanh mới
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6 space-y-5">
            {/* Tên Địa điểm */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Tên Địa điểm kinh doanh
              </Label>
              <Input
                id="name"
                placeholder="Kho Quận 9"
                value={newLocation.name}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, name: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Địa Chỉ */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-medium text-gray-700"
              >
                Địa Chỉ
              </Label>
              <Input
                id="address"
                placeholder="Quận 9, TP.HCM"
                value={newLocation.address}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, address: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Nhân Viên Quản Lí */}
            <div className="space-y-2">
              <Label
                htmlFor="manager"
                className="text-sm font-medium text-gray-700"
              >
                Thêm Nhân Viên Quản Lí Địa Điểm Kinh Doanh
              </Label>
              <Input
                id="manager"
                placeholder="Nguyễn Văn A"
                value={newLocation.manager}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, manager: e.target.value })
                }
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewLocation({ name: "", address: "", manager: "" });
              }}
              className="mr-2"
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              onClick={() => {
                // Xử lý thêm kho mới
                const newId = locations.length + 1;
                setLocations([
                  ...locations,
                  {
                    id: newId,
                    name: newLocation.name,
                    address: newLocation.address,
                    manager: newLocation.manager,
                    isActive: true,
                  },
                ]);
                setIsDialogOpen(false);
                setNewLocation({ name: "", address: "", manager: "" });
              }}
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
            >
              Thêm Địa điểm kinh doanh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
