const BASE = "http://localhost:5000/api";

const parseJsonSafe = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const getArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.expenses)) return payload.expenses;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.rules)) return payload.rules;
  return [];
};

const authHeaders = () => {
  const raw = localStorage.getItem("auth-storage");
  let token: string | null = null;

  try {
    token = raw ? JSON.parse(raw)?.state?.token ?? null : null;
  } catch {
    token = null;
  }

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const normalizeExpense = (expense: any) => {
  const totalSteps = Array.isArray(expense?.approvalChain)
    ? expense.approvalChain.length
    : undefined;

  return {
    _id: expense?._id ?? expense?.id,
    employeeName: expense?.employeeId?.name ?? expense?.employeeName ?? "Unknown",
    amount: Number(expense?.amount ?? 0),
    currencyCode: expense?.currency ?? expense?.currencyCode ?? "USD",
    convertedAmount: Number(expense?.convertedAmount ?? expense?.amount ?? 0),
    category: expense?.category ?? "Other",
    description: expense?.description ?? "",
    status: expense?.status ?? "PENDING",
    currentStep: typeof expense?.currentStep === "number" ? expense.currentStep + 1 : undefined,
    totalSteps,
    createdAt: expense?.createdAt ?? expense?.date ?? new Date().toISOString(),
    rejectionComment: expense?.rejectionComment ?? expense?.reason ?? "",
  };
};

const normalizeUser = (user: any) => ({
  _id: user?._id ?? user?.id,
  name: user?.name ?? "",
  email: user?.email ?? "",
  role: user?.role ?? "EMPLOYEE",
  managerId:
    typeof user?.managerId === "object"
      ? user?.managerId?._id ?? user?.managerId?.id ?? ""
      : user?.managerId ?? "",
  managerName:
    typeof user?.managerId === "object"
      ? user?.managerId?.name ?? ""
      : user?.managerName ?? "",
});

const normalizeRule = (rule: any) => {
  const steps = Array.isArray(rule?.steps) ? rule.steps : [];
  const firstStep = steps[0] ?? {};
  const approvers = Array.isArray(firstStep?.approvers) ? firstStep.approvers : [];

  return {
    _id: rule?._id ?? rule?.id,
    userId:
      typeof rule?.employeeId === "object"
        ? rule?.employeeId?._id ?? ""
        : rule?.employeeId ?? "",
    userName:
      typeof rule?.employeeId === "object"
        ? rule?.employeeId?.name ?? ""
        : rule?.userName ?? "",
    managerId:
      typeof rule?.managerId === "object"
        ? rule?.managerId?._id ?? ""
        : rule?.managerId ?? "",
    managerName:
      typeof rule?.managerId === "object"
        ? rule?.managerId?.name ?? ""
        : rule?.managerName ?? "",
    description: rule?.description ?? rule?.name ?? "",
    isManagerApprover: Boolean(rule?.isManagerApprover),
    approvers: approvers.map((a: any, index: number) => ({
      userId: typeof a?.userId === "object" ? a?.userId?._id ?? "" : a?.userId ?? "",
      userName: typeof a?.userId === "object" ? a?.userId?.name ?? "" : "",
      order: Number(a?.order ?? index + 1),
      isRequired: Boolean(a?.isRequired),
    })),
    isSequential:
      typeof rule?.isSequence === "boolean"
        ? rule.isSequence
        : !Boolean(firstStep?.isParallel),
    minApprovalPercentage: Number(rule?.minApprovalPercentage ?? firstStep?.threshold ?? 100),
  };
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAllUsers = async () => {
  const res = await fetch(`${BASE}/users`, { headers: authHeaders() });
  const payload = await parseJsonSafe(res);
  return {
    ...payload,
    users: getArray(payload).map(normalizeUser),
  };
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  managerId?: string;
}) => {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonSafe(res);
};

export const updateUser = async (
  id: string,
  data: { name?: string; role?: string; managerId?: string }
) => {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonSafe(res);
};

export const deleteUser = async (id: string) => {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseJsonSafe(res);
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const getAllExpenses = async (params?: {
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  search?: string;
}) => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v && v !== "ALL")
    )
  ).toString();
  const res = await fetch(`${BASE}/expenses/all${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
  const payload = await parseJsonSafe(res);
  return {
    ...payload,
    expenses: getArray(payload).map(normalizeExpense),
  };
};

export const overrideExpense = async (
  id: string,
  data: { action: "APPROVED" | "REJECTED"; comment?: string }
) => {
  const res = await fetch(`${BASE}/expenses/${id}/override`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: data.action, reason: data.comment }),
  });
  return parseJsonSafe(res);
};

// ─── Approval Rules ──────────────────────────────────────────────────────────

export const getAllRules = async () => {
  const res = await fetch(`${BASE}/rules`, { headers: authHeaders() });
  const payload = await parseJsonSafe(res);
  return {
    ...payload,
    rules: getArray(payload).map(normalizeRule),
  };
};

export const createRule = async (data: unknown) => {
  const res = await fetch(`${BASE}/rules`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonSafe(res);
};

export const updateRule = async (id: string, data: unknown) => {
  const res = await fetch(`${BASE}/rules/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonSafe(res);
};

export const deleteRule = async (id: string) => {
  const res = await fetch(`${BASE}/rules/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseJsonSafe(res);
};