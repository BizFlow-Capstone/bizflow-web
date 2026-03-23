import { NextRequest } from "next/server";

/**
 * Returns a normalized Bearer token header value from incoming request.
 */
export function getBearerAuthorizationHeader(
  request: NextRequest,
): string | null {
  const rawAuthHeader = request.headers.get("authorization")?.trim() ?? "";
  if (!rawAuthHeader) {
    return null;
  }

  if (/^Bearer\s+/i.test(rawAuthHeader)) {
    return rawAuthHeader;
  }

  return `Bearer ${rawAuthHeader}`;
}
