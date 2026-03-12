# BizFlow - Frontend Next.js Rules

## Project Context

BizFlow - Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh Việt Nam.

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **State Management**: TanStack Query v5 (server state), React useState (UI state)
- **UI Library**: shadcn/ui (New York style) + Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Motion (framer-motion)
- **Path Alias**: `@/*` → project root

---

## Architecture

### Data Flow

```
UI Component → TanStack Query Hook → Service → API Route → Backend
```

- **UI Component**: Hiển thị, UI state (tabs, modals, search text)
- **Hook** (`useXxx`): TanStack Query caching, invalidation, optimistic updates
- **Service** (`xxxService.ts`): Pure fetch logic, KHÔNG có React hooks
- **API Route** (`app/api/`): Next.js proxy tới backend, forward headers

### Folder Structure

```
bizflow_web/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers)
│   ├── page.tsx                  # Landing page
│   ├── loading.tsx               # Root loading
│   ├── not-found.tsx             # 404 page
│   ├── globals.css               # Global styles
│   ├── api/                      # API Routes (proxy to backend)
│   │   ├── products/route.ts
│   │   ├── locations/route.ts
│   │   ├── imports/route.ts
│   │   └── employees/route.ts
│   ├── auth/                     # Auth pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/                # Protected dashboard
│   │   ├── layout.tsx            # Dashboard layout (sidebar)
│   │   ├── page.tsx              # Dashboard home
│   │   ├── locations/
│   │   │   ├── page.tsx          # Server Component (metadata only)
│   │   │   ├── LocationsClient.tsx  # Client Component (data + UI)
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── LocationDetailClient.tsx
│   │   └── imports/
│   │       ├── page.tsx
│   │       ├── ImportsClient.tsx
│   │       ├── create/
│   │       └── [importId]/
│   └── scan/                     # Barcode scanner
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui components
│   ├── landing/                  # Landing page sections
│   ├── DashboardSidebar.tsx      # Layout components
│   └── CustomLoading.tsx
├── hooks/                        # TanStack Query hooks
│   ├── useProducts.ts
│   ├── useLocations.ts
│   ├── useImports.ts
│   └── useEmployees.ts
├── services/                     # API calling functions
│   ├── productService.ts
│   ├── locationService.ts
│   ├── importService.ts
│   └── employeeService.ts
└── lib/
    ├── utils.ts                  # cn() utility
    ├── types/                    # TypeScript interfaces
    │   ├── product.ts
    │   ├── location.ts
    │   ├── import.ts
    │   └── employee.ts
    ├── hooks/                    # Complex/specialized hooks
    ├── providers/                # React context providers
    │   └── QueryProvider.tsx
    └── services/                 # (reserved)
```

---

## File Naming Patterns

| Type             | Pattern                   | Location             | Example                            |
| ---------------- | ------------------------- | -------------------- | ---------------------------------- |
| Page (Server)    | `page.tsx`                | `app/{route}/`       | `app/dashboard/locations/page.tsx` |
| Client Page      | `{Feature}Client.tsx`     | `app/{route}/`       | `LocationsClient.tsx`              |
| Loading          | `loading.tsx`             | `app/{route}/`       | `app/dashboard/loading.tsx`        |
| API Route        | `route.ts`                | `app/api/{feature}/` | `app/api/products/route.ts`        |
| Layout           | `layout.tsx`              | `app/{route}/`       | `app/dashboard/layout.tsx`         |
| Hook             | `use{Feature}s.ts`        | `hooks/`             | `useProducts.ts`                   |
| Service          | `{feature}Service.ts`     | `services/`          | `productService.ts`                |
| Type             | `{feature}.ts`            | `lib/types/`         | `product.ts`                       |
| UI Component     | `{name}.tsx` (kebab-case) | `components/ui/`     | `alert-dialog.tsx`                 |
| Shared Component | `{Name}.tsx` (PascalCase) | `components/`        | `DashboardSidebar.tsx`             |
| Provider         | `{Name}Provider.tsx`      | `lib/providers/`     | `QueryProvider.tsx`                |

---

## Page Pattern (Server Component → Client Component)

### Server Component (page.tsx) - metadata only

