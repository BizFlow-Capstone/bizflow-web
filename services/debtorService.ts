import type {
  ApiResponse,
  DebtorRecord,
  DebtorFull,
  DebtorPagination,
  DebtorFilters,
  CreateDebtorRequest,
  UpdateDebtorRequest,
  RecordPaymentRequest,
  RecordPaymentResponse,
  DebtSummary,
} from "@/lib/types/debtor";

// ================ MOCK DATA ================

const MOCK_DEBTORS: DebtorRecord[] = [
  {
    debtorId: 1,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Anh Ba",
    phone: "0901234567",
    address: "123 Nguyễn Văn A, Q.1, TP.HCM",
    notes: "Khách quen, mua xi măng thường xuyên",
    creditLimit: 10000000,
    currentBalance: -1500000,
    outstandingDebt: 1500000,
    isActive: true,
    lastOrderDate: "2026-03-08T14:30:00Z",
    lastPaymentDate: "2026-03-05T10:00:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-03-08T14:30:00Z",
  },
  {
    debtorId: 2,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Chú Năm",
    phone: "0912345678",
    address: "45 Lê Lợi, Q.3, TP.HCM",
    notes: "Nhà thầu nhỏ, mua sắt thép",
    creditLimit: 20000000,
    currentBalance: -5200000,
    outstandingDebt: 5200000,
    isActive: true,
    lastOrderDate: "2026-03-06T09:15:00Z",
    lastPaymentDate: "2026-02-28T16:00:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-03-06T09:15:00Z",
  },
  {
    debtorId: 3,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Cô Bảy",
    phone: "0909876543",
    address: "78 Trần Hưng Đạo, Q.5, TP.HCM",
    creditLimit: 5000000,
    currentBalance: 200000,
    outstandingDebt: 0,
    isActive: true,
    lastOrderDate: "2026-03-08T11:00:00Z",
    lastPaymentDate: "2026-03-08T11:00:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-03-08T11:00:00Z",
  },
  {
    debtorId: 4,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Anh Tư (Thợ sơn)",
    phone: "0923456789",
    address: "12 Nguyễn Trãi, Q.1, TP.HCM",
    notes: "Mua sơn, bột trét tường",
    creditLimit: 8000000,
    currentBalance: -3800000,
    outstandingDebt: 3800000,
    isActive: true,
    lastOrderDate: "2026-03-07T15:00:00Z",
    lastPaymentDate: "2026-02-20T09:30:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-01-25T14:00:00Z",
    updatedAt: "2026-03-07T15:00:00Z",
  },
  {
    debtorId: 5,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Chị Lan",
    phone: "0934567890",
    address: "56 Hai Bà Trưng, Q.1, TP.HCM",
    creditLimit: undefined,
    currentBalance: -800000,
    outstandingDebt: 800000,
    isActive: true,
    lastOrderDate: "2026-03-09T08:45:00Z",
    lastPaymentDate: "2026-03-01T14:00:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-02-10T11:00:00Z",
    updatedAt: "2026-03-09T08:45:00Z",
  },
  {
    debtorId: 6,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Nguyễn Văn An",
    phone: "0945678901",
    address: "90 Điện Biên Phủ, Bình Thạnh, TP.HCM",
    notes: "Xây nhà mới",
    creditLimit: 15000000,
    currentBalance: 0,
    outstandingDebt: 0,
    isActive: true,
    lastOrderDate: "2026-02-25T16:00:00Z",
    lastPaymentDate: "2026-02-25T16:00:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-02-25T16:00:00Z",
  },
  {
    debtorId: 7,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Công ty TNHH Phúc An",
    phone: "02838123456",
    address: "200 Cách Mạng Tháng 8, Q.10, TP.HCM",
    notes: "Công ty xây dựng nhỏ, mua số lượng lớn",
    creditLimit: 50000000,
    currentBalance: -12500000,
    outstandingDebt: 12500000,
    isActive: true,
    lastOrderDate: "2026-03-10T10:00:00Z",
    lastPaymentDate: "2026-03-01T08:00:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-03-10T10:00:00Z",
  },
  {
    debtorId: 8,
    businessLocationId: 1,
    businessLocationName: "Chi nhánh Quận 1",
    name: "Anh Đức (Thợ điện)",
    phone: "0956789012",
    notes: "Mua dây điện, ống nhựa",
    creditLimit: 3000000,
    currentBalance: -2900000,
    outstandingDebt: 2900000,
    isActive: true,
    lastOrderDate: "2026-03-09T13:00:00Z",
    lastPaymentDate: "2026-01-30T10:00:00Z",
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: "2026-01-28T15:00:00Z",
    updatedAt: "2026-03-09T13:00:00Z",
  },
];

