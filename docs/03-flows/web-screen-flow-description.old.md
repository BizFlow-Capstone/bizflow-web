# BizFlow Web - Screen Flow Description (Reviewed)

> Purpose: provide a validated web screen flow description based on the actual Next.js implementation.

> Writing convention: English descriptions with Vietnamese UI labels/buttons.

---

## 1. Validation Result (Important Corrections)

### 1.1 Correct and usable as-is

- Authentication flow (Landing -> Login/Register -> Dashboard).
- Order core flow (Order List -> Create -> Detail -> Edit/Payment).
- Debt core flow (Customer List -> Create -> Detail -> Record Payment).
- Import core flow (Imports List -> Create -> Detail -> Edit/Confirm).
- Product, Location, Employee, Accounting/Reporting domains.

### 1.2 Needs correction for web implementation

- Reset Password is not a separate route screen.
  - It is a step inside Forgot Password: `/auth/forgot-password`.
- Create Manually and AI Order Draft are not separate routes.
  - Both are modes/sections inside `/dashboard/orders/create`.
- Completed Order is not a standalone screen.
  - It is an order status shown in Order List and Order Detail.
- Draft / Confirm Import is not a standalone screen.
  - It is a state transition/action in import create/detail flow.
- Create new Location and Update Location are dialog-driven in Locations module.
  - No dedicated route like `/dashboard/locations/create` or `/edit` currently.
- Active/Deactive Location and Delete Location are actions, not screens.
- Assign Employee Location is not a standalone route screen in current UI.
  - Employee module has list, invitations tab, invite dialog, accept/reject/remove actions.
- Accounting Management is represented by Reports page tabs.
  - Main route: `/dashboard/reports` with tabs `reports`, `periods`, `books`.

---

## 2. Split Structure

To make documentation easier to maintain, this document is split by screen type:

1. Standalone route screens.
2. In-screen flows (tab/dialog/action/state).

---

## 3. Screen Summary Table

