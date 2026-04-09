import { useEffect, useState } from "react";

// ─── Base formatter ──────────────────────────────────────────────────────────

const currencyFmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("vi-VN");

// ─── Core formatters ─────────────────────────────────────────────────────────

/** Full VND (chuẩn Việt Nam, ₫ hậu tố) → 1.200.000 ₫ */
export function formatVnd(amount: number): string {
  return currencyFmt.format(amount);
}

/** Plain number theo chuẩn Việt Nam → 1.200.000 */
export function formatNumberVi(value: number): string {
  return numberFmt.format(value);
}

/** Compact VND (tiếng Việt) → 1,2 tỷ · 1,2 tr · 500K */
export function formatCompactVnd(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    const v = (abs / 1_000_000_000)
      .toFixed(1)
      .replace(".", ",")
      .replace(/,0$/, "");
    return `${sign}${v} tỷ`;
  }
  if (abs >= 1_000_000) {
    const v = (abs / 1_000_000).toFixed(1).replace(".", ",").replace(/,0$/, "");
    return `${sign}${v} tr`;
  }
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K`;

  return formatVnd(amount);
}

/** Y-axis chart (ngắn gọn) → 1,2 tr · 500K */
export function formatYAxisShort(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000)
      .toFixed(1)
      .replace(".", ",")
      .replace(/,0$/, "")} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000)
      .toFixed(1)
      .replace(".", ",")
      .replace(/,0$/, "")} tr`;
  }
  if (abs >= 1_000) return `${Math.round(value / 1_000)}K`;

  return `${value}`;
}

/** Tooltip chart → 1.200.000 ₫ */
export function formatTooltipCurrency(value: unknown): string {
  const numeric = Number(value ?? 0);
  return formatVnd(Number.isFinite(numeric) ? numeric : 0);
}

// ─── Date formatters ─────────────────────────────────────────────────────────

export function formatDateTimeVi(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateVi(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Responsive logic ────────────────────────────────────────────────────────

export function useIsSmallScreen(breakpoint = 768) {
  const [isSmall, setIsSmall] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const listener = (e: MediaQueryListEvent) => {
      setIsSmall(e.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [breakpoint]);

  return isSmall;
}

// ─── Smart formatter (auto switch) ───────────────────────────────────────────

export function formatCurrencyResponsive(
  amount: number,
  isCompact: boolean,
): string {
  return isCompact ? formatCompactVnd(amount) : formatVnd(amount);
}

// ─── React hook tiện dụng ────────────────────────────────────────────────────

export function useCurrencyFormatter() {
  const isCompact = useIsSmallScreen();

  return {
    format: (amount: number) =>
      isCompact ? formatCompactVnd(amount) : formatVnd(amount),

    formatFull: formatVnd,
    formatCompact: formatCompactVnd,
    isCompact,
  };
}
