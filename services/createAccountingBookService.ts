import type { ApiResponse, AccountingBook } from "@/lib/types/accounting";
import { authFetch } from "@/lib/auth/tokenManager";

export interface CreateAccountingBookRequest {
  periodId: number;
  groupNumber: number;
  taxMethod: string;
  templateCodes: string[];
}

export async function createAccountingBook(
  locationId: number,
  data: CreateAccountingBookRequest,
): Promise<ApiResponse<{ createdBooks: AccountingBook[] }>> {
  const response = await authFetch(
    `/api/locations/${locationId}/accounting/books`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to create accounting book: ${response.status}`);
  }
  return response.json();
}