| Feature        | Screen Name                   | Route                                                        | Type                   | Description                                                 |
| -------------- | ----------------------------- | ------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------- |
| Authentication | Landing Page                  | `/`                                                          | Standalone route       | Public entry point introducing BizFlow and routing to auth. |
| Authentication | User Login                    | `/auth/login`                                                | Standalone route       | Authenticates users via phone, email, or Google.            |
| Authentication | User Register                 | `/auth/register`                                             | Standalone route       | Registers new user accounts and verifies OTP.               |
| Authentication | Forget Password               | `/auth/forgot-password`                                      | Standalone route       | Initiates password recovery via OTP.                        |
| Authentication | Reset Password                | `/auth/forgot-password`                                      | In-screen step         | Password reset step after OTP verification.                 |
| Home           | Home Screen                   | `/dashboard`                                                 | Standalone route       | Main dashboard overview and navigation hub after login.     |
| Profile        | User Profile                  | `/dashboard/profile`                                         | Standalone route       | Displays and manages user account information.              |
| Order          | Order List                    | `/dashboard/orders`                                          | Standalone route       | Main screen for monitoring sales orders and statuses.       |
| Order          | Create Order Screen           | `/dashboard/orders/create`                                   | Standalone route       | Entry screen for manual or AI-assisted order creation.      |
| Order          | Create Manually               | `/dashboard/orders/create`                                   | In-screen mode         | Build a sales order item by item.                           |
| Order          | AI Order Draft Screen         | `/dashboard/orders/create`                                   | In-screen mode         | AI voice/draft assisted order generation and review.        |
| Order          | Order Detail                  | `/dashboard/orders/[orderId]`                                | Standalone route       | Shows order items, totals, payment state, and history.      |
| Order          | Update Order                  | `/dashboard/orders/[orderId]/edit`                           | Standalone route       | Allows editing of order data.                               |
| Order          | Completed Order               | N/A                                                          | Status state           | Final status after order processing.                        |
| Debt           | Debt Customer List            | `/dashboard/customers`                                       | Standalone route       | Manages debt customers, balances, and activity states.      |
| Debt           | Create new Regular Customer   | `/dashboard/customers/create`                                | Standalone route       | Creates a new customer profile for debt tracking.           |
| Debt           | Profile Detail & Debt History | `/dashboard/customers/[debtorId]`                            | Standalone route       | Shows customer profile, balance summary, and history.       |
| Debt           | Record Debt Collection        | `/dashboard/customers/[debtorId]/payment`                    | Standalone route       | Records debt payment and updates customer balance.          |
| Import         | Goods Received Notes List     | `/dashboard/imports`                                         | Standalone route       | Tracks goods received notes and import statuses.            |
| Import         | Create Import Receipt Screen  | `/dashboard/imports/create`                                  | Standalone route       | Captures import information to build draft receipt.         |
| Import         | Draft / Confirm Import        | `/dashboard/imports/create`, `/dashboard/imports/[importId]` | State/action           | Finalizes receipt and updates inventory data.               |
| Import         | Receipt Detail                | `/dashboard/imports/[importId]`                              | Standalone route       | Shows full receipt information and status history.          |
| Product        | Product List                  | `/dashboard/products`                                        | Standalone route       | Central screen for searching and managing products.         |
| Product        | Create new Product Screen     | `/dashboard/locations/[id]/products/new`                     | Standalone route       | Adds a new product and its sellable item data.              |
| Product        | Update Product                | `/dashboard/locations/[id]/products/[productId]`             | In-screen action       | Edits product fields and business data.                     |
| Product        | Product Detail                | `/dashboard/locations/[id]/products/[productId]`             | Standalone route       | Shows product information and location context.             |
| Location       | Business Location List        | `/dashboard/locations`                                       | Standalone route       | Manages branches/stores/locations.                          |
| Location       | Create a new Location         | `/dashboard/locations`                                       | Dialog flow            | Creates a new branch/site from create dialog.               |
| Location       | Update Location               | `/dashboard/locations`, `/dashboard/locations/[id]`          | Dialog/flow            | Edits selected location information.                        |
| Location       | Active/Deactive Location      | `/dashboard/locations`                                       | Action                 | Toggles operational availability of a location.             |
| Location       | Delete Location               | `/dashboard/locations`                                       | Action                 | Removes a business location based on permissions.           |
| Employee       | Employee List                 | `/dashboard/employees`                                       | Standalone route       | Manages staff accounts and invitations.                     |
| Employee       | Invite Employee               | `/dashboard/employees`                                       | Dialog flow            | Sends invitation to a new staff member.                     |
| Employee       | Assign Employee Location      | `/dashboard/employees`                                       | Action/assignment flow | Assignment behavior through invitation/hiring actions.      |
| Accounting     | Accounting Management         | `/dashboard/reports`                                         | Standalone route       | Parent screen for reports, periods, and books tabs.         |
| Accounting     | Accounting Period List        | `/dashboard/reports?tab=periods`                             | Tab screen             | Manages accounting periods.                                 |
| Accounting     | Reporting Tab                 | `/dashboard/reports?tab=reports`                             | Tab screen             | Groups revenue, cost, ledger, and anomaly alerts.           |

---

## 4. Screen Function Descriptions

## 4.1 Authentication

### 4.1.1 Landing Page

Function Description: The landing page is the public entry point of the web app. It introduces BizFlow and routes users toward authentication.

Function Trigger: Opened directly from browser, public links, or marketing channels.

Sub-functions:

- Button/Navigation: "Đăng nhập"
  - Trigger: user wants to access system.
  - Function: navigates to User Login.
- Button/Navigation: "Đăng ký"
  - Trigger: user wants to create account.
  - Function: navigates to User Register.

### 4.1.2 User Login

Function Description: Authenticates users by phone/email/password or Google sign-in, then routes by role.

