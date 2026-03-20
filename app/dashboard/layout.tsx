import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import NoLocationActionModal from "@/components/NoLocationActionModal";
import { DashboardLocationProvider } from "@/lib/providers/DashboardLocationProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <DashboardLocationProvider>
        <main className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <div className="flex-1">{children}</div>
          <NoLocationActionModal />
        </main>
      </DashboardLocationProvider>
    </div>
  );
}
