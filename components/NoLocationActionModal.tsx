"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocations } from "@/hooks/useLocations";

export default function NoLocationActionModal() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: locations = [], isLoading } = useLocations();

  const shouldShowModal = useMemo(() => {
    if (isLoading) return false;
    if (locations.length > 0) return false;
    if (!pathname.startsWith("/dashboard")) return false;
    if (pathname.startsWith("/dashboard/locations")) return false;
    if (pathname.startsWith("/dashboard/employees")) return false;
    return true;
  }, [isLoading, locations.length, pathname]);

  return (
    <Dialog open={shouldShowModal}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Bạn chưa có địa điểm kinh doanh</DialogTitle>
          <DialogDescription>
            Hãy tạo địa điểm mới hoặc kiểm tra lời mời làm nhân viên để tiếp tục
            sử dụng hệ thống.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Button
            className="w-full justify-start gap-2 bg-[#23C4C1] hover:bg-[#1aa8a5]"
            onClick={() => router.push("/dashboard/locations?openCreate=1")}
          >
            <Building2 className="w-4 h-4" />
            Tạo địa điểm kinh doanh
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => router.push("/dashboard/employees?tab=invitations")}
          >
            <BellRing className="w-4 h-4" />
            Nhận lời mời
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
