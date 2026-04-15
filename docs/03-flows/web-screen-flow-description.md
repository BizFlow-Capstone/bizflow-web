# BizFlow Web - Screen Flow Description

> Purpose: provide a comprehensive web screen flow description based on the actual Next.js implementation.

> Writing convention: English descriptions with Vietnamese UI labels/buttons.

---

## 1. Screen Summary Table

| #   | Feature        | Screen Name                       | Route                                                        | Type             | Description                                                    |
| --- | -------------- | --------------------------------- | ------------------------------------------------------------ | ---------------- | -------------------------------------------------------------- |
| 1   | Authentication | Landing Page                      | `/`                                                          | Standalone route | Public entry point introducing BizFlow and routing to auth.    |
| 2   | Authentication | User Login                        | `/auth/login`                                                | Standalone route | Authenticates users via phone, email, or Google.               |
| 3   | Authentication | User Register                     | `/auth/register`                                             | Standalone route | Registers new user accounts and verifies OTP.                  |
| 4   | Authentication | Forget Password                   | `/auth/forgot-password`                                      | Standalone route | Initiates password recovery via OTP.                           |
| 5   | Authentication | Reset Password                    | `/auth/forgot-password`                                      | In-screen step   | Password reset step after OTP verification.                    |
| 6   | Authentication | Logout                            | `/auth/logout`                                               | Redirect page    | Clears auth tokens and redirects to login.                     |
| 7   | Home           | Home Screen (Dashboard)           | `/dashboard`                                                 | Standalone route | Main dashboard overview with KPIs, charts, and navigation hub. |
| 8   | Profile        | User Profile                      | `/dashboard/profile`                                         | Standalone route | Displays and manages user account information and security.    |
| 9   | Settings       | Settings                          | `/dashboard/settings`                                        | Standalone route | Configures accounting, fiscal year, and store info.            |
| 10  | Subscription   | Subscription Management           | `/dashboard/subscription`                                    | Standalone route | Manages subscription plan, upgrade, and transaction history.   |
| 11  | Order          | Order List                        | `/dashboard/orders`                                          | Standalone route | Main screen for monitoring sales orders and statuses.          |
| 12  | Order          | Create Order Screen               | `/dashboard/orders/create`                                   | Standalone route | Entry screen for manual or AI-assisted order creation.         |
| 13  | Order          | Create Manually                   | `/dashboard/orders/create`                                   | In-screen mode   | Build a sales order item by item.                              |
| 14  | Order          | AI Order Draft Screen             | `/dashboard/orders/create`                                   | In-screen mode   | AI voice/draft assisted order generation and review.           |
| 15  | Order          | Order Detail                      | `/dashboard/orders/[orderId]`                                | Standalone route | Shows order items, totals, payment state, and history.         |
| 16  | Order          | Update Order                      | `/dashboard/orders/[orderId]/edit`                           | Standalone route | Allows editing of order data.                                  |
| 17  | Order          | Order Payment                     | `/dashboard/orders/[orderId]/payment`                        | Standalone route | Records payment via cash or bank transfer with QR code.        |
| 18  | Order          | Completed Order                   | N/A                                                          | Status state     | Final status after order processing.                           |
| 19  | Debt           | Debt Customer List                | `/dashboard/customers`                                       | Standalone route | Manages debt customers, balances, and activity states.         |
| 20  | Debt           | Create new Regular Customer       | `/dashboard/customers/create`                                | Standalone route | Creates a new customer profile for debt tracking.              |
| 21  | Debt           | Customer Detail & Debt History    | `/dashboard/customers/[debtorId]`                            | Standalone route | Shows customer profile, balance summary, and history.          |
| 22  | Debt           | Edit Customer                     | `/dashboard/customers/[debtorId]/edit`                       | Standalone route | Edits customer basic info, credit limit, and notes.            |
| 23  | Debt           | Record Debt Collection            | `/dashboard/customers/[debtorId]/payment`                    | Standalone route | Records debt payment and updates customer balance.             |
| 24  | Import         | Goods Received Notes List         | `/dashboard/imports`                                         | Standalone route | Tracks goods received notes and import statuses.               |
| 25  | Import         | Create Import Receipt Screen      | `/dashboard/imports/create`                                  | Standalone route | Captures import information to build draft receipt.            |
| 26  | Import         | Edit Import Receipt               | `/dashboard/imports/[importId]/edit`                         | Standalone route | Edits existing import receipt data before confirmation.        |
| 27  | Import         | Receipt Detail                    | `/dashboard/imports/[importId]`                              | Standalone route | Shows full receipt information and status history.             |
| 28  | Import         | Draft / Confirm Import            | `/dashboard/imports/create`, `/dashboard/imports/[importId]` | State/action     | Finalizes receipt and updates inventory data.                  |
| 29  | Product        | Product List                      | `/dashboard/products`                                        | Standalone route | Central screen for searching and managing products.            |
| 30  | Product        | Stock Adjustment                  | `/dashboard/products`                                        | Dialog           | Adjusts product stock quantity with memo.                      |
| 31  | Product        | Barcode Scan                      | `/dashboard/products`                                        | Dialog           | Scans product barcode to search or add product.                |
| 32  | Location       | Business Location List            | `/dashboard/locations`                                       | Standalone route | Manages branches/stores/locations with grid or list view.      |
| 33  | Location       | Location Detail                   | `/dashboard/locations/[id]`                                  | Standalone route | Shows location info, manages products and employees.           |
| 34  | Location       | Create a new Location             | `/dashboard/locations`                                       | Dialog flow      | Creates a new branch/site from create dialog.                  |
| 35  | Location       | Update Location                   | `/dashboard/locations`, `/dashboard/locations/[id]`          | Dialog/flow      | Edits selected location information.                           |
| 36  | Location       | Active/Deactive Location          | `/dashboard/locations`                                       | Action           | Toggles operational availability of a location.                |
| 37  | Location       | Delete Location                   | `/dashboard/locations`                                       | Action           | Removes a business location based on permissions.              |
| 38  | Location       | Location Products                 | `/dashboard/locations/[id]/products`                         | Sub-page         | Lists products scoped to a specific location.                  |
| 39  | Product        | Create new Product Screen         | `/dashboard/locations/[id]/products/new`                     | Standalone route | Adds a new product and its sellable item data.                 |
| 40  | Product        | Product Detail (Location)         | `/dashboard/locations/[id]/products/[productId]`             | Standalone route | Shows product information, stock chart, and location context.  |
| 41  | Product        | Update Product                    | `/dashboard/locations/[id]/products/[productId]`             | In-screen action | Edits product fields and business data.                        |
| 42  | Location       | Location Inventory / Stock-In     | `/dashboard/locations/[id]/inventory/new`                    | Standalone route | Manages low-stock products and creates stock-in receipts.      |
| 43  | Employee       | Employee List                     | `/dashboard/employees`                                       | Standalone route | Manages staff accounts and invitations.                        |
| 44  | Employee       | Employee Tab                      | `/dashboard/employees`                                       | Tab screen       | Employee roster with search and remove actions.                |
| 45  | Employee       | Invitations Tab                   | `/dashboard/employees`                                       | Tab screen       | Pending invitations management with accept/reject.             |
| 46  | Employee       | Invite Employee                   | `/dashboard/employees`                                       | Dialog flow      | Sends invitation to a new staff member.                        |
| 47  | Accounting     | Accounting Management             | `/dashboard/reports`                                         | Standalone route | Parent screen for GL, periods, and books tabs.                 |
| 48  | Accounting     | General Ledger Tab                | `/dashboard/reports` (GL tab)                                | Tab screen       | Displays GL entries with advanced filters and search.          |
| 49  | Accounting     | Accounting Period List            | `/dashboard/reports` (Periods tab)                           | Tab screen       | Manages accounting periods with create/finalize/reopen.        |
| 50  | Accounting     | Accounting Books Tab              | `/dashboard/reports` (Books tab)                             | Tab screen       | Accounting books and export functions.                         |
| 51  | Accounting     | Create Period Dialog              | `/dashboard/reports`                                         | Dialog           | Creates standard or custom accounting period.                  |
| 52  | Accounting     | Opening Balance Suggestion Dialog | `/dashboard/reports`                                         | Dialog           | Suggests opening balances from previous period data.           |
| 53  | Shared         | No Location Action Modal          | Any dashboard page                                           | Modal            | Prompts user to create location or check invitations.          |
| 54  | Admin          | Admin Overview                    | `/admin`                                                     | Standalone route | Admin dashboard with platform stats and quick access.          |
| 55  | Admin          | Admin Accounts Management         | `/admin/accounts`                                            | Standalone route | Manages user accounts, roles, and statuses across platform.    |
| 56  | Admin          | Admin Notifications Management    | `/admin/notifications`                                       | Standalone route | Manages notification templates and campaigns.                  |
| 57  | Admin          | Notification Templates Tab        | `/admin/notifications`                                       | Tab screen       | Creates and manages notification templates.                    |
| 58  | Admin          | Notification Campaigns Tab        | `/admin/notifications`                                       | Tab screen       | Sends and tracks notification campaigns.                       |
| 59  | Admin          | Admin Accounting Management       | `/admin/accounting`                                          | Standalone route | Manages accounting formulas, mappings, and template versions.  |
| 60  | Admin          | Formula Tab                       | `/admin/accounting`                                          | Tab screen       | Creates and tests accounting formulas.                         |
| 61  | Admin          | Mapping Tab                       | `/admin/accounting`                                          | Tab screen       | Maps data fields to accounting entities.                       |
| 62  | Admin          | Version Flow Tab                  | `/admin/accounting`                                          | Tab screen       | Manages template versions and activation.                      |
| 63  | Admin          | Compare (A/B) Tab                 | `/admin/accounting`                                          | Tab screen       | Compares formula versions side by side.                        |
| 64  | Admin          | Preview Tab                       | `/admin/accounting`                                          | Tab screen       | Previews accounting template output.                           |
| 65  | Admin          | Trace Logic Tab                   | `/admin/accounting`                                          | Tab screen       | Traces accounting logic execution path.                        |
| 66  | Admin          | Admin Subscriptions               | `/admin/subscriptions`                                       | Standalone route | Manages subscription plans and pricing.                        |
| 67  | Admin          | Admin Analytics                   | `/admin/analytics`                                           | Standalone route | Platform analytics with growth charts and user distribution.   |
| 68  | Admin          | Admin System Configuration        | `/admin/system`                                              | Standalone route | Configures platform settings, business types, and tax rates.   |
| 69  | Admin          | General Settings Tab              | `/admin/system`                                              | Tab screen       | Platform name, support email, limits, feature toggles.         |
| 70  | Admin          | Business Types Tab                | `/admin/system`                                              | Tab screen       | Manages business types and VAT rates.                          |
| 71  | Admin          | Tax Rates (TT152) Tab             | `/admin/system`                                              | Tab screen       | Manages TT152 tax rate groups and revenue ranges.              |
| 72  | Admin          | Database Tab                      | `/admin/system`                                              | Tab screen       | Database management and monitoring.                            |

---

## 2. Screen Function Descriptions

---

### 2.1 Landing Page

- **Function Description:** The landing page is the public entry point of the web app. It introduces BizFlow through hero section, features overview, pricing plans, testimonials, and call-to-action sections. It routes users toward authentication or the dashboard.
- **Function Trigger:** Opened directly from the browser, or accessed from public links and marketing entry points.

◆ Navigate to Login

- **Button/Navigation:** There is a "Đăng nhập" button displayed prominently on the landing page, allowing users to access the authentication flow.
- **Trigger:** When the user clicks the "Đăng nhập" button, the system initiates navigation to the login screen.
- **Function:** The system redirects the user to the User Login screen (`/auth/login`), where they can authenticate using their credentials or Google sign-in.

◆ Navigate to Register

- **Button/Navigation:** There is a "Đăng ký" button on the landing page, positioned alongside the login option for new users.
- **Trigger:** When the user clicks the "Đăng ký" button, the system begins the account creation process.
- **Function:** The system navigates the user to the User Register screen (`/auth/register`), where they can fill in their information and create a new account.

---

### 2.2 User Login

- **Function Description:** The login screen authenticates users by phone number, email, or Google sign-in, then redirects them to the correct area based on role. Supports switching between phone and email authentication methods.
- **Function Trigger:** Opened from the landing page, logout redirect, or any protected route guard.

◆ Sign in with Credentials

- **Button/Navigation:** There is a "Đăng nhập" button at the bottom of the credential form, where users enter their phone number or email along with their password.
- **Trigger:** After the user fills in the credential form (phone/email and password) and clicks the "Đăng nhập" button, the system processes the authentication request.
- **Function:** The system validates the credentials against the backend. If the credentials are correct, the system stores the access token and refresh token, then redirects the user to the Home Screen (`/dashboard`). If the credentials are invalid, an error message is displayed prompting the user to try again.

◆ Sign in with Google

- **Button/Navigation:** There is a "Đăng nhập với Google" button on the login screen, providing an alternative authentication method through Google OAuth.
- **Trigger:** When the user clicks the "Đăng nhập với Google" button, the system opens the Google authentication popup.
- **Function:** The system authenticates the user via Google OAuth. Upon successful authentication, the system stores the session data and redirects the user to the dashboard.

◆ Navigate to Forgot Password

- **Button/Navigation:** There is a "Quên mật khẩu" link below the password input field.
- **Trigger:** When the user clicks the "Quên mật khẩu" link, the system navigates them to the password recovery flow.
- **Function:** The system opens the Forget Password screen (`/auth/forgot-password`), where the user can initiate the password reset process via email OTP.

◆ Navigate to Register

