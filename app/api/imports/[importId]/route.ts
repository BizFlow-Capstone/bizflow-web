import { NextRequest, NextResponse } from "next/server";

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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import/${importId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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
