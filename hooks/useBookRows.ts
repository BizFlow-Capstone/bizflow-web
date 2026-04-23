import { useCallback } from "react";
import { BookRow } from "@/components/products/BookRowsTable";
import { authFetch } from "@/lib/auth/tokenManager";
import { ApiResponse } from "@/lib/types/accounting";
import { useRef } from "react";

// Real API hook for book rows with cursor-based pagination
export function useBookRows(bookId: number, locationId?: number) {
  const cursorRef = useRef<string | undefined>(undefined);
  const cursorHistoryRef = useRef<Set<string>>(new Set());

  function resetCursorState() {
    cursorRef.current = undefined;
    cursorHistoryRef.current = new Set();
  }

  return useCallback(
    async (page: number, pageSize: number) => {
      if (page <= 1) {
        resetCursorState();
      }

      const cursor = page > 1 ? cursorRef.current : undefined;
      const locId = locationId || 1;
      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      params.append("batchSize", String(pageSize));
      const url = `/api/locations/${locId}/accounting/books/${bookId}/rows?${params.toString()}`;
      const response = await authFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Không thể tải dòng sổ kế toán");
      const api: ApiResponse<any> = await response.json();
      const data = api.data;

      const nextCursorRaw =
        typeof data?.nextCursor === "string" ? data.nextCursor.trim() : "";
      const hasMoreRaw = Boolean(data?.hasMore);

      const isCursorLoop =
        !!nextCursorRaw &&
        (nextCursorRaw === cursor ||
          cursorHistoryRef.current.has(nextCursorRaw));

      const hasMore = hasMoreRaw && !!nextCursorRaw && !isCursorLoop;

      if (hasMore) {
        cursorRef.current = nextCursorRaw;
        cursorHistoryRef.current.add(nextCursorRaw);
      } else {
        cursorRef.current = undefined;
      }

      return {
        rows: (data?.rows ?? []) as Record<string, unknown>[],
        hasMore,
        totalEstimated: Number(data?.totalEstimated ?? 0),
      };
    },
    [bookId, locationId],
  );
}
