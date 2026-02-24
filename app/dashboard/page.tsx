"use client";

import { Sun, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Trang Chủ</h1>
            <p className="text-sm text-gray-600 mt-1">
              Tổng quan về hoạt động kinh doanh của bạn
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Chào mừng trở lại!
          </h2>
          <p className="text-gray-600">
            Đây là trang tổng quan của hệ thống quản lý kinh doanh BizFlow.
          </p>
        </div>
      </main>
    </div>
  );
}
