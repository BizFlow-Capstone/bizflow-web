import { useQuery } from "@tanstack/react-query";
import { getBookSummary } from "@/services/accountingService";

export function useBookSummary(locationId: number, bookId: number) {
  return useQuery({
    queryKey: ["book-summary", locationId, bookId],
    queryFn: () => getBookSummary(locationId, bookId),
    enabled: !!locationId && !!bookId,
  });
}
