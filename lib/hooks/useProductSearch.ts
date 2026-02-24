import { useState, useCallback } from "react";

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku?: string;
  isActive: boolean;
  trackInventory: boolean;
  costPrice: string;
  sellPrice: string;
  stock: string;
  unit: string;
  minStock: string;
  supplierName?: string;
  contactPerson?: string;
  address?: string;
  imageUrl?: string;
  priceList?: Array<{
    name: string;
    unit: string;
    quantity: string;
    price: string;
  }>;
}

interface UseProductSearchOptions {
  onProductFound?: (product: Product) => void;
  onProductNotFound?: (barcode: string) => void;
}

/**
 * Hook để tìm kiếm sản phẩm theo mã barcode/SKU
 */
export function useProductSearch({
  onProductFound,
  onProductNotFound,
}: UseProductSearchOptions = {}) {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByBarcode = useCallback(
    async (barcode: string) => {
      if (!barcode || barcode.trim() === "") {
        return null;
      }

      setIsSearching(true);
      setError(null);

      try {
        // TODO: Thay bằng API call thực tế
        // const response = await fetch(`/api/products/search?barcode=${barcode}`);
        // const product = await response.json();

        // Giả lập API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock data - thay bằng dữ liệu thực từ API
        const mockProducts: Record<string, Product> = {
          "8934588020016": {
            id: "1",
            name: "Nước khoáng Lavie",
            barcode: "8934588020016",
            sku: "LAVIE-500ML",
            isActive: true,
            trackInventory: true,
            costPrice: "8000",
            sellPrice: "10000",
            stock: "240",
            unit: "lon",
            minStock: "10",
            supplierName: "Công ty ABC",
            contactPerson: "Anh Tuấn",
            address: "Hà Nội",
            priceList: [
              {
                name: "Giá bán 1",
                unit: "thùng",
                quantity: "12",
                price: "110000",
              },
            ],
          },
          "8936036013498": {
            id: "2",
            name: "Mì hảo hảo tôm chua cay",
            barcode: "8936036013498",
            sku: "HH-TCC",
            isActive: true,
            trackInventory: true,
            costPrice: "2500",
            sellPrice: "3500",
            stock: "500",
            unit: "gói",
            minStock: "50",
            supplierName: "Công ty XYZ",
            contactPerson: "Chị Lan",
            address: "TP.HCM",
            priceList: [
              {
                name: "Giá bán lẻ",
                unit: "gói",
                quantity: "1",
                price: "3500",
              },
              {
                name: "Giá bán sỉ",
                unit: "thùng",
                quantity: "30",
                price: "95000",
              },
            ],
          },
        };

        const product = mockProducts[barcode];

        if (product) {
          onProductFound?.(product);
          return product;
        } else {
          const notFoundMsg = `Không tìm thấy sản phẩm với mã: ${barcode}`;
          setError(notFoundMsg);
          onProductNotFound?.(barcode);
          return null;
        }
      } catch (err) {
        const errorMsg = "Có lỗi xảy ra khi tìm kiếm sản phẩm";
        setError(errorMsg);
        console.error("Product search error:", err);
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [onProductFound, onProductNotFound],
  );

  const searchBySKU = useCallback(
    async (sku: string) => {
      // Có thể dùng cùng endpoint hoặc endpoint khác
      return searchByBarcode(sku);
    },
    [searchByBarcode],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSearching,
    error,
    searchByBarcode,
    searchBySKU,
    clearError,
  };
}
