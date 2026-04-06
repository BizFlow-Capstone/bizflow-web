// ---------------------------------------------------------------------------
// Admin Notification types – migrated from bizflow_admin_cms
// ---------------------------------------------------------------------------

export interface NotificationTemplate {
  notificationTemplateId: string;
  eventCode: string;
  notificationType: string;
  titleTemplate: string;
  contentTemplate: string;
  defaultActionType?: string | null;
  defaultTargetScreen?: string | null;
  defaultActionPayloadJson?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface NotificationActionType {
  code: string;
  displayName: string;
  description: string;
}

export interface NotificationTarget {
  code: string;
  targetScreen: string;
  mobileRoute: string;
  webRoute: string;
  aliases: string[];
  payloadExampleJson: string;
}

export interface NotificationActionCatalog {
  actionTypes: NotificationActionType[];
  targets: NotificationTarget[];
  triggers: Array<{
    eventCode: string;
    feature: string;
    triggerDescription: string;
  }>;
  placeholders?: Array<{
    key: string;
    token: string;
    description: string;
    exampleValue: string;
  }>;
}

export type DispatchStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "COMPLETED"
  | "FAILED";

export interface NotificationDispatch {
  notificationDispatchId: number;
  notificationTemplateId?: string | null;
  notificationType: string;
  priority: string;
  title: string;
  content: string;
  recipientScope: string;
  recipientUserIdsJson?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  status: DispatchStatus | string;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateDispatchRequest {
  eventCode?: string;
  notificationType?: string;
  priority?: string;
  title?: string;
  content?: string;
  templateData?: Record<string, string>;
  dataJson?: string;
  actionType?: string;
  targetScreen?: string;
  actionPayloadJson?: string;
  sendToAllUsers: boolean;
  recipientUserIds?: string[];
  scheduledAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
