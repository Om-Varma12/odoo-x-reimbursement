import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";
import { getDashboardRoute } from "../../utils/getDashboardRoute";

const Login = () => {
  const navigate = useNavigate();

  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authService.login(form.email, form.password);

      if (!res.token) {
        setError(res.message || "Login failed");
        return;
      }

      const userWithCompany = {
        ...res.user,
        company: res.company || res.user?.company || undefined,
      };

      login({ user: userWithCompany, token: res.token });

      // Redirect based on role
      navigate(getDashboardRoute(userWithCompany.role));
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-lg">
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-primary text-center">
          Welcome Back
        </h1>
        <p className="text-textSecondary text-center mt-1">
          Login to your account
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Email */}
          <div>
            <label className="text-sm text-textSecondary">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-textSecondary">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-textSecondary text-center mt-4">
          Don’t have an account?{" "}
            <span
            onClick={() => navigate("/signup")}
            className="text-primary cursor-pointer hover:underline"
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;