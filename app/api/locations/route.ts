import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../_utils/authHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

type LocationDto = {
  id: number;
  name: string;
  address: string;
  district: string | null;
  city: string | null;
  phone: string | null;
  taxCode: string | null;
  isActive: boolean;
  ownerName: string | null;
  isOwner?: boolean;
  accessType?: "owned" | "work-at";
};

type ApiResult<T> = {
  data: T;
  success: boolean;
  messageCode: string;
  message: string;
  errors?: unknown;
  timestamp?: string;
};

//trong request chứa token, nếu có thì mới truyền vào header Authorization ocnf không thì không truyền
export async function GET(request: NextRequest) {
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

    const headers = {
      ...createLocaleForwardHeaders(request),
      accept: "*/*",
      Authorization: authHeader,
    };

    const [ownedResponse, workResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/api/location/me/owned`, {
        method: "GET",
        headers,
      }),
      fetch(`${BACKEND_URL}/api/location/work-at-locations`, {
        method: "GET",
        headers,
      }),
    ]);

    const [ownedData, workData] = (await Promise.all([
      ownedResponse.json(),
      workResponse.json(),
    ])) as [ApiResult<LocationDto[]>, ApiResult<LocationDto[]>];

    if (!ownedResponse.ok && !workResponse.ok) {
      return NextResponse.json(ownedData, {
        status: ownedResponse.status,
      });
    }

    const mergedMap = new Map<number, LocationDto>();

    for (const location of workData?.data ?? []) {
      mergedMap.set(location.id, {
        ...location,
        isOwner: false,
        accessType: "work-at",
      });
    }

    for (const location of ownedData?.data ?? []) {
      mergedMap.set(location.id, {
        ...location,
        isOwner: true,
        accessType: "owned",
      });
    }

    const mergedData = Array.from(mergedMap.values());

    return NextResponse.json(
      {
        data: mergedData,
        success: true,
        messageCode: "COMMON_DATA_RETRIEVED",
        message: "Data retrieved successfully",
        errors: null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch locations",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const response = await fetch(`${BACKEND_URL}/api/location/create`, {
      method: "POST",
      headers: {
        ...createLocaleForwardHeaders(request),
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create location",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
