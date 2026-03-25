import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/imports/[importId]
 * Proxy to backend: GET /api/my-business/accounting/import/{importId}
 * Get import detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ importId: string }> },
) {
  try {
    const { importId } = await params;
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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: authHeader,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching import detail:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch import detail",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/imports/[importId]
 * Proxy to backend: PUT /api/my-business/accounting/import/{importId}
 * Update a DRAFT import
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ importId: string }> },
) {
  try {
    const { importId } = await params;
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
    const formData = new FormData();

    if (contentType.includes("multipart/form-data")) {
      const incomingFormData = await request.formData();
      const mapping: Record<string, string> = {
        importType: "ImportType",
        hasInvoice: "HasInvoice",
        supplier: "Supplier",
        note: "Note",
        receivedAt: "ReceivedAt",
        saveAsDraft: "SaveAsDraft",
        items: "Items",
      };

      for (const [key, value] of incomingFormData.entries()) {
        const targetKey = mapping[key] || key;
        if (key === "items" && typeof value === "string") {
          formData.append("Items", value);
        } else {
          formData.append(targetKey, value);
        }
      }
    } else {
      const body = await request.json();
      if (body.importType) formData.append("ImportType", String(body.importType));
      if (body.hasInvoice !== undefined)
        formData.append("HasInvoice", String(body.hasInvoice));
      if (body.supplier) formData.append("Supplier", String(body.supplier));
      if (body.note) formData.append("Note", String(body.note));
      if (body.receivedAt) formData.append("ReceivedAt", String(body.receivedAt));
      if (body.saveAsDraft !== undefined)
        formData.append("SaveAsDraft", String(body.saveAsDraft));

      if (Array.isArray(body.items)) {
        formData.append("Items", JSON.stringify(body.items));
      }
    }

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "PUT",
        headers: {
          accept: "*/*",
          Authorization: authHeader,
        },
        body: formData,
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update import",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/imports/[importId]
 * Proxy to backend: PATCH /api/my-business/accounting/import/{importId}
 * Confirm a DRAFT import
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ importId: string }> },
) {
  try {
    const { importId } = await params;
    const body = await request.json();
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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error confirming import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to confirm import",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/imports/[importId]
 * Proxy to backend: DELETE /api/my-business/accounting/import/{importId}
 * Delete/cancel an import
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ importId: string }> },
) {
  try {
    const { importId } = await params;
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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: authHeader,
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete import",
      },
      { status: 500 },
    );
  }
}
