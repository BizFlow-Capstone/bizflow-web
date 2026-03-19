import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/products/[productId]
 * Proxy to backend: GET /api/my-business/product/{productId}
 * Get product detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/product/${productId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product detail",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/products/[productId]
 * Proxy to backend: PUT /api/my-business/product/{productId}
 * Convert JSON body to FormData for backend [FromForm] DTO.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const authHeader = request.headers.get("authorization");
    const contentType = request.headers.get("content-type") || "";

    // If FE sends multipart/form-data (including image binary), forward as-is.
    if (contentType.includes("multipart/form-data")) {
      const incomingFormData = await request.formData();

      const response = await fetch(
        `${BACKEND_API_URL}/api/my-business/product/${productId}`,
        {
          method: "PUT",
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

    formData.append("LocationId", String(body.locationId));
    formData.append("BusinessTypeId", String(body.businessTypeId));
    formData.append("ProductName", String(body.name));
    formData.append("Unit", String(body.unit));

    if (body.sku) formData.append("Sku", String(body.sku));
    formData.append("TrackInventory", String(body.trackInventory ?? true));
    formData.append("SellingPrice", String(body.sellingPrice ?? 0));
    formData.append("CostPrice", String(body.costPrice ?? 0));
    formData.append("Stock", String(body.stock ?? 0));
    if (body.manufacturer)
      formData.append("Manufacturer", String(body.manufacturer));
    formData.append("RemoveImage", String(Boolean(body.removeImage)));

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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/product/${productId}`,
      {
        method: "PUT",
        headers: {
          ...(authHeader && { Authorization: authHeader }),
        },
        body: formData,
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/products/[productId]
 * Proxy to backend: DELETE /api/my-business/product/{productId}
 * Delete product (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/product/${productId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 },
    );
  }
}
