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
  UserPlus,
  Trash2,
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
  DropdownMenuSeparator,
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
  useCreateAdminConsultant,
  useDeleteAdminConsultant,
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

function formatRoleLabel(role: string) {
  switch (role.toLowerCase()) {
    case "consultant":
      return "Accountant";
    default:
      return role;
  }
}

function canRevokeRefreshTokens(role: string) {
  return role.toLowerCase() === "user";
}

export default function AdminAccountsClient() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageNumber, setPageNumber] = useState(1);
  const [mountedAt] = useState(() => Date.now());
  const [revokeDialogUser, setRevokeDialogUser] =
    useState<AdminManagedUser | null>(null);
  const [deleteDialogUser, setDeleteDialogUser] =
    useState<AdminManagedUser | null>(null);
  const [isCreateConsultantOpen, setIsCreateConsultantOpen] = useState(false);
  const [consultantForm, setConsultantForm] = useState({
    email: "",
    fullName: "",
  });
  const [consultantFormError, setConsultantFormError] = useState("");

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
  const createConsultantMutation = useCreateAdminConsultant();
  const revokeTokensMutation = useRevokeAdminUserRefreshTokens();
  const deleteConsultantMutation = useDeleteAdminConsultant();

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

  const resetConsultantForm = () => {
    setConsultantForm({ email: "", fullName: "" });
    setConsultantFormError("");
  };

  const handleCreateConsultant = () => {
    const email = consultantForm.email.trim().toLowerCase();
    const fullName = consultantForm.fullName.trim();

    if (!email) {
      setConsultantFormError("Vui lòng nhập email cho accountant.");
      return;
    }

    if (!fullName) {
      setConsultantFormError("Vui lòng nhập họ và tên accountant.");
      return;
    }

    setConsultantFormError("");
    createConsultantMutation.mutate(
      { email, fullName },
      {
        onSuccess: (result) => {
          toast.success(
            `Đã tạo tài khoản accountant cho ${result.email} và gửi email hướng dẫn.`,
          );
          setIsCreateConsultantOpen(false);
          resetConsultantForm();
          setPageNumber(1);
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Không thể tạo tài khoản accountant.";
          setConsultantFormError(message);
          toast.error(message);
        },
      },
    );
  };

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

  const handleDeleteConsultant = () => {
    if (!deleteDialogUser) return;

    deleteConsultantMutation.mutate(deleteDialogUser.accountId, {
      onSuccess: () => {
        toast.success(
          `Đã xóa tài khoản accountant "${deleteDialogUser.fullName || deleteDialogUser.email}".`,
        );
        setDeleteDialogUser(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể xóa tài khoản accountant.",
        );
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản Lý Người Dùng
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Xem, tìm kiếm và tạo nhanh tài khoản accountant cho hệ thống.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetConsultantForm();
            setIsCreateConsultantOpen(true);
          }}
          className="bg-[#23C4C1] hover:bg-[#1a9b99]"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Tạo tài khoản kế toán
        </Button>
      </div>

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
                  <SelectItem value="Consultant">Accountant</SelectItem>
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
                        {formatRoleLabel(user.role)}
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
                      {canRevokeRefreshTokens(user.role) ? (
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
                      ) : user.role.toLowerCase() === "consultant" ? (
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-red-600 focus:text-red-600"
                              onClick={() => setDeleteDialogUser(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Xóa tài khoản
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
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
        open={isCreateConsultantOpen}
        onOpenChange={(open) => {
          setIsCreateConsultantOpen(open);
          if (!open) resetConsultantForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản accountant</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tạo tài khoản role consultant/accountant và gửi email
              chào mừng. Khi đăng nhập lần đầu, accountant sẽ được yêu cầu đổi
              mật khẩu mới.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="consultant-full-name">Họ và tên</Label>
              <Input
                id="consultant-full-name"
                value={consultantForm.fullName}
                onChange={(e) =>
                  setConsultantForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                placeholder="Nhập họ và tên accountant"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="consultant-email">Email</Label>
              <Input
                id="consultant-email"
                type="email"
                value={consultantForm.email}
                onChange={(e) =>
                  setConsultantForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="accountant@bizflow.vn"
              />
            </div>

            <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3 text-sm text-teal-800">
              Sau khi tạo xong, accountant sẽ nhận email hướng dẫn và dùng luồng
              đặt mật khẩu mới ngay trong màn hình đăng nhập.
            </div>

            {consultantFormError ? (
              <p className="text-sm text-red-600">{consultantFormError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateConsultantOpen(false)}
              disabled={createConsultantMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleCreateConsultant}
              disabled={createConsultantMutation.isPending}
              className="bg-[#23C4C1] hover:bg-[#1a9b99]"
            >
              {createConsultantMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tạo tài khoản
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Delete consultant dialog */}
      <Dialog
        open={deleteDialogUser != null}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogUser(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Xóa tài khoản accountant</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Tài khoản accountant sẽ bị xóa
              vĩnh viễn khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>

          {deleteDialogUser ? (
            <div className="rounded-lg border bg-red-50/50 border-red-200 p-3 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-medium">Tên:</span>{" "}
                {deleteDialogUser.fullName || "--"}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {deleteDialogUser.email || "--"}
              </p>
              <p>
                <span className="font-medium">AccountId:</span>{" "}
                {deleteDialogUser.accountId}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogUser(null)}
              disabled={deleteConsultantMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConsultant}
              disabled={deleteConsultantMutation.isPending}
            >
              {deleteConsultantMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa tài khoản
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
