import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { JSX } from "react/jsx-runtime";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};