Function Trigger: Opened from Landing, logout redirect, or protected route guard.

Sub-functions:

- Button/Navigation: "Đăng nhập"
  - Trigger: credentials submitted.
  - Function: authenticate, store tokens, navigate to Home Screen.
- Button/Navigation: "Đăng nhập với Google"
  - Trigger: user chooses Google OAuth.
  - Function: authenticate via Google and continue to dashboard.
- Button/Navigation: "Quên mật khẩu"
  - Trigger: user forgot password.
  - Function: opens Forget Password screen.

### 4.1.3 User Register

Function Description: Registers new account and verifies phone via OTP.

Function Trigger: Opened from Landing or Login.

Sub-functions:

- Button/Navigation: request OTP flow
  - Trigger: registration form is valid.
  - Function: sends phone verification OTP.
- Button/Navigation: verify OTP / complete registration
  - Trigger: user enters OTP.
  - Function: verifies OTP, creates account, stores auth state, navigates to Home.

### 4.1.4 Forget Password + Reset Password

Function Description: Password recovery flow with OTP verification and reset step.

Function Trigger: Opened from Login.

Sub-functions:

- Button/Navigation: "Gửi mã OTP"
  - Trigger: user enters registered email.
  - Function: sends reset OTP.
- Button/Navigation: verify OTP
  - Trigger: user submits received code.
  - Function: validates OTP and unlocks reset step.
- Button/Navigation: "Đặt lại mật khẩu"
  - Trigger: user enters new password and confirmation.
  - Function: saves new password and returns user to login path.

## 4.2 Home and Profile

### 4.2.1 Home Screen

Function Description: Central dashboard showing KPIs, alerts, and shortcuts to operational modules.

Function Trigger: Opened after login or when selecting home from sidebar.

Sub-functions:

- Button/Navigation: sidebar module items
  - Trigger: user selects a module.
  - Function: navigates to target module list screen.
- Button/Navigation: top/bottom account navigation
  - Trigger: user needs account-level actions.
  - Function: opens Profile, Settings, Subscription, or Logout.

### 4.2.2 User Profile

Function Description: Displays and manages user account information and security settings.

Function Trigger: Opened from sidebar account item.

Sub-functions:

- Button/Navigation: profile/security actions
  - Trigger: user updates account settings.
  - Function: persists profile/security updates.

## 4.3 Order Module

### 4.3.1 Order List

Function Description: Main table for order monitoring by status, payment, and search/filter.

Function Trigger: Opened from Home sidebar.

Sub-functions:

- Button/Navigation: "Tạo đơn hàng"
  - Trigger: user creates new order.
  - Function: opens Create Order Screen.
- Button/Navigation: order row click
  - Trigger: user selects an order.
  - Function: opens Order Detail.

### 4.3.2 Create Order Screen (Manual + AI)

Function Description: Single route that supports manual cart building and AI voice-assisted drafting.

Function Trigger: Opened from Order List.

Sub-functions:

- Button/Navigation: manual creation area
  - Trigger: user wants item-by-item creation.
  - Function: add items, quantity, payment setup.
- Button/Navigation: AI voice creation area
  - Trigger: user wants AI-assisted drafting.
  - Function: capture/process voice and generate draft data for review.
- Button/Navigation: "Tạo đơn hàng"
  - Trigger: order data validated.
  - Function: creates order record and enters order lifecycle.

### 4.3.3 Order Detail and Update

Function Description: Displays order information and supports status/payment actions; update via dedicated edit route.

Function Trigger: Opened from Order List.

Sub-functions:

- Button/Navigation: update/edit action
  - Trigger: user needs to adjust order data.
  - Function: opens Update Order route.
- Button/Navigation: payment/confirm/complete actions
  - Trigger: order lifecycle progresses.
  - Function: updates payment and status.

### 4.3.4 Completed Order

Function Description: Completed Order is represented as order status, not as standalone route screen.

Function Trigger: after confirm/complete workflow.