```tsx
import { Metadata } from "next";
import LocationsClient from "./LocationsClient";

export const metadata: Metadata = {
  title: "Quản lý Địa Điểm Kinh Doanh | BizFlow",
  description: "Quản lý trạng thái và thông tin các điểm kinh doanh.",
};

/**
 * Server Component - Layout shell only
 *
 * ⚠️ For CRUD dashboards, do NOT use:
 * - ISR (revalidate)
 * - Server Component data fetching with cache
 *
 * Use TanStack Query in Client Components instead.
 */
export default function LocationsPage() {
  return <LocationsClient />;
}
```

### Client Component - handles data + UI

```tsx
"use client";

import { useState, useMemo } from "react";
import { useLocations, useCreateLocation } from "@/hooks/useLocations";
import type { Location } from "@/lib/types/location";

export default function LocationsClient() {
  // UI State (client-only)
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Server State (TanStack Query)
  const { data: locations, isLoading, error } = useLocations();
  const createMutation = useCreateLocation();

  // Derived data
  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    if (activeTab === "ALL") return locations;
    return locations.filter(loc =>
      activeTab === "ACTIVE" ? loc.isActive : !loc.isActive
    );
  }, [locations, activeTab]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  return (/* JSX */);
}
```

Page Rules:

- `page.tsx` là Server Component: chỉ chứa metadata + render Client Component
- `{Feature}Client.tsx` là Client Component: chứa hooks, state, data fetching
- KHÔNG fetch data trong Server Component cho CRUD pages
- KHÔNG dùng ISR/revalidate cho dashboard data
- Luôn handle 3 states: loading, error, success

---

## Service Pattern

```typescript
import type {
  ApiResponse,
  ProductPagination,
  ProductFilters,
} from "@/lib/types/product";

/**
 * Product Service
 * Pure API calling logic - no React hooks here
 *
 * Flow: Service → API Route → Backend
 */

export async function getProducts(
  filters: ProductFilters,
): Promise<ApiResponse<ProductPagination>> {
  const params = new URLSearchParams();

  // Required params
  params.append("LocationId", String(filters.locationId));

  // Optional params - only append if defined
  if (filters.name) params.append("Name", filters.name);
  if (filters.pageNumber)
    params.append("PageNumber", String(filters.pageNumber));
  if (filters.pageSize) params.append("PageSize", String(filters.pageSize));

  const response = await fetch(`/api/products?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
}
```

Service Rules:

- Pure functions, KHÔNG có React hooks hay state
- Gọi tới `/api/{feature}` (Next.js API Route), KHÔNG gọi trực tiếp backend
- Always `cache: "no-store"` cho dashboard data
- Throw Error khi `!response.ok`
- Return typed `ApiResponse<T>`
- Dùng `URLSearchParams` cho query filters

---

## Hook Pattern (TanStack Query)

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getProducts, createProduct } from "@/services/productService";
import type { ProductFilters, CreateProductRequest } from "@/lib/types/product";

/**
 * Query key factory - dùng để quản lý cache
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

/**
 * Hook to fetch products with pagination
 */
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const response = await getProducts(filters);
      return response.data;
    },
    placeholderData: keepPreviousData,
    enabled: !!filters.locationId,
  });
}

/**
 * Hook to create a product
 * Invalidates list cache on success
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

Hook Rules:

- Mỗi feature 1 file hook: `use{Feature}s.ts`
- Luôn định nghĩa `{feature}Keys` factory cho cache management
- `useQuery` cho GET, `useMutation` cho POST/PUT/DELETE
- `enabled` option để conditionally fetch (e.g., khi có locationId)
- `keepPreviousData` cho pagination transitions
- `onSuccess` → `invalidateQueries` để refetch related data
- Optimistic updates cho toggle/status operations
- Return `response.data` trong `queryFn` (unwrap ApiResponse)

---

## API Route Pattern (Proxy to Backend)

```typescript
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/products
 * Proxy to backend: GET /api/my-business/products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");

    const backendUrl = new URL(`${BACKEND_API_URL}/api/my-business/products`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
```

API Route Rules:

- Đặt trong `app/api/{feature}/route.ts`
- Luôn dùng `BACKEND_API_URL` từ env
- Forward `authorization` header nếu có
- Try-catch và trả về structured error response
- Forward backend status code: `{ status: response.status }`
- Dynamic routes: `app/api/{feature}/[id]/route.ts`

---

## Type Definition Pattern

```typescript
// lib/types/product.ts

// --- API Response wrapper (shared across features) ---
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  timestamp: string;
}

// --- Entity ---
export interface Product {
  productId: number;
  name: string;
  price: number;
  trackInventory: boolean;
  stock: number;
  status: string;
}

