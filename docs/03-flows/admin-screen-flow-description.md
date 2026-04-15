# BizFlow Admin - Screen Flow Description (Reviewed)

> Purpose: document the admin web screen flow based on the current implementation and the provided admin diagram.

> Writing convention: English descriptions with Vietnamese UI labels/buttons.

---

## 1. Validation Result (Diagram vs Current Admin Web)

### 1.1 Fully aligned with current admin implementation

- Sign in -> Admin dashboard entry.
- User Management -> User List.
- Package Management -> Package List + Create/Update Package.
- Notification Management -> Template, Campaign, Dispatch logs, Analytics/Performance.
- Accounting Template Management -> Overview, Template Versions, Formulas, Row Definitions, Field Mappings, Entities & Fields.

### 1.2 Requires adjustment for current web scope

- Consultant Account Management is not a standalone route.
  - Consultant operations are currently part of User Management using role filtering.
- Create Consultant Account / Update Consultant Account are not dedicated pages yet.
  - Current admin accounts screen provides list/filter and session revoke actions.
- Several nodes in the diagram are in-screen tabs/actions, not route screens.
  - Example: Create Package, Update Package, Template Detail, Create Campaign, Campaign History.

### 1.3 Additional admin screens present in code (not explicit in diagram)

- Platform Analytics screen.
- System Configuration screen.

---

## 2. Screen Summary Table

| Feature                        | Screen Name                    | Route                                | Type             | Description                                                                   |
| ------------------------------ | ------------------------------ | ------------------------------------ | ---------------- | ----------------------------------------------------------------------------- |
| Admin Auth                     | Sign In                        | /auth/login                          | Shared route     | Admin signs in via common login, then role-based redirect to Admin Dashboard. |
| Admin Home                     | Dashboard                      | /admin                               | Standalone route | Admin overview and quick navigation hub.                                      |
| User Management                | User Management                | /admin/accounts                      | Standalone route | Main admin user management screen.                                            |
| User Management                | User List                      | /admin/accounts                      | In-screen table  | User list with search/filter/pagination and actions.                          |
| User Management                | Consultant Account Management  | /admin/accounts                      | In-screen flow   | Consultant handling via role filter, not dedicated route.                     |
| Package Management             | Package Management             | /admin/subscriptions                 | Standalone route | Subscription plans and pricing management.                                    |
| Package Management             | Package List                   | /admin/subscriptions                 | In-screen table  | Plan list with filters and status indicators.                                 |
| Package Management             | Create Package                 | /admin/subscriptions                 | Dialog flow      | Create new subscription plan.                                                 |
| Package Management             | Update Package                 | /admin/subscriptions                 | Dialog flow      | Edit existing subscription plan.                                              |
| Notification Management        | Notification Management        | /admin/notifications                 | Standalone route | Notification operations workspace.                                            |
| Notification Management        | Notification Template          | /admin/notifications                 | Tab              | Template listing, detail, create, update, toggle.                             |
| Notification Management        | Template Detail                | /admin/notifications                 | In-tab editor    | Detail editor for selected template.                                          |
| Notification Management        | Create New Template            | /admin/notifications                 | In-tab action    | Create template by new event code.                                            |
| Notification Management        | Campaign                       | /admin/notifications                 | Tab              | Campaign create form and campaign history list.                               |
| Notification Management        | Create Campaign                | /admin/notifications                 | In-tab form      | Build and submit notification campaign.                                       |
| Notification Management        | Campaign History               | /admin/notifications                 | In-tab list      | Historical campaign/dispatch records.                                         |
| Notification Management        | Check Dispatches               | /admin/notifications                 | Tab              | Failed dispatch review and retry trigger.                                     |
| Notification Management        | Notification Analytics         | /admin/notifications                 | Tab              | Hangfire/performance monitoring section.                                      |
| Accounting Template Management | Accounting Template Management | /admin/accounting                    | Standalone route | Accounting template lifecycle and support tools.                              |
| Accounting Template Management | Overview                       | /admin/accounting?tab=overview       | Tab              | Snapshot of templates, business types, formulas.                              |
| Accounting Template Management | Business Types & Tax Rates     | /admin/accounting?tab=business-types | Tab              | Business type manager and tax rates editor.                                   |
| Accounting Template Management | Template Versions              | /admin/accounting?tab=version        | Tab              | Version lifecycle, clone, activate/deactivate, update wizard flows.           |
| Accounting Template Management | Formulas                       | /admin/accounting?tab=formulas       | Tab              | Formula list, create/update, clone, activation controls.                      |
| Accounting Template Management | Row Definitions                | /admin/accounting?tab=rowdefs        | Tab              | Manage accounting row definition structures.                                  |
| Accounting Template Management | Field Mappings                 | /admin/accounting?tab=mappings       | Tab              | Manage mapping between source fields and accounting fields.                   |
| Accounting Template Management | Entities & Fields              | /admin/accounting?tab=entities       | Tab              | Manage mappable entities and fields.                                          |
| Accounting Template Management | Compare (A/B)                  | /admin/accounting?tab=compare        | Support tab      | Compare versions and detect structure logic changes.                          |
| Accounting Template Management | Preview                        | /admin/accounting?tab=preview        | Support tab      | Preview generated accounting outputs.                                         |
| Accounting Template Management | Trace Logic                    | /admin/accounting?tab=trace          | Support tab      | Trace formula execution and final values.                                     |
| Accounting Template Management | Enums Reference                | /admin/accounting?tab=reference      | Support tab      | Reference values for tab operations.                                          |
| Accounting Template Management | Node Schemas                   | /admin/accounting?tab=schema         | Support tab      | Schema and node structure reference.                                          |
| Platform Analytics             | Analytics                      | /admin/analytics                     | Standalone route | Platform-level metrics and growth analysis.                                   |
| System Config                  | System                         | /admin/system                        | Standalone route | Global settings, business type presets, tax-rate and database info.           |

