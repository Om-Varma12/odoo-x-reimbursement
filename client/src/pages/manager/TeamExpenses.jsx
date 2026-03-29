import { useEffect, useMemo, useState } from "react";
import { managerService } from "../../services/manager.service";

const StatusBadge = ({ status }) => {
  const map = {
    PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    APPROVED: "bg-green-50 text-green-700 border border-green-200",
    REJECTED: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || ""}`}>
      {status}
    </span>
  );
};

const getReceiptUrl = (receiptImage) => {
  if (!receiptImage) return "";
  if (receiptImage.startsWith("http://") || receiptImage.startsWith("https://")) {
    return receiptImage;
  }

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const normalizedPath = receiptImage.startsWith("/") ? receiptImage : `/${receiptImage}`;
  return `${apiBase}${normalizedPath}`;
};

const TeamExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    category: "ALL",
    from: "",
    to: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await managerService.getTeamExpenses();
      setExpenses(response);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load team expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(expenses.map((expense) => expense.category).filter(Boolean));
    return ["ALL", ...Array.from(unique)];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (filters.status !== "ALL" && expense.status !== filters.status) return false;
      if (filters.category !== "ALL" && expense.category !== filters.category) return false;

      const expenseDate = new Date(expense.createdAt);
      if (filters.from) {
        const fromDate = new Date(filters.from);
        if (expenseDate < fromDate) return false;
      }

      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        if (expenseDate > toDate) return false;
      }

      return true;
    });
  }, [expenses, filters]);

  if (loading) {
    return <p className="text-sm text-textSecondary">Loading team expenses...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-primary mb-1">Team Expenses</h1>
        <p className="text-sm text-textSecondary">
          Read-only history for expenses submitted by your direct reports.
        </p>
      </div>

      {error && <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        />

        <input
          type="date"
          value={filters.to}
          onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              {["Employee", "Date", "Category", "Description", "Amount (Company)", "Status", "View"].map((head) => (
                <th key={head} className="text-left px-4 py-2.5 text-xs text-textSecondary font-medium whitespace-nowrap">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense._id} className="border-b border-border last:border-0 hover:bg-surface/40">
                <td className="px-4 py-2.5 text-primary">{expense.employeeName}</td>
                <td className="px-4 py-2.5 text-textSecondary">{new Date(expense.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-textSecondary">{expense.category}</td>
                <td className="px-4 py-2.5 text-textSecondary max-w-[220px] truncate">{expense.description || "-"}</td>
                <td className="px-4 py-2.5 text-primary">
                  {expense.convertedAmount.toLocaleString()} {expense.currencyCode}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={expense.status} />
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => setSelectedExpense(expense)}
                    className="text-primary text-xs hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-textSecondary">
                  No team expenses for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedExpense && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-end z-50">
          <div className="bg-surface border-l border-border w-full sm:w-[480px] h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-primary">Expense Detail</h3>
              <button
                onClick={() => setSelectedExpense(null)}
                className="text-textSecondary hover:text-primary text-xl leading-none"
              >
                ×
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              {[
                ["Employee", selectedExpense.employeeName],
                ["Category", selectedExpense.category],
                ["Description", selectedExpense.description || "-"],
                ["Original amount", `${selectedExpense.amount.toLocaleString()} ${selectedExpense.originalCurrency}`],
                ["Company amount", `${selectedExpense.convertedAmount.toLocaleString()} ${selectedExpense.currencyCode}`],
                ["Rule", `${selectedExpense.ruleName} (${selectedExpense.ruleCategory})`],
                ["Submitted", new Date(selectedExpense.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-textSecondary">{label}</dt>
                  <dd className="text-primary font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>

            {selectedExpense.receiptImage && (
              <div className="mt-4">
                <p className="text-xs text-textSecondary mb-2">Receipt image</p>
                <img
                  src={getReceiptUrl(selectedExpense.receiptImage)}
                  alt="Receipt"
                  className="w-full rounded-xl border border-border object-cover"
                />
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs text-textSecondary mb-2">Approval chain</p>
              <div className="space-y-2">
                {(selectedExpense.approvalChain || []).map((step, stepIndex) => (
                  <div key={`${selectedExpense._id}-${stepIndex}`} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-textSecondary">Step {stepIndex + 1}</p>
                      <StatusBadge status={step.status || "PENDING"} />
                    </div>
                    <div className="mt-2 space-y-1">
                      {(step.approvers || []).map((approver, idx) => (
                        <div key={`${stepIndex}-${idx}`} className="flex items-center justify-between text-xs">
                          <span className="text-textSecondary">{approver?.userId?.name || "Approver"}</span>
                          <StatusBadge status={approver?.status || "PENDING"} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamExpenses;
