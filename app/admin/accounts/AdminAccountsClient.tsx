"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Shield,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useAdminUsers,
  useRevokeAdminUserRefreshTokens,
} from "@/hooks/useAdminUsers";
import type { AdminManagedUser } from "@/lib/types/adminUserManagement";

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleColor(role: string) {
  switch (role.toLowerCase()) {
    case "admin":
      return "bg-violet-50 text-violet-700 hover:bg-violet-50";
    case "consultant":
      return "bg-amber-50 text-amber-700 hover:bg-amber-50";
    default:
      return "bg-gray-50 text-gray-600 hover:bg-gray-50";
  }
}

export default function AdminAccountsClient() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageNumber, setPageNumber] = useState(1);
  const [mountedAt] = useState(() => Date.now());
  const [revokeDialogUser, setRevokeDialogUser] =
    useState<AdminManagedUser | null>(null);

  const pageSize = 10;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPageNumber(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPageNumber(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPageNumber(1);
  };

  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      search: search.trim() || undefined,
      role: roleFilter === "ALL" ? undefined : roleFilter,
      isActive:
        statusFilter === "ACTIVE"
          ? true
          : statusFilter === "INACTIVE"
            ? false
            : undefined,
    }),
    [pageNumber, pageSize, roleFilter, search, statusFilter],
  );

  const usersQuery = useAdminUsers(queryParams);
  const revokeTokensMutation = useRevokeAdminUserRefreshTokens();

  const users = usersQuery.data?.items ?? [];
  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;
  const sevenDaysAgo = mountedAt - 7 * 24 * 60 * 60 * 1000;
  const recentLoginCount = users.filter((user) => {
    if (!user.lastLoginAt) return false;
    const loginTime = new Date(user.lastLoginAt).getTime();
    return loginTime >= sevenDaysAgo;
  }).length;

  const totalCount = usersQuery.data?.totalCount ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 1;

  const handleRevokeTokens = () => {
    if (!revokeDialogUser) return;

    revokeTokensMutation.mutate(revokeDialogUser.accountId, {
      onSuccess: () => {
        toast.success("Đã thu hồi toàn bộ phiên đăng nhập của người dùng.");
        setRevokeDialogUser(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể thu hồi phiên đăng nhập.",
        );
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem, tìm kiếm và quản lý tài khoản người dùng trên nền tảng.
        </p>
      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Tài khoản trang này",
            value: users.length,
            icon: Shield,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Đang hoạt động",
            value: activeCount,
            icon: Shield,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Đã vô hiệu",
            value: inactiveCount,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Login trong 7 ngày",
            value: recentLoginCount,
            icon: Calendar,
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
                  <p className="text-xs font-medium text-gray-500">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="users-search">Từ khóa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="users-search"
                  className="pl-9"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="users-role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger id="users-role-filter" className="w-full">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả role</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="users-status-filter">Trạng thái</Label>
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger id="users-status-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Vô hiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">
              Danh Sách Người Dùng ({totalCount})
            </CardTitle>
            {usersQuery.isFetching ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang cập nhật dữ liệu
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Login cuối</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex items-center justify-center py-10 text-gray-500 text-sm gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải danh sách người dùng
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {usersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <p className="text-sm text-red-600">
                        {usersQuery.error instanceof Error
                          ? usersQuery.error.message
                          : "Không thể tải danh sách người dùng."}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => usersQuery.refetch()}
                      >
                        <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                        Tải lại
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {!usersQuery.isLoading &&
              !usersQuery.isError &&
              users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-10 text-center text-sm text-gray-500">
                      Không có người dùng phù hợp với bộ lọc.
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {!usersQuery.isLoading &&
                !usersQuery.isError &&
                users.map((user) => (
                  <TableRow key={user.accountId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          {(user.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {user.fullName || "Người dùng chưa cập nhật tên"}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email || "--"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {user.phone || "--"}
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
                    <TableCell className="text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatDateTime(user.lastLoginAt)}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => setRevokeDialogUser(user)}
                          >
                            <Shield className="w-4 h-4" />
                            Thu hồi phiên đăng nhập
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Trang {pageNumber} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1 || usersQuery.isFetching}
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber >= totalPages || usersQuery.isFetching}
                onClick={() =>
                  setPageNumber((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={revokeDialogUser != null}
        onOpenChange={(open) => {
          if (!open) setRevokeDialogUser(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thu hồi tất cả phiên đăng nhập</DialogTitle>
            <DialogDescription>
              Người dùng sẽ bị đăng xuất khỏi mọi thiết bị sau khi thu hồi
              refresh token.
            </DialogDescription>
          </DialogHeader>

          {revokeDialogUser ? (
            <div className="rounded-lg border bg-amber-50/50 border-amber-200 p-3 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-medium">Người dùng:</span>{" "}
                {revokeDialogUser.fullName || "--"}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {revokeDialogUser.email || "--"}
              </p>
              <p>
                <span className="font-medium">AccountId:</span>{" "}
                {revokeDialogUser.accountId}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeDialogUser(null)}
              disabled={revokeTokensMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRevokeTokens}
              disabled={revokeTokensMutation.isPending}
            >
              {revokeTokensMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thu hồi
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Thu hồi ngay
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