---

## 3. Screen Function Descriptions

## 3.1 Admin Authentication and Entry

### 3.1.1 Sign In

Function Description: Admin uses shared login screen. After successful authentication, role check routes admin users to the admin area.

Function Trigger: Opened from direct login entry or auth redirect.

Sub-functions:

- Button/Navigation: "Đăng nhập"
  - Trigger: admin submits valid credentials.
  - Function: authenticate and redirect to Admin Dashboard.

### 3.1.2 Admin Dashboard

Function Description: Overview screen showing platform statistics, recent activities, system health, and quick access links.

Function Trigger: Opened after admin login or from admin sidebar dashboard item.

Sub-functions:

- Button/Navigation: quick links
  - Trigger: admin chooses a management module.
  - Function: navigate to Accounts, Notifications, or Subscriptions.

## 3.2 User Management

### 3.2.1 User Management / User List

Function Description: Main admin user workspace for search, filtering by role/status, paging, and account-level operations.

Function Trigger: Opened from sidebar item "Quản Lý Người Dùng".

Sub-functions:

- Button/Navigation: search input
  - Trigger: admin enters keyword.
  - Function: filter user list.
- Button/Navigation: role/status filters
  - Trigger: admin selects filter values.
  - Function: fetch filtered user dataset.
- Button/Navigation: overflow action "Thu hồi phiên đăng nhập"
  - Trigger: admin needs forced sign-out.
  - Function: revoke refresh tokens for selected account.

### 3.2.2 Consultant Account Management (Current Scope)

Function Description: Consultant user handling currently runs inside User Management via role filtering.

Function Trigger: Admin filters role as Consultant.

Sub-functions:

- Button/Navigation: role filter "Consultant"
  - Trigger: admin wants consultant subset.
  - Function: display consultant accounts in list.

## 3.3 Package Management

### 3.3.1 Package Management / Package List

Function Description: Subscription plan management workspace including plan list, status, and lifecycle actions.

Function Trigger: Opened from sidebar item "Gói Đăng Ký".

Sub-functions:

- Button/Navigation: search and status filters
  - Trigger: admin narrows plan list.
  - Function: filter plan table.
- Button/Navigation: action menu on each plan
  - Trigger: admin chooses edit, status toggle, or delete.
  - Function: execute selected lifecycle operation.

### 3.3.2 Create Package

Function Description: Dialog flow to define new subscription plan metadata, pricing, and feature limits.

Function Trigger: Admin clicks "Tạo Gói Mới".

Sub-functions:

- Button/Navigation: dialog submit "Tạo Gói"
  - Trigger: required fields are valid.
  - Function: create plan in inactive state.

### 3.3.3 Update Package

Function Description: Dialog flow to update existing plan details.

Function Trigger: Admin selects "Chỉnh sửa" from plan actions.

