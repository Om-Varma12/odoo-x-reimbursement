import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getDashboardRoute } from "../utils/getDashboardRoute";

import { ProtectedRoute } from "./ProtectedRoute";
import { RoleBasedRoute } from "./RoleBasedRoute";

// Pages
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Unauthorized from "../pages/Unauthorized.jsx";

// Layouts
import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";

// Pages (Nested)
import AdminDashboard from "../pages/admin/AdminDashboard";
import AllExpenses from "../pages/admin/AllExpenses";
import ManageUsers from "../pages/admin/ManageUsers";
import ApprovalRules from "../pages/admin/ApprovalRules";
import ManageRoles from "../pages/admin/ManageRoles";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import TeamExpenses from "../pages/manager/TeamExpenses";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import ExpenseHistory from "../pages/employee/ExpenseHistory";
import SubmitExpense from "../pages/employee/SubmitExpense";

export const AppRouter = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <Routes>
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={getDashboardRoute(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="expenses" element={<AllExpenses />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="rules" element={<ApprovalRules />} />
        <Route path="settings" element={<ManageRoles />} />
      </Route>

      {/* ================= MANAGER ================= */}
      <Route
        path="/manager"
        element={
          <ManagerLayout />
        }
      >
        <Route index element={<ManagerDashboard />} />
        <Route path="approvals" element={<ManagerDashboard />} />
        <Route path="expenses" element={<TeamExpenses />} />
      </Route>

      {/* ================= EMPLOYEE ================= */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["EMPLOYEE"]}>
              <EmployeeLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
        <Route path="expenses" element={<ExpenseHistory />} />
        <Route path="submit" element={<SubmitExpense />} />
      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};