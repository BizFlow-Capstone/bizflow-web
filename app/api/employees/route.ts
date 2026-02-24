import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/employees
 * Proxy to backend: GET /api/my-employee/employees
 * Get employee list for dropdown selection
 */
export async function GET() {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-employee/employees`,
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
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch employees",
        data: { employees: [] },
      },
      { status: 500 },
    );
  }
}
