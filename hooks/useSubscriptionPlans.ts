import { useQuery } from "@tanstack/react-query";
import { getPublicSubscriptionPlans } from "@/lib/subscription-api";

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: getPublicSubscriptionPlans,
    staleTime: 5 * 60 * 1000,
  });
}