Sub-functions:

- Button/Navigation: view completed order detail
  - Trigger: user inspects completed transaction.
  - Function: opens Order Detail with completed status context.

## 4.4 Debt Module

### 4.4.1 Debt Customer List

Function Description: Main list for debt customers, balances, and activity state.

Function Trigger: Opened from Home sidebar.

Sub-functions:

- Button/Navigation: "Thêm khách hàng"
  - Trigger: user wants new debtor profile.
  - Function: opens Create Customer screen.
- Button/Navigation: customer row click
  - Trigger: user inspects customer.
  - Function: opens Profile Detail & Debt History.

### 4.4.2 Create new Regular Customer

Function Description: Creates debtor profile with identity/contact/credit data.

Function Trigger: Opened from Debt Customer List.

Sub-functions:

- Button/Navigation: save/create
  - Trigger: required fields completed.
  - Function: stores debtor profile and returns to list/detail flow.

### 4.4.3 Profile Detail & Debt History

Function Description: Shows debtor profile, current balance, recent orders, and debt/payment history.

Function Trigger: Opened from Debt Customer List.

Sub-functions:

- Button/Navigation: "Điều chỉnh công nợ" / payment action
  - Trigger: user records debt collection.
  - Function: opens Record Debt Collection route.
- Button/Navigation: "Chỉnh sửa"
  - Trigger: user updates customer profile.
  - Function: opens debtor edit route.

### 4.4.4 Record Debt Collection

Function Description: Records payment transaction for a debtor and updates balance.

Function Trigger: Opened from Profile Detail.

Sub-functions:

- Button/Navigation: confirm payment record
  - Trigger: amount and data are valid.
  - Function: saves debt payment and recalculates balance.

## 4.5 Import Module

### 4.5.1 Goods Received Notes List

Function Description: Displays import receipts and statuses, with quick creation entry.

Function Trigger: Opened from sidebar.

Sub-functions:

- Button/Navigation: "Tạo phiếu nhập"
  - Trigger: user creates new receipt.
  - Function: opens Create Import Receipt Screen.
- Button/Navigation: receipt row click
  - Trigger: user inspects receipt.
  - Function: opens Receipt Detail.

### 4.5.2 Create Import Receipt + Draft/Confirm

Function Description: Creates receipt, saves draft if needed, confirms to update inventory.

Function Trigger: Opened from import list.

Sub-functions:

- Button/Navigation: save draft
  - Trigger: user not ready to finalize.
  - Function: creates draft import receipt.
- Button/Navigation: confirm import
  - Trigger: user finalizes receipt.
  - Function: confirms receipt and updates inventory data.

### 4.5.3 Receipt Detail

Function Description: Full receipt information, status history, and follow-up actions.

Function Trigger: Opened from import list or post-create flow.

Sub-functions:

- Button/Navigation: "Sửa"
  - Trigger: draft needs changes.
  - Function: opens edit route.
- Button/Navigation: confirm action
  - Trigger: draft is ready.
  - Function: transitions draft to confirmed.

## 4.6 Product Module

### 4.6.1 Product List

Function Description: Central product management list with search/filter and create entry.

Function Trigger: Opened from sidebar.

Sub-functions:

- Button/Navigation: "Thêm sản phẩm"
  - Trigger: owner wants to add product.
  - Function: navigates to location-scoped new product route.
- Button/Navigation: product row click
  - Trigger: user inspects product.
  - Function: opens Product Detail route.

### 4.6.2 Create new Product + Sell Item

Function Description: Creates product and sale item configuration in location context.

Function Trigger: Opened from Product List.

Sub-functions:

- Button/Navigation: create/save product
  - Trigger: master data is valid.
  - Function: stores product.
- Button/Navigation: configure sell item
  - Trigger: user needs sale-ready unit mapping.
  - Function: creates/updates sell item definitions.

### 4.6.3 Product Detail + Update Product