- **Button/Navigation:** There is a "Đăng ký" link at the bottom of the login form for users who do not yet have an account.
- **Trigger:** When the user clicks the "Đăng ký" link, the system redirects them to the registration screen.
- **Function:** The system navigates the user to the User Register screen (`/auth/register`) to create a new account.

◆ Switch Authentication Method

- **Button/Navigation:** There is a Phone/Email toggle control on the login form, allowing users to switch between authentication methods.
- **Trigger:** When the user clicks the toggle, the system switches the credential input form between phone number mode and email mode.
- **Function:** The system updates the form layout accordingly — displaying a phone number input field when phone mode is selected, or an email input field when email mode is selected.

---

### 2.3 User Register

- **Function Description:** The register screen creates a new user account with phone number, password, and full name, then verifies the phone number through OTP. It is a multi-step flow: register form → OTP verification → success.
- **Function Trigger:** Opened from the landing page or the login screen.

◆ Request OTP

- **Button/Navigation:** There is a "Gửi OTP" button at the bottom of the registration form, where users have entered their phone number, password, and full name.
- **Trigger:** After the user fills in all required registration fields (phone, password, full name) and clicks the "Gửi OTP" button, the system initiates the phone verification process.
- **Function:** The system sends a verification OTP code to the user's phone number. If the phone number is already registered, the system displays an error message. Otherwise, the system advances the user to the OTP input step.

◆ Verify and Create Account

- **Button/Navigation:** There is an "Xác nhận" button below the OTP input fields, where the user enters the received verification code.
- **Trigger:** After the user enters the OTP code received on their phone and clicks the "Xác nhận" button, the system validates the code.
- **Function:** The system verifies the OTP code against the server. If the code is valid, the system creates the new account, stores the access token and refresh token, and navigates the user to the Home Screen (`/dashboard`). If the code is incorrect or expired, an error message is displayed prompting the user to request a new code.

◆ Navigate to Login

- **Button/Navigation:** There is a "Đăng nhập" link at the bottom of the registration form for users who already have an account.
- **Trigger:** When the user clicks the "Đăng nhập" link, the system redirects them to the login screen.
- **Function:** The system navigates the user to the User Login screen (`/auth/login`), where they can sign in with their existing credentials.

---

### 2.4 Forget Password

- **Function Description:** The forgot password flow resets an existing account password using email verification and OTP. Contains two steps: send OTP, then set new password.
- **Function Trigger:** Opened from the login screen via "Quên mật khẩu" link.

◆ Request Reset OTP

- **Button/Navigation:** There is a "Gửi mã OTP" button below the email input field, where the user enters their registered email address.
- **Trigger:** After the user enters their registered email and clicks the "Gửi mã OTP" button, the system initiates the password reset process.
- **Function:** The system sends a reset OTP code to the user's email address. If the email does not exist in the system, an error message is displayed prompting the user to check their email or register a new account.

◆ Verify OTP

- **Button/Navigation:** There is an OTP input field and a verify action button that appears after the reset OTP has been sent.
- **Trigger:** After the user receives the OTP code via email and enters it into the input field, the system validates the code.
- **Function:** The system checks whether the OTP code is correct and still valid. If the code is valid, the system unlocks the password reset form, allowing the user to set a new password. If the code is incorrect or has expired, an error message is shown.

◆ Set New Password (Reset Password — In-screen step)

- **Button/Navigation:** There is a "Đặt lại mật khẩu" button below the new password and confirmation fields, which appear after successful OTP verification.
- **Trigger:** After the user enters their new password and confirmation, then clicks the "Đặt lại mật khẩu" button, the system processes the password change.
- **Function:** The system validates that the new password meets security requirements and that the confirmation matches. If valid, the system saves the new password and redirects the user to the User Login screen (`/auth/login`) with a success message.

---

### 2.5 Logout

- **Function Description:** The logout page handles user sign-out by clearing all authentication tokens and session data, then redirects to the login page.
- **Function Trigger:** Triggered from the sidebar "Đăng Xuất" menu item or session expiration.

◆ Auto Logout Process

- **Button/Navigation:** This screen does not contain interactive elements; it is an automatic process page that displays a "Đang đăng xuất..." loading message.
- **Trigger:** When the user selects the "Đăng Xuất" option from the sidebar menu or when the session expires, the system automatically loads this page.
- **Function:** The system clears all stored authentication data, including the access token, refresh token, and session information. After clearing the data, the system automatically redirects the user to the User Login screen (`/auth/login`).

---

### 2.6 Home Screen (Dashboard)

- **Function Description:** The dashboard home is the central overview screen. It summarizes business activity through KPI cards (Doanh Số, Đơn Hàng, Chi Phí, Lợi Nhuận, Tỉ Lệ Lợi Nhuận, Nhập Kho), revenue trend charts, payment method distribution, best sellers, growth trends, promotion opportunities, low-stock alerts, and AI anomaly warnings. It acts as the navigation hub to all operational modules.
- **Function Trigger:** Opened immediately after successful login or from any dashboard module via sidebar.

◆ Global Navigation (Sidebar)

- **Button/Navigation:** There is a sidebar menu on the left side of the screen containing the following navigation items: "Trang Chủ", "Đơn Hàng", "Sản Phẩm", "Khách Hàng Thân Thiết", "Địa Điểm Kinh Doanh", "Nhập Kho" (visible to owners only), "Nhân Viên" (visible to owners only), and "Báo Cáo & Thống Kê" (visible to owners only).
- **Trigger:** When the user clicks on any sidebar menu item, the system navigates to the corresponding module screen.
- **Function:** The system loads the respective list screen based on the selected menu item — for example, clicking "Đơn Hàng" opens the Order List, clicking "Sản Phẩm" opens the Product List, and so on. Owner-only items are hidden from employee users.

◆ Account Navigation

- **Button/Navigation:** There are account-level navigation items at the bottom of the sidebar: "Nâng Cấp Tài Khoản" (visible to owners only), "Tài Khoản", "Cài Đặt", and "Đăng Xuất".
- **Trigger:** When the user clicks one of these items, the system navigates to the corresponding account management screen.
- **Function:** The system opens the User Profile screen when "Tài Khoản" is selected, the Settings screen for "Cài Đặt", the Subscription Management screen for "Nâng Cấp Tài Khoản", or initiates the logout flow when "Đăng Xuất" is selected.

◆ View AI Anomaly Alerts

- **Button/Navigation:** There is a "Cảnh Báo Dữ Liệu" section on the dashboard displaying alert cards with urgency badges such as "Khẩn cấp cao", "Khẩn cấp vừa", and "Khẩn cấp thấp".
- **Trigger:** When the system detects unusual data patterns or anomalies, the alerts are automatically generated and displayed on the dashboard.
- **Function:** The system presents each alert as a card containing the anomaly details, the affected data area, and recommended actions for the user to investigate.

◆ View Reorder Suggestions

- **Button/Navigation:** There is a "Tồn Kho Sắp Hết" section on the dashboard that lists products approaching their minimum stock threshold.
- **Trigger:** When any product's current stock level reaches or falls below the minimum stock threshold, the system automatically flags it in this section.
- **Function:** The system displays a list of low-stock products along with reorder suggestions, helping the user plan inventory replenishment before stock runs out.

◆ View Revenue and Cost Charts

- **Button/Navigation:** There are three chart sections on the dashboard: a revenue trend line chart, a revenue vs. cost bar chart, and a payment method pie chart.
- **Trigger:** When the dashboard loads and analytics data is available, the system renders all charts with the latest data.
- **Function:** The system displays a 7-month revenue trend line, a side-by-side comparison of revenue versus cost as bar charts, and a pie chart showing the distribution of payment methods used (cash, bank transfer, e-wallet).

◆ View Best Sellers and Growth Trends

- **Button/Navigation:** There are "Sản Phẩm Bán Chạy" and "Tăng Trưởng Nổi Bật" sections on the dashboard presenting product performance data.
- **Trigger:** When the dashboard loads with product analytics data, these sections are automatically populated.
- **Function:** The system displays a ranked list of top-selling products and highlights products with notable growth trends over the recent period.

◆ View Promotion Opportunities

- **Button/Navigation:** There is a "Cơ Hội Đẩy Bán" section on the dashboard, showing AI-recommended products for promotional campaigns.
- **Trigger:** When the AI engine identifies products that could benefit from promotional campaigns based on sales data, this section is automatically populated.
- **Function:** The system presents a list of suggested products along with promotional insights, helping the user make informed decisions about which products to promote.

---

### 2.7 User Profile

- **Function Description:** Displays and manages user account information, authentication methods, security settings, and session management. Includes avatar upload, credential management, phone number linking, password change/set, session logout, and account deletion.
- **Function Trigger:** Opened from sidebar "Tài Khoản" menu item or header profile icon.

◆ Update Profile Information

- **Button/Navigation:** There are profile editing fields (name, avatar upload) and a save button on the profile screen.
- **Trigger:** When the user modifies their account information such as display name or avatar image and clicks the save button, the system processes the update.
- **Function:** The system validates the changes and persists the updated profile information to the backend. A success notification is displayed upon completion.

◆ Change Password

- **Button/Navigation:** There is a password change section on the profile screen with fields for the current password and new password.
- **Trigger:** When the user enters their current password and a new password, then confirms the change, the system processes the password update.
- **Function:** The system validates the current password against the stored credentials. If correct, the system saves the new password. If the current password is incorrect, an error message is displayed.

◆ Link Phone Number

- **Button/Navigation:** There is a phone linking action on the profile screen that initiates an OTP verification flow.
- **Trigger:** When the user clicks the phone linking option and enters their phone number, the system sends an OTP for verification.
- **Function:** The system sends a verification OTP to the entered phone number. After the user enters the correct OTP, the system links the phone number to the user's account for future authentication.

◆ Logout All Devices

- **Button/Navigation:** There is a session management action on the profile screen that allows the user to sign out from all other devices.
- **Trigger:** When the user clicks the logout all devices option, the system initiates session revocation.
- **Function:** The system revokes all active sessions except the current one, effectively signing the user out from all other browsers and devices.

◆ Delete Account

- **Button/Navigation:** There is an account deletion action at the bottom of the profile screen with a confirmation dialog to prevent accidental deletion.
- **Trigger:** When the user clicks the delete account option and confirms through the confirmation dialog, the system begins the account deletion process.
- **Function:** The system permanently deletes the user's account and all associated data after final confirmation. This action is irreversible.

---

### 2.8 Settings

- **Function Description:** Configures accounting settings and displays store information for the selected location. Includes fiscal year start month, default currency, and store details (name, address, district, city, phone, owner, status).
- **Function Trigger:** Opened from sidebar "Cài Đặt" menu item.

◆ Configure Fiscal Year

- **Button/Navigation:** There is a "Tháng bắt đầu năm tài chính" dropdown selector on the settings screen, allowing the owner to choose which month the fiscal year begins.
- **Trigger:** When the owner selects a different month from the dropdown, the system registers the change for saving.
- **Function:** The system updates the fiscal year start month configuration. A help text is displayed: "Mặc định: Tháng 1. Ảnh hưởng đến kỳ kế toán tự động." This setting affects how accounting periods are automatically generated.

◆ Configure Currency

- **Button/Navigation:** There is a "Đơn vị tiền tệ mặc định" selector on the settings screen with two options: VND — Việt Nam Đồng and USD — US Dollar.
- **Trigger:** When the owner selects a different currency option, the system prepares to update the default currency setting.
- **Function:** The system switches the default currency used throughout the platform for all monetary displays and calculations.

◆ Save Settings

- **Button/Navigation:** There is a "Lưu cài đặt" button at the bottom of the settings form.
- **Trigger:** After the user has made changes to the settings and clicks the "Lưu cài đặt" button, the system processes all pending changes.
- **Function:** The system persists all modified settings to the backend and displays a confirmation message upon successful save.

◆ View Store Information

- **Button/Navigation:** There is a "Thông tin cửa hàng" section on the settings screen displayed as a read-only information panel.
- **Trigger:** When the settings page loads with a selected business location, this section is automatically populated with the location's data.
- **Function:** The system displays the following store details: "Tên" (Name), "Địa chỉ" (Address), "Quận/Huyện" (District), "Thành phố" (City), "Điện thoại" (Phone), "Chủ sở hữu" (Owner), and operational status ("Hoạt động" or "Ngừng hoạt động").

---

### 2.9 Subscription Management

- **Function Description:** Manages the user's subscription plan, allows upgrading to premium plans, and displays transaction history. Contains two tabs: "Nâng cấp gói" (Upgrade Plan) and "Giao dịch" (Transactions).
- **Function Trigger:** Opened from sidebar "Nâng Cấp Tài Khoản" menu item (owner only).

◆ View Current Plan

- **Button/Navigation:** There is a "Gói hiện tại" card displayed at the top of the subscription screen, showing the user's active subscription details.
- **Trigger:** When the subscription page loads, the system automatically retrieves and displays the current subscription plan information.
- **Function:** The system displays the current plan name, its status ("Đang hoạt động", "Đã hết hạn", or "Đã huỷ"), start date ("Bắt đầu"), and expiration date ("Hết hạn"). If the user does not have any active subscription, a "Chưa có gói đăng ký" card is shown instead.

◆ Upgrade Plan

- **Button/Navigation:** There are plan selection cards in the "Nâng cấp gói" tab, with the recommended plan marked by a "Gói phổ biến" badge.
- **Trigger:** When the user selects a plan card and clicks the upgrade action, the system opens a checkout modal for payment confirmation.
- **Function:** The system presents a checkout modal where the user can review the plan details and confirm the purchase. Upon successful payment, the system activates the new subscription plan and updates the current plan display.

◆ View Transaction History

