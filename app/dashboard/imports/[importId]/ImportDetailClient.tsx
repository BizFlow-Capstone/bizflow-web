"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Package,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
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
  useImportDetail,
  useConfirmImport,
  useDeleteImport,
} from "@/hooks/useImports";
import type { ImportStatus } from "@/lib/types/import";

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

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `Ngày ${d.getDate().toString().padStart(2, "0")} tháng ${(d.getMonth() + 1).toString().padStart(2, "0")} năm ${d.getFullYear()}`;
}

function getStatusBadge(status: ImportStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm px-3 py-1">
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Nháp
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 text-sm px-3 py-1">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Đã xác nhận
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300 text-sm px-3 py-1">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Đã hủy
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function getImportTypeLabel(importType: string) {
  switch (importType) {
    case "INVOICE":
      return "Nhập hàng";
    case "INVENTORY_ADJUSTMENT":
      return "Điều chỉnh tồn kho";
    case "RETURN":
      return "Trả hàng nhập lại";
    default:
      return importType;
  }
}

// --- Main Component ---

export default function ImportDetailClient() {
  const params = useParams();
  const router = useRouter();
  const importId = Number(params.importId);
  const printRef = useRef<HTMLDivElement>(null);

  // State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Data
  const {
    data: importDetail,
    isLoading,
    error,
    refetch,
  } = useImportDetail(importId);
  const confirmMutation = useConfirmImport();
  const deleteMutation = useDeleteImport();

  // Handlers
  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync({
        importId,
        data: { receivedAt: new Date().toISOString() },
      });
      setConfirmOpen(false);
    } catch (err) {
      console.error("Error confirming import:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(importId);
      setDeleteOpen(false);
      router.push("/dashboard/imports");
    } catch (err) {
      console.error("Error deleting import:", err);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${importDetail?.importCode ?? "Phiếu nhập kho"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #333; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #555; padding: 6px 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-8 { margin-top: 32px; }
            .italic { font-style: italic; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 48px; }
            .sig-block { text-align: center; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">Đang tải chi tiết phiếu...</span>
      </div>
    );
  }

  // Error
  if (error || !importDetail) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Không thể tải phiếu nhập kho
          </h3>
          <p className="text-gray-500 mt-1">
            {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/imports")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <Button
              onClick={() => refetch()}
              className="bg-[#23C4C1] hover:bg-[#1da8a5]"
            >
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const itemCount = importDetail.items?.length ?? 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/imports")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  {importDetail.importCode}
                </h1>
                {getStatusBadge(importDetail.status)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Chi tiết phiếu nhập kho
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              In phiếu
            </Button>
            {importDetail.status === "DRAFT" && (
              <>
                <Link href={`/dashboard/imports/${importId}/edit`}>
                  <Button variant="outline" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
                </Link>
                <Button
                  onClick={() => setConfirmOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận nhập kho
                </Button>
              </>
            )}
            {importDetail.status !== "CANCELLED" && (
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 hover:text-red-700 hover:border-red-300 gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {importDetail.status === "DRAFT" ? "Xóa" : "Hủy phiếu"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* The Invoice Document */}
          <div
            ref={printRef}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Title */}
            <div className="px-8 pt-8 pb-4 text-center">
              <p className="text-xs text-gray-500 mb-1 italic">
                Mẫu số: 01/TNDN — (Ban hành kèm theo Thông tư số 78/2014/TT-BTC
                của Bộ Tài chính)
              </p>
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                Bảng kê thu mua hàng hóa, dịch vụ
              </h2>
              <h3 className="text-lg font-bold text-gray-700 uppercase mt-1">
                Phiếu nhập kho
              </h3>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-sm font-mono font-semibold text-[#23C4C1]">
                  {importDetail.importCode}
                </span>
                <span className="text-gray-300">|</span>
                {getStatusBadge(importDetail.status)}
              </div>
              <p className="text-sm text-gray-500 mt-2 italic">
                {formatDateVN(importDetail.createdAt)}
              </p>
            </div>

            <Separator />

            {/* Business Info */}
            <div className="px-8 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40 shrink-0">
                      Tên doanh nghiệp:
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {importDetail.businessLocationName}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-40 shrink-0">
                      Nhà cung cấp:
                    </span>
                    <span className="text-sm text-gray-800">
                      {importDetail.supplier || (
                        <span className="italic text-gray-400">
                          Không có thông tin
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-32 shrink-0">
                      Loại phiếu:
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {getImportTypeLabel(importDetail.importType)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-32 shrink-0">
                      Chứng từ:
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {importDetail.hasInvoice
                        ? "Có hóa đơn"
                        : "Không có hóa đơn"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 w-32 shrink-0">
                      Ghi chú:
                    </span>
                    <span className="text-sm text-gray-800">
                      {importDetail.note || (
                        <span className="italic text-gray-400">Không có</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Info Bar */}
            <div className="px-8 py-3 bg-gray-50/80 border-y border-gray-200">
              <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-500">
                <span>
                  Ngày tạo:{" "}
                  <strong className="text-gray-700">
                    {formatDate(importDetail.createdAt)}
                  </strong>
                </span>
                {importDetail.receivedAt && (
                  <span>
                    Ngày nhận hàng:{" "}
                    <strong className="text-gray-700">
                      {formatDate(importDetail.receivedAt)}
                    </strong>
                  </span>
                )}
                {importDetail.updatedAt && (
                  <span>
                    Cập nhật:{" "}
                    <strong className="text-gray-700">
                      {formatDate(importDetail.updatedAt)}
                    </strong>
                  </span>
                )}
                <span>
                  Số mặt hàng:{" "}
                  <strong className="text-gray-700">{itemCount}</strong>
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="px-4 pt-2">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-y border-gray-300">
                    <TableHead className="font-bold text-gray-700 text-center text-xs w-14 border-r border-gray-200">
                      STT
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-xs border-r border-gray-200 min-w-[200px]">
                      Tên hàng hóa, dịch vụ
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-center text-xs border-r border-gray-200 w-20">
                      ĐVT
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-center text-xs border-r border-gray-200 w-24">
                      Số lượng
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-right text-xs border-r border-gray-200 w-36">
                      Đơn giá
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-right text-xs w-40">
                      Tổng giá thanh toán
                    </TableHead>
                    {importDetail.status === "CONFIRMED" && (
                      <TableHead className="font-bold text-gray-700 text-center text-xs w-24 border-l border-gray-200">
                        Tồn kho
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importDetail.items?.map((item, index) => (
                    <TableRow
                      key={item.productId}
                      className="border-b border-gray-200 hover:bg-gray-50/50"
                    >
                      <TableCell className="text-center text-sm text-gray-500 font-medium border-r border-gray-100">
                        {index + 1}
                      </TableCell>
                      <TableCell className="border-r border-gray-100">
                        <p className="text-sm font-medium text-gray-800">
                          {item.productName || `Sản phẩm #${item.productId}`}
                        </p>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 border-r border-gray-100">
                        {item.baseUnit || "—"}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-gray-800 border-r border-gray-100">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700 border-r border-gray-100">
                        {formatCurrency(item.costPrice)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-gray-800">
                        {formatCurrency(
                          item.totalPrice ?? item.quantity * item.costPrice,
                        )}
                      </TableCell>
                      {importDetail.status === "CONFIRMED" && (
                        <TableCell className="text-center border-l border-gray-100">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                          >
                            {item.currentStock ?? "—"}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {/* Total row */}
                  <TableRow className="bg-gray-50 border-t-2 border-gray-300">
                    <TableCell
                      colSpan={5}
                      className="text-right text-sm font-bold text-gray-700 pr-4"
                    >
                      Tổng giá trị hàng hóa mua vào:
                    </TableCell>
                    <TableCell className="text-right text-base font-bold text-[#23C4C1] px-3">
                      {formatCurrency(importDetail.totalAmount)}
                    </TableCell>
                    {importDetail.status === "CONFIRMED" && <TableCell />}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Signature Section */}
            <div className="px-8 py-6">
              <Separator className="mb-6" />
              <div className="flex justify-between">
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-gray-700">
                    Người lập bảng kê
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    (Ký, ghi rõ họ tên)
                  </p>
                  <div className="h-16" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-gray-700">
                    Người giao hàng
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    (Ký, ghi rõ họ tên)
                  </p>
                  <div className="h-16" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-500 italic">
                    {formatDateVN(importDetail.createdAt)}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    Giám đốc doanh nghiệp
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    (Ký tên, đóng dấu)
                  </p>
                  <div className="h-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nhập kho</DialogTitle>
            <DialogDescription>
              Xác nhận phiếu <strong>{importDetail.importCode}</strong>? Tồn kho
              sẽ được cập nhật cho tất cả sản phẩm trong phiếu. Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {importDetail.status === "DRAFT"
                ? "Xóa phiếu nhập kho?"
                : "Hủy phiếu nhập kho?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {importDetail.status === "DRAFT" ? (
                <>
                  Phiếu <strong>{importDetail.importCode}</strong> sẽ bị xóa
                  vĩnh viễn. Hành động này không thể hoàn tác.
                </>
              ) : (
                <>
                  Phiếu <strong>{importDetail.importCode}</strong> sẽ bị hủy và
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
              ) : importDetail.status === "DRAFT" ? (
                "Xóa phiếu"
              ) : (
                "Hủy phiếu"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