Sub-functions:

- Button/Navigation: dialog submit "Cập Nhật"
  - Trigger: edit form is valid.
  - Function: persist plan changes.

## 3.4 Notification Management

### 3.4.1 Notification Management (Parent)

Function Description: Central workspace for template operations, campaign execution, delivery diagnostics, and job-performance review.

Function Trigger: Opened from sidebar item "Quản Lý Thông Báo".

Sub-functions:

- Button/Navigation: tabs "Mẫu Thông Báo", "Chiến Dịch", "Nhật Ký Gửi", "Hiệu Suất"
  - Trigger: admin switches operational context.
  - Function: display corresponding tab content.

### 3.4.2 Notification Template and Template Detail

Function Description: Template tab supports listing, selecting, editing, toggling, and creating templates.

Function Trigger: Admin opens "Mẫu Thông Báo" tab.

Sub-functions:

- Button/Navigation: "Tạo Mới"
  - Trigger: new event code entered.
  - Function: create new notification template.
- Button/Navigation: template list item
  - Trigger: admin selects template.
  - Function: load Template Detail editor.
- Button/Navigation: "Lưu Template"
  - Trigger: editor changes are ready.
  - Function: update template.
- Button/Navigation: "Bật/Tắt Template"
  - Trigger: admin changes activation state.
  - Function: toggle template status.

### 3.4.3 Campaign and Create Campaign

Function Description: Campaign tab provides campaign creation form and campaign history list.

Function Trigger: Admin opens "Chiến Dịch" tab.

Sub-functions:

- Button/Navigation: campaign form submit "Tạo Chiến Dịch"
  - Trigger: campaign payload is valid.
  - Function: create dispatch campaign.
- Button/Navigation: refresh campaign history
  - Trigger: admin requests latest dispatch results.
  - Function: reload campaign dispatch list.

### 3.4.4 Check Dispatches (Delivery Logs)

Function Description: Delivery logs tab focuses on failed dispatches and recovery actions.

Function Trigger: Admin opens "Nhật Ký Gửi" tab.

Sub-functions:

- Button/Navigation: "Process Due Dispatches"
  - Trigger: admin wants retry processing.
  - Function: trigger due-dispatch processing and refresh failed list.

### 3.4.5 Notification Analytics (Performance)

Function Description: Performance tab displays Hangfire/background job operational metrics.

Function Trigger: Admin opens "Hiệu Suất" tab.

Sub-functions:

- Button/Navigation: performance panel controls
  - Trigger: admin reviews worker/job conditions.
  - Function: inspect processing performance state.

## 3.5 Accounting Template Management

### 3.5.1 Accounting Template Management (Parent)

Function Description: Advanced admin accounting workspace covering template lifecycle and calculation tooling.

Function Trigger: Opened from sidebar item "Quản Lý Kế Toán".

Sub-functions:

- Button/Navigation: Core Management tabs
  - Trigger: admin selects core editing stage.
  - Function: open Overview, Business Types, Template Versions, Formulas, Mappings, Row Definitions, or Entities.
- Button/Navigation: Support Tools tabs
  - Trigger: admin selects analysis/validation mode.
  - Function: open Compare, Preview, Trace Logic, Enums Reference, or Node Schemas.

### 3.5.2 Overview

Function Description: Snapshot tab showing templates, business types, and formulas with quick entry buttons.

Function Trigger: Default accounting tab.

Sub-functions:

- Button/Navigation: quick action links from summary tables
  - Trigger: admin wants deep edit.
  - Function: navigate to specific accounting tabs.

### 3.5.3 Business Types & Tax Rates

Function Description: Manage business type metadata and tax-rate rulesets.

Function Trigger: Admin selects "Business Types & Tax Rates" tab.

Sub-functions:

- Button/Navigation: metadata save
  - Trigger: business type metadata edited.
  - Function: update metadata.
- Button/Navigation: add/remove/replace rates
  - Trigger: tax-rates need revision.
  - Function: replace selected business-type tax rates.

### 3.5.4 Template Versions

Function Description: Version lifecycle control for accounting templates.

Function Trigger: Admin selects "Template Versions" tab.

Sub-functions:

- Button/Navigation: create template/version
  - Trigger: admin initializes new lifecycle node.
  - Function: create template or new template version.
- Button/Navigation: clone/activate/deactivate/update/delete
  - Trigger: lifecycle management action selected.
  - Function: execute version state transition.

