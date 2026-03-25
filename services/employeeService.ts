import type {
  ApiResponse,
  EmployeeDetail,
  EmployeeSearchResult,
  EmployeeInvitation,
  InviteEmployeeRequest,
  HireRecord,
  AssignableEmployee,
} from "@/lib/types/employee";
import { authFetch } from "@/lib/auth/tokenManager";

/**
 * Employee Service
 * Pure API calling logic - no React hooks here
 */

export async function getEmployees(): Promise<ApiResponse<EmployeeDetail[]>> {
  const response = await authFetch("/api/employees", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.status}`);
  }

  const result = (await response.json()) as ApiResponse<
    EmployeeDetail[] | { employees: EmployeeDetail[] }
  >;

  const normalized = Array.isArray(result.data)
    ? result.data
    : (result.data?.employees ?? []);

  const acceptedEmployees = normalized.filter((employee) => {
    const status = employee.status?.toLowerCase();
    return employee.isActive === true && status === "accepted";
  });

  return {
    ...result,
    data: acceptedEmployees,
  };
}

type RawMyEmployee = {
  profileId?: string;
  userName?: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isAlreadyHired?: boolean;
  isActive?: boolean;
};

export async function getAssignableEmployees(): Promise<
  ApiResponse<AssignableEmployee[]>
> {
  const response = await authFetch("/api/my-employee/employees", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch assignable employees: ${response.status}`);
  }

  const result = (await response.json()) as ApiResponse<
    RawMyEmployee[] | { employees?: RawMyEmployee[] }
  >;

  const normalized = Array.isArray(result.data)
    ? result.data
    : (result.data?.employees ?? []);

  const assignableMap = new Map<string, AssignableEmployee>();

  for (const employee of normalized) {
    if (!employee.profileId) continue;
    if (employee.isAlreadyHired !== true || employee.isActive !== true)
      continue;

    if (!assignableMap.has(employee.profileId)) {
      assignableMap.set(employee.profileId, {
        userId: employee.profileId,
        userName: employee.userName?.trim() || employee.profileId,
        phone: employee.phone,
        email: employee.email,
        avatarUrl: employee.avatarUrl,
      });
    }
  }

  return {
    ...result,
    data: Array.from(assignableMap.values()),
  };
}

export async function searchEmployees(
  query: string,
): Promise<ApiResponse<EmployeeSearchResult[]>> {
  const params = new URLSearchParams();
  params.append("query", query);

  const response = await authFetch(
    `/api/employees/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to search employees: ${response.status}`);
  }

  return response.json();
}

export async function inviteEmployee(
  data: InviteEmployeeRequest,
): Promise<ApiResponse<HireRecord>> {
  const response = await authFetch("/api/employees/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to invite employee: ${response.status}`);
  }

  return response.json();
}

export async function removeEmployee(
  employeeId: string,
): Promise<ApiResponse<null>> {
  const response = await authFetch(`/api/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to remove employee: ${response.status}`);
  }

  return response.json();
}

export async function getPendingInvitations(): Promise<
  ApiResponse<EmployeeInvitation[]>
> {
  const response = await authFetch("/api/employees/invitations", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch invitations: ${response.status}`);
  }

  return response.json();
}

export async function acceptInvitation(
  hireId: number,
): Promise<ApiResponse<null>> {
  const response = await authFetch(
    `/api/employees/invitations/${hireId}/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to accept invitation: ${response.status}`);
  }

  return response.json();
}

export async function rejectInvitation(
  hireId: number,
): Promise<ApiResponse<null>> {
  const response = await authFetch(
    `/api/employees/invitations/${hireId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to reject invitation: ${response.status}`);
  }

  return response.json();
}
