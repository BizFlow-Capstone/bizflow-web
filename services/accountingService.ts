import type {
  ApiResponse,
  CashFlowReport,
  CostPagination,
  CostFilters,
  RevenuePagination,
  AccountingPeriod,
  CreatePeriodRequest,
  PeriodAuditLog,
  AccountingTemplate,
  AccountingBook,
} from "@/lib/types/accounting";

/**
 * Accounting Service — Mock data
 * Will be replaced by real API calls when backend is ready
 */

// ═══ Mock Data ═══

const MOCK_COSTS: CostPagination = {
  items: [
    {
      costId: 1,
      businessLocationId: 1,
      costType: "import",
      importId: 1,
      description: "Nhập xi măng Hà Tiên 500 bao",
      amount: 23750000,
      costDate: "2026-03-01",
      paymentMethod: "cash",
      createdByUserName: "Lê Văn A",
      createdAt: "2026-03-01T08:00:00Z",
    },
    {
      costId: 2,
      businessLocationId: 1,
      costType: "salary",
      description: "Lương nhân viên T3/2026",
      amount: 15000000,
      costDate: "2026-03-05",
      paymentMethod: "bank",
      createdByUserName: "Lê Văn A",
      createdAt: "2026-03-05T10:00:00Z",
    },
    {
      costId: 3,
      businessLocationId: 1,
      costType: "rent",
      description: "Tiền thuê mặt bằng T3/2026",
      amount: 8000000,
      costDate: "2026-03-01",
      paymentMethod: "bank",
      createdByUserName: "Lê Văn A",
      createdAt: "2026-03-01T07:00:00Z",
    },
    {
      costId: 4,
      businessLocationId: 1,
      costType: "utilities",
      description: "Tiền điện + nước T2/2026",
      amount: 2500000,
      costDate: "2026-03-03",
      paymentMethod: "cash",
      createdByUserName: "Lê Văn A",
      createdAt: "2026-03-03T09:00:00Z",
    },
    {
      costId: 5,
      businessLocationId: 1,
      costType: "transport",
      description: "Vận chuyển sắt phi 12",
      amount: 1200000,
      costDate: "2026-03-02",
      paymentMethod: "cash",
      createdByUserName: "Nguyễn Thị B",
      createdAt: "2026-03-02T14:00:00Z",
    },
  ],
  totalCount: 5,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
};

const MOCK_REVENUES: RevenuePagination = {
  items: [
    {
      revenueId: 1,
      businessLocationId: 1,
      revenueType: "sale",
      orderId: 1001,
      description: "Đơn hàng #ORD-2026-001 hoàn tất",
      amount: 4750000,
      revenueDate: "2026-03-01",
      paymentMethod: "cash",
      createdByUserName: "Hệ thống",
      createdAt: "2026-03-01T10:30:00Z",
    },
    {
      revenueId: 2,
      businessLocationId: 1,
      revenueType: "sale",
      orderId: 1002,
      description: "Đơn hàng #ORD-2026-002 hoàn tất",
      amount: 2300000,
      revenueDate: "2026-03-01",
      paymentMethod: "bank",
      createdByUserName: "Hệ thống",
      createdAt: "2026-03-01T14:00:00Z",
    },
    {
      revenueId: 3,
      businessLocationId: 1,
      revenueType: "sale",
      orderId: 1003,
      description: "Đơn hàng #ORD-2026-003 hoàn tất",
      amount: 8200000,
      revenueDate: "2026-03-02",
      paymentMethod: "mixed",
      createdByUserName: "Hệ thống",
      createdAt: "2026-03-02T09:00:00Z",
    },
    {
      revenueId: 4,
      businessLocationId: 1,
      revenueType: "manual",
      description: "Thu nhập dịch vụ cắt sắt",
      amount: 500000,
      revenueDate: "2026-03-02",
      paymentMethod: "cash",
      createdByUserName: "Lê Văn A",
      createdAt: "2026-03-02T16:00:00Z",
    },
  ],
  totalCount: 4,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
};

const MOCK_CASHFLOW: CashFlowReport = {
  startDate: "2026-03-01",
  endDate: "2026-03-31",
  channels: [
    { channel: "cash", totalIn: 450000000, totalOut: 85000000, net: 365000000 },
    { channel: "bank", totalIn: 120000000, totalOut: 15000000, net: 105000000 },
    { channel: "debt", totalIn: 50000000, totalOut: 0, net: 50000000 },
  ],
};

