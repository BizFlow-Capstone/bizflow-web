import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-10" />
        <p className="text-sm text-gray-600">Đang tải...</p>
      </div>
    </div>
  );
}