- **Button/Navigation:** There is a "Giao dịch" tab on the subscription screen that lists all billing transactions.
- **Trigger:** When the user clicks the "Giao dịch" tab, the system loads the complete transaction history.
- **Function:** The system displays a list of past transactions with status badges: "Thành công" for successful payments, "Thất bại" for failed payments, "Đang xử lý" for processing payments, and "Chờ thanh toán" for pending payments. Zero-amount transactions are displayed with the label "Miễn phí".

---

### 2.10 Order List

- **Function Description:** The orders list is the main screen for monitoring sales orders, order status, payment state, and customer information. Supports search by customer/phone, status filtering, date filtering, location filtering, and pagination.
- **Function Trigger:** Accessed from the Home Screen sidebar via "Đơn Hàng".

◆ Create New Order

- **Button/Navigation:** There is a "Tạo đơn hàng" button at the top of the Order List screen.
- **Trigger:** When the user clicks the "Tạo đơn hàng" button, the system initiates the order creation workflow.
- **Function:** The system navigates the user to the Create Order Screen (`/dashboard/orders/create`), where they can build a new sales order manually or through AI assistance.

◆ View Order Details

- **Button/Navigation:** There are clickable order rows in the order table, each displaying order information such as customer name, amount, and status.
- **Trigger:** When the user clicks on a specific order row, the system opens the detailed view for that order.
- **Function:** The system navigates the user to the Order Detail screen (`/dashboard/orders/[orderId]`), displaying complete order information including items, totals, payment state, and history.

◆ Filter Orders

- **Button/Navigation:** There are filter controls above the order table: a status select dropdown, a date filter, a location filter, and a search input field.
- **Trigger:** When the user selects filter criteria or enters search text, the system immediately applies the filters to narrow down the displayed orders.
- **Function:** The system filters the order table based on the selected criteria, showing only orders that match the chosen status, date range, location, and/or search keywords.

◆ Quick Order Actions

- **Button/Navigation:** There are action buttons on each order row, providing quick access to operations such as edit, cancel, confirm, complete, and delete.
- **Trigger:** When the user clicks an action button on a specific order row, the system executes the corresponding state transition.
- **Function:** The system performs the requested action on the order — for example, confirming a pending order, completing a confirmed order, or cancelling an order with a confirmation dialog.

---

### 2.11 Create Order Screen (Manual + AI)

- **Function Description:** The order creation flow allows users to build a new sales order manually (item-by-item selection) or from an AI-assisted voice draft. Supports product search, quantity adjustment (±), voice note recording, and payment method selection (Tiền mặt, Chuyển Khoản, Ví điện tử).
- **Function Trigger:** Navigated from the Order List via "Tạo đơn hàng" button.

◆ Create Manually (In-screen mode)

- **Button/Navigation:** There is a "Tạo thủ công" option and a manual product selection area on the Create Order screen.
- **Trigger:** When the user selects the manual creation option, the system displays the product search and cart building interface.
- **Function:** The system opens a form where the user can search for products, select them, set quantities, and build the order item by item in a cart-style layout.

◆ Create via AI Draft (In-screen mode)

- **Button/Navigation:** There is an AI draft option with a voice recording area on the Create Order screen.
- **Trigger:** When the user selects the AI draft option, the system activates the voice input and AI processing interface.
- **Function:** The system processes voice input through the AI engine and generates an order draft based on the spoken items. The user can then review and edit the AI-generated draft before finalizing.

◆ Add Items

- **Button/Navigation:** There is a product search field and an add button within the order creation form.
- **Trigger:** When the user searches for a product and selects it from the search results, the system adds it to the order cart.
- **Function:** The system adds the selected product to the order cart with default quantity controls, allowing the user to adjust the quantity as needed.

◆ Adjust Quantity

- **Button/Navigation:** There are plus (+) and minus (−) quantity buttons next to each product item in the order cart.
- **Trigger:** When the user clicks the plus or minus button, the system updates the item quantity accordingly.
- **Function:** The system adjusts the item quantity and automatically recalculates the item subtotal and overall order total.

◆ Select Payment Method

- **Button/Navigation:** There are payment method tabs on the order creation form: "Tiền mặt" (Cash), "Chuyển Khoản" (Bank Transfer), and "Ví điện tử" (E-wallet).
- **Trigger:** When the user clicks on a payment method tab, the system sets the selected method as the payment option for the order.
- **Function:** The system records the chosen payment method for the order and updates the payment section to reflect the selected option.

◆ Finalize Order

- **Button/Navigation:** There is a "Tạo đơn hàng" / Save / Confirm button at the bottom of the order creation form.
- **Trigger:** After the user finishes entering all order data and clicks the finalize button, the system validates the order information.
- **Function:** The system validates all required fields and creates the order record in the system. The order then enters the order lifecycle and the user is redirected to the Order Detail screen.

---

### 2.12 Order Detail

- **Function Description:** Shows order items, totals, payment state, customer information, and order history. Supports order status transitions (cancel, confirm, complete, delete) and printing.
- **Function Trigger:** Opened from the Order List by clicking an order row.

◆ Edit Order

- **Button/Navigation:** There is a "Cập nhật đơn hàng" button on the Order Detail screen, visible when the order is in an editable state.
- **Trigger:** When the user clicks the "Cập nhật đơn hàng" button, the system opens the editing interface for the order.
- **Function:** The system navigates the user to the Update Order screen (`/dashboard/orders/[orderId]/edit`), where they can modify the order items, quantities, and other details.

◆ Process Payment

- **Button/Navigation:** There is a payment action button on the Order Detail screen when the order requires payment settlement.
- **Trigger:** When the user clicks the payment action button, the system opens the payment processing interface.
- **Function:** The system navigates the user to the Order Payment screen (`/dashboard/orders/[orderId]/payment`), where they can record payments via cash or bank transfer.

◆ Confirm Order

- **Button/Navigation:** There is a confirm action button on the Order Detail screen for orders that are ready to be confirmed.
- **Trigger:** When the user clicks the confirm button, the system processes the order status transition.
- **Function:** The system updates the order status from pending to confirmed, allowing it to proceed to the next stage in the order lifecycle.

◆ Complete Order

- **Button/Navigation:** There is a complete action button on the Order Detail screen for orders that have been fully processed and paid.
- **Trigger:** When the user clicks the complete button, the system finalizes the order.
- **Function:** The system updates the order status to completed, marking it as fully processed in the system.

◆ Cancel Order

- **Button/Navigation:** There is a cancel action button on the Order Detail screen with a confirmation dialog to prevent accidental cancellation.
- **Trigger:** When the user clicks the cancel button and confirms through the dialog, the system processes the cancellation.
- **Function:** The system sets the order status to cancelled after the user confirms the action. This operation may affect related inventory and payment records.

◆ Delete Order

- **Button/Navigation:** There is a delete action button on the Order Detail screen with a confirmation dialog.
- **Trigger:** When the user clicks the delete button and confirms through the dialog, the system permanently removes the order.
- **Function:** The system deletes the order record from the system after confirmation. This action is typically available only for orders in certain statuses.

◆ Print Invoice

- **Button/Navigation:** There is an "In hóa đơn" button on the Order Detail screen, along with an export to PDF option.
- **Trigger:** When the user clicks the "In hóa đơn" button, the system generates a printable invoice document.
- **Function:** The system generates the order invoice in a printable or downloadable format (PDF), including all order items, totals, customer information, and payment details.

---

### 2.13 Update Order

- **Function Description:** Allows editing of an existing order's data including items, quantities, and other details before finalization.
- **Function Trigger:** Opened from Order Detail via "Cập nhật đơn hàng" button.

◆ Modify Items

- **Button/Navigation:** There are product quantity controls (plus/minus buttons) and delete buttons for each item in the order editing form.
- **Trigger:** When the user adjusts the quantity of an item or clicks the delete button to remove it, the system updates the order items list in real-time.
- **Function:** The system recalculates the order totals after each modification, reflecting the updated quantities and items.

◆ Save Changes

- **Button/Navigation:** There is a Save/Confirm button at the bottom of the order editing form.
- **Trigger:** After the user finishes editing the order data and clicks the save button, the system persists the changes.
- **Function:** The system validates the updated order data, saves all changes to the backend, and returns the user to the Order Detail screen with the updated information.

---

### 2.14 Order Payment

- **Function Description:** Records payment for an order with support for cash and bank transfer methods. Displays QR code for bank transfer, calculates change for cash payment, and supports excess payment routing to debt ledger.
- **Function Trigger:** Opened from Order Detail via payment action button.

◆ Cash Payment

- **Button/Navigation:** There is a "Tiền mặt" tab with a "Khách đưa" input field (placeholder: "Nhập số tiền khách đưa...") and quick amount buttons.
- **Trigger:** When the user selects the "Tiền mặt" tab and enters the cash amount received from the customer, the system calculates the change.
- **Function:** The system accepts the cash amount, displays quick amount selection buttons for convenience, and automatically calculates the change to return to the customer based on the order total.

◆ Bank Transfer Payment

- **Button/Navigation:** There is a "Chuyển Khoản" tab that displays bank transfer information and a QR code for payment.
- **Trigger:** When the user selects the "Chuyển Khoản" tab, the system displays the bank account details and generates a QR code.
- **Function:** The system displays the bank information including "Ngân hàng: Vietcombank", "Số TK: 1017 2345 6789", "Chủ TK: CONG TY TNHH MINH PHAT", and "Nội dung: [Order Code]". A copy-to-clipboard feature is available for each field, and a QR code is generated for quick scanning.

◆ Handle Excess Payment

- **Button/Navigation:** There is a debtor selector for the excess amount with the label "Tiền dư từ đơn hàng", allowing the user to route the excess to a customer's debt ledger.
- **Trigger:** When the payment amount entered exceeds the order total, the system detects the excess and prompts the user to assign it.
- **Function:** The system routes the excess payment amount to the selected customer's debt ledger. If the customer does not exist yet, the user can create a new debtor record inline.

◆ View Payment Status

- **Button/Navigation:** There is a payment summary display showing "Đã trả: ... — Còn lại: ..." and "Số tiền cần thanh toán" at the top of the payment screen.
- **Trigger:** When the payment page loads, the system automatically retrieves and displays the current payment status.
- **Function:** The system shows the remaining amount to be paid and the payment progress, giving the user a clear overview of how much has been collected and how much is still outstanding.

◆ Print Receipt

- **Button/Navigation:** There is an "In hóa đơn" button on the payment screen, available after a payment has been recorded.
- **Trigger:** After the payment is recorded, the user can click the "In hóa đơn" button to generate a receipt.
- **Function:** The system generates a payment receipt document containing the order details, payment amount, payment method, and transaction timestamp, ready for printing.

◆ Back to Order

- **Button/Navigation:** There is a "Quay lại" button at the top of the payment screen.
- **Trigger:** When the user clicks the "Quay lại" button, the system navigates back to the order.
- **Function:** The system returns the user to the Order Detail screen, preserving the updated payment status information.

---

### 2.15 Completed Order (Status State)

- **Function Description:** Completed Order is represented as an order status (not a standalone route screen). It indicates an order has been fully processed and paid. Visible in Order List and Order Detail.
- **Function Trigger:** Triggered after confirm/complete workflow in Order Detail.

◆ View Completed Order Detail

- **Button/Navigation:** There are completed order entries in the Order List, identifiable by their completed status badge.
- **Trigger:** When the user clicks on a completed order in the Order List, the system opens the order detail in a read-only context.
- **Function:** The system displays the Order Detail screen with the completed status context, showing all order items, totals, payment details, and history in a read-only format since the order has been fully processed.

---

### 2.16 Debt Customer List

- **Function Description:** The main screen for managing debt customers (Khách Hàng Thân Thiết), balance status, and activity state. Supports search by name/phone, filtering by debt status (Paid, Overdue, Critical), credit limit status, and pagination.
- **Function Trigger:** Accessed from the Home Screen sidebar via "Khách Hàng Thân Thiết".

◆ Add New Customer

- **Button/Navigation:** There is a "Thêm khách hàng" button at the top of the Debt Customer List screen.
- **Trigger:** When the user clicks the "Thêm khách hàng" button, the system initiates the customer creation flow.
- **Function:** The system navigates the user to the Create Customer screen (`/dashboard/customers/create`), where they can enter the new customer's information.

◆ View Customer Profile

- **Button/Navigation:** There are clickable customer rows in the customer table, each displaying customer name, phone, balance, and status.
- **Trigger:** When the user clicks on a specific customer row, the system opens the detailed customer view.
- **Function:** The system navigates the user to the Customer Detail & Debt History screen (`/dashboard/customers/[debtorId]`), showing the customer's profile, balance summary, and transaction history.

◆ Search and Filter Customers

- **Button/Navigation:** There is a search input field, a debt status filter (Paid, Overdue, Critical), and a credit limit filter above the customer table.
- **Trigger:** When the user enters search text or selects filter criteria, the system immediately applies the filters to the customer list.
- **Function:** The system filters the customer table based on the entered search keywords (name or phone) and the selected debt status and credit limit criteria.

◆ Quick Customer Actions

- **Button/Navigation:** There are action buttons on each customer row, providing quick access to edit, delete, and record payment operations.
- **Trigger:** When the user clicks an action button on a customer row, the system initiates the corresponding action.
- **Function:** The system navigates the user to the respective screen (Edit Customer or Record Payment) or opens a confirmation dialog for deletion.

---

### 2.17 Create new Regular Customer

- **Function Description:** Creates a new debtor profile with identity, contact, and credit data. Includes fields for name (required), phone, address, credit limit toggle, credit limit amount, and notes.
- **Function Trigger:** Opened from Debt Customer List via "Thêm khách hàng" button.