const MOCK_PERIODS: AccountingPeriod[] = [
  {
    periodId: 1,
    businessLocationId: 1,
    periodType: "quarter",
    year: 2026,
    quarter: 1,
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    openingCashBalance: 50000000,
    openingBankBalance: 120000000,
    status: "open",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    periodId: 2,
    businessLocationId: 1,
    periodType: "year",
    year: 2025,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    openingCashBalance: 30000000,
    openingBankBalance: 80000000,
    status: "finalized",
    finalizedAt: "2026-01-15T09:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

const MOCK_AUDIT_LOGS: PeriodAuditLog[] = [
  {
    logId: 1,
    periodId: 1,
    action: "period_created",
    newValue: JSON.stringify({ periodType: "quarter", year: 2026, quarter: 1 }),
    createdByUserName: "Lê Văn A",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    logId: 2,
    periodId: 2,
    action: "period_finalized",
    newValue: JSON.stringify({ finalizedAt: "2026-01-15T09:00:00Z" }),
    createdByUserName: "Lê Văn A",
    createdAt: "2026-01-15T09:00:00Z",
  },
];

const MOCK_TEMPLATES: AccountingTemplate[] = [
  {
    templateId: 1,
    templateCode: "S1a",
    name: "Sổ chi tiết bán hàng",
    applicableGroups: [1],
    isActive: true,
  },
  {
    templateId: 2,
    templateCode: "S2a",
    name: "Sổ doanh thu bán hàng hóa, dịch vụ",
    applicableGroups: [2],
    applicableMethods: ["method_1"],
    isActive: true,
  },
  {
    templateId: 3,
    templateCode: "S2b",
    name: "Sổ doanh thu bán hàng hóa, dịch vụ",
    applicableGroups: [2, 3, 4],
    applicableMethods: ["method_2"],
    isActive: true,
  },
  {
    templateId: 4,
    templateCode: "S2c",
    name: "Sổ chi tiết doanh thu, chi phí",
    applicableGroups: [2, 3, 4],
    applicableMethods: ["method_2"],
    isActive: true,
  },
  {
    templateId: 5,
    templateCode: "S2d",
    name: "Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa",
    applicableGroups: [2, 3, 4],
    applicableMethods: ["method_2"],
    isActive: true,
  },
  {
    templateId: 6,
    templateCode: "S2e",
    name: "Sổ chi tiết tiền",
    applicableGroups: [2, 3, 4],
    applicableMethods: ["method_2"],
    isActive: true,
  },
];

const MOCK_BOOKS: AccountingBook[] = [
  {
    bookId: 1,
    periodId: 1,
    templateCode: "S2a",
    templateName: "Sổ doanh thu bán hàng hóa, dịch vụ",
    groupNumber: 2,
    taxMethod: "method_1",
    status: "active",
    createdAt: "2026-01-05T10:00:00Z",
  },
  {
    bookId: 2,
    periodId: 1,
    templateCode: "S2e",
    templateName: "Sổ chi tiết tiền",
    groupNumber: 2,
    taxMethod: "method_2",
    status: "active",
    createdAt: "2026-01-05T10:30:00Z",
  },
  {
    bookId: 3,
    periodId: 2,
    templateCode: "S1a",
    templateName: "Sổ chi tiết bán hàng",
    groupNumber: 1,
    status: "archived",
    createdAt: "2025-01-10T08:00:00Z",
  },
];

// ═══ Service Functions ═══

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getCosts(
  _filters: CostFilters,
): Promise<ApiResponse<CostPagination>> {
  await delay(300);
  return {
    data: MOCK_COSTS,
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getRevenues(
  _locationId: number,
): Promise<ApiResponse<RevenuePagination>> {
  await delay(300);
  return {
    data: MOCK_REVENUES,
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getCashFlowReport(
  _locationId: number,
  _startDate: string,
  _endDate: string,
): Promise<ApiResponse<CashFlowReport>> {
  await delay(350);
  return {
    data: MOCK_CASHFLOW,
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getAccountingPeriods(
  _locationId: number,
): Promise<ApiResponse<AccountingPeriod[]>> {
  await delay(300);
  return {
    data: MOCK_PERIODS,
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function createAccountingPeriod(
  _locationId: number,
  _data: CreatePeriodRequest,
): Promise<ApiResponse<AccountingPeriod>> {
  await delay(400);
  const newPeriod: AccountingPeriod = {
    periodId: Date.now(),
    businessLocationId: _locationId,
    ..._data,
    startDate: _data.quarter
      ? `${_data.year}-${String((_data.quarter - 1) * 3 + 1).padStart(2, "0")}-01`
      : `${_data.year}-01-01`,
    endDate: _data.quarter
      ? `${_data.year}-${String(_data.quarter * 3).padStart(2, "0")}-${_data.quarter === 1 ? 31 : _data.quarter === 2 ? 30 : _data.quarter === 3 ? 30 : 31}`
      : `${_data.year}-12-31`,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  return {
    data: newPeriod,
    success: true,
    messageCode: "SUCCESS",
    message: "Tạo kỳ kế toán thành công",
    timestamp: new Date().toISOString(),
  };
}

export async function finalizePeriod(
  _locationId: number,
  _periodId: number,
): Promise<ApiResponse<AccountingPeriod>> {
  await delay(400);
  const period = MOCK_PERIODS.find((p) => p.periodId === _periodId);
  return {
    data: {
      ...period!,
      status: "finalized",
      finalizedAt: new Date().toISOString(),
    },
    success: true,
    messageCode: "SUCCESS",
    message: "Chốt kỳ thành công",
    timestamp: new Date().toISOString(),
  };
}

export async function reopenPeriod(
  _locationId: number,
  _periodId: number,
  _reason: string,
): Promise<ApiResponse<AccountingPeriod>> {
  await delay(400);
  const period = MOCK_PERIODS.find((p) => p.periodId === _periodId);
  return {
    data: { ...period!, status: "reopened" },
    success: true,
    messageCode: "SUCCESS",
    message: "Mở lại kỳ thành công",
    timestamp: new Date().toISOString(),
  };
}

export async function getPeriodAuditLogs(
  _locationId: number,
  periodId: number,
): Promise<ApiResponse<PeriodAuditLog[]>> {
  await delay(250);
  return {
    data: MOCK_AUDIT_LOGS.filter((l) => l.periodId === periodId),
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getAccountingTemplates(): Promise<
  ApiResponse<AccountingTemplate[]>
> {
  await delay(200);
  return {
    data: MOCK_TEMPLATES,
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getAccountingBooks(
  _locationId: number,
  _periodId?: number,
): Promise<ApiResponse<AccountingBook[]>> {
  await delay(300);
  const books = _periodId
    ? MOCK_BOOKS.filter((b) => b.periodId === _periodId)
    : MOCK_BOOKS;
  return {
    data: books,
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}
