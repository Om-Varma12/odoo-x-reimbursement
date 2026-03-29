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

const ManagerDashboard = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [teamExpenses, setTeamExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionState, setActionState] = useState({
    expenseId: null,
    action: "APPROVE",
    comment: "",
    submitting: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [pending, team] = await Promise.all([
        managerService.getPendingApprovals(),
        managerService.getTeamExpenses(),
      ]);

      setPendingExpenses(pending);
      setTeamExpenses(team);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load manager dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isThisMonth = (dateLike) => {
      const date = new Date(dateLike);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    };

    return {
      awaitingAction: pendingExpenses.length,
      approvedThisMonth: teamExpenses.filter(
        (expense) => expense.status === "APPROVED" && isThisMonth(expense.updatedAt || expense.createdAt)
      ).length,
      rejectedThisMonth: teamExpenses.filter(
        (expense) => expense.status === "REJECTED" && isThisMonth(expense.updatedAt || expense.createdAt)
      ).length,
    };
  }, [pendingExpenses, teamExpenses]);

  const openAction = (expenseId, action) => {
    setActionState({
      expenseId,
      action,
      comment: "",
      submitting: false,
    });
  };

  const resetAction = () => {
    setActionState({
      expenseId: null,
      action: "APPROVE",
      comment: "",
      submitting: false,
    });
  };

  const submitAction = async () => {
    if (!actionState.expenseId) return;

    if (actionState.action === "REJECT" && !actionState.comment.trim()) {
      setError("Comment is required when rejecting an expense.");
      return;
    }

    try {
      setError("");
      setActionState((prev) => ({ ...prev, submitting: true }));

      if (actionState.action === "APPROVE") {
        await managerService.approveExpense(actionState.expenseId, actionState.comment.trim());
      } else {
        await managerService.rejectExpense(actionState.expenseId, actionState.comment.trim());
      }

      resetAction();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to submit action");
      setActionState((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (loading) {
    return <p className="text-sm text-textSecondary">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-primary mb-1">Pending Approvals</h1>
        <p className="text-sm text-textSecondary">
          Review only expenses that are currently waiting for your action.
        </p>
      </div>

      {error && <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-textSecondary mb-1">Awaiting my action</p>
          <p className="text-2xl font-semibold text-primary">{stats.awaitingAction}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-textSecondary mb-1">Approved this month</p>
          <p className="text-2xl font-semibold text-primary">{stats.approvedThisMonth}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-textSecondary mb-1">Rejected this month</p>
          <p className="text-2xl font-semibold text-primary">{stats.rejectedThisMonth}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-primary mb-3">Needs your action</h2>

        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["Employee", "Amount (Company)", "Category", "Submitted", "Status", "Actions"].map((head) => (
                  <th key={head} className="text-left px-4 py-2.5 text-xs text-textSecondary font-medium whitespace-nowrap">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingExpenses.map((expense) => {
                const isActionOpen = actionState.expenseId === expense._id;
                return (
                  <tr
                    key={expense._id}
                    className="border-b border-border last:border-0 hover:bg-surface/40 cursor-pointer"
                    onClick={() => setSelectedExpense(expense)}
                  >
                    <td className="px-4 py-2.5 text-primary">{expense.employeeName}</td>
                    <td className="px-4 py-2.5 text-primary">
                      {expense.convertedAmount.toLocaleString()} {expense.currencyCode}
                    </td>
                    <td className="px-4 py-2.5 text-textSecondary">{expense.category}</td>
                    <td className="px-4 py-2.5 text-textSecondary whitespace-nowrap">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={expense.status} />
                    </td>
                    <td className="px-4 py-2.5" onClick={(event) => event.stopPropagation()}>
                      {!isActionOpen ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openAction(expense._id, "APPROVE")}
                            className="text-xs px-2.5 py-1 rounded-lg bg-primary text-white hover:opacity-90 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openAction(expense._id, "REJECT")}
                            className="text-xs px-2.5 py-1 rounded-lg border border-border text-textSecondary hover:bg-background transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-[220px] space-y-2">
                          <p className="text-xs text-textSecondary">
                            {actionState.action === "REJECT"
                              ? "Comment is required for rejection"
                              : "Optional comment"}
                          </p>
                          <textarea
                            value={actionState.comment}
                            onChange={(event) =>
                              setActionState((prev) => ({ ...prev, comment: event.target.value }))
                            }
                            rows={2}
                            placeholder="Add a comment"
                            className="w-full p-2 rounded-lg bg-background border border-border text-xs focus:ring-2 focus:ring-primary outline-none resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={resetAction}
                              className="text-xs px-2.5 py-1 rounded-lg border border-border text-textSecondary hover:bg-background"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={actionState.submitting}
                              onClick={submitAction}
                              className="text-xs px-2.5 py-1 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-60"
                            >
                              {actionState.submitting ? "Saving..." : "Submit"}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {pendingExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-textSecondary">
                    Nothing pending right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                          <span className="text-textSecondary">
                            {approver?.userId?.name || "Approver"}
                          </span>
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

export default ManagerDashboard;