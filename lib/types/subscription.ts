// ---------------------------------------------------------------------------
// Public Subscription Plan Types (user-facing)
// ---------------------------------------------------------------------------

export interface PublicPlanPrice {
  priceId: number;
  basePrice: number;
  discountedPrice: number | null;
  effectivePrice: number;
  discountStart: string | null;
  discountEnd: string | null;
  isDiscountActive: boolean;
  currency: string;
}

export interface PublicPlanFeature {
  featureId: number;
  featureCode: string;
  featureName: string;
  featureDescription: string;
  usageLimit: number; // -1 = unlimited, 0 = not included
}

export interface PublicSubscriptionPlan {
  subscriptionPlanId: number;
  name: string;
  description: string;
  durationDays: number;
  currentPrice: PublicPlanPrice;
  features: PublicPlanFeature[];
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface CreateCheckoutRequest {
  subscriptionPlanId: number;
  quantity: number;
  platform: string;
}

export interface CreateCheckoutResponse {
  transactionId: string;
  sessionUrl: string;
  planPrice: number;
  finalAmount: number;
  currency: string;
  transactionType: string;
}

// ---------------------------------------------------------------------------
// Current Subscription
// ---------------------------------------------------------------------------

export interface CurrentSubscription {
  subscriptionId: string;
  status: "Active" | "Expired" | "Cancelled" | string;
  startDate: string;
  endDate: string;
  plan: PublicSubscriptionPlan;
}

// ---------------------------------------------------------------------------
// Transaction History
// ---------------------------------------------------------------------------

export interface SubscriptionTransaction {
  transactionId: string;
  subscriptionPlanId: number;
  planName: string;
  transactionType: string;
  status: "Success" | "Failed" | "Active" | "Pending" | string;
  planPrice: number;
  prorationCredit: number;
  finalAmount: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Location (owned by current user)
// ---------------------------------------------------------------------------

export interface OwnedLocation {
  id: number;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  isActive: boolean;
  ownerProfileId: string;
  ownerName: string;
}
