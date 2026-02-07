// Types for Employee API

export interface Employee {
  userId: string;
  userName: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}