### 3.5.5 Formulas

Function Description: Formula management for accounting calculations.

Function Trigger: Admin selects "Formulas" tab.

Sub-functions:

- Button/Navigation: create/update formula
  - Trigger: formula editor is ready.
  - Function: save formula payload.
- Button/Navigation: clone formula
  - Trigger: admin wants draft variant.
  - Function: clone selected formula.
- Button/Navigation: activate/deactivate
  - Trigger: formula status change required.
  - Function: toggle formula activity.

### 3.5.6 Field Mappings

Function Description: Mapping editor between accounting fields and source entities/fields.

Function Trigger: Admin selects "Field Mappings" tab.

Sub-functions:

- Button/Navigation: create/update mapping
  - Trigger: mapping form is valid.
  - Function: save mapping.
- Button/Navigation: delete mapping
  - Trigger: mapping action menu delete selected.
  - Function: remove mapping.

### 3.5.7 Row Definitions

Function Description: Defines structural rows used in accounting templates.

Function Trigger: Admin selects "Row Definitions" tab.

Sub-functions:

- Button/Navigation: create/update/delete row definition
  - Trigger: row form action selected.
  - Function: persist row structure changes.

### 3.5.8 Entities & Fields

Function Description: Manage mappable entities and fields for accounting extraction.

Function Trigger: Admin selects "Entities & Fields" tab.

Sub-functions:

- Button/Navigation: select entity and edit details
  - Trigger: admin chooses entity from list.
  - Function: load/edit entity and field metadata.

### 3.5.9 Support Tools (Compare, Preview, Trace, Reference, Schema)

Function Description: Validation and debugging tools for accounting template correctness.

Function Trigger: Admin selects support tab.

Sub-functions:

- Button/Navigation: Compare (A/B)
  - Trigger: admin selects two versions.
  - Function: show difference report.
- Button/Navigation: Preview
  - Trigger: admin runs template preview.
  - Function: show generated accounting output.
- Button/Navigation: Trace Logic
  - Trigger: admin traces calculation path.
  - Function: show trace items and final value path.
- Button/Navigation: Enums Reference / Node Schemas
  - Trigger: admin needs reference details.
  - Function: show supported enum and schema information.

## 3.6 Platform Analytics

### 3.6.1 Analytics

Function Description: Platform KPI and growth dashboard with monthly trends, top locations, and region distribution.

Function Trigger: Opened from sidebar item "Phân Tích Platform".

Sub-functions:

- Button/Navigation: metrics and chart panels
  - Trigger: admin reviews health and growth.
  - Function: inspect trend and performance metrics.

## 3.7 System Configuration

### 3.7.1 System Configuration (Parent)

Function Description: System-level configuration workspace for global settings and business presets.

Function Trigger: Opened from sidebar item "Cấu Hình Hệ Thống".

Sub-functions:

- Button/Navigation: tabs "Cài Đặt Chung", "Loại Hình KD", "Thuế Suất (TT152)", "Database"
  - Trigger: admin selects settings category.
  - Function: load target settings panel.

### 3.7.2 Cài Đặt Chung

Function Description: Global switch/input settings management.

Function Trigger: System tab "Cài Đặt Chung".

Sub-functions:

- Button/Navigation: toggle/input controls + "Lưu Thay Đổi"
  - Trigger: setting values changed.
  - Function: persist system setting values.

### 3.7.3 Loại Hình KD and Thuế Suất

Function Description: Preset business-type and tax table management.

Function Trigger: System tabs "Loại Hình KD" and "Thuế Suất (TT152)".

Sub-functions:

- Button/Navigation: add/edit business type actions
  - Trigger: admin updates preset rows.
  - Function: maintain business-type dataset.
- Button/Navigation: tax table inspection
  - Trigger: admin reviews tax guidelines.
  - Function: inspect tax-rate reference rows.

### 3.7.4 Database Info

Function Description: Read-only operational database information panel.

Function Trigger: System tab "Database".

Sub-functions:

- Button/Navigation: database info panel
  - Trigger: admin reviews infrastructure state.
  - Function: display engine/host/storage/backup metadata.

---

## 4. Recommended Documentation Rule

For each admin screen or in-screen flow:

1. Function Description
2. Function Trigger
3. Sub-functions with Button/Navigation, Trigger, Function

This keeps admin documentation consistent with your existing web flow documentation style.
