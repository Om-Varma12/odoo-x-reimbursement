import axiosInstance from "../utils/axiosInstance";

const unwrapData = (response) => {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  return response?.data;
};

const normalizeExpense = (expense) => ({
  _id: expense?._id ?? expense?.id,
  employeeName: expense?.employeeId?.name ?? expense?.employeeName ?? "Unknown",
  description: expense?.description ?? "",
  category: expense?.category ?? "Other",
  amount: Number(expense?.amount ?? 0),
  convertedAmount: Number(expense?.convertedAmount ?? expense?.amount ?? 0),
  currencyCode: expense?.companyCurrency ?? expense?.currency ?? "USD",
  originalCurrency: expense?.currency ?? "USD",
  createdAt: expense?.createdAt ?? expense?.date ?? new Date().toISOString(),
  updatedAt: expense?.updatedAt ?? expense?.createdAt ?? new Date().toISOString(),
  status: expense?.status ?? "PENDING",
  receiptImage: expense?.receiptImage ?? "",
  ruleName: expense?.ruleId?.name ?? "Approval rule",
  ruleCategory: expense?.ruleId?.category ?? expense?.category ?? "Other",
  approvalChain: Array.isArray(expense?.approvalChain) ? expense.approvalChain : [],
  currentStep: typeof expense?.currentStep === "number" ? expense.currentStep : 0,
});

export const managerService = {
  getPendingApprovals: async () => {
    const response = await axiosInstance.get("/api/approval/expenses/pending");
    const data = unwrapData(response);
    return Array.isArray(data) ? data.map(normalizeExpense) : [];
  },

  approveExpense: async (expenseId, comment = "") => {
    const response = await axiosInstance.post(`/api/approval/expenses/${expenseId}/approve`, {
      comment,
    });
    return unwrapData(response);
  },

  rejectExpense: async (expenseId, comment) => {
    const response = await axiosInstance.post(`/api/approval/expenses/${expenseId}/reject`, {
      comment,
    });
    return unwrapData(response);
  },

  getTeamExpenses: async () => {
    const response = await axiosInstance.get("/api/team/expenses");
    const data = unwrapData(response);
    return Array.isArray(data) ? data.map(normalizeExpense) : [];
  },
};
