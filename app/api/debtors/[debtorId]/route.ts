import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/debtors/[debtorId]
 * Proxy to backend: GET /api/my-business/debtors/{debtorId}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ debtorId: string }> },
) {
  try {
    const { debtorId } = await params;
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
      `${BACKEND_API_URL}/api/my-business/debtors/${debtorId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching debtor detail:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch debtor detail",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/debtors/[debtorId]
 * Proxy to backend: PUT /api/my-business/debtors/{debtorId}
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ debtorId: string }> },
) {
  try {
    const { debtorId } = await params;
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
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/debtors/${debtorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating debtor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update debtor",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/debtors/[debtorId]
 * Proxy to backend: DELETE /api/my-business/debtors/{debtorId}
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ debtorId: string }> },
) {
  try {
    const { debtorId } = await params;
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
    const { searchParams } = new URL(request.url);

    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/debtors/${debtorId}`,
    );
    if (searchParams.has("force")) {
      backendUrl.searchParams.set(
        "force",
        searchParams.get("force") || "false",
      );
    }

    const response = await fetch(backendUrl.toString(), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting debtor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete debtor",
      },
      { status: 500 },
    );
  }
}
