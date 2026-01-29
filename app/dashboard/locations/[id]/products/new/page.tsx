"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, ScanLine, Sun, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AddProductPage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    isActive: true,
    trackInventory: true,
    costPrice: "",
    sellPrice: "",
    stock: "",
    unit: "cái",
    minStock: "10",
    supplierName: "",
    contactPerson: "",
    address: "",
    priceList: [{ name: "Giá bán 1", unit: "", quantity: "", price: "" }],
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log("Form data:", formData);
    router.back();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">
              Thêm sản phẩm mới
            </h1>
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

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Basic Info */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <Label className="text-base font-medium text-gray-900 mb-3 block">
                  Hình ảnh sản phẩm
                </Label>
                <div className="relative">
                  <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors border-[#23C4C1]/30">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <Upload className="w-12 h-12 mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600 text-center font-medium">
                          Kéo thả ảnh vào đây
                        </p>
                        <p className="text-sm text-gray-500 text-center mt-1">
                          hoặc nhấn để chọn ảnh
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-4">
                  Thông tin cơ bản
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm text-gray-700 font-normal"
                    >
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Nhập tên sản phẩm"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="barcode"
                      className="text-sm text-gray-700 font-normal"
                    >
                      Mã vạch <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="barcode"
                        placeholder="Nhập hoặc quét mã vạch"
                        value={formData.barcode}
                        onChange={(e) =>
                          setFormData({ ...formData, barcode: e.target.value })
                        }
                        className="pr-12 h-12"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ScanLine className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="link"
                      className="text-[#23C4C1] hover:text-[#1da8a5] p-0 h-auto text-sm font-normal"
                    >
                      + Thêm Giá bán
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column - Status and Pricing */}
              <div className="space-y-6">
                {/* Status */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    Trạng thái
                  </h3>

                  <div className="space-y-0 divide-y divide-gray-100">
                    <div className="flex items-start justify-between py-4 first:pt-0">
                      <div>
                        <Label className="text-base font-medium text-gray-900">
                          Kích hoạt
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Sản phẩm có thể được bán
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: checked })
                        }
                        className="data-[state=checked]:bg-[#23C4C1] scale-110"
                      />
                    </div>

                    <div className="flex items-start justify-between py-4">
                      <div>
                        <Label className="text-base font-medium text-gray-900">
                          Tồn kho
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Quản lí tồn kho sản phẩm này
                        </p>
                      </div>
                      <Switch
                        checked={formData.trackInventory}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, trackInventory: checked })
                        }
                        className="data-[state=checked]:bg-[#23C4C1] scale-110"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    Giá & Tồn kho
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="costPrice"
                          className="text-sm text-gray-700 font-normal"
                        >
                          Giá vốn
                        </Label>
                        <Input
                          id="costPrice"
                          type="number"
                          placeholder="0"
                          value={formData.costPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              costPrice: e.target.value,
                            })
                          }
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="sellPrice"
                          className="text-sm text-gray-700 font-normal"
                        >
                          Giá bán
                        </Label>
                        <Input
                          id="sellPrice"
                          type="number"
                          placeholder="0"
                          value={formData.sellPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sellPrice: e.target.value,
                            })
                          }
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="stock"
                          className="text-sm text-gray-700 font-normal"
                        >
                          Số lượng
                        </Label>
                        <Input
                          id="stock"
                          type="number"
                          placeholder="0"
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData({ ...formData, stock: e.target.value })
                          }
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="unit"
                          className="text-sm text-gray-700 font-normal"
                        >
                          Đơn vị có bán <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="unit"
                          placeholder="cái"
                          value={formData.unit}
                          onChange={(e) =>
                            setFormData({ ...formData, unit: e.target.value })
                          }
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="minStock"
                        className="text-sm text-gray-700 font-normal"
                      >
                        Tồn tối thiểu
                      </Label>
                      <Input
                        id="minStock"
                        type="number"
                        placeholder="10"
                        value={formData.minStock}
                        onChange={(e) =>
                          setFormData({ ...formData, minStock: e.target.value })
                        }
                        className="h-12"
                      />
                    </div>

                    {/* Price Table */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-2 font-medium text-gray-700">
                                Khoảng Giá
                              </th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">
                                Đơn vị
                              </th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">
                                Số Lượng Mua Tối Thiểu
                              </th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">
                                Giá Sản Phẩm(vnđ)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.priceList.map((price, index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-100"
                              >
                                <td className="py-3 px-2">
                                  <span className="text-gray-600">
                                    {price.name}
                                  </span>
                                </td>
                                <td className="py-3 px-2">
                                  <Input
                                    placeholder=""
                                    className="h-8 text-sm"
                                    value={price.unit}
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="h-8 text-sm"
                                    value={price.quantity}
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="h-8 text-sm"
                                    value={price.price}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supplier */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    Nhà sản xuất
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="supplierName"
                        className="text-sm text-gray-700 font-normal"
                      >
                        Thêm nhà cung cấp mới
                      </Label>
                      <Input
                        id="supplierName"
                        placeholder="Tên nhà cung cấp *"
                        value={formData.supplierName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            supplierName: e.target.value,
                          })
                        }
                        className="h-12"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Người liên hệ (VD: Anh Tuấn)"
                        value={formData.contactPerson}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactPerson: e.target.value,
                          })
                        }
                        className="h-12"
                      />
                      <Input
                        placeholder="Địa chỉ"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="h-12"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
                    >
                      Thêm nhà cung cấp
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="px-6"
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white px-6"
                  >
                    Thêm sản phẩm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