const MOCK_DEBTOR_DETAILS: Record<number, DebtorFull> = {
  1: {
    ...MOCK_DEBTORS[0],
    recentOrders: [
      {
        orderId: 1001,
        orderCode: "ORD-20260308-001",
        orderDate: "2026-03-08T14:30:00Z",
        totalAmount: 2000000,
        debtAmount: 500000,
        paidAmount: 1500000,
        status: "COMPLETED",
      },
      {
        orderId: 985,
        orderCode: "ORD-20260305-002",
        orderDate: "2026-03-05T10:00:00Z",
        totalAmount: 3500000,
        debtAmount: 1000000,
        paidAmount: 2500000,
        status: "COMPLETED",
      },
      {
        orderId: 960,
        orderCode: "ORD-20260301-001",
        orderDate: "2026-03-01T09:00:00Z",
        totalAmount: 1800000,
        debtAmount: 0,
        paidAmount: 1800000,
        status: "COMPLETED",
      },
    ],
    recentPayments: [
      {
        transactionId: 101,
        debtorId: 1,
        amount: 1000000,
        paymentMethod: "cash",
        notes: "Trả một phần",
        balanceBefore: -2500000,
        balanceAfter: -1500000,
        createdByUserName: "Lê Văn Minh",
        paidAt: "2026-03-05T10:00:00Z",
      },
      {
        transactionId: 95,
        debtorId: 1,
        amount: 500000,
        paymentMethod: "bank",
        notes: "Chuyển khoản",
        balanceBefore: -3000000,
        balanceAfter: -2500000,
        createdByUserName: "Trần Thị B",
        paidAt: "2026-02-28T14:00:00Z",
      },
      {
        transactionId: 88,
        debtorId: 1,
        amount: 2000000,
        paymentMethod: "cash",
        balanceBefore: -5000000,
        balanceAfter: -3000000,
        createdByUserName: "Lê Văn Minh",
        paidAt: "2026-02-15T09:30:00Z",
      },
    ],
    statistics: {
      totalOrders: 15,
      totalPurchaseAmount: 25000000,
      totalPaidAmount: 23500000,
      oldestUnpaidOrder: "2026-03-05",
    },
  },
  2: {
    ...MOCK_DEBTORS[1],
    recentOrders: [
      {
        orderId: 995,
        orderCode: "ORD-20260306-003",
        orderDate: "2026-03-06T09:15:00Z",
        totalAmount: 8500000,
        debtAmount: 3200000,
        paidAmount: 5300000,
        status: "COMPLETED",
      },
      {
        orderId: 970,
        orderCode: "ORD-20260302-001",
        orderDate: "2026-03-02T11:00:00Z",
        totalAmount: 6000000,
        debtAmount: 2000000,
        paidAmount: 4000000,
        status: "COMPLETED",
      },
    ],
    recentPayments: [
      {
        transactionId: 98,
        debtorId: 2,
        amount: 3000000,
        paymentMethod: "bank",
        notes: "Chuyển khoản trả nợ tháng 2",
        balanceBefore: -8200000,
        balanceAfter: -5200000,
        createdByUserName: "Lê Văn Minh",
        paidAt: "2026-02-28T16:00:00Z",
      },
    ],
    statistics: {
      totalOrders: 22,
      totalPurchaseAmount: 45000000,
      totalPaidAmount: 39800000,
      oldestUnpaidOrder: "2026-03-02",
    },
  },
  7: {
    ...MOCK_DEBTORS[6],
    recentOrders: [
      {
        orderId: 1005,
        orderCode: "ORD-20260310-002",
        orderDate: "2026-03-10T10:00:00Z",
        totalAmount: 15000000,
        debtAmount: 7500000,
        paidAmount: 7500000,
        status: "COMPLETED",
      },
      {
        orderId: 990,
        orderCode: "ORD-20260305-001",
        orderDate: "2026-03-05T14:00:00Z",
        totalAmount: 12000000,
        debtAmount: 5000000,
        paidAmount: 7000000,
        status: "COMPLETED",
      },
    ],
    recentPayments: [
      {
        transactionId: 100,
        debtorId: 7,
        amount: 5000000,
        paymentMethod: "bank",
        notes: "Chuyển khoản đợt 1 tháng 3",
        balanceBefore: -17500000,
        balanceAfter: -12500000,
        createdByUserName: "Lê Văn Minh",
        paidAt: "2026-03-01T08:00:00Z",
      },
    ],
    statistics: {
      totalOrders: 35,
      totalPurchaseAmount: 120000000,
      totalPaidAmount: 107500000,
      oldestUnpaidOrder: "2026-03-05",
    },
  },
};

// ================ DELAY HELPER ================

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ================ SERVICE FUNCTIONS ================