◆ Fill Customer Information

- **Button/Navigation:** There are form fields on the customer creation screen: "Tên khách hàng" (required, with placeholder: "VD: Anh Ba, Chị Lan, Công ty ABC..."), "Số điện thoại" (with placeholder: "VD: 0901234567"), and "Địa chỉ" (with placeholder: "VD: 123 Nguyễn Văn Linh, Q.7").
- **Trigger:** When the user enters the customer's information into the form fields, the system validates the input in real-time.
- **Function:** The system populates the customer creation form with the entered data and validates required fields. The customer name field is mandatory and must be filled before submission.

◆ Set Credit Limit

- **Button/Navigation:** There is a "Đặt giới hạn nợ" toggle switch and a "Giới hạn (VND)" input field. A help text reads: "Nếu tắt, khách hàng được nợ không giới hạn."
- **Trigger:** When the user toggles the "Đặt giới hạn nợ" switch to the on position, the credit limit input field becomes enabled for data entry.
- **Function:** The system enables or disables the credit limit field based on the toggle state. When enabled, the system validates that the entered value is greater than zero with the message: "Giới hạn nợ phải lớn hơn 0."

◆ Add Notes

- **Button/Navigation:** There is a "Ghi chú" textarea field (with placeholder: "Thêm ghi chú về khách hàng (tuỳ chọn)...") on the customer creation form.
- **Trigger:** When the user enters text into the notes field, the system stores the notes as part of the customer profile.
- **Function:** The system saves the optional notes along with the customer record, providing additional context about the customer for future reference.

◆ Save Customer

- **Button/Navigation:** There is a Save/Create button at the bottom of the customer creation form.
- **Trigger:** After the user completes all required fields and clicks the save button, the system validates the form. If validation fails, the system displays: "Vui lòng nhập tên khách hàng."
- **Function:** The system validates all fields, stores the new debtor profile in the database, and navigates the user to either the customer detail screen or back to the customer list.

---

### 2.18 Customer Detail & Debt History

- **Function Description:** Shows debtor profile information, current balance summary, recent orders, and debt/payment history. Displays balance status with visual indicators.
- **Function Trigger:** Opened from Debt Customer List by clicking a customer row.

◆ Record Payment

- **Button/Navigation:** There is a "Điều chỉnh công nợ" / payment action button on the Customer Detail screen.
- **Trigger:** When the user clicks the "Điều chỉnh công nợ" button, the system opens the debt collection recording interface.
- **Function:** The system navigates the user to the Record Debt Collection screen (`/dashboard/customers/[debtorId]/payment`), where they can enter the payment amount and record the transaction.

◆ Edit Customer Profile

- **Button/Navigation:** There is a "Chỉnh sửa" button on the Customer Detail screen.
- **Trigger:** When the user clicks the "Chỉnh sửa" button, the system opens the customer editing form.
- **Function:** The system navigates the user to the Edit Customer screen (`/dashboard/customers/[debtorId]/edit`), where they can update the customer's information, credit limit, and notes.

◆ Delete Customer

- **Button/Navigation:** There is a delete action on the Customer Detail screen with a confirmation dialog to prevent accidental deletion.
- **Trigger:** When the user clicks the delete action and confirms through the confirmation dialog, the system processes the deletion.
- **Function:** The system permanently deletes the customer profile and all associated debt records after the user confirms the action.

◆ View Order History

- **Button/Navigation:** There is a recent orders section on the Customer Detail screen displaying the customer's purchase history.
- **Trigger:** When the Customer Detail page loads, the system automatically retrieves and displays the customer's associated orders.
- **Function:** The system displays a list of orders linked to this customer, each with a clickable link that navigates to the corresponding Order Detail screen.

---

### 2.19 Edit Customer

- **Function Description:** Edits an existing customer's basic information, credit limit, and notes. Displays section header "Chỉnh sửa thông tin cơ bản". Shows loading state "Đang tải dữ liệu khách hàng..." and error state "Không tìm thấy khách hàng" / "Khách hàng này không tồn tại hoặc đã bị xóa."
- **Function Trigger:** Opened from Customer Detail via "Chỉnh sửa" button.

◆ Update Customer Fields

- **Button/Navigation:** There are form fields on the Edit Customer screen: "Tên khách hàng" (required), "Số điện thoại", "Địa chỉ", "Đặt giới hạn nợ" toggle, "Giới hạn (VND)", and "Ghi chú" (with placeholder: "Thêm ghi chú về khách hàng (tuỳ chọn)..."). All fields are pre-populated with the existing customer data.
- **Trigger:** When the user modifies any field, the system tracks the changes for saving.
- **Function:** The system validates the modified fields in real-time, ensuring required fields are not empty and credit limit values are valid.

◆ Save Changes

- **Button/Navigation:** There is a "Lưu thay đổi" button at the bottom of the edit form. It displays "Đang lưu..." while the system processes the update.
- **Trigger:** After the user makes changes and clicks the "Lưu thay đổi" button, the system saves the updated customer information.
- **Function:** The system persists all customer updates to the backend and navigates the user back to the Customer Detail screen with the refreshed data.

◆ Cancel Edit

- **Button/Navigation:** There is a "Huỷ" button next to the save button on the edit form.
- **Trigger:** When the user clicks the "Huỷ" button, the system discards all unsaved changes.
- **Function:** The system discards any modifications made to the customer data and navigates the user back to the Customer Detail screen without saving.

◆ Back to List

- **Button/Navigation:** There is a "Quay lại" / "Quay lại danh sách" button at the top of the edit screen.
- **Trigger:** When the user clicks the "Quay lại" button, the system navigates back to the customer list.
- **Function:** The system returns the user to the Debt Customer List screen.

---

### 2.20 Record Debt Collection

- **Function Description:** Records a debt payment transaction for a specific customer and updates their balance. Supports cash and bank transfer payment methods with amount input, payment confirmation, and notes.
- **Function Trigger:** Opened from Customer Detail via "Điều chỉnh công nợ" / payment action.

◆ Enter Payment Amount

- **Button/Navigation:** There is an amount input field and a payment method selector (Cash/Bank) on the Record Debt Collection screen.
- **Trigger:** When the user enters the collected amount and selects the payment method, the system validates the input against the outstanding balance.
- **Function:** The system checks that the entered amount does not exceed the customer's outstanding debt balance and prepares the payment record for confirmation.

◆ Confirm Payment Record

- **Button/Navigation:** There is a Confirm/Save button at the bottom of the debt collection form.
- **Trigger:** After the payment amount and method are valid and the user clicks the confirm button, the system processes the payment.
- **Function:** The system saves the debt payment transaction, deducts the amount from the customer's outstanding balance, and recalculates the customer's overall debt status.

---

### 2.21 Goods Received Notes List (Imports List)

- **Function Description:** The imports list tracks goods received notes and import receipt statuses. Supports search, date filtering, status filtering, and pagination. This module is owner-only.
- **Function Trigger:** Opened from Dashboard Home or the sidebar via "Nhập Kho" (owner only).

◆ Create New Import

- **Button/Navigation:** There is a "Tạo phiếu nhập" button at the top of the Goods Received Notes List screen.
- **Trigger:** When the user clicks the "Tạo phiếu nhập" button, the system initiates the import receipt creation workflow.
- **Function:** The system navigates the user to the Create Import Receipt Screen (`/dashboard/imports/create`), where they can enter supplier information, select products, and build a new import receipt.

◆ View Receipt Details

- **Button/Navigation:** There are clickable receipt rows in the import table, each displaying receipt information such as supplier, date, status, and total amount.
- **Trigger:** When the user clicks on a specific receipt row, the system opens the detailed receipt view.
- **Function:** The system navigates the user to the Receipt Detail screen (`/dashboard/imports/[importId]`), showing complete receipt information including items, supplier data, and status history.

◆ Filter Imports

- **Button/Navigation:** There are filter controls above the import table: a status filter, a date filter, and a search input field.
- **Trigger:** When the user selects filter criteria or enters search text, the system applies the filters to narrow down the displayed import records.
- **Function:** The system filters the import table based on the selected status, date range, and/or search keywords, showing only matching records.

◆ Quick Import Actions

- **Button/Navigation:** There are action buttons on each receipt row, providing quick access to edit and delete operations.
- **Trigger:** When the user clicks an action button on a specific receipt row, the system initiates the corresponding action.
- **Function:** The system either navigates the user to the Edit Import Receipt screen for editing, or opens a confirmation dialog for deletion.

---

### 2.22 Create Import Receipt Screen

- **Function Description:** Captures goods received information (supplier, items, quantities, cost prices) and builds a draft receipt before confirmation. Supports image upload, barcode scanning, OCR processing, and product search. Includes import type selection and invoice toggle. Date format: "Ngày [day] tháng [month] năm [year]".
- **Function Trigger:** Opened from the Goods Received Notes List via "Tạo phiếu nhập" button.

◆ Select Import Type

- **Button/Navigation:** There is a "Loại Nhập" dropdown selector on the import creation form with options: INVOICE, NO_INVOICE / "Nhập hàng không hóa đơn (chi phí)", ADJUSTMENT, and RETURN.
- **Trigger:** When the user selects an import type from the dropdown, the system adjusts the form fields according to the selected type.
- **Function:** The system sets the import category and dynamically updates the form layout — for example, showing or hiding supplier-related fields based on whether the import type requires invoice information.

◆ Toggle Invoice

- **Button/Navigation:** There is a "Có hóa đơn" toggle switch on the import creation form.
- **Trigger:** When the user toggles the switch, the system enables or disables the invoice-related fields on the form.
- **Function:** The system shows or hides supplier information fields (supplier name, address, tax ID) based on the toggle state. When enabled, these fields become available for data entry.

◆ Enter Supplier Information

- **Button/Navigation:** There are text input fields on the form: "Nhà cung cấp" (Supplier name), "Địa chỉ NCC" (Supplier address), and "Mã số thuế/CMND" (Tax ID/ID number).
- **Trigger:** When the user enters supplier details into these fields, the system stores the data as part of the import receipt.
- **Function:** The system populates the supplier information section of the import receipt with the entered data for record-keeping and accounting purposes.

◆ Add Products

- **Button/Navigation:** There is a "Chọn sản phẩm" dropdown and a "Thêm sản phẩm" button (with a Plus icon) on the import creation form.
- **Trigger:** When the user selects a product from the dropdown and clicks the "Thêm sản phẩm" button, the system adds the product to the import list.
- **Function:** The system adds a new product row to the import items table with columns for "Số lượng" (Quantity), "Giá nhập" (Cost Price), and "Thành tiền" (Total Amount), allowing the user to enter the quantity and price for the imported product.

◆ Remove Products

- **Button/Navigation:** There is a "Xóa" button (with a Trash icon) on each product row in the import items table.
- **Trigger:** When the user clicks the "Xóa" button on a specific product row, the system removes that product from the import list.
- **Function:** The system deletes the selected product row from the import items and recalculates the total import amount.

◆ Upload Invoice Photo / Scan OCR

- **Button/Navigation:** There are "Tải ảnh hóa đơn" and "Quét OCR" buttons on the import creation form.
- **Trigger:** When the user clicks the upload or OCR button and provides an invoice image, the system processes the image.
- **Function:** The system uploads the image and processes it through OCR technology to automatically extract and populate form fields such as supplier name, product items, quantities, and prices from the invoice image.

◆ Add Notes

- **Button/Navigation:** There is a "Ghi chú" textarea field on the import creation form.
- **Trigger:** When the user enters remarks or additional information about the import, the system stores the notes.
- **Function:** The system saves the notes as part of the import receipt record for future reference.

◆ Save Draft

- **Button/Navigation:** There is a save draft button on the import creation form.
- **Trigger:** When the user has entered import details but is not ready to finalize, clicking the save draft button preserves the current state.
- **Function:** The system creates a Draft Import Receipt that can be edited and completed later without affecting inventory data.

◆ Confirm Import

- **Button/Navigation:** There is a "Lưu & Hoàn tất" / Confirm import button on the import creation form.
- **Trigger:** After the user has entered all necessary import data and clicks the confirm button, the system finalizes the receipt.
- **Function:** The system confirms the import receipt, updates the status to confirmed, and directly updates the inventory data by adding the imported quantities to the corresponding product stock levels.

◆ Cancel

- **Button/Navigation:** There is a "Hủy" button on the import creation form.
- **Trigger:** When the user clicks the "Hủy" button, the system discards the import creation.
- **Function:** The system returns the user to the Goods Received Notes List without saving any data from the current import creation session.

---

### 2.23 Edit Import Receipt

- **Function Description:** Edits an existing import receipt's data (import type, supplier, items, quantities, cost prices) before it is confirmed. Same form layout as Create Import but pre-populated with existing data.
- **Function Trigger:** Opened from Receipt Detail via "Sửa" button or import list action.

◆ Modify Import Data

- **Button/Navigation:** There are form fields on the Edit Import screen with the same layout as the Create Import form (import type, supplier details, items table), pre-populated with the existing receipt data.
- **Trigger:** When the user modifies any field on the form, the system tracks the changes for saving.
- **Function:** The system updates the import receipt fields in real-time and validates all modifications before allowing the user to save.

◆ Add/Remove Products

- **Button/Navigation:** There is a "Thêm sản phẩm" button for adding new products and a "Xóa" button on each product row for removal.
- **Trigger:** When the user clicks the add button to include a new product or the remove button to delete an existing one, the system updates the product list.
- **Function:** The system adds a new product row to the import items table or removes the selected row, then recalculates the total import amount.

◆ Save Changes

