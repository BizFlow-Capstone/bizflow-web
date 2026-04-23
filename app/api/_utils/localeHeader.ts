import { NextRequest } from "next/server";

export type RequestLocale = "vi" | "en";

function normalizeLocale(value?: string | null): RequestLocale | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("vi")) return "vi";
  return null;
}

export function getRequestLocale(request: NextRequest): RequestLocale {
  const byXLocale = normalizeLocale(request.headers.get("x-locale"));
  if (byXLocale) return byXLocale;

  const byAcceptLanguage = normalizeLocale(
    request.headers.get("accept-language"),
  );
  return byAcceptLanguage ?? "vi";
}

export function createLocaleForwardHeaders(request: NextRequest) {
  const locale = getRequestLocale(request);
  return {
    "Accept-Language": locale,
  };
}
