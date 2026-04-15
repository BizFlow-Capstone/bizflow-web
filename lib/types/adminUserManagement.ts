export interface AdminUserQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface AdminManagedUser {
  accountId: string;
  profileId: string;
  fullName: string;
  role: string;
  isActive: boolean;
  email?: string | null;
  phone?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface CreateAdminConsultantRequest {
  email: string;
  fullName: string;
}

export interface CreateAdminConsultantResponse {
  accountId: string;
  profileId: string;
  email: string;
}

export interface AdminUsersPaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}
