import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/imports
 * Proxy to backend: GET /api/my-business/accounting/imports
 * List imports with filters and pagination
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

    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/accounting/imports`,
    );
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        ...createLocaleForwardHeaders(request),
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching imports:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch imports",
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
 * POST /api/imports
 * Proxy to backend: POST /api/my-business/accounting/import
 * Create a new import
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
    const formData = new FormData();

    if (contentType.includes("multipart/form-data")) {
      const incomingFormData = await request.formData();
      // Map incoming fields to PascalCase for backend
      const mapping: Record<string, string> = {
        importType: "ImportType",
        hasInvoice: "HasInvoice",
        businessLocationId: "BusinessLocationId",
        supplier: "Supplier",
        note: "Note",
        receivedAt: "ReceivedAt",
        saveAsDraft: "SaveAsDraft",
        items: "Items",
        // 'image' stays 'image' based on Swagger
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
      // Map JSON fields to PascalCase FormData
      formData.append("ImportType", String(body.importType));
      if (body.hasInvoice !== undefined)
        formData.append("HasInvoice", String(body.hasInvoice));
      formData.append("BusinessLocationId", String(body.businessLocationId));
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
      `${BACKEND_API_URL}/api/my-business/accounting/import`,
      {
        method: "POST",
        headers: {
          ...createLocaleForwardHeaders(request),
          accept: "*/*",
          Authorization: authHeader,
          // Let fetch set the correct boundary for multipart/form-data
        },
        body: formData,
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create import",
      },
      { status: 500 },
    );
  }
}
