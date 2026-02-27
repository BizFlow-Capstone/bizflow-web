// Types for Business Type API

export interface BusinessType {
  businessTypeId: string;
  code: string;
  name: string;
  description: string;
  status: string;
}

export interface BusinessTypeApiResponse {
  data: BusinessType[];
  success: boolean;
  messageCode: string;
  message: string;
  errors: null | string[];
  timestamp: string;
}
