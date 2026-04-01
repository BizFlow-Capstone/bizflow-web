// Types for Location API
export interface Location {
  id: number;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  taxCode?: string | null;
  isActive: boolean;
  ownerName: string;
  isOwner?: boolean;
  accessType?: "owned" | "work-at";
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

export interface NewLocationForm {
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  taxCode: string;
  employeeIds: string[];
}

export interface UpdateLocationPayload {
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  taxCode: string;
}

export interface LocationEmployee {
  userId: string;
  userName: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  isActive?: boolean;
}

export interface LocationEmployeesResponse {
  employees: LocationEmployee[];
}

export interface LocationDetail extends Location {
  employees: LocationEmployee[];
}
