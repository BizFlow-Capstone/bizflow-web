"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Mock Data ──────────────────────────────────────────────────────────────────

interface MockUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "User" | "Admin" | "Consultant";
  isActive: boolean;
  locationsCount: number;
  createdAt: string;
  lastLogin: string;
}

const mockUsers: MockUser[] = [
  {
    id: "u-001",
    fullName: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    phone: "0912345678",
    role: "User",
    isActive: true,
    locationsCount: 2,
    createdAt: "2026-01-15T08:00:00Z",
    lastLogin: "2026-03-28T07:30:00Z",
  },
  {
    id: "u-002",
    fullName: "Trần Thị Bích",
    email: "tranthibich@gmail.com",
    phone: "0987654321",
    role: "User",
    isActive: true,
    locationsCount: 1,
    createdAt: "2026-02-01T08:00:00Z",
    lastLogin: "2026-03-27T14:20:00Z",
  },
  {
    id: "u-003",
    fullName: "Lê Minh Thiện",
    email: "thien.admin@bizflow.vn",
    phone: "0363053659",
    role: "Admin",
    isActive: true,
    locationsCount: 0,
    createdAt: "2025-12-01T08:00:00Z",
    lastLogin: "2026-03-28T09:00:00Z",
  },
  {
    id: "u-004",
    fullName: "Phạm Quốc Dũng",
    email: "dungpq@example.com",
    phone: "0901234567",
    role: "User",
    isActive: false,
    locationsCount: 1,
    createdAt: "2026-01-20T08:00:00Z",
    lastLogin: "2026-02-15T10:00:00Z",
  },
  {
    id: "u-005",
    fullName: "Vũ Hoàng Hiếu Ngân",
    email: "ngan.consultant@bizflow.vn",
    phone: "0966288741",
    role: "Consultant",
    isActive: true,
    locationsCount: 0,
    createdAt: "2025-12-15T08:00:00Z",
    lastLogin: "2026-03-28T08:15:00Z",
  },
  {
    id: "u-006",
    fullName: "Hoàng Mai Linh",
    email: "linhhoang@shop.vn",
    phone: "0932111222",
    role: "User",
    isActive: true,
    locationsCount: 3,
    createdAt: "2026-02-10T08:00:00Z",
    lastLogin: "2026-03-28T06:45:00Z",
  },
  {
    id: "u-007",
    fullName: "Đặng Văn Tùng",
    email: "tungdv@yahoo.com",
    phone: "0978333444",
    role: "User",
    isActive: true,
    locationsCount: 1,
    createdAt: "2026-03-01T08:00:00Z",
    lastLogin: "2026-03-26T15:00:00Z",
  },
  {
    id: "u-008",
    fullName: "Bùi Thanh Hà",
    email: "hathanhbui@gmail.com",
    phone: "0845667788",
    role: "User",
    isActive: false,
    locationsCount: 0,
    createdAt: "2026-03-10T08:00:00Z",
    lastLogin: "2026-03-12T09:00:00Z",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function roleColor(role: string) {
  switch (role) {
    case "Admin":
      return "bg-violet-50 text-violet-700 hover:bg-violet-50";
    case "Consultant":
      return "bg-amber-50 text-amber-700 hover:bg-amber-50";
    default:
      return "bg-gray-50 text-gray-600 hover:bg-gray-50";
  }
}

// ────────────────────────────────────────────────────────────────────────────────

export default function AdminAccountsClient() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockUsers.filter((u) => {
    if (
      search &&
      !u.fullName.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase()) &&
      !u.phone.includes(search)
    )
      return false;
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter === "ACTIVE" && !u.isActive) return false;
    if (statusFilter === "INACTIVE" && u.isActive) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Quản Lý Người Dùng
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem, tìm kiếm và quản lý tài khoản người dùng trên nền tảng.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng tài khoản",
            value: mockUsers.length,
            icon: Shield,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Đang hoạt động",
            value: mockUsers.filter((u) => u.isActive).length,
            icon: UserCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Đã vô hiệu",
            value: mockUsers.filter((u) => !u.isActive).length,
            icon: UserX,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Địa điểm KD",
            value: mockUsers.reduce((s, u) => s + u.locationsCount, 0),
            icon: MapPin,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {s.label}
                  </p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, email hoặc SĐT..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả role</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Vô hiệu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Danh Sách Người Dùng ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Địa điểm KD</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Login cuối</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {user.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={roleColor(user.role)}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.locationsCount}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(user.lastLogin)}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      >
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-500 hover:bg-gray-100"
                      >
                        Vô hiệu
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          {user.isActive ? (
                            <>
                              <UserX className="w-4 h-4" />
                              Vô hiệu hoá
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Kích hoạt
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
