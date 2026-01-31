"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

export type Ean13ScannerStatus =
  | "idle"
  | "requesting-permission"
  | "starting"
  | "scanning"
  | "stopping"
  | "stopped"
  | "error";

export interface Ean13ScannerProps {
  onScan: (ean13: string) => void;
  className?: string;
  fps?: number;
  debug?: boolean;
  onLog?: (entry: {
    level: "debug" | "info" | "warn" | "error";
    message: string;
    data?: unknown;
  }) => void;
}

type Html5QrcodeInstance = {
  start: (
    cameraIdOrConfig: unknown,
    config: unknown,
    onSuccess: (decodedText: string) => void | Promise<void>,
    onError: (errorMessage: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
};

type Html5QrcodeCtor = new (elementId: string) => Html5QrcodeInstance;

type Html5QrcodeModule = {
  Html5Qrcode: Html5QrcodeCtor & {
    getCameras: () => Promise<Array<{ id: string; label: string }>>;
  };
  Html5QrcodeSupportedFormats: { EAN_13: unknown };
};

function isDigits(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

// EAN-13 checksum validation
function isValidEan13(raw: string): boolean {
  if (raw.length !== 13) return false;
  if (!isDigits(raw)) return false;

  const digits = raw.split("").map((d) => Number(d));
  const checkDigit = digits[12];
  let sum = 0;

  // positions 1..12 (index 0..11): odd positions weight 1, even positions weight 3
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const computed = (10 - (sum % 10)) % 10;
  return computed === checkDigit;
}

export function Ean13Scanner({
  onScan,
  className,
  fps = 10,
  debug = false,
  onLog,
}: Ean13ScannerProps) {
  const regionId = useId();
  const [status, setStatus] = useState<Ean13ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const didScanRef = useRef(false);
  const mountedRef = useRef(false);

  const log = (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    data?: unknown,
  ) => {
    // Console logs (opt-in)
    if (propsRef.current.debug) {
      const prefix = `[Ean13Scanner] ${message}`;
      if (level === "error") console.error(prefix, data);
      else if (level === "warn") console.warn(prefix, data);
      else if (level === "info") console.info(prefix, data);
      else console.debug(prefix, data);
    }

    propsRef.current.onLog?.({ level, message, data });

    if (propsRef.current.debug) {
      const ts = new Date().toLocaleTimeString();
      setDebugLines((prev) => {
        const next = [`${ts} [${level}] ${message}`, ...prev];
        return next.slice(0, 12);
      });
    }
  };

  // keep latest props for log() without re-creating effects
  const propsRef = useRef<{
    debug: boolean;
    onLog?: Ean13ScannerProps["onLog"];
  }>({
    debug: false,
    onLog: undefined,
  });
  useEffect(() => {
    propsRef.current = { debug, onLog };
  }, [debug, onLog]);

  useEffect(() => {
    mountedRef.current = true;

    const start = async () => {
      try {
        setErrorMessage(null);
        setStatus("requesting-permission");
        log("info", "Init scanner");

        // Dynamic import to avoid SSR/window issues
        const mod =
          (await import("html5-qrcode")) as unknown as Html5QrcodeModule;
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod;

        if (!mountedRef.current) return;

        const html5QrCode = new Html5Qrcode(regionId);
        scannerRef.current = html5QrCode;

        setStatus("starting");

        const cameras = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;

        log(
          "info",
          `Found cameras: ${cameras?.length ?? 0}`,
          (cameras ?? []).map((c) => ({ id: c.id, label: c.label })),
        );

        const cameraId = cameras?.[0]?.id;
        if (!cameraId) {
          setStatus("error");
          setErrorMessage("Không tìm thấy camera.");
          log("error", "No camera found");
          return;
        }

        log("info", "Using camera", { cameraId });

        // Barcode 1D prefers a wide scanning box
        const config: Record<string, unknown> = {
          fps,
          qrbox: { width: 320, height: 140 },
          aspectRatio: 16 / 9,
          disableFlip: true,
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
        };

        log("debug", "Start config", config);

        didScanRef.current = false;

        await html5QrCode.start(
          { deviceId: { exact: cameraId } },
          config,
          async (decodedText: string) => {
            if (didScanRef.current) return;
            const candidate = decodedText.trim();

            // Some devices may include whitespace or non-digit chars
            const normalized = candidate.replace(/\D/g, "");

            log("debug", "Decoded frame", {
              decodedText: candidate,
              normalized,
            });

            if (!isValidEan13(normalized)) {
              if (normalized.length > 0) {
                log("warn", "Rejected (not valid EAN-13)", { normalized });
              }
              return;
            }

            log("info", "EAN-13 accepted", { ean13: normalized });

            didScanRef.current = true;
            setStatus("stopping");

            try {
              await html5QrCode.stop();
              log("info", "Stopped scanner");
            } catch {
              log("warn", "Stop scanner failed");
              // ignore
            }
            try {
              await html5QrCode.clear();
              log("info", "Cleared scanner");
            } catch {
              log("warn", "Clear scanner failed");
              // ignore
            }

            if (!mountedRef.current) return;
            setStatus("stopped");
            onScan(normalized);
          },
          () => {
            // ignore per-frame decode errors
          },
        );

        if (!mountedRef.current) return;
        setStatus("scanning");
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Không thể khởi động camera scanner.",
        );
        log("error", "Scanner start failed", err);
      }
    };

    void start();

    return () => {
      mountedRef.current = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        // Best-effort cleanup (can't await in React cleanup)
        try {
          scanner.stop().catch(() => undefined);
          log("debug", "Cleanup: stop() called");
        } catch {
          // ignore
        }
        try {
          scanner.clear().catch(() => undefined);
          log("debug", "Cleanup: clear() called");
        } catch {
          // ignore
        }
      }
    };
  }, [fps, onScan, regionId]);

  return (
    <div className={className}>
      <div className="rounded-lg border bg-white p-3">
        <div className="text-sm text-gray-700 mb-2">
          {status === "requesting-permission" && "Đang xin quyền camera..."}
          {status === "starting" && "Đang khởi động scanner..."}
          {status === "scanning" && "Đưa mã EAN-13 vào khung để quét."}
          {status === "stopping" && "Đã quét, đang dừng camera..."}
          {status === "stopped" && "Đã dừng camera."}
          {status === "error" && "Không thể quét."}
        </div>

        {errorMessage && (
          <div className="text-sm text-red-600 mb-2">{errorMessage}</div>
        )}

        <div
          id={regionId}
          className="w-full overflow-hidden rounded-md bg-black"
          style={{ aspectRatio: "16/9" } as CSSProperties}
        />

        <div className="mt-2 text-xs text-gray-500">
          Chỉ hỗ trợ barcode EAN-13 (13 chữ số), không hỗ trợ QR.
        </div>

        {debug && (
          <div className="mt-3 rounded-md bg-gray-50 p-2">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Debug log
            </div>
            <div className="space-y-1">
              {debugLines.length === 0 ? (
                <div className="text-xs text-gray-500">(no logs yet)</div>
              ) : (
                debugLines.map((l, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-mono text-gray-700 wrap-break-word"
                  >
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