- **Button/Navigation:** There is a "Lưu & Hoàn tất" button at the bottom of the edit form.
- **Trigger:** After the user finishes editing the import data and clicks the "Lưu & Hoàn tất" button, the system persists the changes.
- **Function:** The system validates all modified fields and saves the updated import receipt to the backend.

◆ Cancel Edit

- **Button/Navigation:** There is a "Hủy" button on the edit form.
- **Trigger:** When the user clicks the "Hủy" button, the system discards all unsaved changes.
- **Function:** The system returns the user to the Receipt Detail screen without saving any modifications.

---

### 2.24 Receipt Detail

- **Function Description:** Shows the full receipt information, imported items, supplier data, status history, and follow-up actions. Supports transitioning draft receipts to confirmed state and printing.
- **Function Trigger:** Opened from the Goods Received Notes List by clicking a receipt row or after creating a draft.

◆ Edit Draft Receipt

- **Button/Navigation:** There is a "Sửa" button on the Receipt Detail screen, available when the receipt is in draft status.
- **Trigger:** When the user clicks the "Sửa" button, the system opens the editing interface for the draft receipt.
- **Function:** The system navigates the user to the Edit Import Receipt screen (`/dashboard/imports/[importId]/edit`), where they can modify the receipt data before finalization.

◆ Confirm Receipt

- **Button/Navigation:** There is a confirm import button on the Receipt Detail screen for draft receipts that are ready to be finalized.
- **Trigger:** When the user clicks the confirm button, the system processes the receipt finalization.
- **Function:** The system moves the receipt from draft to confirmed status and updates the inventory data by adding the imported quantities to the corresponding product stock levels.

◆ Delete Receipt

- **Button/Navigation:** There is a delete action on the Receipt Detail screen with a confirmation dialog.
- **Trigger:** When the user clicks the delete action and confirms through the dialog, the system removes the receipt.
- **Function:** The system permanently deletes the import receipt after the user confirms the action.

◆ Print Invoice

- **Button/Navigation:** There is a Print/Export button on the Receipt Detail screen.
- **Trigger:** When the user clicks the print or export button, the system generates a document for the import receipt.
- **Function:** The system generates the import receipt document in a printable or downloadable format, including all imported items, supplier data, and totals.

---

### 2.25 Product List

- **Function Description:** The products list is the central screen for searching, managing, and monitoring product master data. Supports text search, barcode scanning, stock adjustment, product activation/deactivation, and product deletion.
- **Function Trigger:** Opened from Dashboard Home or the sidebar via "Sản Phẩm".

◆ Create New Product

- **Button/Navigation:** There is a "Thêm sản phẩm" / "+" button at the top of the Product List screen.
- **Trigger:** When the owner clicks the "Thêm sản phẩm" button, the system initiates the product creation workflow.
- **Function:** The system navigates the user to the location-scoped new product route (`/dashboard/locations/[id]/products/new`), where they can enter the product master data and sell item configuration.

◆ View Product Details

- **Button/Navigation:** There are clickable product rows in the product table, each displaying product name, stock, price, and status information.
- **Trigger:** When the user clicks on a specific product row, the system opens the detailed product view.
- **Function:** The system navigates the user to the Product Detail screen (`/dashboard/locations/[id]/products/[productId]`), showing comprehensive product information, stock charts, and location context.

◆ Scan Barcode (Dialog)

- **Button/Navigation:** There is a barcode scan button on the Product List screen that opens the BarcodeScanModal.
- **Trigger:** When the user clicks the barcode scan button, the system opens a camera-based barcode scanning dialog.
- **Function:** The system activates the device camera within the modal to scan product barcodes. If a matching product is found, the system navigates to its detail page. If no match exists, the user is prompted to add a new product.

◆ Adjust Stock (Dialog)

- **Button/Navigation:** There is a stock adjustment action on each product row that opens the StockAdjustmentDialog with the title "Điều chỉnh tồn kho".
- **Trigger:** When the user clicks the stock adjustment action, the system opens a dialog containing the following fields: "Tồn kho hiện tại" (read-only, showing current stock), "Tồn kho mới" (input with placeholder: "Nhập số lượng mới"), "Giá nhập (tuỳ chọn)" (input with placeholder: "Nhập giá nhập hàng"), and "Ghi chú (tuỳ chọn)" (input with placeholder: "Lý do điều chỉnh...").
- **Function:** The system calculates the difference between the current and new stock levels. If the new quantity is higher, the system displays the message: "Tăng ... so với hiện tại — sẽ tạo phiếu nhập kho." If the new quantity is lower, it shows: "Giảm ... so với hiện tại — sẽ tạo phiếu điều chỉnh." The user can confirm with the "Xác nhận" button (which shows "Đang lưu..." while processing) or cancel with the "Hủy" button.

◆ Toggle Product Status

- **Button/Navigation:** There is an Activate/Deactivate toggle on each product row in the product table.
- **Trigger:** When the user clicks the toggle, the system switches the product's active state.
- **Function:** The system updates the product's availability status. Active products are visible in order creation and other operational flows, while deactivated products are hidden from those flows.

◆ Delete Product

- **Button/Navigation:** There is a delete action on each product row with a confirmation dialog.
- **Trigger:** When the user clicks the delete action and confirms through the confirmation dialog, the system removes the product.
- **Function:** The system permanently deletes the product from the system after the user confirms the action.

---

### 2.26 Business Location List

- **Function Description:** The business location list manages branches, stores, and operational locations. Supports grid view and list view toggle, location creation dialog, status toggle, and deletion. Displays location card/list items with name, address, phone, and employee count.
- **Function Trigger:** Opened from Dashboard Home or sidebar via "Địa Điểm Kinh Doanh".

◆ Create Location (Dialog Flow)

- **Button/Navigation:** There is a "Tạo kho mới" / "+" button on the Business Location List screen.
- **Trigger:** When the owner clicks the "Tạo kho mới" button, the system opens a creation dialog.
- **Function:** The system displays a dialog with input fields for location name, address, phone, and employee assignment. After the user fills in the details and confirms, the system saves the new location and adds it to the location list.

◆ View Location Detail

- **Button/Navigation:** There are clickable location cards (in grid view) or rows (in list view), each displaying the location name, address, phone, and employee count.
- **Trigger:** When the user clicks on a specific location card or row, the system opens the detailed location view.
- **Function:** The system navigates the user to the Location Detail screen (`/dashboard/locations/[id]`), showing full location information and product management capabilities.

◆ Update Location (Dialog/Flow)

- **Button/Navigation:** There is an edit action on each location card or row.
- **Trigger:** When the user clicks the edit action, the system opens an edit dialog or navigates to the detail screen for editing.
- **Function:** The system allows the user to modify the location's information (name, address, phone) and saves the changes upon confirmation.

◆ Manage Location Status

- **Button/Navigation:** There is a "Kích hoạt / Vô hiệu" toggle or action button on each location card or row.
- **Trigger:** When the user clicks the toggle or action button, the system switches the location's operational status.
- **Function:** The system toggles the operational availability of the target location between active and inactive states. Inactive locations are not available for order creation or inventory operations.

◆ Delete Location

- **Button/Navigation:** There is a "Xóa" button on each location card or row with a confirmation dialog.
- **Trigger:** When the user clicks the "Xóa" button and confirms through the confirmation dialog, the system removes the location.
- **Function:** The system deletes the location according to system permission rules. The deletion may be restricted if the location has active products or pending operations.

◆ Toggle View Mode

- **Button/Navigation:** There are Grid/List view toggle buttons at the top of the location list.
- **Trigger:** When the user clicks either the grid or list toggle button, the system changes the display layout.
- **Function:** The system switches between a card grid view (showing locations as visual cards) and a table list view (showing locations as rows in a table).

---

### 2.27 Location Detail

- **Function Description:** Shows detailed location information, manages products at the location, and employee assignments. Displays location name ("Địa điểm #[id]"), address, phone, and provides access to product management and inventory features. Subtitle: "Quản lý sản phẩm tại địa điểm kinh doanh".
- **Function Trigger:** Opened from Business Location List by clicking a location.

◆ Add Product

- **Button/Navigation:** There is a "Thêm sản phẩm" button on the Location Detail screen.
- **Trigger:** When the user clicks the "Thêm sản phẩm" button, the system initiates the product creation workflow scoped to this location.
- **Function:** The system navigates the user to the new product screen (`/dashboard/locations/[id]/products/new`) or opens a product creation form where they can add a new product to this specific location.

◆ Search Products

- **Button/Navigation:** There is a "Tìm kiếm sản phẩm..." search input field on the Location Detail screen.
- **Trigger:** When the user types into the search field, the system filters the product list in real-time based on the entered text.
- **Function:** The system displays only products whose names or codes match the search query, updating the results as the user types.

◆ Filter Products

- **Button/Navigation:** There is a "Lọc" button with a filter panel containing min/max price fields, a business type multi-select dropdown, and a status selector ("Hoạt động" / "Ngừng hoạt động").
- **Trigger:** When the user sets filter criteria and clicks the "Áp dụng" button, the system applies the filters to the product list. Filters can be reset with the "Đặt lại" button.
- **Function:** The system filters the product list based on the selected criteria, showing only products that match the specified price range, business type, and status.

◆ Scan Barcode

- **Button/Navigation:** There is a "Quét mã vạch" button on the Location Detail screen.
- **Trigger:** When the user clicks the "Quét mã vạch" button, the system opens the barcode scanner.
- **Function:** The system activates the camera-based barcode scanner and searches for a product matching the scanned barcode within the current location.

◆ View Product Detail

- **Button/Navigation:** There are clickable product rows in the product table, with columns showing "Tồn kho" (Stock) and "Giá nhập" (Cost Price).
- **Trigger:** When the user clicks on a product row, the system opens the detailed product view.
- **Function:** The system navigates the user to the product detail page (`/dashboard/locations/[id]/products/[productId]`), showing comprehensive product information within the location context.

◆ Back to Locations

- **Button/Navigation:** There is a "Quay lại" button at the top of the Location Detail screen.
- **Trigger:** When the user clicks the "Quay lại" button, the system navigates back to the location list.
- **Function:** The system returns the user to the Business Location List screen.

---

### 2.28 Location Products (Sub-page)

- **Function Description:** Sub-page that lists all products scoped to a specific business location. Provides product search and management within location context.
- **Function Trigger:** Accessed from Location Detail or via route `/dashboard/locations/[id]/products`.

◆ View Product List

- **Button/Navigation:** There is a product table or grid display on the Location Products sub-page showing all products at this location.
- **Trigger:** When the page loads, the system automatically retrieves and displays all products associated with the selected location.
- **Function:** The system displays each product with its stock level, cost price, and active status, allowing the user to manage products within the location context.

---

### 2.29 Create new Product Screen

- **Function Description:** Adds a new product and its sellable item data (units, variants, pricing tiers) within a specific business location context. Includes fields for product name, SKU, business type, unit, initial stock, cost price, manufacturer, track inventory toggle, and price tiers.
- **Function Trigger:** Opened from Product List or Location Detail via "Thêm sản phẩm" button.

◆ Create Product

- **Button/Navigation:** There is a Save/Create product button at the bottom of the product creation form.
- **Trigger:** After the user enters all required product master data (name, SKU, business type, unit, stock, cost price) and clicks the save button, the system validates and processes the creation.
- **Function:** The system validates all required fields and saves the new product into the system for the selected location, making it available for ordering and inventory management.

◆ Configure Sell Item

- **Button/Navigation:** There is a sell item configuration section on the product creation form, where the user can define the sale-ready unit and pricing tiers.
- **Trigger:** When the user fills in the sell item details (unit type and pricing), the system prepares the sell item mapping.
- **Function:** The system creates the sell item mapping that links the product to a specific sale unit and pricing structure, enabling the product to be used in order creation and import workflows.

---

### 2.30 Product Detail (Location)

- **Function Description:** Shows comprehensive product information, stock history chart, sales trend chart, reorder suggestions, and business location context. Supports inline editing of product fields.
- **Function Trigger:** Opened from Product List or Location Detail by clicking a product.

◆ Update Product (In-screen action)

- **Button/Navigation:** There is a "Cập nhật" / Edit button on the Product Detail screen.
- **Trigger:** When the user clicks the "Cập nhật" button, the system enables inline editing mode for the product fields.
- **Function:** The system allows the user to modify product fields, selling units, and business data directly on the detail screen. Changes are persisted when the user clicks save.

◆ Delete Product

- **Button/Navigation:** There is a delete action on the Product Detail screen with a confirmation dialog.
- **Trigger:** When the user clicks the delete action and confirms through the confirmation dialog, the system removes the product.
- **Function:** The system permanently deletes the product from the system after user confirmation.

◆ View Analytics

- **Button/Navigation:** There are stock history chart and sales trend chart sections on the Product Detail screen.
- **Trigger:** When the page loads with available analytics data, the system renders the performance charts.
- **Function:** The system displays product performance charts showing stock level history over time, sales trends, and reorder suggestions based on the product's data.

---

### 2.31 Location Inventory / Stock-In

- **Function Description:** Manages low-stock products and creates stock-in receipts from a specific location context. Shows products that need reordering with supplier contact information. Supports creating import with or without invoice, multi-step flow (select products → enter details → confirm). Title: "Nhập Kho Hàng Hoá".
- **Function Trigger:** Opened from Location Detail or inventory management navigation.

◆ Select Low-Stock Products

- **Button/Navigation:** There is a "Sản phẩm sắp hết tồn" section with product checkboxes on the stock-in screen.
- **Trigger:** When the system identifies products below the minimum stock threshold, these products are automatically listed in this section with selection checkboxes.
- **Function:** The system displays each low-stock product with its "Tồn kho hiện tại" (Current Stock), "Tồn kho tối thiểu" (Min Stock), and "Đơn vị" (Unit) information, allowing the user to select which products to include in the stock-in receipt.

