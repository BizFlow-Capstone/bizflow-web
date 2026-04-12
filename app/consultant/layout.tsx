"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConsultantSidebar from "@/components/consultant/ConsultantSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { DashboardLocationProvider } from "@/lib/providers/DashboardLocationProvider";
import { getRoleFromToken, getValidAccessToken } from "@/lib/auth/tokenManager";

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkConsultant() {
      try {
        const token = await getValidAccessToken();
        const role = getRoleFromToken(token);

        if (role !== "consultant" && role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setAuthorized(true);
      } catch {
        router.replace("/auth/login");
      }
    }

    void checkConsultant();
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ConsultantSidebar />
      <DashboardLocationProvider>
        <main className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <div className="flex-1 overflow-auto bg-gray-50/50">
            <div className="mx-auto p-6">{children}</div>
          </div>
        </main>
      </DashboardLocationProvider>
    </div>
  );
}
