import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id: locationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const authHeader = getBearerAuthorizationHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "Missing Authorization Bearer token" },
        { status: 401 },
      );
    }

    const backendUrl = new URL(`${BACKEND_API_URL}/api/locations/${locationId}/accounting/books`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        ...createLocaleForwardHeaders(request),
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error listing books:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id: locationId } = await context.params;
    const body = await request.json();
    const authHeader = getBearerAuthorizationHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "Missing Authorization Bearer token" },
        { status: 401 },
      );
    }

    const response = await fetch(
      `${BACKEND_API_URL}/api/locations/${locationId}/accounting/books`,
      {
        method: "POST",
        headers: {
          ...createLocaleForwardHeaders(request),
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
