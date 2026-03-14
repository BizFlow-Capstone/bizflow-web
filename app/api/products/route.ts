import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/products
 * Proxy to backend: GET /api/my-business/products
 * Search/filter products with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");

    // Forward all query params to backend
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
      {
        success: false,
        message: "Failed to fetch products",
        data: {
          items: [],
          pageNumber: 1,
          pageSize: 10,
          totalPages: 0,
          totalCount: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/products
 * Proxy to backend: POST /api/my-business/product
 * BE uses [FromForm] multipart/form-data — convert JSON body to FormData here.
 * Field name mapping: camelCase (FE) → PascalCase (BE DTO)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const contentType = request.headers.get("content-type") || "";

    // If FE sends multipart/form-data (including image binary), forward as-is.
    if (contentType.includes("multipart/form-data")) {
      const incomingFormData = await request.formData();

      const response = await fetch(
        `${BACKEND_API_URL}/api/my-business/product`,
        {
          method: "POST",
          headers: {
            ...(authHeader && { Authorization: authHeader }),
          },
          body: incomingFormData,
        },
      );

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const body = await request.json();

    const formData = new FormData();

    // Required fields
    formData.append("LocationId", String(body.locationId));
    formData.append("BusinessTypeId", String(body.businessTypeId));
    formData.append("ProductName", String(body.name));
    formData.append("Unit", String(body.unit));

    // Optional fields
    if (body.sku) formData.append("Sku", String(body.sku));
    formData.append("TrackInventory", String(body.trackInventory ?? true));
    formData.append("SellingPrice", String(body.sellingPrice ?? 0));
    formData.append("CostPrice", String(body.costPrice ?? 0));
    formData.append("Stock", String(body.stock ?? 0));
    if (body.manufacturer)
      formData.append("Manufacturer", String(body.manufacturer));

    // Price tiers — ASP.NET Core [FromForm] indexed notation
    if (Array.isArray(body.priceTiers)) {
      body.priceTiers.forEach(
        (
          tier: { unit: string; quantity: number; price: number },
          index: number,
        ) => {
          formData.append(`PriceTiers[${index}].Unit`, String(tier.unit));
          formData.append(
            `PriceTiers[${index}].Quantity`,
            String(tier.quantity),
          );
          formData.append(`PriceTiers[${index}].Price`, String(tier.price));
        },
      );
    }

    const response = await fetch(`${BACKEND_API_URL}/api/my-business/product`, {
      method: "POST",
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
      // Do NOT set Content-Type — let fetch set it with the correct boundary
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      { status: 500 },
    );
  }
}
