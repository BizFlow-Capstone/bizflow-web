// Types for Location API
export interface Location {
  id: number;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  isActive: boolean;
  ownerName: string;
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
  employeeIds: number[];
}
