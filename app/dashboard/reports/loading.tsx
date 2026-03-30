import { Loader2 } from "lucide-react";

export default function ReportsLoading() {
  return (
    <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#23C4C1]" />
        <p className="text-sm font-medium text-gray-500 animate-pulse">
          Đang tải báo cáo...
        </p>
      </div>
    </div>
  );
}
