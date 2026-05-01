import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../../../../_utils/authHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

// DELETE /api/locations/[id]/employees/[employeeId] - Remove employee from location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> },
) {
  try {
    const { id, employeeId } = await params;
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
      `${BACKEND_URL}/api/location/${id}/employees/${employeeId}`,
      {
        method: "DELETE",
        headers: {
          ...createLocaleForwardHeaders(request),
          accept: "*/*",
          Authorization: authHeader,
        },
      },
    );

    const data = await response.json().catch(async () => {
      const text = await response.text();
      return { success: false, message: text };
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error removing location employee:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove location employee",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
