export interface AuthApiResponse<T> {
  data?: T;
  success: boolean;
  messageCode?: string;
  message?: string;
  timestamp?: string;
}

export interface AuthAccountCredential {
  type: "phone" | "email" | "google" | string;
  identifier: string;
  emailVerified?: boolean | null;
}

export interface AuthAccount {
  accountId?: string;
  profileId?: string;
  fullName?: string;
  avatarUrl?: string | null;
  taxCode?: string | null;
  role?: string;
  hasPassword?: boolean;
  mustChangePassword?: boolean;
  credentials?: AuthAccountCredential[];
}

export interface AuthUserProfile {
  profileId?: string;
  fullName?: string;
  avatarUrl?: string | null;
  taxCode?: string | null;
  mustChangePassword?: boolean;
}

export interface FirebaseCustomTokenData {
  profileId?: string;
  customToken?: string;
}

export interface GoogleAuthData {
  accessToken?: string;
  refreshToken?: string;
  hasPassword?: boolean;
  isNewAccount?: boolean;
  account?: AuthAccount;
}

export interface AuthCredentialsData {
  credentials?: Array<{
    type: "phone" | "email" | "google" | string;
    identifier: string;
    emailVerified?: boolean;
    createdAt?: string;
  }>;
  [key: string]: unknown;
}
