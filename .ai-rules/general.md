# BizFlow - General Coding Rules

## 🎯 Project Context

BizFlow is a platform supporting digital transformation for household businesses in Vietnam.
The target users have low digital literacy and primarily use smartphones.

## 👥 User Roles

| Role | Permissions |
| ---- | ----------- |

| **User** | CRUD orders, products, inventory, debts, view reports |
| **Admin** | Manage accounts, pricing, system config, platform analytics |
| **Consultant** | Manage financial report templates, notifications |

## Naming Conventions

### General

- **PascalCase**: Classes, Methods, Properties, Enums
- **camelCase**: Local variables, parameters, private fields
- **SCREAMING_SNAKE_CASE**: Constants
- **PascalCase**: Database tables, columns

### File Names (Backend - C#)

| Type | Format | Example |
|------|--------|---------||

| Entity | `{Name}.cs` | `Order.cs` |
| DTO | `{Name}Dto.cs` | `OrderDto.cs` |
| Request | `{Action}{Entity}Request.cs` | `CreateOrderRequest.cs` |
| Response | `{Entity}Response.cs` | `OrderResponse.cs` |
| Service | `{Feature}Service.cs` | `OrderService.cs` |
| Interface | `I{Name}.cs` | `IOrderService.cs` |
| Controller | `{Feature}Controller.cs` | `OrderController.cs` |
| Repository | `{Entity}Repository.cs` | `OrderRepository.cs` |

### File Names (Frontend - Next.js/TypeScript)

| Type | Format | Example |
|------|--------|---------||

| Page (Server) | `page.tsx` | `app/dashboard/locations/page.tsx` |
| Client Component | `{Feature}Client.tsx` | `LocationsClient.tsx` |
| Hook | `use{Feature}s.ts` | `useProducts.ts` |
| Service | `{feature}Service.ts` | `productService.ts` |
| Type file | `{feature}.ts` | `lib/types/product.ts` |
| API Route | `route.ts` | `app/api/products/route.ts` |
| UI Component | `{name}.tsx` (kebab-case) | `alert-dialog.tsx` |
| Shared Component | `{Name}.tsx` (PascalCase) | `DashboardSidebar.tsx` |
| Provider | `{Name}Provider.tsx` | `QueryProvider.tsx` |

## Security Principles

- All API endpoints must have authentication (except for /auth/\*)
- Validate BusinessId ownership in the service layer
- Soft delete instead of hard delete
- Do not log sensitive data (passwords, tokens, PII)

## Business Terms

- **Hộ kinh doanh**: Household business (revenue < 1B VND/year)
- **Ghi nợ**: Customer debt/credit
- **Thông tư 152**: Circular 152/2025/TT-BTC - simplified accounting
- **Draft Order**: AI-generated order pending user confirmation