export async function getDebtors(
  filters: DebtorFilters,
): Promise<ApiResponse<DebtorPagination>> {
  await delay(400);

  let result = [...MOCK_DEBTORS];

  // Filter: hasDebt
  if (filters.hasDebt === true) {
    result = result.filter((d) => d.currentBalance < 0);
  }

  // Filter: search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.phone && d.phone.includes(q)) ||
        (d.address && d.address.toLowerCase().includes(q)),
    );
  }

  // Sort
  const sortBy = filters.sortBy ?? "name";
  const sortDir = filters.sortDir ?? "asc";
  result.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") cmp = a.name.localeCompare(b.name, "vi");
    else if (sortBy === "balance") cmp = a.currentBalance - b.currentBalance;
    else if (sortBy === "createdAt")
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === "desc" ? -cmp : cmp;
  });

  // Pagination
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const totalCount = result.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const start = (page - 1) * pageSize;
  const items = result.slice(start, start + pageSize);

  const totalDebt = MOCK_DEBTORS.filter((d) => d.currentBalance < 0).reduce(
    (sum, d) => sum + d.outstandingDebt,
    0,
  );

  return {
    data: {
      items,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
      totalDebt,
    },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function getDebtorDetail(
  debtorId: number,
): Promise<ApiResponse<DebtorFull>> {
  await delay(300);

  const detail = MOCK_DEBTOR_DETAILS[debtorId];
  if (detail) {
    return {
      data: detail,
      success: true,
      messageCode: "SUCCESS",
      message: "OK",
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback: generate basic detail from record
  const record = MOCK_DEBTORS.find((d) => d.debtorId === debtorId);
  if (!record) {
    throw new Error("Không tìm thấy khách hàng");
  }

  return {
    data: {
      ...record,
      recentOrders: [],
      recentPayments: [],
      statistics: {
        totalOrders: 0,
        totalPurchaseAmount: 0,
        totalPaidAmount: 0,
      },
    },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}

export async function createDebtor(
  request: CreateDebtorRequest,
): Promise<ApiResponse<DebtorRecord>> {
  await delay(500);

  const newDebtor: DebtorRecord = {
    debtorId: Date.now(),
    businessLocationId: request.businessLocationId,
    businessLocationName: "Chi nhánh Quận 1",
    name: request.name,
    phone: request.phone,
    address: request.address,
    notes: request.notes,
    creditLimit: request.creditLimit,
    currentBalance: 0,
    outstandingDebt: 0,
    isActive: true,
    createdByUserId: "user-001",
    createdByUserName: "Lê Văn Minh",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    data: newDebtor,
    success: true,
    messageCode: "CREATED",
    message: "Tạo khách hàng thành công",
    timestamp: new Date().toISOString(),
  };
}

export async function updateDebtor(
  debtorId: number,
  request: UpdateDebtorRequest,
): Promise<ApiResponse<DebtorRecord>> {
  await delay(400);

  const existing = MOCK_DEBTORS.find((d) => d.debtorId === debtorId);
  if (!existing) throw new Error("Không tìm thấy khách hàng");

  const updated: DebtorRecord = {
    ...existing,
    ...request,
    updatedAt: new Date().toISOString(),
  };

  return {
    data: updated,
    success: true,
    messageCode: "UPDATED",
    message: "Cập nhật thành công",
    timestamp: new Date().toISOString(),
  };
}

export async function deleteDebtor(
  debtorId: number,
): Promise<ApiResponse<null>> {
  await delay(300);

  const existing = MOCK_DEBTORS.find((d) => d.debtorId === debtorId);
  if (!existing) throw new Error("Không tìm thấy khách hàng");
  if (existing.currentBalance < 0) {
    throw new Error(
      `Không thể xóa khách hàng còn nợ ${Math.abs(existing.currentBalance).toLocaleString("vi-VN")}đ`,
    );
  }

  return {
    data: null,
    success: true,
    messageCode: "DELETED",
    message: "Xóa thành công",
    timestamp: new Date().toISOString(),
  };
}

export async function recordPayment(
  debtorId: number,
  request: RecordPaymentRequest,
): Promise<ApiResponse<RecordPaymentResponse>> {
  await delay(500);

  const debtor = MOCK_DEBTORS.find((d) => d.debtorId === debtorId);
  if (!debtor) throw new Error("Không tìm thấy khách hàng");

  const balanceBefore = debtor.currentBalance;
  const balanceAfter = balanceBefore + request.amount;

  return {
    data: {
      transactionId: Date.now(),
      debtorId,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      balanceBefore,
      balanceAfter,
      outstandingDebtAfter: Math.abs(Math.min(0, balanceAfter)),
      paidAt: new Date().toISOString(),
      createdByUserName: "Lê Văn Minh",
    },
    success: true,
    messageCode: "CREATED",
    message: "Ghi nhận thanh toán thành công",
    timestamp: new Date().toISOString(),
  };
}

export async function getDebtSummary(): Promise<ApiResponse<DebtSummary>> {
  await delay(300);

  const debtorsWithDebt = MOCK_DEBTORS.filter((d) => d.currentBalance < 0);
  const debtorsWithCredit = MOCK_DEBTORS.filter((d) => d.currentBalance > 0);
  const totalOutstanding = debtorsWithDebt.reduce(
    (sum, d) => sum + d.outstandingDebt,
    0,
  );
  const totalCredit = debtorsWithCredit.reduce(
    (sum, d) => sum + d.currentBalance,
    0,
  );

  return {
    data: {
      totalDebtors: MOCK_DEBTORS.length,
      debtorsWithDebt: debtorsWithDebt.length,
      debtorsWithCredit: debtorsWithCredit.length,
      totalOutstandingDebt: totalOutstanding,
      totalCredit,
      netDebt: totalOutstanding - totalCredit,
    },
    success: true,
    messageCode: "SUCCESS",
    message: "OK",
    timestamp: new Date().toISOString(),
  };
}