◆ Set Import Type

- **Button/Navigation:** There is a "Loại phiếu" selector with options: "Nhập hàng có hóa đơn" / "Nhập hàng không hóa đơn", and a "Có hóa đơn" toggle on the stock-in form.
- **Trigger:** When the user selects the import type, the system adjusts the form fields accordingly.
- **Function:** The system configures the import receipt type and shows or hides invoice-related fields based on the selection.

◆ Enter Product Details

- **Button/Navigation:** There is a product table with columns: "Tên sản phẩm" (Product name), "Số lượng" (Quantity), "Giá" (Price per unit), and "Thành tiền" (Total amount). Each row has a "Xóa" (Delete) button.
- **Trigger:** When the user fills in the quantity and price for each product, the system calculates the totals in real-time.
- **Function:** The system automatically multiplies the quantity by the unit price to compute the total amount per product row and the overall import total.

◆ Add Products

- **Button/Navigation:** There is a "Thêm sản phẩm" button with a "Tìm kiếm sản phẩm..." search input field.
- **Trigger:** When the user clicks the "Thêm sản phẩm" button and searches for a product, the system adds it to the import list.
- **Function:** The system adds the selected product to the import items list, allowing the user to include products beyond the automatically suggested low-stock items.

◆ Enter Supplier Information

- **Button/Navigation:** There are input fields for "Nhà cung cấp" (Supplier name), "SĐT" (Phone), and "Địa chỉ" (Address) on the stock-in form.
- **Trigger:** When the user enters supplier contact details into the fields, the system stores the data.
- **Function:** The system populates the supplier information section of the import receipt for record-keeping purposes.

◆ Toggle VAT

- **Button/Navigation:** There is a "Tính VAT" toggle switch on the stock-in form.
- **Trigger:** When the user toggles the switch, the system includes or excludes VAT from the calculations.
- **Function:** The system recalculates all amounts based on whether VAT is enabled or disabled.

◆ Add Notes

- **Button/Navigation:** There is a "Ghi chú" textarea field on the stock-in form.
- **Trigger:** When the user enters remarks into the notes field, the system stores the text.
- **Function:** The system saves the notes as part of the import receipt for future reference.

◆ Save Draft

- **Button/Navigation:** There is a "Lưu nháp" button on the stock-in form.
- **Trigger:** When the user clicks the "Lưu nháp" button, the system saves the current state without finalizing.
- **Function:** The system creates a draft import receipt that can be completed later, without updating inventory data.

◆ Confirm Import

- **Button/Navigation:** There is a "Xác nhận nhập kho" button at the bottom of the stock-in form.
- **Trigger:** After the user has entered all necessary data and clicks the "Xác nhận nhập kho" button, the system finalizes the import.
- **Function:** The system confirms the import receipt, updates the inventory by adding the imported quantities to the product stock levels, and completes the stock-in process.

◆ Receive Goods

- **Button/Navigation:** There is a "Tiếp Nhận Hàng Hoá" section with a "Xác nhận ngày nhận" field and a "Hoàn tất" button.
- **Trigger:** When the physical goods are received at the location, the user enters the receipt date and clicks "Hoàn tất".
- **Function:** The system records the receipt date and marks the goods as physically received, completing the stock-in workflow.

---

### 2.32 Employee List

- **Function Description:** Manages staff accounts and invitation records with two main tabs: Employee roster tab and Invitations tab. This module is owner-only.
- **Function Trigger:** Opened from Dashboard Home or sidebar via "Nhân Viên" (owner only).

◆ Switch Tabs (Employees / Invitations)

- **Button/Navigation:** There are tab buttons at the top of the Employee List screen for switching between the employee roster and the invitations view.
- **Trigger:** When the user clicks a tab button, the system loads the corresponding tab content.
- **Function:** The system switches between the employee roster tab (showing current staff members) and the invitations tab (showing pending invitations and requests).

◆ Search Employees

- **Button/Navigation:** There is a search input field on the employee roster tab.
- **Trigger:** When the user types into the search field, the system filters the employee list in real-time.
- **Function:** The system displays only employees whose names or contact information match the search query.

◆ Remove Employee

- **Button/Navigation:** There is a remove action button on each employee row with a confirmation dialog.
- **Trigger:** When the owner clicks the remove button and confirms through the dialog, the system processes the removal.
- **Function:** The system unbinds the employee from the organization and/or location scope, revoking their access to the business operations.

◆ Invite Employee (Dialog Flow)

- **Button/Navigation:** There is a "Mời nhân viên" button on the Employee List screen.
- **Trigger:** When the owner clicks the "Mời nhân viên" button, the system opens an invitation dialog.
- **Function:** The system displays a dialog where the owner can enter the invitee's contact information (phone number or email) and send the invitation. Upon submission, the invitation is sent and appears in the invitations tab.

◆ Accept Invitation

- **Button/Navigation:** There is an accept action button on each invitation row in the invitations tab.
- **Trigger:** When the owner clicks the accept button, the system approves the invitation.
- **Function:** The system confirms the employee assignment, granting the invitee access to the business operations and adding them to the employee roster.

◆ Reject Invitation

- **Button/Navigation:** There is a reject action button on each invitation row in the invitations tab.
- **Trigger:** When the owner clicks the reject button, the system declines the invitation.
- **Function:** The system rejects the invitation request and removes it from the pending invitations list.

---

### 2.33 Accounting Management (Reports Dashboard)

- **Function Description:** The central hub for accounting data. Contains tabs for General Ledger ("Sổ Kế Toán Chung"), Accounting Periods ("Kỳ Kế Toán"), and Accounting Books ("Sổ Kế Toán"). This module is owner-only.
- **Function Trigger:** Opened from Dashboard Home or sidebar via "Báo Cáo & Thống Kê" (owner only).

◆ Navigate Accounting Tabs

- **Button/Navigation:** There are tab buttons at the top of the Accounting Management screen: "Sổ Kế Toán Chung" (General Ledger), "Kỳ Kế Toán" (Accounting Periods), and "Sổ Kế Toán" (Accounting Books).
- **Trigger:** When the user clicks a tab button, the system loads the corresponding accounting sub-module.
- **Function:** The system switches between the General Ledger view, the Accounting Periods management, and the Accounting Books section, loading the appropriate data and controls for each.

---

### 2.34 General Ledger Tab

- **Function Description:** Displays accounting general ledger entries with advanced filtering. Supports search by transaction type, filters for transaction types, reference types, payment channels ("Tiền mặt", "Ngân hàng", "Ghi nợ"), date range, and view mode toggle between Audit and Effective views. Title: "Sổ Kế Toán Chung".
- **Function Trigger:** Selected via General Ledger tab in Accounting Management.

◆ Search GL Entries

- **Button/Navigation:** There is a search input field on the General Ledger tab (with placeholder: "Tìm kiếm theo loại giao dịch...").
- **Trigger:** When the user types a search query into the input field, the system filters the GL entries based on the text.
- **Function:** The system displays only GL entries that match the search query, filtering by transaction type or description.

◆ Apply Filters

- **Button/Navigation:** There is a "Bộ Lọc" panel with multi-select filters: "Loại giao dịch" (Transaction Types), "Loại tham chiếu" (Reference Types), "Kênh thanh toán" (Payment Channels: "Tiền mặt", "Ngân hàng", "Ghi nợ"), and date range fields "Từ ngày" and "Đến ngày". Quick actions include "Chọn tất cả" and "Bỏ chọn".
- **Trigger:** When the user sets filter criteria and clicks the "Áp dụng" button, the system applies all selected filters. Users can clear filters with the "Xóa bộ lọc" button.
- **Function:** The system filters the GL entries table based on all selected criteria, showing only entries that match the chosen transaction types, reference types, payment channels, and date range.

◆ Switch View Mode

- **Button/Navigation:** There is a "Chế độ xem" toggle with two options: "Audit - Dòng thời gian đầy đủ" and "Effective - Số liệu hiệu lực".
- **Trigger:** When the user clicks the toggle to switch between audit and effective views, the system changes the display format.
- **Function:** The system switches between the audit trail view (showing the complete chronological record of all entries including reversals) and the effective balance view (showing only currently active entries with net calculations).

◆ View GL Entry Details

- **Button/Navigation:** There is a "Danh Sách Sổ Kế Toán" table with columns: "Tài khoản" (Account), "Diễn giải" (Description), "Nợ" (Debit), "Có" (Credit), "Ngày" (Date), and "Trạng thái" (Status).
- **Trigger:** When the page loads with accounting data, the system populates the table with all GL entries for the current period.
- **Function:** The system displays each entry with its account, description, debit/credit amounts, date, and status badge: "Đang hiệu lực" (Active), "Dòng đảo" (Reversal), or "Đã bị hủy hiệu lực" (Reversed).

---

### 2.35 Accounting Period List Tab

- **Function Description:** Manages open and historical accounting periods. Supports creating standard (quarter/year) or custom periods, setting opening balances with suggestions from previous periods, finalizing, reopening, and deleting periods. Shows recent activities log. Title: "Kỳ Kế Toán".
- **Function Trigger:** Selected via "Kỳ Kế Toán" tab in Accounting Management.

◆ Create New Period (Dialog)

- **Button/Navigation:** There is a "Tạo Kỳ Mới" button on the Accounting Period List tab. Clicking it opens a dialog with two tabs: "Tạo tiêu chuẩn" and "Tạo tuỳ chọn".
- **Trigger:** When the user clicks the "Tạo Kỳ Mới" button, the system opens the period creation dialog.
- **Function:** The system displays a dialog where the user can create either a standard period (using "Quý" / Quarter or "Năm" / Year selectors) or a custom period (using "Từ ngày" / "Dến ngày" date pickers). The dialog also includes "Tồn tiền mặt đầu kỳ" (Opening Cash Balance) and "Tồn ngân hàng đầu kỳ" (Opening Bank Balance) input fields.

◆ Get Opening Balance Suggestion (Dialog)

- **Button/Navigation:** There is a "Lấy gợi ý" button within the period creation dialog.
- **Trigger:** When the user clicks the "Lấy gợi ý" button, the system calculates suggested opening balances from previous period data.
- **Function:** The system displays a "Gợi ý từ kỳ trước" section showing "Tiền mặt" (Cash), "Ngân hàng" (Bank), "Đầu kỳ trước" (Previous Opening), and "Net GL" values. The user can apply these suggestions by clicking the "Áp dụng gợi ý" button.

◆ View Periods List

- **Button/Navigation:** There is a "Danh Sách Kỳ Kế Toán" table with columns: "Tên Kỳ" (Period name), "Loại" (Type: quarter/year/custom), "Từ - Đến" (Date range), "Trạng thái" (Status), and "Thao tác" (Actions).
- **Trigger:** When the page loads, the system retrieves and displays all accounting periods.
- **Function:** The system displays each period with its name, type, date range, and status badge: "Đang mở" (Open), "Đã chốt" (Finalized), or "Mở lại" (Reopened).

◆ Finalize Period

- **Button/Navigation:** There is a "Chốt kỳ" button in the actions column for open periods.
- **Trigger:** When the user clicks the "Chốt kỳ" button, the system processes the period finalization.
- **Function:** The system finalizes the accounting period and locks all entries, preventing further modifications to the period's GL data.

◆ Reopen Period

- **Button/Navigation:** There is a "Mở lại kỳ" button in the actions column for finalized periods.
- **Trigger:** When the user clicks the "Mở lại kỳ" button, the system reopens the finalized period.
- **Function:** The system changes the period status back to open, allowing the user to add or modify GL entries within that period.

◆ Delete Period

- **Button/Navigation:** There is a "Xóa kỳ" button in the actions column with a confirmation dialog.
- **Trigger:** When the user clicks the "Xóa kỳ" button and confirms through the dialog, the system removes the period.
- **Function:** The system permanently deletes the accounting period and all associated data after user confirmation.

◆ View Recent Activities

- **Button/Navigation:** There is a "Hoạt Động Gần Đây" section at the bottom of the Accounting Period tab.
- **Trigger:** When the page loads, the system retrieves the recent activity log.
- **Function:** The system displays a chronological list of recent accounting actions: "Tạo kỳ" (Period created), "Chốt kỳ" (Period finalized), "Mở lại kỳ" (Period reopened), "Tạo sổ kế toán" (Book created), and "Xuất sổ" (Book exported).

---

### 2.36 Accounting Books Tab

- **Function Description:** Manages accounting books with creation and export capabilities. Allows generating accounting reports for selected periods. Tab label: "Sổ Kế Toán".
- **Function Trigger:** Selected via "Sổ Kế Toán" tab in Accounting Management.

◆ Create Accounting Book

- **Button/Navigation:** There is a "Tạo sổ kế toán" action on the Accounting Books tab.
- **Trigger:** When the user clicks the "Tạo sổ kế toán" action, the system generates an accounting book.
- **Function:** The system creates an accounting book for the selected accounting period, compiling all GL entries and financial data into a structured report.

◆ Export Book

- **Button/Navigation:** There is a "Xuất sổ" button on each accounting book entry.
- **Trigger:** When the user clicks the "Xuất sổ" button, the system generates an exportable file.
- **Function:** The system exports the accounting book data to a downloadable format (e.g., Excel or PDF), allowing the user to save or print the accounting records.

---

### 2.37 No Location Action Modal

- **Function Description:** A modal that appears when a user has no associated business locations. Encourages the user to either create a new location or check pending employee invitations.
- **Function Trigger:** Triggered automatically when user navigates to dashboard pages without any location.

◆ Create Location

