# BizFlow Admin FE – Tài Liệu Nghiệp Vụ & Chuẩn Bị Hội Đồng

> **Mục đích**: Tài liệu toàn diện để chuẩn bị bảo vệ luận văn – phần Admin Web FE.
> **Phạm vi**: Nghiệp vụ, logic vận hành, câu hỏi hội đồng dự kiến và câu trả lời chuẩn bị sẵn.

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống BizFlow](#1-tổng-quan-hệ-thống-bizflow)
2. [Kiến Trúc & Vai Trò Admin](#2-kiến-trúc--vai-trò-admin)
3. [Nghiệp Vụ Quản Lý Người Dùng](#3-nghiệp-vụ-quản-lý-người-dùng)
4. [Nghiệp Vụ Quản Lý Thông Báo](#4-nghiệp-vụ-quản-lý-thông-báo)
5. [Nghiệp Vụ Quản Lý Gói Đăng Ký](#5-nghiệp-vụ-quản-lý-gói-đăng-ký)
6. [Nghiệp Vụ Quản Lý Template Kế Toán](#6-nghiệp-vụ-quản-lý-template-kế-toán)
7. [Luồng Dữ Liệu Tổng Thể](#7-luồng-dữ-liệu-tổng-thể)
8. [Câu Hỏi Hội Đồng Dự Kiến & Câu Trả Lời](#8-câu-hỏi-hội-đồng-dự-kiến--câu-trả-lời)

---

## 1. Tổng Quan Hệ Thống BizFlow

### 1.1 Bài Toán Thực Tế

BizFlow giải quyết bài toán của **hộ kinh doanh nhỏ tại Việt Nam** phải tự kê khai thuế theo TT152/2025:

| Vấn Đề                                   | Giải Pháp BizFlow                                 |
| ---------------------------------------- | ------------------------------------------------- |
| Quản lý đơn hàng thủ công (sổ tay, Zalo) | App mobile nhận đơn hàng kể cả qua giọng nói (AI) |
| Không theo dõi được nợ khách hàng        | Module Debtor quản lý nợ có và nợ chi tiết        |
| Tự kê khai thuế theo TT152/2025          | Sổ sách kế toán tự động dựa trên template chuẩn   |
| Không có phân tích doanh thu/tồn kho     | Dashboard báo cáo tổng hợp                        |

### 1.2 Tech Stack

- **Backend**: ASP.NET Core 8 + MySQL (containerized Docker)
- **Frontend Web (Admin)**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Frontend Mobile**: Flutter
- **AI Service**: Python (STT + RAG + LLM)

### 1.3 Các Nhóm Người Dùng

| Vai Trò      | Route Sau Đăng Nhập    | Quyền                              |
| ------------ | ---------------------- | ---------------------------------- |
| admin        | /admin                 | Quản lý toàn nền tảng              |
| user / owner | /dashboard             | Vận hành kinh doanh                |
| consultant   | /consultant/accounting | Chỉ xem/sửa draft template kế toán |
| employee     | /dashboard (hạn chế)   | Thao tác được phân quyền bởi chủ   |

---

## 2. Kiến Trúc & Vai Trò Admin

### 2.1 Bảo Vệ Route – Cơ Chế JWT

Khi admin truy cập bất kỳ trang /admin/\*, hệ thống thực hiện:

1. Gọi `getValidAccessToken()` để lấy access token hợp lệ (tự động refresh nếu hết hạn)
2. Giải mã JWT payload, kiểm tra claim `role`
3. Phân nhánh redirect theo role:
   - Không có token → `/auth/login`
   - role = "user" hoặc "owner" → `/dashboard`
   - role = "consultant" → `/consultant/accounting`
   - role = "admin" → setAuthorized(true), render layout
4. Trong khi đang kiểm tra (authorized = false) → render null, tránh flash nội dung cho người không có quyền

### 2.2 Sidebar – 5 Module Chính

| Module             | Route                | Vai Trò Nghiệp Vụ                  |
| ------------------ | -------------------- | ---------------------------------- |
| Tổng Quan          | /admin               | Snapshot nền tảng                  |
| Quản Lý Người Dùng | /admin/accounts      | CRUD tài khoản, kiểm soát phiên    |
| Quản Lý Thông Báo  | /admin/notifications | Gửi thông báo push toàn nền tảng   |
| Quản Lý Kế Toán    | /admin/accounting    | Cấu hình engine kế toán            |
| Gói Đăng Ký        | /admin/subscriptions | Định giá, tính năng, kích hoạt gói |

---

## 3. Nghiệp Vụ Quản Lý Người Dùng

### 3.1 Xem Danh Sách Người Dùng

**Mục đích nghiệp vụ**: Admin cần nhìn thấy toàn bộ tài khoản đang tồn tại trên nền tảng để giám sát, hỗ trợ và kiểm soát.

**Luồng dữ liệu**:

- FE gọi `GET /api/admin/users?pageNumber=X&pageSize=10&search=...&role=...&isActive=...`
- BE trả về danh sách phân trang kèm totalCount
- FE tính stats bar (active/inactive) từ data trang hiện tại – KHÔNG phải tổng toàn bộ

**Tại sao stats bar chỉ tính theo trang?** Để tránh phải tải toàn bộ dataset về client. Đây là trade-off có chủ ý giữa chính xác số liệu và hiệu năng.

**Các filter hoạt động độc lập và kết hợp được**:

- Search: lọc name + email (partial match) tại BE
- Role: ALL / user / owner / consultant
- Status: ALL / ACTIVE / INACTIVE
- Khi thay đổi bất kỳ filter → reset pageNumber về 1

### 3.2 Tạo Tài Khoản Kế Toán Viên (Consultant)

**Mục đích nghiệp vụ**: Kế toán viên là người chuyên môn về thuế, được admin tuyển vào để cấu hình các template sổ sách kế toán theo Thông tư 152. Họ không thể tự đăng ký mà phải được admin cấp tài khoản.

**Luồng xử lý**:

1. Admin nhập email + họ tên
2. FE validate: không rỗng, email được normalize (trim + lowercase)
3. Gọi `POST /api/admin/consultants` với payload `{ email, fullName }`
4. BE tạo tài khoản với role = "consultant", gửi email setup mật khẩu cho kế toán viên
5. FE đóng dialog, hiện toast thành công, refresh danh sách

**Tại sao normalize email?** Tránh tạo trùng do người dùng nhập hoa/thường không nhất quán ("Test@Example.COM" vs "test@example.com" là cùng 1 tài khoản).

**Lỗi duplicate email**: BE trả về 409 Conflict, FE hiển thị lỗi ngay trong form (không đóng dialog) để admin sửa ngay.

### 3.3 Thu Hồi Phiên (Revoke Sessions)

**Mục đích nghiệp vụ**: Khi tài khoản user bị nghi ngờ bị chiếm quyền, admin cần vô hiệu hóa tức thì tất cả phiên đăng nhập đang hoạt động của họ.

**Cơ chế hoạt động**:

- Hệ thống dùng Refresh Token để duy trì phiên đăng nhập lâu dài
- "Revoke Sessions" = gọi `POST /api/admin/users/{id}/revoke-tokens`
- BE xóa/vô hiệu tất cả refresh token của user đó trong DB
- Lần tiếp theo user gọi API với access token hết hạn → refresh thất bại → buộc đăng nhập lại
- Access token hiện tại của user vẫn còn hiệu lực đến khi hết hạn tự nhiên (thường 15 phút)

**Tại sao chỉ revoke được cho "user" role?**
Consultant không tự đăng ký nên admin đã kiểm soát việc tạo tài khoản. Nếu muốn loại bỏ consultant, dùng chức năng "Xóa Tài Khoản" thay thế.

### 3.4 Xóa Tài Khoản Kế Toán Viên

**Mục đích nghiệp vụ**: Khi một kế toán viên không còn cộng tác, cần xóa hoàn toàn tài khoản.

Xóa tài khoản là hành động vĩnh viễn – `DELETE /api/admin/consultants/{id}`. Cần confirmation dialog trước khi thực thi.

---

## 4. Nghiệp Vụ Quản Lý Thông Báo

### 4.1 Tổng Quan Hệ Thống Thông Báo

Hệ thống thông báo của BizFlow gồm 3 lớp:

```
Template (định nghĩa nội dung khuôn mẫu)
    ↓
Dispatch (lệnh gửi: gửi cho ai, khi nào)
    ↓
Push Notification gửi đến thiết bị người dùng
```

### 4.2 Quản Lý Template

**Mục đích nghiệp vụ**: Template là khuôn mẫu tái sử dụng cho các loại thông báo khác nhau. Admin định nghĩa sẵn template cho từng sự kiện thay vì viết nội dung từng lần khi gửi.

**Cấu trúc template**:

- Event Code: định danh sự kiện (EMPLOYEE_INVITE, PROMO_WEEKLY...)
- Title Template: tiêu đề với placeholder (ví dụ: "Xin chào {{userName}}")
- Content Template: nội dung body thông báo
- Action Type: NONE (chỉ hiển thị) hoặc NAVIGATE (mở màn hình cụ thể khi tap)
- Target Screen + Payload JSON: chỉ có khi actionType = NAVIGATE

**Template hệ thống bị khoá (không thể tắt)**:
Các event code: EMPLOYEE_INVITE, INVITE_ACCEPTED, INVITE_REJECTED, EMPLOYEE_REMOVED là template nghiệp vụ lõi. Không thể tắt vì nếu tắt, chức năng mời nhân viên sẽ không gửi thông báo được. Nhưng admin vẫn có thể chỉnh nội dung (tiêu đề, body).

**Tự động viết hoa event code**: Khi admin nhập "promo_weekly" → hệ thống convert thành "PROMO_WEEKLY". Đảm bảo tính nhất quán khi BE đối chiếu event code.

### 4.3 Gửi Chiến Dịch Thông Báo (Dispatch)

**6 Chế độ người nhận**:

| Chế Độ                       | Mô Tả                         | Dùng Khi Nào                       |
| ---------------------------- | ----------------------------- | ---------------------------------- |
| ALL_USERS                    | Toàn bộ user                  | Thông báo hệ thống toàn nền tảng   |
| ALL_LOCATION_OWNERS          | Tất cả chủ hộ                 | Thông báo về chính sách cho chủ hộ |
| LOCATION_OWNER               | Chủ 1 cửa hàng cụ thể         | Hỗ trợ trực tiếp 1 khách hàng      |
| LOCATION_EMPLOYEES           | Nhân viên của 1 cửa hàng      | Thông báo nội bộ cửa hàng          |
| LOCATION_OWNER_AND_EMPLOYEES | Cả chủ + nhân viên 1 cửa hàng | Thông báo toàn bộ 1 đơn vị         |
| SPECIFIC_USERS               | Chọn từng người               | Campaign nhắm mục tiêu             |

**Polling trạng thái dispatch**:

- Sau khi tạo dispatch, FE poll mỗi 3 giây để cập nhật trạng thái khi có dispatch đang xử lý
- Khi không có dispatch đang xử lý, tăng interval lên 15 giây để tiết kiệm resource
- Vòng đời: PENDING → PROCESSING → SENT / FAILED / CANCELLED

**Preview Recipients**: Admin có thể kiểm tra số lượng người nhận thực tế trước khi bấm gửi, tránh gửi nhầm đối tượng.

---

## 5. Nghiệp Vụ Quản Lý Gói Đăng Ký

### 5.1 Mô Hình Gói Đăng Ký

**Mục đích nghiệp vụ**: BizFlow là SaaS – chủ hộ kinh doanh trả phí hàng tháng/năm để dùng các tính năng. Admin định nghĩa các gói, gắn tính năng và giới hạn sử dụng.

**Cấu trúc một gói**:

```
Gói (Plan)
├── Tên, mô tả
├── Thời hạn (ngày)
├── Giá cơ bản (VND)
├── Giảm giá (tùy chọn)
│   ├── Giá sau giảm
│   ├── Ngày bắt đầu giảm
│   └── Ngày kết thúc giảm
└── Danh sách tính năng
    ├── Feature: ORDERS (giới hạn: -1 = unlimited hoặc N đơn/tháng)
    ├── Feature: AI_CALLS (giới hạn: -1 hoặc N lần gọi)
    └── ...
```

### 5.2 Giá Trị Giới Hạn Tính Năng

| Giá Trị | Ý Nghĩa                                 |
| ------- | --------------------------------------- |
| -1      | Không giới hạn (Unlimited)              |
| 0       | Không có quyền dùng tính năng này       |
| N > 0   | Được dùng tối đa N lần/đơn vị thời gian |

### 5.3 Vòng Đời Gói

1. Admin tạo gói → trạng thái mặc định **Không hoạt động** (người dùng không thể mua)
2. Admin kiểm tra lại thông tin, giá, tính năng
3. Admin kích hoạt gói → **Hoạt động** → hiển thị cho người dùng để mua
4. Admin có thể tắt gói (không xóa) → ẩn khỏi người dùng nhưng vẫn giữ lịch sử subscription

**Tại sao tạo ở trạng thái Inactive?** Để admin có thể hoàn thiện tất cả thông tin trước khi public, tránh người dùng thấy gói chưa hoàn chỉnh.

### 5.4 Giảm Giá Theo Thời Gian

Khi bật công tắc "Có giảm giá", phải nhập đủ 3 trường: giá sau giảm, ngày bắt đầu, ngày kết thúc.

BE tự động áp dụng giảm giá trong khoảng thời gian đó. Ngoài khoảng → dùng giá cơ bản.

**Tại sao validation bắt buộc cả 3 trường?** Nếu thiếu ngày kết thúc, giảm giá sẽ không bao giờ kết thúc – gây thất thu. Nếu thiếu giá sau giảm, hệ thống không biết giảm xuống bao nhiêu.

---

## 6. Nghiệp Vụ Quản Lý Template Kế Toán

### 6.1 Bối Cảnh Nghiệp Vụ – Thông Tư 152/2025/TT-BTC

Từ năm 2026, hộ kinh doanh phải **tự kê khai thuế** thay vì nộp theo thuế khoán như trước. BizFlow cung cấp sổ sách kế toán tự động dựa trên dữ liệu đơn hàng, tồn kho đã nhập.

**Mối quan hệ**: Dữ liệu vận hành (đơn hàng, kho, nhân viên) → Engine kế toán → Sổ sách chuẩn TT152

### 6.2 Kiến Trúc 4 Tầng Của Engine Kế Toán

```
Tầng 1: Loại Hình Kinh Doanh (Business Types)
          Định nghĩa ngành nghề + thuế suất tương ứng
                    ↓
Tầng 2: Template + Phiên Bản (Template Versions)
          Cấu trúc sổ sách: bao nhiêu cột, bao nhiêu hàng
                    ↓
Tầng 3: Công Thức (Formulas) + Ánh Xạ Trường (Field Mappings)
          Mỗi ô trong sổ lấy dữ liệu từ đâu, tính theo công thức nào
                    ↓
Tầng 4: Sổ Sách Thực Tế (Accounting Books)
          Kết quả render ra cho từng hộ kinh doanh theo từng kỳ
```

### 6.3 Mô Hình Phiên Bản (Version Model) – Concept Quan Trọng Nhất

**Vấn đề**: Template kế toán phải thay đổi theo năm (Thông tư mới, quy định mới), nhưng sổ sách đã lập trong kỳ trước không thể bị ảnh hưởng.

**Giải pháp: Versioning**

```
Template (thực thể gốc, ví dụ: "S1a - Sổ Chi Tiết Doanh Thu")
├── Version v2025.1 [ACTIVE]   ← phiên bản đang dùng
├── Version v2026.1 [DRAFT]    ← đang chuẩn bị cho năm 2026
└── Version v2024.1 [INACTIVE] ← phiên bản cũ
```

**Quy tắc bất biến**:

- Chỉ **1 version ACTIVE** tại một thời điểm
- Version ACTIVE là **chỉ đọc** – không thể sửa trực tiếp
- Muốn sửa → phải **Clone** thành DRAFT mới → sửa DRAFT → **Activate** DRAFT khi sẵn sàng
- Activate version mới tự động deactivate version cũ

**Tại sao không cho sửa trực tiếp version ACTIVE?**
Vì hàng trăm hộ kinh doanh đang dùng version đó để lập sổ sách. Nếu sửa column/row, sổ sách cũ của họ sẽ bị sai lệch dữ liệu hồi tố – vi phạm nguyên tắc kế toán (không sửa sổ đã khóa kỳ).

### 6.4 Quy Trình Wizard 4 Bước (VersionFlowTab)

| Bước                  | Nội Dung                                  | Validation                       |
| --------------------- | ----------------------------------------- | -------------------------------- |
| 1 - Metadata          | Version label, effectiveFrom, changeNotes | Label không rỗng, ngày hợp lệ    |
| 2 - Field Mappings    | Định nghĩa các cột (nguồn dữ liệu)        | Phải có ít nhất 1 mapping        |
| 3 - Row Definitions   | Định nghĩa các hàng (cấu trúc sổ)         | Phải có ít nhất 1 row definition |
| 4 - Review + Activate | Preview + nút Activate                    | Cả 3 bước trước phải hợp lệ      |

Không thể bỏ qua bước. Phải hoàn thành tuần tự.

### 6.5 Công Thức (Formulas) – Cách Engine Tính Toán

**5 loại công thức**:

| Loại            | Ý Nghĩa                          | Ví Dụ                                    |
| --------------- | -------------------------------- | ---------------------------------------- |
| AGGREGATE       | Tổng hợp dữ liệu thô từ DB       | SUM(orders.totalAmount) – tổng doanh thu |
| CELL_REF        | Tính toán từ các công thức khác  | DOANH_THU - CHI_PHI = LOI_NHUAN          |
| TAX_RATE        | Tra cứu thuế suất theo loại thuế | Lấy thuế VAT 10% cho nhóm ngành bán lẻ   |
| EXTERNAL_LOOKUP | Tra cứu dữ liệu ngoài bảng       | Lấy số ngày trong kỳ kế toán             |
| WEIGHTED_AVG    | Trung bình có trọng số           | Giá vốn bình quân gia quyền              |

**Visual Token Builder (CELL_REF)**: Thay vì gõ JSON phức tạp, admin kéo thả các token (biến = tên công thức khác, toán tử, số literal) để xây dựng biểu thức.

**Trace Logic**: Khi sổ sách cho kết quả sai, Trace Logic cho admin thấy từng bước tính toán → biết chính xác bước nào sai.

### 6.6 Ánh Xạ Trường (Field Mappings) – Cầu Nối Dữ Liệu

Field Mapping ánh xạ tên cột trừu tượng ("DOANH_THU") → nguồn dữ liệu cụ thể trong DB.

```
Trường: "DOANH_THU_BAN_HANG"
  Source Type: query
  Entity: orders
  Field: totalAmount
  Aggregation: SUM
  Filter: { status: "completed" }
```

**4 loại nguồn dữ liệu**:

- query: truy vấn trực tiếp từ entity/field trong DB
- formula: dùng kết quả của một công thức
- static: giá trị cố định (ví dụ: tên cột hiển thị)
- auto: hệ thống tự xác định

### 6.7 Định Nghĩa Hàng (Row Definitions) – Cấu Trúc Sổ Sách

| Loại Hàng        | Ý Nghĩa                                    |
| ---------------- | ------------------------------------------ |
| industry_header  | Tiêu đề nhóm ngành (Bán lẻ, Dịch vụ...)    |
| data_placeholder | Hàng dữ liệu thực (đơn hàng, khoản chi...) |
| subtotal         | Hàng cộng dồn nhóm                         |
| tax_line         | Hàng thuế (VAT, PIT...)                    |
| grand_total      | Tổng cộng cuối sổ                          |

**Mối quan hệ Field Mapping ↔ Row Definition**: Field Mapping định nghĩa CỘT, Row Definition định nghĩa HÀNG. Một Row Definition có "Visible Field Codes" = danh sách cột muốn hiển thị trên hàng đó. Engine kế toán đọc cả 2 để render bảng: **hàng nào × cột nào → lấy giá trị từ đâu**.

### 6.8 So Sánh A/B (Compare)

Chạy engine kế toán 2 lần với 2 version khác nhau trên cùng dữ liệu, hiển thị kết quả side-by-side, highlight sự khác biệt. Dùng để kiểm tra chất lượng trước khi Activate version mới.

### 6.9 Thuế Suất Theo Loại Hình Kinh Doanh

Mỗi Loại Hình Kinh Doanh có bộ thuế suất riêng theo từng Ruleset (có effectiveFrom theo thông tư).

Khi cập nhật thuế suất, FE gửi **toàn bộ danh sách** (replace operation, không phải partial update). Điều này đảm bảo không có thuế suất cũ sót lại sau khi cập nhật.

### 6.10 Vai Trò Consultant Trong Quy Trình

```
Consultant                          Admin
    │                                 │
    ├─ Tạo DRAFT version              │
    ├─ Sửa Field Mappings             │
    ├─ Sửa Row Definitions            │
    ├─ Build/Edit Formulas            │
    ├─ Chạy Preview để kiểm tra       │
    │                                 │
    │    ── báo Admin review ──>      │
    │                                 ├─ Review nội dung
    │                                 ├─ Chạy Compare A/B
    │                                 └─ Activate (publish lên production)
```

---

## 7. Luồng Dữ Liệu Tổng Thể

### 7.1 Luồng Vận Hành Của Chủ Hộ → Sổ Sách

```
Chủ hộ nhập đơn hàng, tồn kho, nhân viên
        ↓ (App mobile / Web dashboard)
Dữ liệu lưu vào DB (orders, products, employees, locations)
        ↓
Engine kế toán đọc dữ liệu qua Field Mappings
        ↓ (Áp dụng Formulas + Row Definitions theo template ACTIVE)
Render Sổ Sách Kế Toán (Accounting Book)
        ↓
Chủ hộ xem báo cáo, xuất file kê khai thuế
```

### 7.2 Luồng Admin Cấu Hình Template

```
Admin/Consultant
    │
    ├─ Định nghĩa Loại Hình KD + Thuế Suất
    │
    ├─ Tạo/Clone Phiên Bản Template [DRAFT]
    │
    ├─ Cấu hình Field Mappings (cột lấy dữ liệu từ đâu)
    │
    ├─ Cấu hình Row Definitions (cấu trúc hàng: header/data/total)
    │
    ├─ Xây dựng/Chỉnh sửa Formulas
    │
    ├─ Chạy Preview (kiểm tra kết quả với dữ liệu test)
    ├─ Chạy Compare A/B (so sánh với version cũ)
    │
    └─ Admin Activate Version (publish lên production)
```

---

## 8. Câu Hỏi Hội Đồng Dự Kiến & Câu Trả Lời

### NHÓM 1: Nghiệp Vụ Tổng Thể

---

**Q1: BizFlow khác gì so với các phần mềm kế toán hiện có như MISA, Fast Accounting?**

> MISA/Fast Accounting là phần mềm kế toán chuyên nghiệp, yêu cầu người dùng có kiến thức kế toán để nhập liệu thủ công theo nghiệp vụ kế toán chuẩn. BizFlow hướng đến hộ kinh doanh nhỏ – những người không có chuyên môn kế toán. BizFlow tự động tổng hợp sổ sách từ dữ liệu vận hành (đơn hàng, tồn kho, nhân viên) mà hộ kinh doanh đã nhập trong quá trình kinh doanh hàng ngày, không cần nhập liệu kép.

---

**Q2: Tại sao cần có vai trò Admin riêng, không để Developer quản lý trực tiếp qua database?**

> 1. **Bảo mật**: Mọi thay đổi phải qua lớp business logic, không bypass validation
> 2. **Audit trail**: Mọi thao tác admin được log lại kèm timestamps và userID
> 3. **Không cần technical knowledge**: Admin nghiệp vụ (không phải lập trình viên) có thể thao tác qua giao diện
> 4. **Template kế toán thay đổi liên tục**: Thông tư 152 có nhiều phụ lục, cần cơ chế linh hoạt để cập nhật mà không cần deploy code mới

---

**Q3: Hệ thống ngăn admin vô tình tắt template hệ thống quan trọng như thế nào?**

> FE có danh sách cứng (hardcoded) các event code bị khoá: EMPLOYEE_INVITE, INVITE_ACCEPTED, INVITE_REJECTED, EMPLOYEE_REMOVED. Khi admin nhấn toggle trên các template này, FE kiểm tra trước và từ chối với thông báo lỗi rõ ràng, không gọi API nào cả. Đây là client-side guard, bổ sung thêm lớp bảo vệ ngoài validation tại BE.

---

**Q4: Tại sao lại cần gói đăng ký có giới hạn tính năng thay vì cho dùng tự do?**

> Mô hình subscription cho phép phân khúc người dùng theo nhu cầu và quy mô kinh doanh. Giới hạn tính năng (ví dụ: gói Basic giới hạn 100 đơn/tháng, gói Pro không giới hạn) tạo ra động lực upsell tự nhiên. Giá trị -1 = unlimited cho phép admin cấu hình linh hoạt mà không cần thêm field mới trong schema.

---

### NHÓM 2: Kiến Trúc FE

---

**Q5: Tại sao chọn Next.js App Router thay vì SPA thuần (React)?**

> App Router (Next.js 14) mang lại:
>
> 1. **File-based routing**: Cấu trúc thư mục phản ánh URL, dễ maintain
> 2. **Layout nesting**: Admin layout, dashboard layout tái sử dụng hiệu quả
> 3. **Server Components**: Giảm JavaScript gửi xuống client, tăng performance
> 4. **API Routes**: Proxy call đến BE – che giấu endpoint thực sự, tự động forward header auth

---

**Q6: Khi access token hết hạn giữa phiên làm việc của admin thì xảy ra gì?**

> Hàm `getValidAccessToken()` tự động:
>
> 1. Kiểm tra access token còn hạn không
> 2. Nếu hết hạn → gọi refresh endpoint dùng refresh token
> 3. Nếu refresh thất bại → AdminLayout redirect về /auth/login
>
> Người dùng được redirect đăng nhập lại thay vì nhận lỗi 401 không giải thích.

---

**Q7: URL-driven tab state trong trang kế toán có lợi ích gì?**

> Dùng `?tab=formulas` trong URL thay vì state nội bộ:
>
> 1. **Deep linking**: Admin bookmark `/admin/accounting?tab=version` để vào thẳng tab
> 2. **Browser Back/Forward**: Chuyển tab không mất history
> 3. **Sharing**: Có thể share đường dẫn chính xác cho đồng nghiệp

---

**Q8: Stats bar chỉ tính theo trang hiện tại – đây có phải thiết kế sai không?**

> Đây là trade-off có chủ ý: tính toàn bộ đòi hỏi thêm COUNT query hoặc fetch toàn bộ dataset – tốn resource khi hàng nghìn users. Stats theo trang vẫn hữu ích khi admin đã filter theo role/status cụ thể. Nếu cần số liệu toàn hệ thống, có trang Overview riêng tại /admin.

---

### NHÓM 3: Logic Kế Toán (Phần Phức Tạp Nhất)

---

**Q9: Giải thích mô hình versioning của template kế toán. Tại sao cần phức tạp như vậy?**

> Đây là yêu cầu nghiệp vụ bắt buộc: hộ kinh doanh đã lập sổ sách kỳ Q1/2025 với version 2025 – khi admin cập nhật template lên version 2026, sổ sách Q1/2025 phải giữ nguyên kết quả, không được re-calculate. Đây là nguyên tắc kế toán: không sửa sổ đã khóa kỳ. Version ACTIVE là immutable đảm bảo điều này.

---

**Q10: Consultant khác Admin ở điểm gì trong việc quản lý template?**

> Consultant có thể tạo/sửa DRAFT, chạy Preview nhưng KHÔNG THỂ Activate version lên production. Chỉ Admin mới có quyền Activate/Deactivate. Điều này tạo ra quy trình **review + phê duyệt** 2 cấp trước khi publish, ngăn ngừa lỗi kế toán ảnh hưởng hàng trăm hộ kinh doanh.

---

**Q11: Field Mapping và Row Definition liên hệ với nhau như thế nào?**

> - **Field Mapping** = định nghĩa CỘT: "Cột DOANH_THU lấy từ orders.totalAmount, aggregation SUM"
> - **Row Definition** = định nghĩa HÀNG: "Hàng grand_total chỉ hiển thị cột TONG_CONG"
>
> Engine kế toán đọc cả 2 để render bảng: **hàng nào × cột nào → lấy giá trị từ đâu**.

---

**Q12: Công thức AGGREGATE hoạt động như thế nào? Lấy ví dụ cụ thể.**

> AGGREGATE tổng hợp dữ liệu thô từ DB.
>
> Ví dụ công thức DOANH_THU_THANG:
>
> - Entity = "orders", Field = "totalAmount", Function = SUM
> - Filter: { status: "completed" }
>
> Engine dịch thành: `SELECT SUM(totalAmount) FROM orders WHERE status='completed' AND period = {currentPeriod}`
>
> Kết quả được điền vào ô tương ứng trong sổ sách.

---

**Q13: Compare A/B hoạt động như thế nào?**

> Gọi `POST /admin/accounting/accounting-books/compare` với versionAId và versionBId. BE chạy engine kế toán 2 lần trên cùng dữ liệu thực tế, trả về mảng rows với valueA và valueB. FE render side-by-side và highlight hàng có sự khác biệt. Đây là công cụ QA, không ảnh hưởng sổ sách production.

---

**Q14: Tại sao cần công cụ Trace Logic?**

> Khi sổ sách cho kết quả sai, Trace Logic cho admin thấy từng bước tính toán:
> `DOANH_THU_THUAN = DOANH_THU_GOC - CHIET_KHAU = 50,000,000 - 2,000,000 = 48,000,000`
> Admin biết chính xác bước nào cho giá trị sai mà không cần xem code hay query database thủ công.

---

**Q15: Thuế suất được cập nhật như thế nào? Tại sao dùng replace thay vì partial update?**

> Khi admin cập nhật thuế suất cho một nhóm ngành, FE gửi toàn bộ danh sách thuế (replace operation). Lý do: partial update dễ gây ra tình trạng thuế suất cũ "sót lại" sau khi xóa một dòng. Replace đảm bảo trạng thái cuối cùng trong DB luôn khớp chính xác với những gì admin đã cấu hình trên UI.

---

### NHÓM 4: Thiết Kế & Trade-off

---

**Q16: Tại sao gói đăng ký mới luôn tạo ra ở trạng thái Inactive?**

> Nguyên tắc "Launch when ready": admin thường cần nhiều bước để cấu hình đầy đủ (đặt giá → chọn tính năng → thiết lập giảm giá). Nếu tạo ra Active ngay, người dùng có thể thấy gói chưa hoàn chỉnh. Inactive cho phép "work in progress" trên production mà không ảnh hưởng UX người dùng.

---

**Q17: Hệ thống xử lý race condition như thế nào khi 2 admin cùng activate 2 version khác nhau cùng lúc?**

> Constraint này được xử lý ở tầng BE thông qua database transaction. Chỉ một request activate thành công, request còn lại nhận lỗi 409 Conflict. FE hiển thị lỗi này qua toast và yêu cầu admin refresh trang để thấy trạng thái thực tế.

---

**Q18: Tại sao dùng polling thay vì WebSocket cho dispatch history?**

> Trade-off:
>
> 1. **Đơn giản hơn**: Không cần maintain WebSocket connection và xử lý reconnect logic
> 2. **Tần suất thấp**: 3s khi có dispatch đang xử lý, 15s khi idle – không gây tải nặng
> 3. **Phù hợp scale ngang**: BE stateless với Docker horizontal scaling dễ hơn khi không có stateful connection
>
> Nếu scale lớn hơn, có thể upgrade lên SignalR (ASP.NET WebSocket) sau.

---

**Q19: Điểm yếu hiện tại của hệ thống admin là gì?**

> Trả lời thành thật và có hướng cải thiện:
>
> 1. **Stats dashboard chưa có biểu đồ xu hướng**: Cần tích hợp analytics API để hiển thị user growth, revenue chart theo thời gian.
> 2. **Chưa có audit log UI**: Dù BE log các thao tác, chưa có giao diện xem lịch sử (ai đã activate version nào, khi nào).
> 3. **Formula builder hạn chế với công thức phức tạp**: Visual builder hỗ trợ binary expression cơ bản. Công thức nested/conditional vẫn cần nhập JSON thủ công.
> 4. **Permission chưa granular**: Hiện chỉ có admin/consultant 2 level. Tương lai có thể cần read-only admin, regional admin...

---

**Q20: BizFlow AI Service làm gì trong hệ thống?**

> AI Service (Python) có 3 chức năng chính:
>
> 1. **STT (Speech-to-Text)**: Chủ hộ đọc đơn hàng bằng giọng nói thay vì gõ tay
> 2. **RAG (Retrieval-Augmented Generation)**: Chatbot tra cứu Thông tư 152 – chủ hộ hỏi quy định thuế bằng ngôn ngữ tự nhiên
> 3. **LLM Recommendations**: Gợi ý tóm tắt báo cáo, cảnh báo bất thường trong dữ liệu kinh doanh
>
> AI Service là microservice độc lập, giao tiếp với BE qua internal API, không expose trực tiếp ra client.

---

## Lưu Ý Khi Ra Hội Đồng

### Các điểm nên chủ động trình bày:

- Mô hình versioning của template kế toán (điểm sáng tạo nhất, phân biệt với phần mềm thông thường)
- Lý do chọn Next.js App Router + JWT route protection pattern
- Phân quyền admin/consultant và workflow review trước khi publish
- Ý nghĩa thực tế của Thông tư 152/2025 và tại sao hệ thống cần thiết

### Các điểm cần nắm vững khi được hỏi sâu:

- Cơ chế JWT + token refresh + route protection trong layout.tsx
- Sự khác biệt giữa Field Mapping (cột) và Row Definition (hàng)
- Vòng đời Dispatch: PENDING → PROCESSING → SENT / FAILED / CANCELLED
- Tại sao version ACTIVE là immutable (bất biến)
- Giới hạn tính năng subscription: -1 = unlimited, 0 = không có quyền, N = quota

### Ngôn ngữ nên dùng khi trả lời:

- Nói "hệ thống" thay vì "code"
- Nói "nghiệp vụ yêu cầu" khi giải thích design decision
- Nói "trade-off" khi có ưu nhược điểm cần cân nhắc
- Không nói "em chưa làm phần đó" – thay bằng "phần đó thuộc phạm vi phát triển tiếp theo"
- Khi bị hỏi về phần mobile hoặc BE: "Phần đó do thành viên khác trong nhóm phụ trách, phần em đảm nhiệm là Admin FE Web"
