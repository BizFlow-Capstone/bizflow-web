import { useQuery } from "@tanstack/react-query";
import {
  getCurrentSubscription,
  getSubscriptionTransactions,
} from "@/lib/subscription-api";

export const subscriptionKeys = {
  current: ["subscription", "current"] as const,
  transactions: (page: number) =>
    ["subscription", "transactions", page] as const,
};

export function useCurrentSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current,
    queryFn: getCurrentSubscription,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function useSubscriptionTransactions(page = 1) {
  return useQuery({
    queryKey: subscriptionKeys.transactions(page),
    queryFn: () => getSubscriptionTransactions(page),
    staleTime: 1000 * 60,
  });
}
