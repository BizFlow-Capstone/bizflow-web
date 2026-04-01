// ---------------------------------------------------------------------------
// Admin Subscription Plan Types
// ---------------------------------------------------------------------------

export interface Feature {
  featureId: number;
  featureCode: string;
  name: string;
  description: string;
}

export interface PlanFeature {
  featureId: number;
  featureCode: string;
  featureName: string;
  usageLimit: number;
}

export interface PlanPrice {
  priceId: number;
  basePrice: number;
  discountedPrice: number | null;
  discountStart: string | null;
  discountEnd: string | null;
  isDiscountActive: boolean;
  isActive: boolean;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// Returned by GET /api/admin/subscription-plans (paginated list)
export interface SubscriptionPlan {
  subscriptionPlanId: number;
  name: string;
  isActive: boolean;
  durationDays: number;
  basePrice: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// Returned by GET /api/admin/subscription-plans/:id (full detail)
export interface SubscriptionPlanDetail {
  subscriptionPlanId: number;
  name: string;
  description: string;
  durationDays: number;
  isActive: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  createdAt: string;
  updatedAt: string;
  currentPrice: PlanPrice | null;
  features: PlanFeature[];
}

export interface CreatePlanPriceRequest {
  basePrice: number;
  discountedPrice?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
}

export interface CreatePlanFeatureRequest {
  featureId: number;
  usageLimit: number;
}

export interface CreatePlanRequest {
  name: string;
  description: string;
  durationDays: number;
  price: CreatePlanPriceRequest;
  features: CreatePlanFeatureRequest[];
}

export interface UpdatePlanRequest {
  name: string;
  description: string;
  durationDays: number;
  price: CreatePlanPriceRequest;
  features: CreatePlanFeatureRequest[];
}

export interface PatchStatusRequest {
  isActive: boolean;
}
