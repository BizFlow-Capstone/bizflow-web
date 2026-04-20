"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import NoLocationActionModal from "@/components/NoLocationActionModal";
import { DashboardLocationProvider } from "@/lib/providers/DashboardLocationProvider";
import { getValidAccessToken, getRoleFromToken } from "@/lib/auth/tokenManager";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkUser() {
      try {
        const token = await getValidAccessToken();
        const role = getRoleFromToken(token);
        if (role === "consultant") {
          router.replace("/consultant/accounting");
          return;
        }
        if (role !== "admin" && role !== "owner" && role !== "employee") {
          router.replace("/auth/login");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/auth/login");
      }
    }
    void checkUser();
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardLocationProvider>
        <DashboardSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <div className="flex-1">{children}</div>
          <NoLocationActionModal />
        </main>
      </DashboardLocationProvider>
    </div>
  );
}
