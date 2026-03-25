import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/products
 * Proxy to backend: GET /api/my-business/products
 * Search/filter products with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = getBearerAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "AUTH_UNAUTHORIZED",
          message: "Missing Authorization Bearer token",
        },
        { status: 401 },
      );
    }

    // Forward all query params to backend
    const backendUrl = new URL(`${BACKEND_API_URL}/api/my-business/products`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
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
    const authHeader = getBearerAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "AUTH_UNAUTHORIZED",
          message: "Missing Authorization Bearer token",
        },
        { status: 401 },
      );
    }
    const contentType = request.headers.get("content-type") || "";

    // If FE sends multipart/form-data (including image binary), forward as-is.
    if (contentType.includes("multipart/form-data")) {
      const incomingFormData = await request.formData();

      const response = await fetch(
        `${BACKEND_API_URL}/api/my-business/product`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
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

    // Price tiers are sent as one JSON string field in multipart form-data.
    if (Array.isArray(body.priceTiers)) {
      const normalizedTiers = body.priceTiers
        .map((tier: { unit: string; quantity: number; price: number }) => ({
          unit: String(tier.unit ?? "").trim(),
          quantity: Number(tier.quantity) || 1,
          price: Number(tier.price) || 0,
        }))
        .filter((tier: { unit: string }) => tier.unit.length > 0);

      formData.append("PriceTiers", JSON.stringify(normalizedTiers));
    }

    const response = await fetch(`${BACKEND_API_URL}/api/my-business/product`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
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
