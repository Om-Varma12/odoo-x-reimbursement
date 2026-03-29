// pages/auth/Signup.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";
import { getDashboardRoute } from "../../utils/getDashboardRoute";

type Country = {
  name: { common: string };
  currencies: Record<string, { name: string; symbol: string }>;
};

type CountryOption = {
  label: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    currencyCode: "",
  });

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,currencies"
        );
        const data: Country[] = await res.json();

        const options: CountryOption[] = data
          .filter((c) => c.currencies && Object.keys(c.currencies).length > 0)
          .map((c) => {
            const currencyCode = Object.keys(c.currencies)[0];
            const currency = c.currencies[currencyCode];
            return {
              label: c.name.common,
              currencyCode,
              currencyName: currency.name,
              currencySymbol: currency.symbol,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        setCountries(options);
      } catch {
        setError("Failed to load countries");
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "country") {
      const selected = countries.find((c) => c.label === value);
      setForm({
        ...form,
        country: value,
        currencyCode: selected ? selected.currencyCode : "",
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!form.country || !form.currencyCode) {
      setError("Please select a country");
      return;
    }

    setLoading(true);

    try {
      const role = form.email.toLowerCase().split("@")[0].includes("manager")
        ? "MANAGER"
        : "ADMIN";

      const res = await authService.signup({
        email: form.email,
        password: form.password,
        companyName: form.name,
        country: form.country,
        currencyCode: form.currencyCode,
        role,
      });

      if (!res?.token || !res?.user) {
        setError("Signup failed. Please check your details and try again.");
        return;
      }

      const userWithCompany = {
        ...res.user,
        company: res.company || res.user?.company || undefined,
      };

      login({ user: userWithCompany, token: res.token });
      navigate(getDashboardRoute(userWithCompany.role));
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = countries.find((c) => c.label === form.country);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-lg">

        {/* Title */}
        <h1 className="text-2xl font-bold text-primary text-center">
          Create Account
        </h1>
        <p className="text-textSecondary text-center mt-1">Join Fuolo</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {/* Name */}
          <div>
            <label className="text-sm text-textSecondary">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-textSecondary">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
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
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-textSecondary">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Country selector */}
          <div>
            <label className="text-sm text-textSecondary">Country</label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              disabled={countriesLoading}
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
            >
              <option value="">
                {countriesLoading ? "Loading countries..." : "Select a country"}
              </option>
              {countries.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency display (auto-filled) */}
          {selectedCountry && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-sm">
              <span className="text-textSecondary">Currency:</span>
              <span className="font-medium text-primary">
                {selectedCountry.currencyCode}
              </span>
              <span className="text-textSecondary">
                — {selectedCountry.currencyName} ({selectedCountry.currencySymbol})
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || countriesLoading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-textSecondary text-center mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-primary cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;