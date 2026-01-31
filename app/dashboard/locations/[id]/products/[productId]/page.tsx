import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Pencil,
  AlertTriangle,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ProductDetail = {
  id: string;
  name: string;
  sku: string;
  baseUnit: string;
  minStockAtWarehouse: number;
  supplier: {
    companyName: string;
    contactName: string;
    phone: string;
    address: string;
  };
  imageUrl: string;
  stockCurrent: number;
  stockMin: number;
  pricing: {
    cost: number;
    sell: number;
  };
  conversions: Array<{
    label: string;
    detail: string;
    price: number;
  }>;
  barcodeVisual: string;
};

function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function BarcodeVisual({ value }: { value: string }) {
  return (
    <div className="w-65 select-none">
      <div className="h-18.5 w-full rounded-md border bg-white p-2">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 4px, #111 4px 5px, transparent 5px 7px)",
          }}
        />
      </div>
      <div className="mt-1 text-center font-mono text-[12px] tracking-[0.22em] text-gray-700">
        {value}
      </div>
    </div>
  );
}

function getMockProduct(productId: string): ProductDetail {
  // Mock data aligned with the screenshot.
  // Replace with real API fetch when available.
  const lavie: ProductDetail = {
    id: productId,
    name: "Nước khoáng Lavie",
    sku: "8934588020016",
    baseUnit: "chai",
    minStockAtWarehouse: 5,
    supplier: {
      companyName: "Công ty TNHH Nước Giải Khát Tân Hiệp Phát",
      contactName: "Anh Tuấn",
      phone: "0283 8484 888",
      address: "140 Đường số 8, KCN Tân Tạo, Bình Tân, TP.HCM",
    },
    imageUrl:
      "https://lavievietnam.vn/wp-content/uploads/2018/04/lavie-350ml.jpg",
    stockCurrent: 20,
    stockMin: 50,
    pricing: {
      cost: 5000,
      sell: 10000,
    },
    conversions: [
      {
        label: "1 lốc = 10 lon",
        detail: "Giá bán:",
        price: 59000,
      },
      {
        label: "1 thùng = 30 lon",
        detail: "Giá bán:",
        price: 159000,
      },
    ],
    barcodeVisual: "8712345670016",
  };

  return lavie;
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string; productId: string };
}) {
  const product = getMockProduct(params.productId);
  const isLowStock = product.stockCurrent <= product.stockMin;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white w-full    mx-auto">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={`/dashboard/locations/${params.id}`}
                aria-label="Quay lại"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {product.name}
            </h1>
            {isLowStock && (
              <Badge
                variant="secondary"
                className="bg-[#FEF3C6] text-[#BB4D00] hover:bg-[#FEF3C6]"
              >
                Sắp hết
              </Badge>
            )}
          </div>

          <Button variant="outline" className="gap-2" asChild>
            <Link
              href={`/dashboard/locations/${params.id}/products/new?productId=${encodeURIComponent(
                product.id,
              )}`}
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full px-6 py-6">
        {isLowStock && (
          <div className="mb-4 rounded-lg border border-[#FEF3C6] bg-[#FEF3C6] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#BB4D00] mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#BB4D00]">
                  Sản phẩm sắp hết hàng
                </h3>
                <p className="mt-1 text-sm text-[#BB4D00]">
                  Tồn kho hiện tại ({product.stockCurrent}) đã đạt ngưỡng tối
                  thiểu ({product.stockMin}). Bạn nên tạo phiếu nhập kho để bổ
                  sung hàng hóa.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[#BB4D00] hover:bg-[#996600] text-white shrink-0"
                asChild
              >
                <Link href={`/dashboard/locations/${params.id}/inventory/new`}>
                  <Package className="h-4 w-4 mr-2" />
                  Tạo phiếu nhập
                </Link>
              </Button>
            </div>
          </div>
        )}
        <div className="rounded-xl border bg-white p-6">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left */}
            <div className="lg:col-span-7">
              <div className="space-y-6">
                <section>
                  <div className="text-sm font-semibold text-gray-900">
                    Chi tiết sản phẩm
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-xs text-gray-500">Tên sản phẩm</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Mã vạch / SKU ID
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.sku}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Đơn vị cơ sở</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.baseUnit}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Định mức tồn kho tối thiểu
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.minStockAtWarehouse}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="text-sm font-semibold text-gray-900">
                    Nhà Cung Cấp
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-xs text-gray-500">
                        Tên Người Cung Cấp
                      </div>
                      <div className="mt-1 flex items-start gap-2 text-sm font-medium text-gray-900">
                        <Building2 className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                        <span>{product.supplier.companyName}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Người liên hệ</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.supplier.contactName}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Địa chỉ</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.supplier.address}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="text-sm font-semibold text-gray-900">
                    Quy đổi đơn vị
                  </div>
                  <div className="mt-4 space-y-3">
                    {product.conversions.map((c) => (
                      <div
                        key={c.label}
                        className="rounded-lg bg-gray-50 px-4 py-3"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {c.label}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {c.detail}
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          {formatVnd(c.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-5">
              <div className="space-y-6">
                <div className="rounded-lg  bg-white p-4">
                  <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-lg border bg-gray-50">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-600">Tồn kho hiện tại</div>
                      <div className="font-semibold text-gray-900">
                        {product.stockCurrent}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm border-b pb-3">
                      <div className="text-gray-600">Ngưỡng tối thiểu</div>
                      <div className="font-semibold text-gray-900">
                        {product.stockMin}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg  bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    Giá cả
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Giá vốn</div>
                      <div className="font-semibold text-gray-900">
                        {formatVnd(product.pricing.cost)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Giá bán</div>
                      <div className="font-semibold text-green-600">
                        {formatVnd(product.pricing.sell)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <BarcodeVisual value={product.barcodeVisual} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
