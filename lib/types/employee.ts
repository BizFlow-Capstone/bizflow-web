export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

export interface EmployeeDetail {
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  status?: EmployeeStatusOption | string | null;
  startAt?: string | null;
  endAt?: string;
}

export interface EmployeeStatusOption {
  code: string;
  label: string;
}

export interface EmployeeSearchResult {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  isAlreadyHired: boolean;
}

export interface InviteEmployeeRequest {
  employeeId: string;
}

export interface HireRecord {
  hireId: number;
  ownerId: string;
  employeeId: string;
  createdAt: string;
  isActive: boolean;
}

export interface EmployeeInvitation {
  hireId: number;
  ownerId: string;
  ownerName: string;
  invitedAt: string;
}

export interface AssignableEmployee {
  userId: string;
  userName: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}