Function Description: Product detail screen also supports update actions (not a separate `/update` route).

Function Trigger: Opened from Product List.

Sub-functions:

- Button/Navigation: update action
  - Trigger: user edits product fields.
  - Function: persists product updates.

## 4.7 Location Module

### 4.7.1 Business Location List

Function Description: Main location management screen for branch/store operational settings.

Function Trigger: Opened from sidebar.

Sub-functions:

- Button/Navigation: "Tạo kho mới"
  - Trigger: owner creates location.
  - Function: opens create dialog.
- Button/Navigation: status toggle/action
  - Trigger: user activates/deactivates location.
  - Function: updates active state.
- Button/Navigation: delete action
  - Trigger: user removes location.
  - Function: deletes location subject to permissions.

### 4.7.2 Create/Update/Activate/Delete Location

Function Description: Implemented as dialog/action flows in location module and location detail route.

Function Trigger: user action from location list/detail.

Sub-functions:

- Button/Navigation: create dialog save
  - Trigger: form is valid.
  - Function: creates location.
- Button/Navigation: update action
  - Trigger: location data needs changes.
  - Function: updates location.
- Button/Navigation: activate/deactivate
  - Trigger: operational status change needed.
  - Function: toggles status.
- Button/Navigation: delete confirm
  - Trigger: user confirms deletion.
  - Function: removes location.

## 4.8 Employee Module

### 4.8.1 Employee List

Function Description: Displays employee roster and invitation records.

Function Trigger: Opened from sidebar.

Sub-functions:

- Button/Navigation: tab switch (employees/invitations)
  - Trigger: user changes view.
  - Function: switches between roster and invitation list.
- Button/Navigation: remove employee action
  - Trigger: owner removes employee.
  - Function: unbinds employee from organization/location scope.

### 4.8.2 Invite Employee + Assign Flow

Function Description: Invite and assignment behavior is handled inside employee module dialog and invitation actions.

Function Trigger: user clicks invite or invitation accept/reject actions.

Sub-functions:

- Button/Navigation: "Mời nhân viên"
  - Trigger: owner starts invitation.
  - Function: opens invite dialog and sends invitation.
- Button/Navigation: invitation accept/reject
  - Trigger: recipient handles invitation.
  - Function: confirms or rejects assignment flow.

## 4.9 Accounting and Reporting Module

### 4.9.1 Accounting Management

Function Description: Parent accounting/report route with top tabs for Reports, Periods, and Books.

Function Trigger: Opened from sidebar.

Sub-functions:

- Button/Navigation: top tabs (`Báo cáo`, `Kỳ kế toán`, `Sổ kế toán`)
  - Trigger: user switches accounting area.
  - Function: loads corresponding tab content.

### 4.9.2 Accounting Period List

Function Description: Manages open/historical accounting periods.

Function Trigger: `tab=periods`.

Sub-functions:

- Button/Navigation: create new period / edit period actions
  - Trigger: user manages accounting windows.
  - Function: create/update period configuration.

### 4.9.3 Reporting Tab

Function Description: Financial reporting area with subtabs for Ledger, Revenue, Cost, Cashflow, and Anomalies.

Function Trigger: `tab=reports`.

Sub-functions:

- Button/Navigation: subtab switch (`Sổ cái`, `Doanh thu`, `Chi phí`, `Dòng tiền`, `Cảnh báo`)
  - Trigger: user selects analysis perspective.
  - Function: loads selected report panel.
- Button/Navigation: manual revenue/cost actions
  - Trigger: user adds manual records.
  - Function: opens dialogs and stores manual entries.
- Button/Navigation: anomaly acknowledge action
  - Trigger: user reviews an alert.
  - Function: marks alert as acknowledged.

---

## 5. Usage Note For Thesis/Documentation

Recommended per-screen format:

1. Function Description
2. Function Trigger
3. Sub-functions: Button/Navigation, Trigger, Function

This format is already applied above and aligned to the current web implementation.
