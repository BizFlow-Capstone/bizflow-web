"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Loader2,
  Search,
  User,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAcceptInvitation,
  useEmployees,
  useEmployeeSearch,
  useInviteEmployee,
  usePendingInvitations,
  useRejectInvitation,
  useRemoveEmployee,
} from "@/hooks/useEmployees";
import OwnerOnlyScreen from "@/components/OwnerOnlyScreen";
import { useLocationRole } from "@/hooks/useLocationRole";

type EmployeeTab = "employees" | "invitations";

function getInitials(value: string) {
  return value
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

export default function EmployeesClient() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "invitations" ? "invitations" : "employees";
  const { data: employees, isLoading, error } = useEmployees();
  const {
    data: invitations,
    isLoading: invitationLoading,
    error: invitationError,
  } = usePendingInvitations();

  const inviteMutation = useInviteEmployee();
  const removeMutation = useRemoveEmployee();
  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();

  const [activeTab, setActiveTab] = useState<EmployeeTab>(initialTab);
  const [search, setSearch] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [debouncedInviteQuery, setDebouncedInviteQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedInviteQuery(inviteQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [inviteQuery]);

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useEmployeeSearch(debouncedInviteQuery);

  const filtered = employees?.filter((e) => {
    const keyword = search.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(keyword) ||
      e.email.toLowerCase().includes(keyword) ||
      (e.phone ?? "").toLowerCase().includes(keyword)
    );
  });

  const handleInvite = async (employeeId: string) => {
    try {
      await inviteMutation.mutateAsync(employeeId);
      setInviteQuery("");
      setDebouncedInviteQuery("");
      setIsInviteDialogOpen(false);
    } catch {
      // Error is surfaced by mutation state
    }
  };

  const handleRemove = async (employeeId: string, fullName: string) => {
    const accepted = window.confirm(
      `Xóa nhân viên ${fullName} khỏi danh sách quản lý?`,
    );
    if (!accepted) return;

    try {
      await removeMutation.mutateAsync(employeeId);
    } catch {
      // Error is surfaced by mutation state
    }
  };

  const employeeSummary = useMemo(
    () => `${employees?.length ?? 0} nhân viên`,
    [employees?.length],
  );

  const { isOwner, isLoading: isRoleLoading } = useLocationRole();

  if (isRoleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  if (!isOwner) {
    return <OwnerOnlyScreen featureName="Quản Lý Nhân Viên" />;
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gray-50">
        <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Users className="w-4 h-4 mr-1" />
              {employeeSummary}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {invitations?.length ?? 0} lời mời chờ xử lý
            </Badge>
          </div>

          <Button
            className="bg-[#23C4C1] hover:bg-[#1aa8a5]"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Mời nhân viên
          </Button>
        </div>

        <div className="mb-5 flex gap-2">
          <Button
            variant={activeTab === "employees" ? "default" : "outline"}
            className={activeTab === "employees" ? "bg-gray-900" : ""}
            onClick={() => setActiveTab("employees")}
          >
            Danh sách nhân viên
          </Button>
          <Button
            variant={activeTab === "invitations" ? "default" : "outline"}
            className={activeTab === "invitations" ? "bg-gray-900" : ""}
            onClick={() => setActiveTab("invitations")}
          >
            Lời mời của tôi
          </Button>
        </div>

        {activeTab === "employees" && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {activeTab === "employees" && isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
          </div>
        ) : activeTab === "employees" && error ? (
          <div className="bg-white rounded-xl border p-8 text-center text-red-500">
            <p>Không thể tải danh sách nhân viên</p>
            <p className="text-sm mt-1 text-gray-500">{String(error)}</p>
          </div>
        ) : activeTab === "employees" && filtered && filtered.length > 0 ? (
          <div className="bg-white rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp, i) => (
                  <TableRow
                    key={emp.employeeId}
                    className="hover:bg-gray-50/50"
                  >
                    <TableCell className="text-sm text-gray-500">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-[#23C4C1] text-white text-xs">
                            {getInitials(emp.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-800">
                          {emp.fullName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">{emp.email}</div>
                      <div className="text-xs text-gray-500">
                        {emp.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {emp.startAt
                        ? new Date(emp.startAt).toLocaleDateString("vi-VN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() =>
                          handleRemove(emp.employeeId, emp.fullName)
                        }
                        disabled={removeMutation.isPending}
                      >
                        <UserX className="w-3.5 h-3.5 mr-1" />
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : activeTab === "employees" ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">
              {search ? "Không tìm thấy nhân viên" : "Chưa có nhân viên"}
            </p>
          </div>
        ) : invitationLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
          </div>
        ) : invitationError ? (
          <div className="bg-white rounded-xl border p-8 text-center text-red-500">
            <p>Không thể tải lời mời</p>
            <p className="text-sm mt-1 text-gray-500">
              {String(invitationError)}
            </p>
          </div>
        ) : invitations && invitations.length > 0 ? (
          <div className="bg-white rounded-xl border divide-y">
            {invitations.map((invite) => (
              <div
                key={invite.hireId}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {invite.ownerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Mời bạn vào lúc{" "}
                    {new Date(invite.invitedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => rejectMutation.mutate(invite.hireId)}
                    disabled={
                      acceptMutation.isPending || rejectMutation.isPending
                    }
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#23C4C1] hover:bg-[#1aa8a5]"
                    onClick={() => acceptMutation.mutate(invite.hireId)}
                    disabled={
                      acceptMutation.isPending || rejectMutation.isPending
                    }
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Chấp nhận
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Không có lời mời nào đang chờ</p>
          </div>
        )}

        {(inviteMutation.error || removeMutation.error) && (
          <p className="mt-4 text-sm text-red-600">
            {String(inviteMutation.error || removeMutation.error)}
          </p>
        )}

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Mời nhân viên</DialogTitle>
              <DialogDescription>
                Tìm theo số điện thoại hoặc email, sau đó gửi lời mời.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nhập số điện thoại hoặc email..."
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-72 overflow-auto rounded-lg border">
                {searchLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[#23C4C1]" />
                  </div>
                ) : searchError ? (
                  <p className="text-sm text-red-500 p-3">
                    {String(searchError)}
                  </p>
                ) : debouncedInviteQuery.length < 2 ? (
                  <p className="text-sm text-gray-500 p-3">
                    Nhập ít nhất 2 ký tự để tìm kiếm.
                  </p>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((item) => (
                      <div
                        key={item.userId}
                        className="p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {item.fullName}
                          </p>
                          <p className="text-xs text-gray-500">{item.userId}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={item.isAlreadyHired ? "outline" : "default"}
                          className={
                            item.isAlreadyHired
                              ? "text-gray-400 border-gray-200"
                              : "bg-[#23C4C1] hover:bg-[#1aa8a5]"
                          }
                          disabled={
                            item.isAlreadyHired || inviteMutation.isPending
                          }
                          onClick={() => handleInvite(item.userId)}
                        >
                          {item.isAlreadyHired ? "Đã được mời" : "Gửi lời mời"}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 p-3">
                    Không tìm thấy người dùng phù hợp.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
              >
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
