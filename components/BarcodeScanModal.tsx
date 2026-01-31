"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ean13Scanner } from "@/components/Ean13Scanner";

export interface BarcodeScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (code: string) => void | Promise<void>;
  title?: string;
  description?: string;
  debug?: boolean;
}

export function BarcodeScanModal({
  open,
  onOpenChange,
  onScanned,
  title = "Quét mã vạch",
  description = "Đưa mã vạch vào ô nhập ngay khi quét được.",
  debug = false,
}: BarcodeScanModalProps) {
  const handleScan = useCallback(
    async (code: string) => {
      onOpenChange(false);
      await onScanned(code);
    },
    [onOpenChange, onScanned],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-140">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <div className="text-sm text-gray-600">{description}</div>
          ) : null}
        </DialogHeader>

        {open ? <Ean13Scanner debug={debug} onScan={handleScan} /> : null}
      </DialogContent>
    </Dialog>
  );
}