- **Button/Navigation:** There is a create location action button on the modal.
- **Trigger:** When the user clicks the create location button, the system opens the location creation flow.
- **Function:** The system navigates the user to the location creation workflow, where they can set up their first business location with name, address, and other details.

◆ Check Invitations

- **Button/Navigation:** There is a check invitations action button on the modal.
- **Trigger:** When the user clicks the check invitations button, the system navigates to the invitations view.
- **Function:** The system redirects the user to the employee invitations tab, where they can review and accept pending invitations from existing businesses.

---

## 3. Admin Screen Function Descriptions

---

### 3.1 Admin Overview

- **Function Description:** The admin dashboard overview showing platform-wide statistics and quick access links. Displays stat cards for "Tổng Người Dùng" (Total Users), "Người Dùng Hoạt Động" (Active Users), "Thông Báo Đã Gửi" (Notifications Sent), "Doanh Thu Platform" (Platform Revenue) with month-over-month trends ("so với tháng trước"). Includes recent activity feed and system status indicators. Title: "Tổng Quan Admin".
- **Function Trigger:** Opened when admin navigates to `/admin`.

◆ View Platform Statistics

- **Button/Navigation:** There are stat cards on the Admin Overview screen with trend indicators showing month-over-month changes ("so với tháng trước").
- **Trigger:** When the admin overview page loads, the system automatically retrieves and displays the latest platform statistics.
- **Function:** The system displays cards for "Tổng Người Dùng" (Total Users), "Người Dùng Hoạt Động" (Active Users), "Thông Báo Đã Gửi" (Notifications Sent), and "Doanh Thu Platform" (Platform Revenue), each with trending arrows indicating growth or decline.

◆ View System Status

- **Button/Navigation:** There is a "Trạng Thái Hệ Thống" section on the Admin Overview screen.
- **Trigger:** When the page loads, the system checks and displays the current system health status.
- **Function:** The system shows the overall system health with a status indicator: "Hoạt động" (Healthy) when all services are running normally, or "Cảnh báo" (Warning) when issues are detected.

◆ Quick Access Navigation

- **Button/Navigation:** There is a "Truy Cập Nhanh" section on the Admin Overview screen with links to frequently used admin modules: "Quản Lý Người Dùng", "Quản Lý Thông Báo", and "Gói Đăng Ký".
- **Trigger:** When the admin clicks a quick access link, the system navigates to the respective module.
- **Function:** The system redirects the admin to the selected management module, providing a shortcut from the overview dashboard.

◆ View Recent Activity

- **Button/Navigation:** There is a "Hoạt Động Gần Đây" feed on the Admin Overview screen.
- **Trigger:** When the page loads, the system retrieves the most recent platform events.
- **Function:** The system displays a chronological feed of recent platform actions and events, providing the admin with a quick overview of what has happened on the platform.

---

### 3.2 Admin Accounts Management

- **Function Description:** Manages all user accounts on the platform. Supports search by keyword, filtering by role and status, and displays user table with account information. Shows summary stats: accounts on page, active count, disabled count, and login activity within 7 days. Title: "Quản Lý Người Dùng". Subtitle: "Xem, tìm kiếm và quản lý tài khoản người dùng trên nền tảng."
- **Function Trigger:** Navigated from admin sidebar via "Quản Lý Người Dùng".

◆ Search Accounts

- **Button/Navigation:** There is a "Từ khóa" search input field on the Admin Accounts Management screen.
- **Trigger:** When the admin types a keyword into the search field, the system filters the user list based on the entered text.
- **Function:** The system displays only user accounts that match the search keyword, filtering by name, email, phone, or other identifiable information.

◆ Filter by Role

- **Button/Navigation:** There is a "Role" dropdown on the Admin Accounts screen (default: "Tất cả role").
- **Trigger:** When the admin selects a specific role from the dropdown, the system filters the user list.
- **Function:** The system shows only users matching the selected role, allowing the admin to quickly find users of a particular type.

◆ Filter by Status

- **Button/Navigation:** There is a "Trạng thái" dropdown on the Admin Accounts screen with options: "Tất cả", "HOẠT ĐỘNG", and "VÔ HIỆU".
- **Trigger:** When the admin selects a status filter, the system updates the user list to show only matching accounts.
- **Function:** The system filters the user table to display only active accounts ("HOẠT ĐỘNG") or disabled accounts ("VÔ HIỆU") based on the selection.

◆ View User Table

- **Button/Navigation:** There is a "Danh Sách Người Dùng" table with columns: "Người dùng" (User), "SĐT" (Phone), "Role", "Ngày tạo" (Created date), "Login cuối" (Last login), and "Trạng thái" (Status).
- **Trigger:** When the page loads, the system retrieves and displays the paginated user accounts.
- **Function:** The system displays all user accounts in a paginated table format, showing essential information for each user.

◆ Manage User Account

- **Button/Navigation:** There is an action dropdown on each user row, providing account management operations.
- **Trigger:** When the admin selects an action from the dropdown (such as toggle status or revoke sessions), the system executes the selected operation. A confirmation message reads: "Thu hồi toàn bộ phiên đăng nhập của người dùng."
- **Function:** The system executes the selected account management action and displays "Đang cập nhật dữ liệu" during processing. This includes toggling the account's active/disabled status or revoking all active login sessions for the selected user.

◆ View Account Statistics

- **Button/Navigation:** There are summary stat cards at the top of the Admin Accounts screen: "Tài khoản trang này", "Đang hoạt động", "Đã vô hiệu", and "Login trong 7 ngày".
- **Trigger:** When the page loads, the system calculates and displays the account statistics.
- **Function:** The system displays the count of accounts on the current page, the number of active accounts, disabled accounts, and the count of users who have logged in within the last 7 days.

---

### 3.3 Admin Notifications Management

- **Function Description:** Manages notification templates and campaigns. Contains two main tabs: "Template" for creating/managing notification templates, and "Campaign" for sending and tracking notification campaigns.
- **Function Trigger:** Navigated from admin sidebar via "Quản Lý Thông Báo".

◆ Switch Tabs

- **Button/Navigation:** There are tab buttons on the Admin Notifications screen: "Template" and "Campaign".
- **Trigger:** When the admin clicks a tab button, the system loads the corresponding notification management view.
- **Function:** The system switches between the template management tab (for creating and managing reusable notification templates) and the campaign management tab (for sending and tracking notification campaigns).

---

### 3.4 Notification Templates Tab

- **Function Description:** Creates and manages reusable notification templates with configurable content, notification type, action type, target screen, and active status.
- **Function Trigger:** Selected via "Template" tab in Admin Notifications.

◆ Create Template

- **Button/Navigation:** There is a template creation form on the Notification Templates tab with the following fields: "Tiêu đề template" (Title), "Nội dung template" (Content), "Loại thông báo" (Notification type), "Hành động" (Action type), "Màn hình đích" (Target screen), and "Ghi chú template" (Memo).
- **Trigger:** When the admin fills in the template details, the system validates the input fields.
- **Function:** The system creates a new notification template with the configured content, type, and action settings, making it available for use in notification campaigns.

◆ Save Template

- **Button/Navigation:** There is a "Lưu template" button at the bottom of the template creation form.
- **Trigger:** After the admin fills in valid template data and clicks the "Lưu template" button, the system saves the template.
- **Function:** The system persists the notification template to the database, making it available for selection when creating campaigns.

◆ Toggle Template Status

- **Button/Navigation:** There is a "Sử dụng động" toggle switch on each template entry.
- **Trigger:** When the admin clicks the toggle, the system switches the template's active state.
- **Function:** The system activates or deactivates the template. Active templates are available for use in campaigns, while deactivated templates are hidden from the campaign creation flow.

◆ Filter Templates

- **Button/Navigation:** There is a "Tất cả loại" notification type filter dropdown on the Templates tab.
- **Trigger:** When the admin selects a specific notification type from the filter, the system updates the template list.
- **Function:** The system filters and displays only templates matching the selected notification type.

---

### 3.5 Notification Campaigns Tab

- **Function Description:** Sends notification campaigns to users/groups with scheduling support. Tracks campaign delivery status.
- **Function Trigger:** Selected via "Campaign" tab in Admin Notifications.

◆ Create Campaign

- **Button/Navigation:** There is a "Tạo chiến dịch" button on the Notification Campaigns tab with a form containing: "Tiêu đề" (Title), "Nội dung" (Content), "Gửi đến tất cả người dùng" (Send to all) toggle, and "Lên lịch" (Schedule) date picker.
- **Trigger:** When the admin clicks the "Tạo chiến dịch" button and fills in the campaign details, the system prepares the campaign for delivery.
- **Function:** The system creates the campaign record and, if a schedule is set, queues the delivery for the specified date and time.

◆ Send Campaign

- **Button/Navigation:** There is a "Gửi Chiến Dịch" button on the campaign creation form.
- **Trigger:** After the campaign is configured and the admin clicks the "Gửi Chiến Dịch" button, the system initiates the notification delivery.
- **Function:** The system sends the notification to all targeted users (or all users if the "send to all" toggle is enabled) and begins tracking delivery status.

◆ View Campaign Status

- **Button/Navigation:** There is a campaign table on the Campaigns tab with status badges: "Đã gửi" (Sent), "Chờ gửi" (Pending), and "Thất bại" (Failed).
- **Trigger:** When the page loads, the system retrieves and displays all campaign records with their delivery status.
- **Function:** The system displays the delivery status for each campaign, allowing the admin to monitor which campaigns have been successfully sent, which are pending, and which have failed.

---

### 3.6 Admin Accounting Management

- **Function Description:** Manages the accounting engine configuration with multiple specialized tabs: Overview, Business Types & Tax Rates, Template Versions, Formulas, Field Mappings, Row Definitions, Entities & Fields, Compare (A/B), Preview, Trace Logic, Enums Reference, and Node Schemas.
- **Function Trigger:** Navigated from admin sidebar via "Quản Lý Kế Toán".

◆ Navigate Tabs

- **Button/Navigation:** There are tab buttons on the Admin Accounting Management screen: "Overview", "Business Types & Tax Rates", "Template Versions", "Formulas", "Field Mappings", "Row Definitions", "Entities & Fields", "Compare (A/B)", "Preview", "Trace Logic", "Enums Reference", and "Node Schemas".
- **Trigger:** When the admin clicks on a tab button, the system loads the corresponding accounting engine configuration area.
- **Function:** The system switches to the selected tab, loading the appropriate management interface and data for that specific aspect of the accounting engine.

---

### 3.7 Admin Accounting — Formula Tab

- **Function Description:** Creates and manages accounting formulas with a formula builder interface. Supports variable/operator insertion, formula cloning, testing, and CRUD operations.
- **Function Trigger:** Selected via "Formulas" tab in Admin Accounting.

◆ Create Formula

- **Button/Navigation:** There is a "Tạo Formula" button on the Formula tab.
- **Trigger:** When the admin clicks the "Tạo Formula" button, the system opens the formula builder interface.
- **Function:** The system displays a formula builder with variable insertion tools and operator buttons, allowing the admin to construct accounting formulas using predefined variables and mathematical operations.

◆ Clone Formula

- **Button/Navigation:** There is a "Nhân bản" button on each existing formula entry.
- **Trigger:** When the admin clicks the "Nhân bản" button, the system duplicates the selected formula.
- **Function:** The system creates an exact copy of the selected formula, which the admin can then modify independently without affecting the original.

◆ Test Formula

- **Button/Navigation:** There is a "Chạy" button on each formula entry.
- **Trigger:** When the admin clicks the "Chạy" button, the system executes the formula with test data.
- **Function:** The system runs the formula logic with sample data and displays the calculated results, allowing the admin to validate that the formula produces correct outputs before deployment.

◆ Edit / Delete Formula

- **Button/Navigation:** There are edit and delete action buttons on each formula entry.
- **Trigger:** When the admin clicks the edit or delete action, the system opens the editing interface or displays a confirmation dialog respectively.
- **Function:** The system either allows the admin to modify the formula's expression and parameters (for edit), or permanently removes the formula from the system after confirmation (for delete).

---

### 3.8 Admin Accounting — Mapping Tab

- **Function Description:** Maps data fields to accounting entities with field type selection, source type configuration, and entity field mapping.
- **Function Trigger:** Selected via "Field Mappings" tab in Admin Accounting.

◆ Create Mapping

- **Button/Navigation:** There is a create mapping action on the Mapping tab.
- **Trigger:** When the admin clicks the create mapping action, the system opens the mapping form.
- **Function:** The system displays a form with field type selector, source type configuration, and entity field mapping options, allowing the admin to establish a new mapping between data fields and accounting entities.

◆ Update / Delete Mapping

- **Button/Navigation:** There are edit and delete action buttons on each mapping entry.
- **Trigger:** When the admin clicks the edit or delete action, the system opens the editing interface or displays a confirmation dialog respectively.
- **Function:** The system either allows the admin to modify the mapping's field type, source type, and entity associations (for edit), or permanently removes the mapping from the system after confirmation (for delete).

---

### 3.9 Admin Accounting — Version Flow Tab

- **Function Description:** Manages template versions and accounting workflows. Supports version creation, cloning, activation/deactivation, and deletion.
- **Function Trigger:** Selected via "Template Versions" tab in Admin Accounting.

◆ Create Version

- **Button/Navigation:** There is a "Tạo Version" button on the Version Flow tab.
- **Trigger:** When the admin clicks the "Tạo Version" button, the system opens the version creation form.
- **Function:** The system displays a form where the admin can define a new template version with its configuration and settings.

◆ Clone Version

