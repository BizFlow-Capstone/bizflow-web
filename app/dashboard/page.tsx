'use client';

import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kho Quận 1</h1>
            <p className="text-gray-600">123 Nguyễn Huệ, Quận 1, TP.HCM</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <span className="text-xl">☀️</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <span className="text-xl">🔔</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <span className="text-xl">⚙️</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                LV
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Lê Văn A</p>
                <p className="text-xs text-gray-600">Chủ Kho</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm hoặc quét mã vạch..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
            <span className="absolute right-4 top-3 text-gray-400">🔍</span>
          </div>
          <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            ⚡ Lọc
          </button>
          <div className="flex gap-2">
            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Danh mục
            </button>
            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Đơn vị
            </button>
            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Nhà cung cấp
            </button>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2">
            <span>+</span>
            Nhập Kho
          </button>
          <button className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-semibold flex items-center gap-2">
            <span>+</span>
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Scanning Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-6 text-center">
        <div className="text-6xl mb-4">🔄</div>
        <p className="text-gray-600">Đang quét mã vạch...</p>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã vạch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đơn vị
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số lượng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá nhập
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá bán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày cập nhật
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center mr-3">
                    💧
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Nước khoáng Lavie</p>
                    <p className="text-sm text-gray-500">10 lốc/lốc</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                8934588020016
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                  Đủ dùng
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                lốc
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                240
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                8.000đ
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                10.000đ
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                10/11/2025
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-gray-400 hover:text-gray-600">⋮</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center mr-3">
                    🥤
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Coca Cola</p>
                    <p className="text-sm text-gray-500">12 lốc/lốc</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                8934588020023
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                  Đủ dùng
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                lốc
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                180
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                9.500đ
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                12.000đ
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                10/11/2025
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-gray-400 hover:text-gray-600">⋮</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
