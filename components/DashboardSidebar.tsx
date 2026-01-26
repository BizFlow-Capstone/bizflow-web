'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Trang Chủ', icon: '🏠' },
    { href: '/dashboard/orders', label: 'Đơn Hàng', icon: '📦' },
    { href: '/dashboard/debt', label: 'Quản Lý Nợ', icon: '💰' },
    { href: '/dashboard/locations', label: 'Địa Điểm Kinh Doanh', icon: '🏢', highlight: true },
    { href: '/dashboard/employees', label: 'Nhân Viên', icon: '👥' },
    { href: '/dashboard/reports', label: 'Báo Cáo & Thống Kê', icon: '📊' },
  ];

  const bottomMenuItems = [
    { href: '/dashboard/settings', label: 'Cài Đặt', icon: '⚙️' },
    { href: '/auth/logout', label: 'Đăng Xuất', icon: '🚪' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <span className="text-xl font-semibold text-gray-800 block">BizFlow</span>
            <span className="text-xs text-gray-500">Quản lý kinh doanh</span>
          </div>
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.highlight
                      ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-600 border border-cyan-200'
                      : isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-gray-200">
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
