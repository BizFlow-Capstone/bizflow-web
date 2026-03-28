import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { DashboardLocationProvider } from "@/lib/providers/DashboardLocationProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
