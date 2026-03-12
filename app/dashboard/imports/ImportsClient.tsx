"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sun,
  Bell,
  Settings,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Package,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Calendar,
  Building2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useImports,
  useDeleteImport,
  useConfirmImport,
} from "@/hooks/useImports";
import type {
  ImportFilters,
  ImportStatus,
  ImportRecord,
} from "@/lib/types/import";

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getStatusBadge(status: ImportStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <FileText className="w-3 h-3 mr-1" />
          Nháp
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Đã xác nhận
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Đã hủy
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getImportTypeBadge(importType: string) {
  switch (importType) {
    case "INVOICE":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Nhập hàng
        </Badge>
      );
    case "INVENTORY_ADJUSTMENT":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200"
        >
          Điều chỉnh tồn kho
        </Badge>
      );
    case "RETURN":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          Trả hàng nhập lại
        </Badge>
      );
    default:
      return <Badge variant="outline">{importType}</Badge>;
  }
}

function getHasInvoiceBadge(hasInvoice: boolean) {
  return hasInvoice ? (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200"
    >
      Có HĐ
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-gray-50 text-gray-600 border-gray-200"
    >
      Không HĐ
    </Badge>
  );
}

// --- Main Component ---

export default function ImportsClient() {
  const router = useRouter();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ImportStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<ImportRecord | null>(null);

  // Confirm dialog state
  const [confirmTarget, setConfirmTarget] = useState<ImportRecord | null>(null);

  // Build filters
  const filters: ImportFilters = useMemo(
    () => ({
      ...(statusFilter !== "ALL" && { Status: statusFilter }),
      PageNumber: pageNumber,
      PageSize: pageSize,
    }),
    [statusFilter, pageNumber],
  );

  // Data fetching
  const {
    data: importData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useImports(filters);

  const deleteMutation = useDeleteImport();
  const confirmMutation = useConfirmImport();

  const imports = importData?.items ?? [];
  const totalCount = importData?.totalCount ?? 0;
  const totalPages = importData?.totalPages ?? 0;
  const hasPreviousPage = importData?.hasPreviousPage ?? false;
  const hasNextPage = importData?.hasNextPage ?? false;

  // Client-side search filter (on top of server-side filter)
  const filteredImports = useMemo(() => {
    if (!searchQuery) return imports;
    const q = searchQuery.toLowerCase();
    return imports.filter(
      (imp) =>
        imp.importCode.toLowerCase().includes(q) ||
        imp.businessLocationName.toLowerCase().includes(q) ||
        (imp.supplier && imp.supplier.toLowerCase().includes(q)) ||
        (imp.note && imp.note.toLowerCase().includes(q)),
    );
  }, [imports, searchQuery]);

  // Stats from current page data
  const stats = useMemo(
    () => ({
      total: totalCount,
      draft: imports.filter((i) => i.status === "DRAFT").length,
      confirmed: imports.filter((i) => i.status === "CONFIRMED").length,
      cancelled: imports.filter((i) => i.status === "CANCELLED").length,
    }),
    [imports, totalCount],
  );

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.importId);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting import:", err);
    }
  };

  // Handle confirm
  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      await confirmMutation.mutateAsync({
        importId: confirmTarget.importId,
        data: { receivedAt: new Date().toISOString() },
      });
      setConfirmTarget(null);
    } catch (err) {
      console.error("Error confirming import:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Nhập Kho
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi và quản lý các phiếu nhập kho hàng hóa
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
              Danh sách phiếu nhập kho
            </h2>
            <p className="text-gray-600">
              Tạo mới, xem chi tiết và xác nhận phiếu nhập hàng.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Link href="/dashboard/imports/create">
              <Button className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white shadow-lg shadow-[#23C4C1]/20 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Tạo phiếu nhập
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-2">
          {/* Status Tabs */}
          <div className="flex p-1 bg-gray-100/50 rounded-lg sm:w-auto w-full">
            {(
              [
                { key: "ALL", label: "Tất cả", count: stats.total },
                { key: "DRAFT", label: "Nháp", count: stats.draft },
                {
                  key: "CONFIRMED",
                  label: "Đã xác nhận",
                  count: stats.confirmed,
                },
                { key: "CANCELLED", label: "Đã hủy", count: stats.cancelled },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPageNumber(1);
                }}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  statusFilter === tab.key
                    ? tab.key === "DRAFT"
                      ? "bg-white text-yellow-700 shadow-sm"
                      : tab.key === "CONFIRMED"
                        ? "bg-white text-green-700 shadow-sm"
                        : tab.key === "CANCELLED"
                          ? "bg-white text-red-700 shadow-sm"
                          : "bg-white text-[#23C4C1] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}{" "}
                <span
                  className={`ml-1 text-xs opacity-70 px-1.5 py-0.5 rounded-full ${
                    tab.key === "DRAFT"
                      ? "bg-yellow-100 text-yellow-700"
                      : tab.key === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : tab.key === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center relative">
            <Search className="w-4 h-4 absolute left-4 text-gray-400 z-10 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm theo mã phiếu, nhà cung cấp, ghi chú..."
              className="pl-10 border-0 rounded-none focus:border-0 focus:ring-0 shadow-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-red-300">
            <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
            </h3>
            <Button
              onClick={() => refetch()}
              className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]"
              disabled={isRefetching}
            >
              {isRefetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : (
                "Thử lại"
              )}
            </Button>
          </div>
        )}

        {/* Table Content */}
        {!isLoading && !error && filteredImports.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700">
                    Mã phiếu
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Loại
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Kho nhập
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Nhà cung cấp
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Tổng tiền
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImports.map((imp) => (
                  <TableRow
                    key={imp.importId}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/dashboard/imports/${imp.importId}`)
                    }
                  >
                    <TableCell className="font-mono font-semibold text-[#23C4C1]">
                      {imp.importCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getImportTypeBadge(imp.importType)}
                        {getHasInvoiceBadge(imp.hasInvoice)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(imp.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate max-w-[180px]">
                          {imp.businessLocationName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {imp.supplier || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-800">
                      {formatCurrency(imp.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(imp.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/imports/${imp.importId}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {imp.status === "DRAFT" && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/imports/${imp.importId}/edit`,
                                  );
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmTarget(imp);
                                }}
                                className="text-green-600"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Xác nhận nhập kho
                              </DropdownMenuItem>
                            </>
                          )}
                          {imp.status !== "CANCELLED" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(imp);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {imp.status === "DRAFT" ? "Xóa" : "Hủy phiếu"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Trang {pageNumber} / {totalPages} — Tổng {totalCount} phiếu
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPreviousPage}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    onClick={() => setPageNumber((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredImports.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {imports.length === 0
                ? "Chưa có phiếu nhập kho nào"
                : "Không tìm thấy kết quả"}
            </h3>
            <p className="text-gray-600 mt-1">
              {imports.length === 0
                ? "Bắt đầu bằng cách tạo phiếu nhập kho mới."
                : "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."}
            </p>
            {imports.length === 0 && (
              <Link href="/dashboard/imports/create">
                <Button className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo phiếu nhập
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.status === "DRAFT"
                ? "Xóa phiếu nhập kho?"
                : "Hủy phiếu nhập kho?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.status === "DRAFT" ? (
                <>
                  Phiếu <strong>{deleteTarget?.importCode}</strong> sẽ bị xóa
                  vĩnh viễn. Hành động này không thể hoàn tác.
                </>
              ) : (
                <>
                  Phiếu <strong>{deleteTarget?.importCode}</strong> sẽ bị hủy và
                  tồn kho sẽ được hoàn lại. Phiếu vẫn được lưu trong hệ thống.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : deleteTarget?.status === "DRAFT" ? (
                "Xóa phiếu"
              ) : (
                "Hủy phiếu"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Import Dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={() => setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nhập kho</DialogTitle>
            <DialogDescription>
              Xác nhận phiếu <strong>{confirmTarget?.importCode}</strong>? Tồn
              kho sẽ được cập nhật cho tất cả sản phẩm trong phiếu. Hành động
              này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700"
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
