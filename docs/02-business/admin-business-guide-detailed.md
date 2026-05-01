# BizFlow Admin FE — Tài Liệu Chi Tiết Để Bảo Vệ Hội Đồng

> **Tài liệu này là phụ lục đào sâu của `admin-business-guide.md`**.
> Mục đích: Giúp bạn nắm chắc TỪNG DÒNG CODE và TỪNG QUYẾT ĐỊNH THIẾT KẾ trong Admin FE để tự tin trả lời mọi câu hỏi hội đồng.
>
> Cách dùng:
>
> 1. Đọc tổng quan ở `admin-business-guide.md` trước.
> 2. Quay lại đây để đào sâu từng module.
> 3. Mỗi mục đều có "Câu hỏi có thể bị hỏi" + "Cách trả lời chuẩn".

---

## MỤC LỤC

- [Phần A. Kiến Trúc Tổng Thể & Bảo Vệ Route](#phần-a-kiến-trúc-tổng-thể--bảo-vệ-route)
- [Phần B. Module Tổng Quan (`/admin`)](#phần-b-module-tổng-quan-admin)
- [Phần C. Module Quản Lý Người Dùng (`/admin/accounts`)](#phần-c-module-quản-lý-người-dùng-adminaccounts)
- [Phần D. Module Thông Báo (`/admin/notifications`)](#phần-d-module-thông-báo-adminnotifications)
- [Phần E. Module Gói Đăng Ký (`/admin/subscriptions`)](#phần-e-module-gói-đăng-ký-adminsubscriptions)
- [Phần F. Module Kế Toán (`/admin/accounting`) — Phần Phức Tạp Nhất](#phần-f-module-kế-toán-adminaccounting--phần-phức-tạp-nhất)
- [Phần G. Layer Service / Lib / Hooks](#phần-g-layer-service--lib--hooks)
- [Phần H. UI Patterns & Re-usable Components](#phần-h-ui-patterns--re-usable-components)
- [Phần I. Bộ Câu Hỏi Hội Đồng Mở Rộng (40+ câu)](#phần-i-bộ-câu-hỏi-hội-đồng-mở-rộng-40-câu)
- [Phần J. Mẹo Trả Lời & Kịch Bản Phòng Ngừa](#phần-j-mẹo-trả-lời--kịch-bản-phòng-ngừa)

---

## Phần A. Kiến Trúc Tổng Thể & Bảo Vệ Route

### A.1. Cấu trúc folder admin

```
app/admin/
├── layout.tsx                           # Root layout - chốt chặn JWT + render sidebar
├── page.tsx                             # Server component - chỉ trả metadata
├── AdminOverviewClient.tsx              # Trang tổng quan (mock stats)
├── accounts/
│   ├── page.tsx
│   └── AdminAccountsClient.tsx
├── notifications/
│   ├── page.tsx
│   └── AdminNotificationsClient.tsx
├── accounting/
│   ├── page.tsx
│   ├── AdminAccountingClient.tsx        # Tọa độ chính (~1600 dòng)
│   └── components/
│       ├── types.ts                     # Shared types: MappingFormState, VersionOption
│       ├── VersionFlowTab.tsx           # Wizard 4 bước (~400 dòng)
│       ├── FormulaTab.tsx               # Formula builder (~4700 dòng)
│       └── MappingTab.tsx               # Field mapping CRUD
└── subscriptions/
    ├── page.tsx
    └── AdminSubscriptionsClient.tsx
```

**Pattern Next.js App Router**:

- `page.tsx` là Server Component, chỉ trả metadata + `<Client />`. Không gọi API ở đây vì bên trong client cần token từ `localStorage`.
- `layout.tsx` chạy cho toàn bộ `/admin/*` — chốt chặn auth.
- Tên file `*Client.tsx` thể hiện đây là **Client Component** (`"use client"` ở đầu file).

### A.2. AdminLayout — chốt chặn JWT

**File**: `app/admin/layout.tsx` (~60 dòng)

**Trình tự kiểm tra (chạy trong `useEffect` khi mount)**:

1. Gọi `getValidAccessToken()` (từ `lib/auth/tokenManager.ts`) → token đã được auto-refresh nếu sắp hết hạn.
2. Decode JWT lấy claim role: `getRoleFromToken(token)` đọc claim `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`.
3. Phân nhánh:
   - Không có token → `router.replace("/auth/login")`.
   - `role === "consultant"` → `router.replace("/consultant/accounting")`.
   - `role !== "admin"` (user) → `router.replace("/dashboard")`.
   - `role === "admin"` → `setAuthorized(true)`, render layout.
4. Nếu `try/catch` lỗi (network, JWT malformed) → fallback redirect `/auth/login`.
5. Khi `authorized === false` → render `null` (không phải spinner) để **tránh flash nội dung admin** cho người chưa được duyệt.

**Tại sao kiểm ở client thay vì middleware?**

- Middleware Next.js chạy ở Edge runtime, không truy cập được `localStorage` (nơi lưu token). Token JWT của BizFlow lưu ở localStorage để chia sẻ giữa Web + Mobile WebView.
- Nếu cần kiểm ở server, phải dùng cookie. Hệ thống chọn localStorage để đơn giản hóa và đồng bộ với mobile.

**Câu hỏi có thể bị hỏi**:

> _"Client-side auth có an toàn không? User có thể bypass bằng cách sửa role trong JWT không?"_

**Trả lời**: JWT được ký bằng secret ở BE bằng HS256/RS256. Sửa payload sẽ làm signature fail → BE từ chối mọi request. Client check role chỉ để **UX** (redirect đúng trang, không show menu admin cho user thường). **Authorization thực sự nằm ở BE** — mọi endpoint `/api/admin/*` đều có `[Authorize(Roles = "admin")]`.

### A.3. AdminSidebar — Navigation

**File**: `components/admin/AdminSidebar.tsx`

5 menu items với pattern:

```tsx
const adminMenuItems = [
  {
    href: "/admin",
    label: "Tổng Quan",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/admin/accounts", label: "Quản Lý Người Dùng", icon: Users },
  { href: "/admin/notifications", label: "Quản Lý Thông Báo", icon: Bell },
  { href: "/admin/accounting", label: "Quản Lý Kế Toán", icon: BookOpen },
  { href: "/admin/subscriptions", label: "Gói Đăng Ký", icon: CreditCard },
];
```

**Active detection**:

- Nếu `exact === true` → so sánh `pathname === href`.
- Ngược lại → `pathname.startsWith(href)` (cho phép `/admin/accounting?tab=formulas` vẫn highlight).

**Tại sao tách `exact`?** Vì `/admin` là prefix của tất cả route khác, không có flag này thì menu Tổng Quan luôn active.

---

## Phần B. Module Tổng Quan (`/admin`)

### B.1. Mô tả

Trang dashboard mở đầu cho admin. Hiện tại là phiên bản MVP với **mock data**, để phát triển tiếp khi có analytics API.

### B.2. Cấu trúc

**File**: `app/admin/AdminOverviewClient.tsx`

- 4 stat cards: Tổng Người Dùng, Người Dùng Hoạt Động, Thông Báo Đã Gửi, Doanh Thu.
- Mỗi card có icon, số liệu, % tăng/giảm so với kỳ trước.
- Recent Activities: 5 hoạt động gần đây.
- System Health: trạng thái các service (DB, AI Service, Notification Worker).

### B.3. Trade-off đã chọn

- Hiện dùng mock vì:
  1. BE chưa expose endpoint thống kê tổng hợp.
  2. Mức độ ưu tiên phát triển nhường cho các module nghiệp vụ chính.
- Roadmap: tích hợp endpoint `GET /api/admin/analytics/overview` trả realtime data + chart Recharts.

### B.4. Câu hỏi hội đồng

> _"Tại sao dashboard lại là mock?"_

**Trả lời**: Đây là MVP, ưu tiên hoàn thiện logic nghiệp vụ phức tạp (kế toán, gói đăng ký) trước. Dashboard analytics đã có thiết kế UI, chỉ cần plug API là sẵn sàng. Đây là phần thuộc roadmap giai đoạn 2.

---

## Phần C. Module Quản Lý Người Dùng (`/admin/accounts`)

### C.1. Mục tiêu nghiệp vụ

Cho admin:

1. **Xem** toàn bộ user trong nền tảng (chủ hộ, nhân viên, kế toán viên, admin khác).
2. **Filter** theo role/status/keyword để tìm nhanh.
3. **Thu hồi phiên** đăng nhập của user thường khi nghi ngờ chiếm quyền.
4. **Tạo tài khoản kế toán viên** (consultant không tự đăng ký được).
5. **Xóa tài khoản kế toán viên** khi không còn cộng tác.

### C.2. State chính trong client component

```typescript
// app/admin/accounts/AdminAccountsClient.tsx
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState<
  "ALL" | "user" | "consultant" | "admin"
>("ALL");
const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
  "ALL",
);
const [pageNumber, setPageNumber] = useState(1);
const pageSize = 10;

// Dialogs
const [revokeDialogUser, setRevokeDialogUser] =
  useState<AdminManagedUser | null>(null);
const [deleteDialogUser, setDeleteDialogUser] =
  useState<AdminManagedUser | null>(null);
const [createConsultantOpen, setCreateConsultantOpen] = useState(false);
const [consultantEmail, setConsultantEmail] = useState("");
const [consultantFullName, setConsultantFullName] = useState("");
const [consultantFormError, setConsultantFormError] = useState("");
```

### C.3. Hooks (TanStack Query v5)

**File**: `hooks/useAdminUsers.ts`

```typescript
export function useAdminUsers(query) {
  return useQuery({
    queryKey: adminUserKeys.list(query),
    queryFn: () => getAdminUsers(query),
    placeholderData: keepPreviousData, // giữ data cũ khi đang fetch trang mới
    staleTime: 30 * 1000,
  });
}
```

**Lý do `keepPreviousData`**: Khi đổi trang, user thấy data cũ nhạt mờ thay vì màn hình loading trắng → UX mượt hơn (pattern tương tự Google search).

**`staleTime: 30s`**: Trong 30s sau lần fetch cuối, không refetch khi user click qua lại — giảm tải BE.

### C.4. API endpoints

**File**: `lib/admin-users-api.ts`

| Endpoint                                      | Method | Chức năng                                  |
| --------------------------------------------- | ------ | ------------------------------------------ |
| `/api/admin/users?pageNumber&pageSize&...`    | GET    | List users phân trang                      |
| `/api/admin/consultants`                      | POST   | Tạo tài khoản consultant                   |
| `/api/admin/consultants/{accountId}`          | DELETE | Xóa consultant                             |
| `/api/admin/users/{accountId}/refresh-tokens` | DELETE | Revoke tất cả refresh token (force logout) |

**Pattern email normalization**:

```typescript
const payload = {
  email: email.trim().toLowerCase(),
  fullName: fullName.trim(),
};
```

### C.5. Filter UX

- Search input: debounce 300ms (chuẩn industry), reset `pageNumber` về 1 khi gõ.
- Role/Status select: thay đổi → reset page về 1.
- Filter là **server-side** (truyền vào query params) không phải client-side filter để tránh tải toàn bộ dataset.

### C.6. Stats bar — chỉ tính theo trang

```typescript
const totalActive = items.filter((u) => u.isActive).length;
const totalInactive = items.length - totalActive;
```

**Trade-off**: Để tránh thêm 1 query COUNT toàn bộ DB. Khi admin filter cụ thể (ví dụ: role=consultant + status=active), stats vẫn có giá trị tham khảo.

### C.7. Revoke Tokens — cơ chế logout từ xa

**Workflow nghiệp vụ**:

1. Admin nghi ngờ tài khoản User-A bị chiếm quyền.
2. Click action menu → "Thu hồi phiên" → Confirm dialog.
3. Gọi `DELETE /api/admin/users/{User-A}/refresh-tokens`.
4. BE xóa toàn bộ refresh token của User-A trong DB.
5. Hiệu ứng:
   - **Access token hiện tại** vẫn valid đến khi hết hạn (≤ 15 phút).
   - **Khi access token hết hạn**, user gọi refresh → BE từ chối → buộc đăng nhập lại.
6. User-A đăng nhập lại với mật khẩu mới (đã đổi trước đó).

**Tại sao không revoke access token tức thì?** JWT là stateless, không có cách invalidate trừ khi maintain blacklist (tăng độ phức tạp + giảm hiệu năng). Trade-off: chấp nhận window 15 phút để giữ JWT đơn giản.

**Bảo vệ thêm**: Nếu cần invalidate ngay, có thể thêm `tokenVersion` claim, BE check version trong DB. BizFlow chưa implement vì window 15 phút chấp nhận được.

### C.8. Tạo consultant — phân biệt với self-signup

Consultant **không thể tự đăng ký** vì:

- Tài khoản chuyên môn cần được duyệt bởi admin.
- Tránh spam tạo tài khoản consultant để khai thác miễn phí.

**Flow**:

1. Admin nhập email + fullName.
2. FE validate cơ bản (email có `@`, fullName không rỗng).
3. POST `/api/admin/consultants`.
4. BE:
   - Tạo account với role=consultant + status=active.
   - Generate password setup token.
   - Gửi email cho consultant với link đặt mật khẩu.
5. FE đóng dialog, toast success, refresh list.

**Lỗi 409 Duplicate**:

- BE trả `{ success: false, message: "Email đã tồn tại" }`.
- FE hiển thị lỗi inline trong form (không đóng dialog) → admin sửa email rồi submit lại.

### C.9. Câu hỏi hội đồng

> _"Stats bar chỉ tính theo trang, vậy nếu hội đồng chất vấn 'không chính xác'?"_

**Trả lời**: Đây là trade-off có chủ ý. Nếu cần stats chính xác, sẽ thêm endpoint `GET /api/admin/users/stats` trả về aggregated count toàn DB. Hiện stats bar phục vụ snapshot nhanh trong context filter đã chọn, đủ cho 80% use case của admin.

> _"Tại sao chỉ revoke được cho user role, không cho consultant?"_

**Trả lời**: Consultant là tài khoản chuyên môn được admin tạo, ít rủi ro bị chiếm quyền (không có app mobile, login từ máy nội bộ). Khi cần gỡ consultant, dùng `Xóa Tài Khoản` trực tiếp. Phân tách rõ vai trò để hành động tương xứng với mức độ rủi ro.

---

## Phần D. Module Thông Báo (`/admin/notifications`)

### D.1. Mô hình 3 tầng

```
┌─────────────────────────────────────────────────────┐
│ Template (eventCode + titleTemplate + content)     │
│ Khuôn mẫu cố định, chỉnh ít, dùng nhiều           │
└──────────────────┬─────────────────────────────────┘
                   │ Trigger / placeholder fill
                   ↓
┌─────────────────────────────────────────────────────┐
│ Dispatch (lệnh gửi: ai nhận, khi nào, payload)    │
│ Mỗi chiến dịch gửi tạo 1 dispatch                  │
└──────────────────┬─────────────────────────────────┘
                   │ FCM / APNs
                   ↓
┌─────────────────────────────────────────────────────┐
│ Push Notification → thiết bị người dùng            │
└─────────────────────────────────────────────────────┘
```

### D.2. Tab Templates

**Cấu trúc 1 template**:

```typescript
{
  eventCode: "EMPLOYEE_INVITE",            // Định danh
  notificationType: "INFO" | "PROMO" | "ALERT",
  titleTemplate: "Bạn có lời mời từ {{ownerName}}",
  contentTemplate: "Cửa hàng {{locationName}} mời bạn làm nhân viên.",
  defaultActionType: "NAVIGATE" | "NONE",
  defaultTargetScreen: "InviteDetailScreen" | null,
  defaultActionPayloadJson: '{"inviteId":"{{inviteId}}"}' | null,
  isActive: boolean
}
```

**Placeholder syntax**: `{{key}}` — BE sẽ thay thế khi gửi dispatch dựa trên context.

**Locked event codes** (hardcode ở FE):

```typescript
const LOCKED_EVENT_CODES = new Set([
  "EMPLOYEE_INVITE",
  "INVITE_ACCEPTED",
  "INVITE_REJECTED",
  "EMPLOYEE_REMOVED",
]);
```

Nếu admin click toggle isActive → check `LOCKED_EVENT_CODES.has(eventCode)` → từ chối với toast.

**Tại sao locked?** Các template này gắn với business logic core (mời nhân viên). Nếu tắt, chức năng mời không gửi noti được → user mobile không biết được mời. Tuy nhiên admin vẫn có thể **chỉnh nội dung** (title/content) nếu muốn thay đổi câu chữ.

**Auto uppercase eventCode**:

```typescript
function normalizeEventCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "_");
}
```

Đảm bảo `promo_weekly`, `Promo Weekly`, `PROMO_WEEKLY` đều thành cùng 1 code.

**Action types**:

- `NONE`: Notification chỉ hiển thị, tap không làm gì.
- `NAVIGATE`: Tap mở màn hình cụ thể trong app.
  - Khi chọn NAVIGATE, các trường `targetScreen` + `actionPayloadJson` trở thành **bắt buộc**.
  - `targetScreen` được validate khớp với danh mục `actionCatalog.targets[]` (FE gọi `GET /api/admin/notifications/action-catalog`).
  - `actionPayloadJson` phải parse được JSON, kiểm thêm các key bắt buộc theo `target.payloadExampleJson`.

### D.3. Tab Dispatch — 6 chế độ recipient

| Mode                           | Validation FE                            | Use case                  |
| ------------------------------ | ---------------------------------------- | ------------------------- |
| `ALL_USERS`                    | Không gì thêm                            | Bảo trì hệ thống          |
| `ALL_LOCATION_OWNERS`          | Không gì thêm                            | Chính sách mới cho chủ hộ |
| `LOCATION_OWNER`               | Phải chọn `locationId`                   | Hỗ trợ 1 cửa hàng cụ thể  |
| `LOCATION_EMPLOYEES`           | `locationId` + group=STAFF               | Thông báo nội bộ cửa hàng |
| `LOCATION_OWNER_AND_EMPLOYEES` | `locationId` + group=ALL                 | Toàn bộ 1 đơn vị          |
| `SPECIFIC_USERS`               | `recipientUserIds[]` không rỗng (≥ 1 ID) | Marketing nhắm mục tiêu   |

**Preview Recipients button**: Trước khi bấm gửi, admin có thể xem trước số lượng + sample recipients (5–10 người đầu) để chắc chắn đối tượng.

API gọi tùy mode:

```typescript
GET /api/admin/notifications/recipient-groups/all-location-owners
GET /api/admin/notifications/recipient-groups/locations/{locationId}?recipientGroupType=OWNERS|STAFF|ALL
```

Response:

```typescript
{
  total: number,
  recipients: [{ profileId, fullName, phone?, email?, isOwner }]
}
```

### D.4. Tab History — Polling adaptive

**Vòng đời dispatch**: `PENDING → PROCESSING → SENT | FAILED | CANCELLED`

**Polling logic**:

```typescript
useEffect(() => {
  const hasActiveDispatches = items.some((d) =>
    ["PENDING", "PROCESSING"].includes(d.status),
  );

  if (!hasActiveDispatches) {
    // Polling chậm khi idle
    const timer = setInterval(refetch, 15_000);
    return () => clearInterval(timer);
  }

  // Polling nhanh khi có dispatch đang xử lý
  const timer = setInterval(refetch, 3_000);
  return () => clearInterval(timer);
}, [items]);
```

**Tại sao adaptive?**

- 3s khi đang gửi: user chờ kết quả tức thì.
- 15s khi idle: tiết kiệm tải BE (giảm 5 lần request).
- Có thể cải tiến thêm bằng visibility API: tab background → polling 30s.

**Tại sao không WebSocket?**

1. Đơn giản hơn: không cần infrastructure WebSocket (Redis pub/sub, sticky session).
2. Tần suất cập nhật thấp (1–2 phút có dispatch mới), polling đủ.
3. Stateless BE dễ scale ngang Docker hơn.
4. Roadmap: Khi scale ≥ 1000 admin online cùng lúc → cân nhắc SignalR.

**Status badges**:

| Status     | Màu     | Icon          |
| ---------- | ------- | ------------- |
| PENDING    | Amber   | Clock         |
| PROCESSING | Blue    | Loader (spin) |
| SENT       | Emerald | CheckCircle   |
| FAILED     | Red     | XCircle       |
| CANCELLED  | Gray    | Ban           |

**Cancel dispatch**: Chỉ với PENDING/PROCESSING. Click → `POST /api/admin/notifications/dispatches/{id}/cancel` → status thành CANCELLED.

### D.5. Câu hỏi hội đồng

> _"Tại sao không gửi notification trực tiếp mà phải qua dispatch?"_

**Trả lời**: Dispatch là abstraction để:

1. **Audit**: Mọi lệnh gửi được lưu lịch sử (ai gửi, khi nào, cho ai, kết quả).
2. **Retry**: Failed dispatch có thể retry lại bằng cùng payload.
3. **Schedule**: Dispatch có thể đặt `scheduledAt` để gửi vào tương lai.
4. **Bulk**: 1 dispatch = N push (N có thể hàng nghìn). Không thể chờ N push chạy synchronous → cần queue.

> _"Polling 3s không quá tải sao?"_

**Trả lời**: Mỗi request là `GET /dispatches?pageSize=20` rất nhẹ (≈ 5KB). Một admin online polling 3s = 20 req/phút. Với 10 admin = 200 req/phút — không đáng kể với BE ASP.NET Core. Khi scale lên hàng trăm admin sẽ chuyển sang SignalR.

---

## Phần E. Module Gói Đăng Ký (`/admin/subscriptions`)

### E.1. Mô hình dữ liệu

```typescript
SubscriptionPlan {
  subscriptionPlanId: number,
  name: string,                    // "Basic", "Pro", "Enterprise"
  description: string,
  durationDays: number,            // 30, 90, 365
  isActive: boolean,
  basePrice: number,
  discountedPrice: number | null,
  isDiscountActive: boolean,
  currency: "VND",
  features: PlanFeature[]          // Tính năng + quota
}

PlanFeature {
  featureId: number,               // FK to features (ORDERS, AI_CALLS, ...)
  featureCode: string,
  usageLimit: number               // -1 = unlimited, 0 = disabled, N = quota
}
```

### E.2. Quy ước -1 / 0 / N

| Giá trị | Ý nghĩa   | Ví dụ                           |
| ------- | --------- | ------------------------------- |
| `-1`    | Unlimited | Pro: ORDERS = -1 → vô hạn đơn   |
| `0`     | Disabled  | Basic: AI_CALLS = 0 → không có  |
| `N`     | Quota     | Basic: ORDERS = 100 → 100/tháng |

**Tại sao chọn `-1` thay vì `null`?**

- `null` trong số học gây bug ngầm (`null > 0` trả false ở mọi thứ).
- `-1` rõ ràng là "đặc biệt", BE check `if (limit === -1) return unlimited`.
- Schema DB không cần cột riêng `isUnlimited` (boolean) → giảm 1 column.

### E.3. Discount window

**Form fields khi bật discount**:

- `discountedPrice`: số ≥ 0, < `basePrice`.
- `discountStart`: ISO date.
- `discountEnd`: ISO date > `discountStart`.

**Validation FE**:

```typescript
function validateDiscount(form) {
  if (!form.hasDiscount) return null;

  if (!form.discountedPrice || form.discountedPrice < 0) {
    return "Giá sau giảm phải ≥ 0";
  }
  if (form.discountedPrice >= form.basePrice) {
    return "Giá sau giảm phải nhỏ hơn giá gốc";
  }
  if (!form.discountStart || !form.discountEnd) {
    return "Cần cả ngày bắt đầu và kết thúc";
  }
  if (new Date(form.discountEnd) <= new Date(form.discountStart)) {
    return "Ngày kết thúc phải sau ngày bắt đầu";
  }
  return null;
}
```

**Tại sao bắt buộc cả 3 trường khi bật discount?**

- Thiếu `discountEnd` → giảm giá vô thời hạn → thất thu.
- Thiếu `discountedPrice` → BE không biết giảm xuống bao nhiêu.
- Thiếu `discountStart` → giảm giá hồi tố user đã mua giá gốc.

### E.4. Vòng đời gói

```
[Tạo mới] ─→ Plan {isActive=false}        # Không hiển thị cho user
              ↓ (admin cấu hình tính năng, giá)
              ↓ (admin click "Kích hoạt")
              ↓
            Plan {isActive=true}          # Hiển thị marketplace
              ↓ (admin có thể "Tắt" để ẩn)
              ↓
            Plan {isActive=false}         # Ẩn nhưng giữ lịch sử subscription cũ
```

**Tại sao không xóa, chỉ Inactive?**

- User đã mua gói cũ vẫn cần lịch sử subscription.
- Hard delete sẽ phá foreign key → mất dữ liệu thanh toán.
- Pattern "soft toggle" chuẩn cho SaaS billing.

### E.5. Replace pattern (features list)

Khi update plan, FE gửi **toàn bộ** danh sách features (không partial update từng feature):

```typescript
PUT /api/admin/subscription-plans/{id}
Body: {
  ...metadata,
  features: [
    { featureId: 1, usageLimit: 100 },
    { featureId: 2, usageLimit: -1 }
    // Feature 3 đã có trong DB nhưng không gửi → BE xóa
  ]
}
```

BE: `DELETE FROM plan_features WHERE planId=? ; INSERT ...` (transaction).

**Tại sao replace?**

- Tránh state cũ "rò rỉ" khi admin xóa 1 feature trên UI nhưng forget gửi delete.
- Nguyên lý: state cuối cùng trên UI = state cuối cùng trong DB.

### E.6. Câu hỏi hội đồng

> _"Tại sao -1 = unlimited mà không phải null hoặc một flag riêng?"_

**Trả lời**: Tránh thêm column boolean `isUnlimited` vào schema (over-normalization). `-1` là sentinel value rõ ràng trong domain "số lượng" — tương tự pattern `--depth -1` của git, `EOF=-1` trong C. BE check 1 dòng `if (limit === -1) return Infinity`. Giải pháp tinh gọn nhất.

> _"Discount đã hết hạn nhưng admin quên tắt, hệ thống xử lý sao?"_

**Trả lời**: BE tính giá thực tế tại thời điểm checkout dựa trên `discountStart/End` chứ không lưu giá tĩnh. Nếu hôm nay > `discountEnd` → trả `basePrice`. Discount window tự "hết hạn" mà không cần admin can thiệp. `isDiscountActive` chỉ là computed flag để hiển thị badge "đang giảm giá" trên UI.

---

## Phần F. Module Kế Toán (`/admin/accounting`) — Phần Phức Tạp Nhất

### F.0. Tổng quan tab structure

```typescript
const tabs = [
  // Core
  { key: "overview", label: "Overview" },
  { key: "business-types", label: "Business Types & Tax Rates" },
  { key: "version", label: "Template Versions" },
  { key: "formulas", label: "Formulas" },
  { key: "mappings", label: "Field Mappings" },
  { key: "rowdefs", label: "Row Definitions" },
  { key: "entities", label: "Entities & Fields" },
  // Support
  { key: "compare", label: "Compare (A/B)" },
  { key: "preview", label: "Preview" },
  { key: "trace", label: "Trace Logic" },
  { key: "reference", label: "Enums Reference" },
  { key: "schema", label: "Node Schemas" },
];
```

### F.1. URL-driven tab — chi tiết kỹ thuật

```typescript
// AdminAccountingClient.tsx
const searchParams = useSearchParams();
const router = useRouter();
const activeTab = (searchParams.get("tab") as AccountingTabKey) || "overview";

function changeTab(newTab: AccountingTabKey) {
  const params = new URLSearchParams(searchParams);
  params.set("tab", newTab);
  router.push(`?${params.toString()}`, { scroll: false });
}
```

**Lợi ích**:

1. **Deep link**: `/admin/accounting?tab=formulas&fmId=42` → mở thẳng formula 42.
2. **Browser history**: Back/Forward chuyển tab → user kỳ vọng.
3. **Share**: Gửi link cho colleague → họ vào đúng chỗ.
4. **Refresh**: F5 không reset về tab mặc định.

**Trade-off**: Mỗi lần đổi tab → cập nhật URL → re-render (nhẹ vì chỉ section). Không vấn đề performance.

### F.2. Tab Business Types & Tax Rates

#### F.2.1. Mô hình

```
Tax Ruleset (có effectiveFrom)
  ├── Business Type 1 (Bán lẻ)
  │     ├── Tax Rate: VAT 10%
  │     ├── Tax Rate: PIT_METHOD_1 1.5%
  │     └── Tax Rate: PIT_METHOD_2 0.5%
  ├── Business Type 2 (Dịch vụ ăn uống)
  │     └── ...
  └── Business Type N
```

**Tax Ruleset** = bộ thuế áp dụng cho 1 thông tư cụ thể. Khi BTC ban hành thông tư mới, admin tạo ruleset mới với `effectiveFrom = "2026-01-01"`.

**Business Type** = ngành nghề. Mỗi business type có thuế suất riêng tùy ruleset.

#### F.2.2. APIs

```typescript
GET    /api/admin/accounting/business-types?rulesetId={id}
PATCH  /api/admin/accounting/business-types/{businessTypeId}
PUT    /api/admin/accounting/rulesets/{rulesetId}/business-types/{businessTypeId}/tax-rates
```

**PATCH metadata** (partial): chỉ update `name`, `description`, `status`.

**PUT tax-rates** (replace): gửi toàn bộ mảng rates, BE wipe + insert lại.

#### F.2.3. Tại sao replace mà không partial?

Tax rates là **bộ** liên quan với nhau. Nếu admin xóa 1 rate trên UI nhưng quên gửi DELETE → DB còn rate cũ → engine kế toán tính sai. Replace pattern đảm bảo state cuối cùng UI = DB.

**Pseudo BE**:

```sql
BEGIN TRANSACTION;
DELETE FROM business_type_tax_rates WHERE rulesetId=? AND businessTypeId=?;
INSERT INTO business_type_tax_rates ... (each rate);
COMMIT;
```

#### F.2.4. UI form state

```typescript
const [btMetadataForm, setBtMetadataForm] = useState({
  name: "",
  description: "",
  status: "active" as "active" | "inactive",
});

const [btRatesForm, setBtRatesForm] = useState<
  Array<{ taxType: string; taxRate: number; description: string }>
>([]);
```

User có thể: thêm rate mới, sửa rate hiện có, xóa rate. Khi click "Lưu" → 2 API call (PATCH metadata + PUT rates).

### F.3. Tab Template Versions — Wizard 4 bước

**File**: `app/admin/accounting/components/VersionFlowTab.tsx`

#### F.3.1. Concept Versioning Immutability

```
Template "S1a - Sổ Chi Tiết Doanh Thu"
├── Version v2024.1   [INACTIVE]   (sổ cũ, không sửa được)
├── Version v2025.1   [ACTIVE]     (đang dùng, READ-ONLY)
└── Version v2026.1   [DRAFT]      (đang chuẩn bị)
```

**Quy tắc**:

1. **Chỉ 1 version ACTIVE tại 1 thời điểm.**
2. **ACTIVE = immutable** (BE từ chối mọi PATCH).
3. **Sửa nội dung** = clone ACTIVE → mới DRAFT → sửa DRAFT → activate DRAFT (auto deactivate version cũ).
4. **Activate là atomic transaction** ở BE.

**Lý do**:

- Hộ kinh doanh đã lập sổ Q1/2025 với version active lúc đó. Nếu sửa version → sổ cũ tính lại → sai số liệu hồi tố → vi phạm nguyên tắc kế toán "không sửa sổ đã khóa kỳ".

#### F.3.2. 4 bước wizard

```
[Bước 1: Metadata]
  - versionLabel  (vd: "v2026.1 Q1")
  - effectiveFrom (date)
  - changeNotes   (textarea, mô tả thay đổi)
  - Validation: label ≠ rỗng
       ↓
[Bước 2: Field Mappings]
  - Định nghĩa CỘT của sổ
  - Bao nhiêu mapping = bao nhiêu cột
  - Mỗi mapping: code, label, type, source (query/formula/static), entity, field, agg, sort
  - Validation: ≥ 1 mapping
       ↓
[Bước 3: Row Definitions]
  - Định nghĩa HÀNG của sổ
  - 5 loại: industry_header, data_placeholder, subtotal, tax_line, grand_total
  - Validation: ≥ 1 row definition
       ↓
[Bước 4: Review + Activate]
  - Hiển thị metadata + count mappings/rows
  - Sample preview table
  - Buttons: Clone (tạo draft mới từ đây), Activate (publish), Deactivate, Delete
```

**Wizard navigation**:

- Forward chỉ được khi current step valid.
- Backward không validate (cho phép review).
- Click step number → jump trực tiếp (nếu valid).

#### F.3.3. Activate workflow

1. User click button **Activate** ở step 4.
2. FE confirm dialog: "Bạn sẽ thay version đang active. Tiếp tục?"
3. Gọi `POST /api/admin/accounting/template-versions/{tvId}/activate`.
4. BE thực hiện trong 1 transaction:

   ```sql
   UPDATE template_versions SET isActive=false WHERE templateId=? AND isActive=true;
   UPDATE template_versions SET isActive=true WHERE id=?;
   ```

5. FE refetch full structure → hiển thị state mới.

**Race condition**: Nếu 2 admin đồng thời activate 2 version khác nhau cho cùng template, BE có **unique constraint** trên `(templateId, isActive=true)` hoặc dùng row lock → 1 thành công, 1 nhận 409 Conflict. FE hiển thị lỗi qua toast.

### F.4. Tab Formulas — VŨ KHÍ NẶNG NHẤT

**File**: `app/admin/accounting/components/FormulaTab.tsx` (~4700 dòng)

#### F.4.1. 5 loại công thức

| Loại            | AST shape                                                                         | Use case                          |
| --------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| AGGREGATE       | `{ aggregate: "SUM", source: "revenues", field: "Amount" }`                       | SUM Amount từ table doanh thu     |
| CELL_REF        | `{ op: "SUBTRACT", left: {ref:"A"}, right: {ref:"B"} }`                           | A - B (tham chiếu công thức khác) |
| TAX_RATE        | `{ lookup: { entity: "IndustryTaxRates", field: "TaxRate", filter: { TaxType }}}` | Tra thuế suất                     |
| EXTERNAL_LOOKUP | `{ lookup: { entity: "AccountingPeriods", field: "OpeningCashBalance" }}`         | Lấy số dư đầu kỳ                  |
| WEIGHTED_AVG    | Composition op + aggregate                                                        | Giá vốn bình quân gia quyền       |

#### F.4.2. AST node types (8 loại)

Engine BE hỗ trợ AST với 8 node types:

```typescript
literal; // { literal: 100 } — số cố định
ref; // { ref: "FORMULA_CODE" } — tham chiếu công thức khác
aggregate; // { aggregate: "SUM", source: "...", field: "..." }
lookup; // { lookup: { entity, field, filter } }
op; // { op: "ADD"|"SUBTRACT"|"MULTIPLY"|"DIVIDE", left, right }
fn; // { fn: "MAX"|"MIN", args: [node, node, ...] }
foreach; // { foreach: "industry", apply: <node>, reduce: "SUM" }
context; // { context: "group_amount" } — biến từ ngữ cảnh runtime
```

#### F.4.3. Token Builder (drag-drop) cho CELL_REF

**Token types**:

```typescript
type FormulaTokenType = "var" | "num" | "op" | "lpar" | "rpar";

interface FormulaToken {
  id: string; // unique, để drag-drop ổn định
  type: FormulaTokenType;
  value: string; // "TOTAL_REVENUE" | "100" | "+" | "(" | ")"
  label: string; // hiển thị
}
```

**Workflow**:

1. User kéo biến từ thư viện bên phải vào drop zone.
2. Click toán tử (+ - × ÷) → thêm vào cuối.
3. Có thể drag-reorder, click ✕ để xóa.
4. Tokens biểu diễn theo cú pháp infix: `[A] + [B] * 2`.

**Token → AST** (Shunting Yard algorithm):

```typescript
function tokensToAst(tokens: FormulaToken[]): Record<string, unknown> | null {
  // Bước 1: chuyển infix → postfix (RPN)
  const output: FormulaToken[] = [];
  const stack: FormulaToken[] = [];
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };

  for (const t of tokens) {
    if (t.type === "var" || t.type === "num") output.push(t);
    else if (t.type === "op") {
      while (
        stack.length &&
        stack.top.type === "op" &&
        precedence[stack.top.value] >= precedence[t.value]
      ) {
        output.push(stack.pop());
      }
      stack.push(t);
    } else if (t.type === "lpar") stack.push(t);
    else if (t.type === "rpar") {
      while (stack.top.type !== "lpar") output.push(stack.pop());
      stack.pop(); // discard "("
    }
  }
  while (stack.length) output.push(stack.pop());

  // Bước 2: postfix → AST
  const astStack: any[] = [];
  for (const t of output) {
    if (t.type === "var") astStack.push({ ref: t.value });
    else if (t.type === "num") astStack.push({ literal: Number(t.value) });
    else if (t.type === "op") {
      const right = astStack.pop();
      const left = astStack.pop();
      astStack.push({
        op: { "+": "ADD", "-": "SUBTRACT", "*": "MULTIPLY", "/": "DIVIDE" }[
          t.value
        ],
        left,
        right,
      });
    }
  }
  return astStack.length === 1 ? astStack[0] : null;
}
```

**Tại sao Shunting Yard?**

- Edsger Dijkstra (1961) — chuẩn ngành.
- O(n) time, O(n) space.
- Xử lý precedence + parentheses tự nhiên.
- Đơn giản, ít edge case so với recursive descent parser.

**AST → Token** (`astToTokens`): traversal đệ quy ngược lại, thêm dấu ngoặc khi cần.

#### F.4.4. Lock token builder cho formula advanced

**Vấn đề**: Token builder chỉ biểu diễn được CELL_REF đơn giản (op + ref + literal). Nếu formula đang dùng node `lookup`, `fn`, `foreach`, `context` → token không đại diện đầy đủ → save sẽ **mất logic phức tạp**.

**Giải pháp** (đã implement):

```typescript
const compatibleBuilderMode = useMemo(() => {
  if (!usedNodeTypes.length) return "empty";
  const simpleNodes = new Set(["literal", "ref", "op"]);
  return usedNodeTypes.every((t) => simpleNodes.has(t)) ? "simple" : "advanced";
}, [usedNodeTypes]);

function syncTokens(nextTokens: FormulaToken[]) {
  // Guard: không ghi đè AST advanced bằng token đơn giản
  if (compatibleBuilderMode === "advanced") return;
  // ... còn lại như cũ
}
```

UI: Khi advanced, drop zone bị thay bằng panel khóa (vàng):

```
⚠ Công thức nâng cao — builder bị khóa
Formula đang dùng node lookup/fn/foreach/context.
Hãy chỉnh sửa qua JSON Studio bên dưới.
```

**Tại sao quan trọng?**

- Formula thuế VAT theo ngành dùng `foreach + lookup` rất phức tạp.
- Trước fix: User mở tab CELL_REF → drop zone hiện token tự động (chỉ ref), kéo thêm 1 cái → save → phá nát logic foreach.
- Sau fix: Hệ thống refuse, buộc user dùng JSON Studio (nơi không mất thông tin).

#### F.4.5. Safe Preview Evaluator

**Lý do**:

- Preview cần tính nhanh trên FE (chứ không gọi BE mỗi lần thay đổi).
- KHÔNG dùng `eval()` hay `Function()` — XSS risk + linter cảnh báo.

**Implementation**:

```typescript
const previewResult = useMemo(() => {
  if (builderTab !== "CELL_REF" || !builderTokens.length) return "—";
  try {
    const ast = tokensToAst(builderTokens);
    if (!ast) return "Lỗi biểu thức";

    function evalAst(node: unknown): number {
      if (!node || typeof node !== "object") return 0;
      const n = node as Record<string, unknown>;
      if (typeof n.literal === "number")
        return Number.isFinite(n.literal) ? n.literal : 0;
      if (typeof n.ref === "string") {
        const raw = previewInputs[n.ref] ?? "0";
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      if (typeof n.op === "string") {
        const left = evalAst(n.left);
        const right = evalAst(n.right);
        if (n.op === "ADD") return left + right;
        if (n.op === "SUBTRACT") return left - right;
        if (n.op === "MULTIPLY") return left * right;
        if (n.op === "DIVIDE") return right !== 0 ? left / right : 0;
      }
      return 0;
    }

    const result = evalAst(ast);
    return Number.isFinite(result)
      ? result.toLocaleString("vi-VN")
      : "Lỗi biểu thức";
  } catch {
    return "Lỗi biểu thức";
  }
}, [builderTab, builderTokens, previewInputs]);
```

**Câu hỏi hội đồng**:

> _"Tại sao không dùng `Function()` để eval cho ngắn?"_

**Trả lời**: 3 lý do:

1. **Bảo mật**: Nếu sau này expression có thể chứa string từ DB, attacker có thể inject `console.log(localStorage)`. Safe evaluator chỉ chấp nhận operator có whitelist.
2. **Maintainability**: Eval trả về `Infinity` khi `1/0`, `NaN` khi sai cú pháp — phải catch nhiều case. Safe evaluator return `0` rõ ràng.
3. **Linter chặn**: ESLint plugin `no-eval`, `no-implied-eval`, `no-new-func` mặc định bật trong project.

#### F.4.6. Trace Logic

**Mục đích**: Khi sổ sách cho kết quả sai (vd: thuế VAT 10% nhưng ra 5%), admin cần biết bước nào sai.

**Flow**:

1. Admin chọn formula + location + period + ruleset + business type IDs.
2. FE gọi `POST /api/admin/accounting/testing/trace`.
3. BE chạy engine kế toán step-by-step, return:

```json
{
  "formulaCode": "VAT_BAN_LE",
  "finalValue": 5_000_000,
  "trace": [
    {
      "step": 1,
      "nodeType": "aggregate",
      "description": "SUM Amount từ revenues",
      "resolvedValue": 50_000_000,
      "source": "DB query: SELECT SUM(amount) FROM revenues WHERE ...",
      "debug": "..."
    },
    {
      "step": 2,
      "nodeType": "lookup",
      "description": "Tra thuế VAT từ IndustryTaxRates",
      "resolvedValue": 0.1,
      "source": "row id=42, taxType=VAT, taxRate=0.10"
    },
    {
      "step": 3,
      "nodeType": "op",
      "description": "MULTIPLY: 50,000,000 × 0.10",
      "resolvedValue": 5_000_000
    }
  ]
}
```

4. FE hiển thị tree expandable. Admin nhanh chóng phát hiện step nào sai (vd: step 2 trả 0.05 thay vì 0.10).

**Lợi ích**: Không cần đọc code BE, không cần query DB thủ công. Self-service debugging tool cho admin nghiệp vụ.

#### F.4.7. Validation against schemas

**Function**: `validateExpressionAgainstSchemas(node, schemas, path)`

**Flow**:

1. Detect node type của `node` (literal/ref/aggregate/...).
2. Tìm schema tương ứng.
3. Check các field bắt buộc (required) có trong node không.
4. **Quan trọng**: Chỉ recurse vào các child path BIẾT TRƯỚC của AST:
   - `op.left`, `op.right`
   - `fn.args[]`
   - `foreach.apply`
5. **Không** recurse blanket vào mọi object child (nếu không, `lookup.filter` sẽ bị hiểu sai là AST node → false error).

**Pre-fix bug**: Trước khi fix, code recurse mọi key có giá trị object → `lookup.filter = { TaxType: "VAT" }` bị hiểu là AST → `detectNodeType` trả null → `errors.push("không nhận diện được thành phần")` → user không save được formula valid.

**Sau fix**: Whitelist child paths theo nodeType → chỉ traverse đúng AST children.

### F.5. Tab Field Mappings

#### F.5.1. 4 Source types

| Source    | Cần                       | Use case                            |
| --------- | ------------------------- | ----------------------------------- |
| `query`   | entity + field            | Lấy raw từ DB (orders.totalAmount)  |
| `formula` | formulaId                 | Dùng kết quả formula khác           |
| `static`  | formulaExpression (const) | Hardcode (vd: "100" cho cột header) |
| `auto`    | (không cần)               | System tự gán (auto-increment ID)   |

#### F.5.2. APIs

```typescript
POST / api / admin / accounting / template -
  versions / { tvId } / field -
  mappings;
PATCH / api / admin / accounting / field - mappings / { mappingId } / testing;
DELETE / api / admin / accounting / field - mappings / { mappingId };
```

**Tại sao endpoint update có suffix `/testing`?**

- Field mapping của version ACTIVE = read-only. Update endpoint chỉ cho phép trên version DRAFT.
- Suffix `/testing` báo hiệu "đây là update an toàn cho draft, không phải production data".
- BE check status, nếu version active → 409.

### F.6. Tab Row Definitions

#### F.6.1. 5 Row types

```typescript
const ROW_TYPE_LABELS = {
  industry_header: "Tiêu đề ngành nghề",
  data_placeholder: "Vùng dữ liệu",
  subtotal: "Cộng nhóm",
  tax_line: "Dòng thuế",
  grand_total: "Tổng cộng",
};
```

#### F.6.2. 4 Position types

```typescript
const POSITION_LABELS = {
  per_group: "Mỗi nhóm",
  per_section: "Mỗi phần",
  start_of_book: "Đầu sổ",
  end_of_book: "Cuối sổ",
};
```

#### F.6.3. visibleFieldCodes

Mỗi row có thể chỉ hiển thị một số cột (không phải tất cả). Field này là JSON array string:

```json
"[\"so_tien\",\"thue_suat\",\"thue_phai_nop\"]"
```

Tax_line row chỉ cần 3 cột này, không cần tất cả 10 cột của data row.

#### F.6.4. Mối quan hệ với Field Mapping

- Field Mapping = **CỘT**.
- Row Definition = **HÀNG**.
- Engine kế toán render bảng: với mỗi row, lấy `visibleFieldCodes[]` → join với field mappings → render giá trị từ source.

### F.7. Tab Compare A/B

#### F.7.1. Mục đích

Trước khi activate version mới, admin muốn chắc chắn không có regression so với version cũ. Compare chạy engine 2 lần trên cùng dữ liệu → diff side-by-side.

#### F.7.2. API

```typescript
POST /api/admin/accounting/testing/compare
Body: {
  businessLocationId: number,
  periodId: number,
  draftVersionId: number,
  activeVersionId: number,
  groupNumber: number,
  taxMethod: string,
  rulesetId: number,
  batchSize: number,
  businessTypeIds: string[]
}
Response: {
  draft: { summary, formulaValues, rows },
  active: { summary, formulaValues, rows },
  diff: { changedFormulas: string[], valueChanges: [{code, before, after}] }
}
```

#### F.7.3. Render diff

- Bảng 2 cột song song.
- Hàng có giá trị khác nhau → highlight vàng.
- Bảng tóm tắt formula thay đổi:

| Code         | Before    | After     |
| ------------ | --------- | --------- |
| TOTAL_VAT    | 5,000,000 | 4,500,000 |
| PIT_METHOD_1 | 1,200,000 | 1,200,000 |

### F.8. Tab Preview & Trace

**Preview**: Render thực tế sổ sách của 1 location/period với version đã chọn. Dùng để xem trước khi activate.

**Trace**: Như đã mô tả ở F.4.6.

### F.9. Tab Reference & Schema

**Reference** (`GET /api/admin/accounting/reference`): Trả về toàn bộ enum (fieldTypes, sourceTypes, rowTypes, positions, taxTypes, ...) để FE render dropdown.

**Schema** (`GET /api/admin/accounting/reference/formula-node-schemas`): Trả về schema của 8 AST node types — dùng cho validation + tooltip help.

---

## Phần G. Layer Service / Lib / Hooks

### G.1. API Client Pattern

**File chung pattern**: `lib/admin-*.ts`

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5139";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  const res = await authFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  return body.data;
}
```

**Pattern chuẩn**:

- Tất cả API trả `ApiEnvelope<T>` để FE biết success/error rõ ràng.
- `authFetch` tự động attach Bearer token + auto-refresh khi 401.
- `cache: "no-store"` để bỏ cache Next.js (admin data luôn cần fresh).

### G.2. authFetch — auto refresh

**File**: `lib/auth/tokenManager.ts`

```typescript
export async function authFetch(
  input,
  init = {},
  options = {},
): Promise<Response> {
  const token = await getValidAccessToken();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    // Token có thể vừa expire trong race condition
    const newToken = await refreshAndPersistToken();
    headers.set("Authorization", `Bearer ${newToken}`);
    res = await fetch(input, { ...init, headers });

    if (res.status === 401) {
      clearAuthSession();
      window.location.href = "/auth/login";
    }
  }

  return res;
}
```

**Race condition example**: 2 tab admin cùng gọi API. Tab 1 refresh token thành công, tab 2 vẫn dùng token cũ → 401 → tab 2 retry với token mới (đã được lưu localStorage) → thành công.

### G.3. Hook Pattern (TanStack Query v5)

```typescript
// Query
export function useAdminUsers(query: AdminUserQueryParams) {
  return useQuery({
    queryKey: adminUserKeys.list(query),
    queryFn: () => getAdminUsers(query),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

// Mutation
export function useCreateAdminConsultant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminConsultant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

// Query key factory
export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (query) => [...adminUserKeys.lists(), query] as const,
};
```

**Lợi ích query key factory**:

- Invalidate granular: `invalidateQueries({queryKey: adminUserKeys.lists()})` chỉ invalidate list, không động vào detail cache.
- Type-safe hơn raw array.
- Dễ debug: React Query DevTools hiện key có cấu trúc rõ ràng.

### G.4. Token Manager — chi tiết refresh logic

**File**: `lib/auth/tokenManager.ts`

```typescript
const CLOCK_SKEW_MS = 30_000; // 30s buffer

export async function getValidAccessToken(): Promise<string> {
  const token = localStorage.getItem("bizflow_access_token");
  if (!token) throw new Error("No access token");

  const payload = decodeJwtPayload(token);
  if (!payload) throw new Error("Invalid token");

  const expMs = (payload.exp as number) * 1000;
  if (Date.now() < expMs - CLOCK_SKEW_MS) {
    return token; // còn valid
  }

  // Sắp hết hạn → refresh
  return await refreshAndPersistToken();
}
```

**Tại sao 30s buffer?**

- Avoid race: ngay khi token có 1ms còn lại, gọi API → BE check cùng lúc token expire → 401.
- Buffer 30s đảm bảo BE luôn nhận token còn ≥ 29s.

**Tại sao không pre-refresh background?**

- Có thể implement với `setInterval` check `exp` mỗi phút.
- Hiện chưa cần vì user thường ít idle > 15 phút (token lifetime).
- Trade-off complexity vs benefit.

### G.5. JWT decode

```typescript
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}
```

**Chú ý**:

- JWT Base64URL khác với Base64 chuẩn (`-` thay `+`, `_` thay `/`, không padding `=`).
- Phải convert về Base64 trước khi `atob()`.
- Padding `=` phải đủ (length % 4 === 0).

### G.6. Role claim

```typescript
const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function getRoleFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return (payload[ROLE_CLAIM] as string) ?? null;
}
```

**Tại sao URI dài?** ASP.NET Core dùng claim type chuẩn của Microsoft Identity. FE phải đúng URI để đọc.

---

## Phần H. UI Patterns & Re-usable Components

### H.1. Toast notification (Sonner)

```typescript
import { toast } from "sonner";

toast.success("Lưu thành công");
toast.error(`Lỗi: ${err.message}`);
toast.promise(savePlan(data), {
  loading: "Đang lưu...",
  success: "Đã lưu gói",
  error: (err) => `Lỗi: ${err.message}`,
});
```

**Tại sao Sonner thay react-hot-toast?**

- Animation mượt hơn (Vercel team viết).
- API gọn (`toast.promise` 1 dòng).
- Built-in dark mode support.

### H.2. Confirm Dialog Pattern

```tsx
const [confirmTarget, setConfirmTarget] = useState<Item | null>(null);

<Dialog
  open={!!confirmTarget}
  onOpenChange={(o) => !o && setConfirmTarget(null)}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Xác nhận xóa?</DialogTitle>
      <DialogDescription>
        Bạn sắp xóa {confirmTarget?.name}. Thao tác không thể hoàn tác.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setConfirmTarget(null)}>
        Hủy
      </Button>
      <Button variant="destructive" onClick={handleConfirm}>
        Xóa
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

**Convention**: Dùng `confirmTarget` thay vì `confirmOpen` boolean → vừa biết open/close, vừa biết đối tượng đang confirm.

### H.3. Field with Hint

```tsx
function FieldHint({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);
  // Hover delay 250ms tránh tooltip nhảy lung tung
  return (
    <span className="relative ml-1 inline-flex items-center">
      <button
        onMouseEnter={() => setTimeout(() => setOpen(true), 250)}
        onMouseLeave={() => setOpen(false)}
        className="..."
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-md bg-white px-3 py-2 text-[11px] shadow-lg">
          {hint}
        </div>
      )}
    </span>
  );
}
```

### H.4. Empty / Loading / Error State

```tsx
if (isLoading) return <SkeletonRows count={5} />;
if (error) return <ErrorBanner error={error} onRetry={refetch} />;
if (items.length === 0) return <EmptyState message="Không có dữ liệu" />;
return <DataTable items={items} />;
```

3 state pattern chuẩn cho mọi list view.

### H.5. URL Search Params Update

```tsx
function updateParam(key: string, value: string) {
  const params = new URLSearchParams(searchParams);
  if (value) params.set(key, value);
  else params.delete(key);
  router.push(`?${params.toString()}`, { scroll: false });
}
```

`scroll: false` quan trọng — không scroll lên đầu khi đổi tab.

---

## Phần I. Bộ Câu Hỏi Hội Đồng Mở Rộng (40+ câu)

### I.1. Câu hỏi về kiến trúc tổng thể

**Q1**: Tại sao tách BE thành 2 service (UserMS port 5139, AccountingMS port 8080)?

> Tách microservice theo bounded context: UserMS quản identity/notification/billing (chu kỳ release nhanh), AccountingMS quản template/formula (chu kỳ release theo thông tư BTC, ít hơn). Tách giúp deploy độc lập, scale riêng theo tải, và team con có thể làm song song không conflict code.

**Q2**: FE Web có communication trực tiếp với AI Service không?

> Không. AI Service là microservice nội bộ, FE chỉ gọi qua BE. BE đóng vai trò gateway, kiểm auth + rate limit + log trước khi forward sang AI Service. Tránh expose AI service URL ra public.

**Q3**: Tại sao chọn Next.js 14 App Router chứ không phải Pages Router?

> App Router giới thiệu Server Components → giảm JavaScript bundle → tăng performance lần load đầu. Layout nesting (admin layout, dashboard layout) tự nhiên hơn. File-based routing với folder structure phản ánh URL → maintain dễ. Pages Router dần bị Next.js deprecate (chỉ maintain bug fix).

**Q4**: TanStack Query v5 vs Redux/Context cho data fetching?

> TanStack Query chuyên cho server state (cache, refetch, invalidation, optimistic update) — Redux không có sẵn. Setup ngắn (1 hook), built-in DevTools, type-safe. Redux tốt cho client state phức tạp (multi-step wizard) nhưng admin module ít dùng. Pattern hiện đại 2024-2026.

**Q5**: Vì sao cần useSearchParams cho tab state mà không dùng useState đơn giản?

> useState reset khi refresh page hoặc share link. URL-driven cho phép deep link, browser back/forward, reload giữ tab. Trade-off: thêm 2 dòng code đổi lấy UX vượt trội. Pattern bắt buộc cho admin tools nhiều tab.

### I.2. Câu hỏi về authentication

**Q6**: JWT lưu localStorage có bị XSS không?

> Có rủi ro nếu app có XSS vulnerability. BizFlow mitigate bằng:
>
> 1. CSP header chặn inline script.
> 2. Tất cả user input sanitize trước render (React mặc định đã escape).
> 3. Không dùng `dangerouslySetInnerHTML`.
> 4. Token có lifetime ngắn (15 phút) — XSS chỉ có window nhỏ để dùng token.
>    Alternative là HttpOnly cookie nhưng không share được giữa Web + Mobile WebView nên không chọn.

**Q7**: Refresh token bị leak thì sao?

> BE check device fingerprint kèm refresh token. Nếu refresh từ device lạ → reject. Admin có thể revoke tất cả token của user qua endpoint `/users/{id}/refresh-tokens`.

**Q8**: Bypass route protection bằng DevTools (set authorized=true) thì sao?

> Vô nghĩa. FE chỉ kiểm để redirect — mọi request đến BE vẫn cần JWT hợp lệ với role=admin. BE từ chối nếu role sai. FE bypass chỉ thấy UI rỗng vì API trả 403.

**Q9**: Tại sao Authorization header phải set qua authFetch wrapper, không dùng axios interceptor?

> Project chọn fetch native + custom wrapper để tránh dependency axios (giảm bundle ~40KB). Wrapper authFetch nhỏ gọn, dễ test, dễ patch hành vi (auto-retry 401, log error).

### I.3. Câu hỏi về kế toán (formula engine)

**Q10**: AST của formula thiết kế theo paradigm nào?

> Tree-based functional, lấy cảm hứng từ Lisp expression. Mỗi node là object với 1 key chính (literal/ref/op/...) xác định semantic. Pattern matching ở evaluator dễ implement và mở rộng (thêm node mới chỉ cần thêm 1 case).

**Q11**: Tại sao engine ở BE chứ không FE?

> BE có truy cập DB trực tiếp → AGGREGATE/LOOKUP nhanh. FE phải gọi API lấy data trước khi tính → chậm + thừa request. Hơn nữa, formula chạy trên dữ liệu thật của tenant, BE đảm bảo authorization.

**Q12**: Compare A/B chạy trên data production có nguy hiểm không?

> Không, vì compare chỉ READ data. Engine chạy 2 version song song, return result, không ghi lại vào DB. Đây là dry-run mode.

**Q13**: Activate version atomic như thế nào?

> Transaction SQL ở BE: `UPDATE...SET isActive=false WHERE templateId=? AND isActive=true; UPDATE...SET isActive=true WHERE id=?; COMMIT;`. Unique constraint trên `(templateId, isActive=true)` đảm bảo chỉ 1 version active. Nếu race condition: 1 thành công, 1 nhận constraint violation 409.

**Q14**: Trace logic lưu lại lịch sử không?

> Hiện không, mỗi lần trace là on-demand không persist. Roadmap: lưu trace history cho audit nếu nghi ngờ admin/consultant cấu hình sai dẫn đến số liệu lệch.

**Q15**: Replace tax rates pattern có thực sự cần thiết?

> Có. Partial update gây 2 vấn đề:
>
> 1. Sót state cũ: admin xóa rate trên UI nhưng forget gửi DELETE request → DB còn rate dư.
> 2. Concurrency: 2 admin cùng edit → operation merge unpredictable.
>    Replace đảm bảo state cuối UI = state cuối DB. Cost: gửi nhiều data hơn (acceptable, list nhỏ ≤ 10 rates).

**Q16**: Token Builder Shunting Yard không hỗ trợ unary minus, hàm MAX/MIN, sao không?

> Hiện CELL_REF chỉ cần binary op (+/-/×/÷). MAX/MIN/foreach là node fn/foreach trong AST, được edit qua VisualNodeEditor (recursive form) hoặc JSON Studio. Tách trách nhiệm: token builder cho 80% case đơn giản, JSON cho 20% phức tạp.

**Q17**: Lock builder advanced có làm khó user không?

> Không, vì đã có panel cảnh báo + hướng dẫn dùng JSON Studio. Trade-off: chấp nhận UX nhỏ để bảo vệ data integrity. Trước fix, user vô tình phá formula thuế phức tạp → sổ sách sai → khó debug.

**Q18**: Safe evaluator hỗ trợ phép chia 0 ra sao?

> Trả 0 thay vì Infinity/NaN. Lý do: preview trên FE chỉ để estimate, không dùng cho production. BE engine xử lý tỉ mỉ hơn (throw exception hoặc default rule theo nghiệp vụ).

### I.4. Câu hỏi về thông báo

**Q19**: Locked event code hardcode ở FE có an toàn không?

> Đây là defensive coding. BE cũng có whitelist tương tự (double check). FE chặn để feedback ngay (không phải đợi 400 từ BE), BE chặn cho security. Defense in depth.

**Q20**: Polling 3s vs WebSocket — chọn polling vì sao?

> 4 lý do (đã trình bày ở D.4):
>
> 1. Đơn giản (không cần Redis pub/sub).
> 2. Tần suất cập nhật thấp.
> 3. Stateless dễ scale ngang.
> 4. Mức tải hiện tại đủ. Sẽ chuyển SignalR khi scale ≥ 1000 admin online.

**Q21**: Recipient mode SPECIFIC_USERS không có search user, hạn chế không?

> Đúng, hiện admin phải có sẵn list IDs (vd export từ accounts module). Roadmap: tích hợp typeahead search user ngay trong dispatch form.

**Q22**: Dispatch failed thì retry tự động không?

> BE retry 3 lần với exponential backoff (1s → 5s → 30s). Sau 3 lần fail → status FAILED. Admin có thể trigger retry manual qua UI (sẽ tạo dispatch mới với cùng payload).

### I.5. Câu hỏi về subscription

**Q23**: Stripe integration ở đâu?

> BE quản lý Stripe (Stripe SDK trong ASP.NET Core). FE chỉ thấy `stripeProductId`, `stripePriceId` để hiển thị reference. Khi user subscribe trên mobile, mobile redirect qua Stripe Checkout → BE webhook nhận event → tạo subscription record.

**Q24**: Discount window có overlap được không (2 plan cùng giảm giá cùng kỳ)?

> Có, mỗi plan độc lập. Không có constraint cross-plan. Admin chịu trách nhiệm pricing strategy.

**Q25**: User đang dùng gói Pro, admin downgrade Pro xuống Inactive thì sao?

> Subscription hiện tại không bị ảnh hưởng (vẫn dùng đến hết kỳ). Chỉ ảnh hưởng renewal: hết kỳ → subscription expire → user phải mua gói khác. Hệ thống gửi noti trước 7 ngày báo gói sắp ngưng.

**Q26**: usageLimit -1 và 999_999_999 khác gì?

> Semantic. -1 nói "không cần check, cứ cho dùng". 999_999_999 nói "có check, vẫn ngưỡng cụ thể". BE evaluator: `if (limit === -1) return true; return current < limit;`. Performance không khác, semantic rõ ràng hơn.

### I.6. Câu hỏi về mã nguồn FE

**Q27**: FormulaTab.tsx 4700 dòng — quá lớn, có refactor không?

> Đúng, đây là tech debt nhận biết. Roadmap tách thành:
>
> - `FormulaList.tsx` (CRUD list)
> - `FormulaEditor.tsx` (form chính)
> - `TokenBuilder.tsx` (drag-drop)
> - `VisualNodeEditor.tsx` (recursive AST editor)
> - `JsonStudio.tsx` (raw JSON)
> - `LogicTrace.tsx` (trace tree)
>   Lý do giữ chung hiện tại: state nhiều (40+ useState), tách sớm gây prop drilling. Dự định dùng useReducer + Context khi tách.

**Q28**: Tại sao không dùng react-hook-form cho form lớn?

> Form admin chủ yếu là controlled input đơn giản (text/select). react-hook-form mạnh ở complex validation + array fields, project hiện không cần đến. Nếu tương lai cần dynamic field array, sẽ cân nhắc.

**Q29**: Drag-drop dùng native HTML5 hay react-dnd?

> Native HTML5 Drag-Drop API (`onDragStart`, `onDrop`, `dataTransfer`). Lý do: lightweight (0 dependency), token builder đơn giản. react-dnd phù hợp hơn nếu cần multi-touch hoặc nested drop zones phức tạp.

**Q30**: Tại sao TypeScript strict mode?

> Catch bug compile time. Thấy rõ khi viết evaluator: TypeScript ép check `n.literal` là number trước khi cộng → tránh runtime error. Trade-off: phải gõ thêm type annotations (acceptable cho lợi ích bảo trì).

### I.7. Câu hỏi tình huống

**Q31**: Có template kế toán mới ban hành theo TT mới, quy trình deploy?

> 1. Consultant tạo DRAFT version với metadata effectiveFrom = ngày thông tư có hiệu lực.
> 2. Cấu hình field mappings + row definitions theo cấu trúc thông tư.
> 3. Build formulas (thuế, công thức tổng hợp).
> 4. Chạy Preview với dữ liệu test, Compare với version cũ.
> 5. Báo Admin review.
> 6. Admin Activate vào ngày thông tư có hiệu lực.
> 7. Cũ version tự động deactivate.

**Q32**: Bug được report: sổ sách Q1/2026 bị sai 1 cột thuế. Quy trình debug?

> 1. Mở `/admin/accounting?tab=trace` → chọn formula thuế đó.
> 2. Chọn business location của user, periodId Q1/2026.
> 3. Click Run trace → xem step nào trả giá trị bất thường.
> 4. Nếu sai ở AGGREGATE → query DB raw để verify.
> 5. Nếu sai ở LOOKUP → check tax rate trong ruleset.
> 6. Nếu sai logic → tạo DRAFT version mới với formula sửa, Compare với active.
> 7. Activate version mới.

**Q33**: Admin lỡ activate version sai → rollback?

> Dễ. Mở tab Template Versions → chọn version cũ (status INACTIVE) → Activate lại. Engine sẽ auto deactivate version đang active. Atomic transaction. Roadmap: thêm "Activation history" để rollback một click.

**Q34**: User báo "tôi không nhận được noti mời nhân viên".

> Debug:
>
> 1. `/admin/notifications?tab=templates` → check template `EMPLOYEE_INVITE` có `isActive = true`.
> 2. `/admin/notifications?tab=history` → filter by user → xem có dispatch không.
> 3. Nếu không có dispatch → BE chưa trigger event → check log BE.
> 4. Nếu có dispatch FAILED → click chi tiết → xem error (FCM token expire / no permission).

**Q35**: 1000 hộ kinh doanh đăng ký dùng đồng thời, FE Admin bị lag?

> FE admin không chịu tải này. FE admin chỉ vài chục admin online. Tải mobile/web user → BE tự scale với Docker horizontal. FE admin polling 3s với pageSize 20 → ~ 500 req/phút từ tất cả admin (low).

### I.8. Câu hỏi về testing

**Q36**: Có unit test cho FormulaTab không?

> Hiện ưu tiên integration test (manual qua UI). Function pure như `tokensToAst`, `astToTokens`, `evalAst` dễ unit test, sẽ thêm sau với Vitest. Lý do delay: ưu tiên hoàn thiện feature trước milestone bảo vệ.

**Q37**: E2E test (Playwright)?

> Có một bộ Playwright test cho luồng mobile (user flow). Admin FE chưa có E2E vì:
>
> 1. UI thay đổi nhanh khi feature còn beta.
> 2. Manual test với checklist (`TestCases/` folder).
>    Roadmap: Playwright cho 5 critical paths (login, create consultant, create plan, send dispatch, activate version).

### I.9. Câu hỏi về security

**Q38**: SQL Injection?

> BE dùng Entity Framework Core với parameterized query. FE chỉ gửi JSON, không build raw SQL. Risk = 0.

**Q39**: CORS?

> BE cấu hình CORS chỉ allow origin của FE (dev: localhost:3000, prod: domain thật). Admin endpoint thêm `[Authorize(Roles = "admin")]`.

**Q40**: Rate limit?

> BE có middleware rate limit (100 req/phút/IP cho endpoint công khai, 1000 req/phút cho authenticated admin). Login endpoint stricter (5 lần/15 phút) để chống brute force.

**Q41**: HTTPS bắt buộc?

> Production: enforce HTTPS qua HSTS header. Local dev cho HTTP để dễ debug. JWT chỉ chấp nhận từ HTTPS origin (BE check).

### I.10. Câu hỏi về performance

**Q42**: Dataset lớn (1000 formulas) làm formula list lag?

> Hiện list formula có pagination (pageSize 50). Search/filter ở BE. Renderingn 50 row React virtualized không cần (đủ nhanh). Khi > 5000 formula, sẽ thêm `react-window` cho virtual scroll.

**Q43**: Bundle size FE Admin?

> ~ 250KB gzip cho route admin (chưa optimize). Plan: code-split per route với Next.js dynamic import. Mục tiêu < 150KB.

**Q44**: Lighthouse score?

> Performance ~ 85, Accessibility ~ 95, Best Practices ~ 95, SEO N/A (admin private). Có thể cải thiện performance bằng image optimization + lazy load tabs.

---

## Phần J. Mẹo Trả Lời & Kịch Bản Phòng Ngừa

### J.1. Nguyên tắc chung

1. **Trả lời ngắn gọn, cụ thể**: Mỗi câu 30–60 giây, không dài dòng.
2. **Ngôn ngữ chuyên nghiệp**: "Hệ thống xử lý...", "Trade-off ở đây...", "Nguyên tắc nghiệp vụ yêu cầu...".
3. **Khi không chắc chắn**: "Phần đó nằm trong roadmap giai đoạn 2", "Em chưa kiểm chứng cụ thể nhưng theo logic..." (KHÔNG nói "em không biết").
4. **Khi bị quay với câu hỏi hóc búa**: "Câu hỏi rất hay, để em phân tích từng khía cạnh:..." → kéo thời gian suy nghĩ.

### J.2. Câu hỏi đánh đố thường gặp

> _"Em test phần này như thế nào?"_

**Trả lời mẫu**: "Em test thủ công theo checklist trong folder `TestCases/`. Mỗi feature có test case dạng: precondition → action → expected result. Test có 32 file TC tương ứng 32 tính năng chính. Unit test pure function (formula evaluator, JWT decode) đã có một phần. E2E Playwright là roadmap kế tiếp."

> _"Em làm bao nhiêu phần trăm code?"_

**Trả lời mẫu**: "Em phụ trách phần Admin FE Web, gồm 5 module với khoảng 12,000 dòng code. Phần BE và mobile do thành viên khác trong nhóm thực hiện. Em hiểu cả luồng dữ liệu end-to-end vì mỗi feature đều cần phối hợp 3 bên."

> _"Đâu là phần khó nhất em đã làm?"_

**Trả lời mẫu**: "Module Formula trong Accounting là phần phức tạp nhất. Em phải thiết kế:

> 1. Visual builder cho admin không hiểu kỹ thuật.
> 2. JSON studio cho consultant chuyên môn.
> 3. Safe evaluator để preview không dùng eval.
> 4. Lock mode tránh user vô tình phá AST nâng cao.
> 5. Trace tool để debug khi sổ sách sai.
>    Mỗi phần em đều phải hiểu sâu vừa kế toán vừa parser theory."

> _"Có technical debt nào em nhận thấy?"_

**Trả lời thành thật**: "Có 3 điểm em đã note:

> 1. FormulaTab.tsx 4700 dòng — cần tách module.
> 2. AdminOverviewClient mock data — cần plug analytics API.
> 3. Chưa có audit log UI dù BE đã log.
>    Đây là tech debt em sẽ ưu tiên giải quyết sau bảo vệ."

> _"Tại sao không dùng [framework X]?"_

**Trả lời tổng quát**: "Mỗi lựa chọn đều có trade-off. [Framework hiện tại] phù hợp với:

> - Quy mô team (2 người FE).
> - Yêu cầu hiện tại (CRUD admin với một số feature đặc biệt).
> - Hệ sinh thái Next.js + TanStack Query rất chín, có TypeScript first-class support.
>   [Framework X] mạnh hơn ở [điểm nào đó] nhưng overkill cho scope hiện tại. Nếu sau này scale lớn sẽ cân nhắc lại."

### J.3. Câu hỏi về điểm yếu

Hãy CHỦ ĐỘNG nhận và có hướng giải quyết:

| Điểm yếu                 | Hướng cải thiện                               |
| ------------------------ | --------------------------------------------- |
| Dashboard mock           | Tích hợp analytics API (roadmap Q2)           |
| FormulaTab quá lớn       | Tách thành 5 sub-component                    |
| Chưa có audit log UI     | BE đã log, FE thêm trang xem trong sprint tới |
| Chưa có E2E test         | Thiết lập Playwright cho 5 critical path      |
| Permission chưa granular | Roadmap thêm read-only admin, regional admin  |
| Bundle size 250KB        | Code-split per route, lazy load tab           |

### J.4. Phân biệt Code/BE/Mobile khi bị hỏi

- **Câu về FE Admin**: Trả lời tự tin, chi tiết.
- **Câu về BE**: "Phần BE do bạn [tên] phụ trách. Theo em hiểu thì..." rồi trả lời ngắn dựa trên kiến thức đã trao đổi với teammate.
- **Câu về Mobile**: Tương tự, "phần đó thuộc bạn [tên]..."
- **Câu liên quan cả 3 tầng**: Trả lời dạng end-to-end "Khi user click X, FE gửi Y, BE xử lý Z, mobile nhận noti W".

### J.5. Demo trực tiếp (nếu được yêu cầu)

Chuẩn bị sẵn:

1. **Login admin** → vào `/admin`.
2. **Demo accounts**: List user, filter, tạo consultant.
3. **Demo notifications**: Edit template, gửi dispatch test.
4. **Demo accounting** (highlight):
   - Mở Template Versions → giải thích versioning.
   - Mở Formulas → tạo 1 formula đơn giản với token builder.
   - Demo Trace logic.
   - Demo Compare A/B.
5. **Demo subscriptions**: Tạo gói mới, bật discount.

**Câu kết khi demo xong**: "Em vừa demo end-to-end 5 module chính. Mỗi module đều thiết kế để admin nghiệp vụ (không phải developer) có thể vận hành. Đây là điểm khác biệt của BizFlow so với SaaS kế toán hiện hành."

---

## Lời kết

**Trước hôm bảo vệ**:

1. Đọc lại toàn bộ `admin-business-guide.md` + tài liệu này.
2. Tự test thử mỗi tab trên local, nắm flow thực tế.
3. Tự đặt câu hỏi cho mình trước gương → trả lời thành tiếng.
4. Chuẩn bị máy demo (đảm bảo BE/AI service chạy ổn).
5. In ra checklist bảo vệ (3 trang) để mang theo.

**Trong phòng bảo vệ**:

1. Chào hội đồng tự tin, ngắn gọn (15 giây).
2. Nói chậm, nghe kỹ câu hỏi trước khi trả lời.
3. Nếu không hiểu câu hỏi → "Thầy/Cô có thể làm rõ ý X được không ạ?"
4. Trả lời theo cấu trúc: nhận định → giải pháp đã chọn → trade-off.
5. Khi không biết: thừa nhận thẳng + chỉ ra hướng tìm hiểu.

**Chúc bạn bảo vệ thành công!**
