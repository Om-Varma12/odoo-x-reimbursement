import { Outlet } from "react-router-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { Topbar } from "../components/common/Topbar";
import { useAuthStore } from "../store/authStore";

const managerMenu = [
  { label: "Pending Approvals", path: "/manager" },
  { label: "Team Expenses", path: "/manager/expenses" },
];

const ManagerLayout = () => {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 min-h-screen bg-surface border-r border-border px-4 py-5 flex flex-col">
        <h2 className="mb-6 text-lg font-semibold tracking-tight text-textPrimary">Fuolo</h2>

        <nav className="flex flex-col gap-1.5">
          {managerMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "border-border bg-secondary text-primary"
                    : "border-transparent text-textSecondary hover:bg-secondary hover:text-textPrimary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-medium text-textSecondary hover:bg-secondary hover:text-textPrimary transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <Topbar />
    
        <main className="p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;