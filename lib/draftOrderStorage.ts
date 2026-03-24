import type {
  DraftOrder,
  DraftOrderItem,
  PaymentType,
} from "@/lib/types/order";

const STORAGE_KEY = "bizflow_draft_orders";

function generateId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getDraftOrders(): DraftOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DraftOrder[]) : [];
    return parsed.map((draft) => ({
      ...draft,
      items: (draft.items ?? []).map((item) => ({
        ...item,
        saleItemId: item.saleItemId ?? item.productId,
        discount: item.discount ?? 0,
      })),
    }));
  } catch {
    return [];
  }
}

export function getDraftOrder(draftId: string): DraftOrder | null {
  const drafts = getDraftOrders();
  return drafts.find((d) => d.draftId === draftId) ?? null;
}

export function saveDraftOrder(
  items: DraftOrderItem[],
  paymentType: PaymentType,
  options?: {
    draftId?: string;
    debtorId?: number;
    debtorName?: string;
    note?: string;
  },
): DraftOrder {
  const drafts = getDraftOrders();
  const now = new Date().toISOString();

  if (options?.draftId) {
    const idx = drafts.findIndex((d) => d.draftId === options.draftId);
    if (idx !== -1) {
      drafts[idx] = {
        ...drafts[idx],
        items,
        paymentType,
        debtorId: options.debtorId,
        debtorName: options.debtorName,
        note: options.note,
        updatedAt: now,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      return drafts[idx];
    }
  }

  const draft: DraftOrder = {
    draftId: generateId(),
    items,
    paymentType,
    debtorId: options?.debtorId,
    debtorName: options?.debtorName,
    note: options?.note,
    createdAt: now,
    updatedAt: now,
  };

  drafts.push(draft);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  return draft;
}

export function deleteDraftOrder(draftId: string): void {
  const drafts = getDraftOrders().filter((d) => d.draftId !== draftId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function getDraftOrderCount(): number {
  return getDraftOrders().length;
}