// --- Pagination ---
export interface ProductPagination {
  items: Product[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// --- Filters / Query Params ---
export interface ProductFilters {
  locationId: number;
  name?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

// --- Request DTOs ---
export interface CreateProductRequest {
  locationId: number;
  name: string;
  sku: string;
  costPrice: number;
  priceTiers: PriceTier[];
}

export interface UpdateProductStatusRequest {
  status: "active" | "inactive";
}
```

Type Rules:

- Mỗi feature 1 file: `lib/types/{feature}.ts`
- Prefix interfaces: Entity, Pagination, Filters, Request
- `ApiResponse<T>` wrapper dùng chung (mỗi file define lại do independent)
- Pagination interface theo chuẩn: `items`, `pageNumber`, `pageSize`, `totalPages`, `totalCount`, `hasPreviousPage`, `hasNextPage`
- Dùng `interface` thay vì `type` cho objects
- Export tất cả types bằng named exports

---

## Component Pattern

### shadcn/ui Components

```tsx
// Import từ @/components/ui/
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

### Icon Usage

```tsx
// Import từ lucide-react
import { Plus, Search, Loader2, MapPin, Settings } from "lucide-react";

// Sử dụng
<Plus className="h-4 w-4" />
<Loader2 className="h-4 w-4 animate-spin" />
```

### Inline Sub-components

```tsx
// Dùng cho small presentational components trong cùng file
const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"
    }`}
  >
    {isActive ? "Đang hoạt động" : "Đã đóng"}
  </span>
);
```

Component Rules:

- Dùng `"use client"` directive cho components có hooks/interactivity
- Styling: Tailwind CSS classes, dùng `cn()` cho conditional classes
- Icons: Lucide React, size `h-4 w-4` hoặc `h-5 w-5`
- UI primitives: shadcn/ui từ `@/components/ui/`
- Vietnamese text cho user-facing labels
- `useMemo` cho derived/filtered data
- Tách small presentational components thành inline const trong cùng file

---

## Provider Pattern

```tsx
// lib/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

- Providers wrap `{children}` trong root `layout.tsx`
- QueryClient tạo trong `useState` để tránh shared state giữa requests
- DevTools chỉ hiển thị trong development

---

## Dashboard Layout Pattern

```tsx
// app/dashboard/layout.tsx
import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- Sidebar fixed bên trái, content flex-1
- Loading states per-route via `loading.tsx`

---

## Anti-patterns to AVOID

```tsx
// ❌ Fetch data trong Server Component cho CRUD pages
export default async function LocationsPage() {
  const locations = await fetch("...");  // STALE DATA!
  return <LocationsList data={locations} />;
}

// ❌ Gọi trực tiếp backend từ service
const response = await fetch("http://localhost:5139/api/products");

// ❌ React hooks trong service files
export function getProducts() {
  const [data, setData] = useState([]); // WRONG
}

// ❌ Business logic trong component
export default function ProductsClient() {
  const handleCreate = async () => {
    const response = await fetch("/api/products", { method: "POST", ... });
    // Service nên handle API call
  };
}

// ❌ Hardcoded API URLs
const response = await fetch("http://localhost:5139/api/products");

// ❌ Quên handle loading/error states
export default function LocationsClient() {
  const { data } = useLocations();
  return <div>{data.map(...)}</div>; // Crash khi loading!
}

// ❌ Dùng useEffect cho data fetching thay vì TanStack Query
useEffect(() => {
  fetch("/api/products").then(res => res.json()).then(setData);
}, []);

// ❌ Quên "use client" directive
import { useState } from "react"; // Error: hooks in Server Component
```

---

## Checklist cho Feature mới

Khi tạo feature mới (e.g., Orders), cần tạo:

1. **Types**: `lib/types/order.ts` → interfaces cho Entity, Pagination, Filters, Request
2. **Service**: `services/orderService.ts` → pure fetch functions
3. **Hook**: `hooks/useOrders.ts` → TanStack Query hooks + query keys factory
4. **API Route**: `app/api/orders/route.ts` → proxy to backend
5. **Page**: `app/dashboard/orders/page.tsx` → Server Component (metadata)
6. **Client**: `app/dashboard/orders/OrdersClient.tsx` → Client Component (UI + data)
7. **Loading**: `app/dashboard/orders/loading.tsx` → loading state
