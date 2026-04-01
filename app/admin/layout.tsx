"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { DashboardLocationProvider } from "@/lib/providers/DashboardLocationProvider";
import { getValidAccessToken, getRoleFromToken } from "@/lib/auth/tokenManager";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const token = await getValidAccessToken();
        const role = getRoleFromToken(token);
        if (role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/auth/login");
      }
    }
    checkAdmin();
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <DashboardLocationProvider>
        <main className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <div className="flex-1 overflow-auto bg-gray-50/50">
            <div className="p-6  mx-auto">{children}</div>
          </div>
        </main>
      </DashboardLocationProvider>
    </div>
  );
}