- **Button/Navigation:** There is a "Nhân bản" button on each existing version entry.
- **Trigger:** When the admin clicks the "Nhân bản" button, the system duplicates the selected version.
- **Function:** The system creates an exact copy of the selected version, which can be modified independently for A/B testing or iterative development.

◆ Activate / Deactivate Version

- **Button/Navigation:** There is a "Kích hoạt" / "Vô hiệu hóa" toggle on each version entry.
- **Trigger:** When the admin clicks the toggle, the system changes the version's activation state.
- **Function:** The system enables or disables the template version. Only active versions are used in production accounting calculations.

◆ Delete Version

- **Button/Navigation:** There is a delete action on each version entry with a confirmation dialog.
- **Trigger:** When the admin clicks the delete action and confirms through the dialog, the system removes the version.
- **Function:** The system permanently deletes the template version and all associated configuration data after confirmation.

---

### 3.10 Admin Accounting — Compare (A/B) Tab

- **Function Description:** Compares accounting formula versions side by side for validation and review.
- **Function Trigger:** Selected via "Compare (A/B)" tab in Admin Accounting.

◆ Select Versions to Compare

- **Button/Navigation:** There are two version selector dropdowns (A and B) on the Compare tab.
- **Trigger:** When the admin selects two different versions from the dropdowns, the system loads and compares their data.
- **Function:** The system displays a side-by-side comparison of the two selected formula versions, highlighting differences in formulas, mappings, and calculated outputs to help the admin validate changes between versions.

---

### 3.11 Admin Accounting — Preview Tab

- **Function Description:** Previews accounting template output with test data to validate calculations before deployment.
- **Function Trigger:** Selected via "Preview" tab in Admin Accounting.

◆ Preview Template Output

- **Button/Navigation:** There is a preview action button on the Preview tab.
- **Trigger:** When the admin clicks the preview button, the system renders the template with test data.
- **Function:** The system processes the active accounting template with either sample or real business data and displays the calculated output, allowing the admin to verify that all formulas, mappings, and row definitions produce correct results before deploying to production.

---

### 3.12 Admin Accounting — Trace Logic Tab

- **Function Description:** Traces and visualizes the execution path of accounting logic for debugging and validation purposes.
- **Function Trigger:** Selected via "Trace Logic" tab in Admin Accounting.

◆ Trace Execution Path

- **Button/Navigation:** There are trace execution controls on the Trace Logic tab.
- **Trigger:** When the admin initiates a trace, the system processes the accounting logic step by step.
- **Function:** The system visualizes the complete execution path of accounting calculations, showing each step in sequence — including formula evaluation, data lookups, conditional branches, and final results — enabling the admin to debug and validate the accounting logic.

---

### 3.13 Admin Subscriptions

- **Function Description:** Manages subscription plans and pricing configuration. Supports plan creation, editing, activation/deactivation, and deletion. Displays plan list ("Danh Sách Gói") with status indicators. Title: "Quản Lý Gói Đăng Ký".
- **Function Trigger:** Navigated from admin sidebar via "Gói Đăng Ký".

◆ Create New Plan

- **Button/Navigation:** There is a "Tạo Gói Mới" button on the Admin Subscriptions screen.
- **Trigger:** When the admin clicks the "Tạo Gói Mới" button, the system opens the plan creation dialog.
- **Function:** The system displays a dialog where the admin can define a new subscription plan with name, duration, description, and pricing.

◆ Edit Plan

- **Button/Navigation:** There is a "Chỉnh Sửa Gói Đăng Ký" dialog with the following fields: "Tên gói" (required, with placeholder: "VD: Gói Pro"), "Thời hạn (ngày)" (required), "Mô tả" (with placeholder: "Mô tả ngắn gọn về gói..."), and "Giá gốc (VND)" (required).
- **Trigger:** When the admin clicks the edit action on an existing plan, the system opens the edit dialog pre-populated with the plan's current data.
- **Function:** The system allows the admin to update the plan's name, duration, description, and pricing, then saves the changes upon confirmation.

◆ Configure Discount

- **Button/Navigation:** There is a "Có chiết khấu" toggle on the plan edit dialog with additional fields: "Giá chiết khấu" (Discounted Price), "Ngày bắt đầu chiết khấu" (Discount Start), and "Ngày kết thúc chiết khấu" (Discount End).
- **Trigger:** When the admin toggles the "Có chiết khấu" switch to the on position, the discount fields become enabled.
- **Function:** The system allows the admin to set a promotional pricing period with a discounted price, start date, and end date. The discount is automatically applied to subscribers during the specified period.

◆ Configure Features

- **Button/Navigation:** There is a "Tính năng bao gồm" (Features Included) section and a "Giới hạn sử dụng" (Usage Limit) field with a "Không giới hạn" (Unlimited) option.
- **Trigger:** When the admin defines the features included in the plan and sets usage limits, the system stores these configurations.
- **Function:** The system saves the plan's feature set and usage limitations, which determine what capabilities subscribers on this plan can access.

◆ Activate / Deactivate Plan

- **Button/Navigation:** There is a "Kích hoạt Gói" / "Vô hiệu hóa Gói" button on each plan entry.
- **Trigger:** When the admin clicks the activation toggle, the system changes the plan's availability status.
- **Function:** The system toggles the plan availability between "Hoạt động" (Active — visible to users for subscription) and "Không hoạt động" (Inactive — hidden from subscription options).

◆ Delete Plan

- **Button/Navigation:** There is a "Xóa Gói" button on each plan entry with a confirmation dialog.
- **Trigger:** When the admin clicks the "Xóa Gói" button and confirms through the dialog, the system removes the plan.
- **Function:** The system permanently deletes the subscription plan from the system after confirmation.

---

### 3.14 Admin Analytics

- **Function Description:** Platform analytics dashboard with growth charts, user distribution, and performance tracking. Displays stat cards with month-over-month comparisons ("vs tháng trước"). Title: "Phân Tích Platform". Subtitle: "Theo dõi hiệu suất, tăng trưởng và các chỉ số quan trọng của nền tảng."
- **Function Trigger:** Navigated from admin sidebar via "Phân Tích Platform".

◆ View Growth Statistics

- **Button/Navigation:** There are stat cards on the Admin Analytics screen: "Người Dùng Mới (Tháng này)", "Tổng Đơn Hàng (Tháng này)", "Địa Điểm KD Mới", and "Tỉ Lệ Giữ Chân", each with trending indicators showing month-over-month changes ("vs tháng trước").
- **Trigger:** When the analytics page loads, the system retrieves and calculates the latest growth data.
- **Function:** The system displays new user registrations, total orders, new business locations, and user retention rate for the current month, with trending arrows indicating positive or negative changes compared to the previous month.

◆ View Monthly Growth Chart

- **Button/Navigation:** There is a "Tăng Trưởng Theo Tháng" chart on the Admin Analytics screen.
- **Trigger:** When the page loads with sufficient analytics data, the system renders the growth chart.
- **Function:** The system displays a month-over-month growth trend chart with dual lines showing user registrations and order volumes over time.

◆ View Top Active Locations

- **Button/Navigation:** There is a "Top Địa Điểm Hoạt Động" section on the Admin Analytics screen.
- **Trigger:** When the page loads, the system identifies and ranks the most active business locations.
- **Function:** The system displays a ranked list of the top performing business locations based on order volume, revenue, or activity metrics.

◆ View User Distribution

- **Button/Navigation:** There is a "Phân Bố Người Dùng Theo Khu Vực" chart on the Admin Analytics screen.
- **Trigger:** When the page loads with geographic data, the system renders the distribution chart.
- **Function:** The system displays a geographic distribution chart showing where users are concentrated across different regions or cities.

---

### 3.15 Admin System Configuration

- **Function Description:** Configures platform-wide settings with multiple tabs. Title: "Cấu Hình Hệ Thống". Subtitle: "Quản lý cấu hình platform, loại hình kinh doanh và thuế suất."
- **Function Trigger:** Navigated from admin sidebar via "Cấu Hình Hệ Thống".

◆ Navigate Configuration Tabs

- **Button/Navigation:** There are tab buttons on the Admin System Configuration screen: "Cài Đặt Chung" (General Settings), "Loại Hình KD" (Business Types), "Thuế Suất (TT152)" (Tax Rates), and "Database".
- **Trigger:** When the admin clicks a tab button, the system loads the corresponding configuration area.
- **Function:** The system switches to the selected system configuration tab, displaying the appropriate settings and management interface.

---

### 3.16 Admin System — General Settings Tab

- **Function Description:** Configures core platform settings including platform name, support email, usage limits for free tier, feature toggles, and maintenance mode.
- **Function Trigger:** Selected via "Cài Đặt Chung" tab in System Configuration.

◆ Configure Platform Settings

- **Button/Navigation:** There are form fields on the General Settings tab: "Tên nền tảng" (Platform Name), "Email hỗ trợ" (Support Email), "Số sản phẩm tối đa (Free)" (Max Free Products), and "Số địa điểm tối đa (Free)" (Max Free Locations).
- **Trigger:** When the admin modifies any platform setting field, the system tracks the changes for saving.
- **Function:** The system updates the platform configuration values, which affect the platform name display, support contact information, and free tier usage limits.

◆ Toggle Feature Flags

- **Button/Navigation:** There are feature toggle switches on the General Settings tab: "AI Voice Order" toggle and "Chế độ bảo trì" (Maintenance Mode) toggle.
- **Trigger:** When the admin clicks a feature toggle, the system enables or disables the corresponding feature platform-wide.
- **Function:** The system activates or deactivates the selected feature across the entire platform. Enabling maintenance mode restricts user access, while the AI Voice Order toggle controls the availability of the AI-assisted order creation feature.

◆ Save Changes

- **Button/Navigation:** There is a "Lưu Thay Đổi" button at the bottom of the General Settings form.
- **Trigger:** After the admin has made changes and clicks the "Lưu Thay Đổi" button, the system persists all configuration updates.
- **Function:** The system saves all modified settings to the backend and displays a confirmation message upon successful save.

---

### 3.17 Admin System — Business Types Tab

- **Function Description:** Manages business types with associated VAT rates. CRUD operations on business type entries. Tab label: "Loại Hình KD".
- **Function Trigger:** Selected via "Loại Hình KD" tab in System Configuration.

◆ View Business Types

- **Button/Navigation:** There is a "Loại Hình Kinh Doanh" table on the Business Types tab with columns: "Tên" (Name), "Mã" (Code), "Thuế GTGT (%)" (VAT Rate), and "Trạng thái" (Status).
- **Trigger:** When the page loads, the system retrieves and displays all configured business types.
- **Function:** The system displays each business type with its name, code, associated VAT rate, and active status in a table format.

◆ Add New Business Type

- **Button/Navigation:** There is a "Thêm mới" button on the Business Types tab.
- **Trigger:** When the admin clicks the "Thêm mới" button, the system opens a form for creating a new business type.
- **Function:** The system displays an input form where the admin can enter the business type name, code, and VAT rate, then saves the new entry to the system.

◆ Edit / Delete Business Type

- **Button/Navigation:** There are edit and delete action buttons on each business type row.
- **Trigger:** When the admin clicks the edit or delete action, the system opens the editing form or displays a confirmation dialog respectively.
- **Function:** The system either allows the admin to modify the business type's name, code, and VAT rate (for edit), or permanently removes the business type from the system after confirmation (for delete).

---

### 3.18 Admin System — Tax Rates (TT152) Tab

- **Function Description:** Manages TT152 tax rate groups and revenue ranges for Vietnamese tax regulation compliance. Tab label: "Thuế Suất (TT152)".
- **Function Trigger:** Selected via "Thuế Suất (TT152)" tab in System Configuration.

◆ View Tax Rate Groups

- **Button/Navigation:** There is a "Thuế Suất (TT152)" table on the Tax Rates tab with columns: "Nhóm" (Group) and "Dải doanh thu" (Revenue Range).
- **Trigger:** When the page loads, the system retrieves and displays all TT152 tax rate configurations.
- **Function:** The system displays each tax rate group with its classification and corresponding revenue ranges according to Vietnamese TT152 tax regulation.

◆ Edit Tax Rates

- **Button/Navigation:** There are edit actions on each tax group row.
- **Trigger:** When the admin clicks the edit action on a specific tax group, the system opens the editing interface.
- **Function:** The system allows the admin to modify the tax rate values and revenue range boundaries for the selected group, then saves the changes upon confirmation.

---

### 3.19 Admin System — Database Tab

- **Function Description:** Provides database management and monitoring tools for admin users.
- **Function Trigger:** Selected via "Database" tab in System Configuration.

◆ View Database Status

- **Button/Navigation:** There is a database monitoring dashboard on the Database tab.
- **Trigger:** When the page loads, the system retrieves the current database health and performance metrics.
- **Function:** The system displays database health indicators, performance metrics, storage usage, and management options, providing the admin with a comprehensive overview of the database infrastructure.

---

## 4. Screen Count Summary

| Category               | Count  |
| ---------------------- | ------ |
| Authentication screens | 6      |
| Dashboard/Home screens | 4      |
| Order screens          | 6      |
| Debt/Customer screens  | 5      |
| Import screens         | 5      |
| Product screens        | 5      |
| Location screens       | 8      |
| Employee screens       | 4      |
| Accounting screens     | 6      |
| Shared modals          | 1      |
| Admin screens          | 19     |
| **Total**              | **72** |

### Breakdown by Type

| Screen Type              | Count  |
| ------------------------ | ------ |
| Standalone route screens | 30     |
| In-screen modes/steps    | 3      |
| Tab screens              | 16     |
| Dialog/Modal flows       | 8      |
| Actions/Status states    | 5      |
| Sub-pages                | 1      |
| Redirect pages           | 1      |
| **Total**                | **72** |
