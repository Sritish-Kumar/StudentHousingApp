"use client";

import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const normalizeEmail = (email) => email.trim().toLowerCase();

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: "",
        password: "",
        rememberMe: false,
      });
      setErrors({});
      setApiError("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setApiError("");
  };

  const validateForm = () => {
    const newErrors = {};
    const email = normalizeEmail(formData.email);

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizeEmail(formData.email),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's an unverified email error
        if (response.status === 403 && data.message.includes("not verified")) {
          setApiError(
            <div>
              <p className="mb-3">{data.message}</p>
              <button
                onClick={handleDeleteAndSignup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-all"
              >
                Start Fresh - Sign Up Again
              </button>
            </div>
          );
          return;
        }
        throw new Error(data.message || "Login failed");
      }

      setSuccessMessage("Login successful! Redirecting...");
      setFormData({
        email: "",
        password: "",
        rememberMe: false,
      });

      // Refresh auth state and close modal
      setTimeout(() => {
        login(); // Refresh user data from context
        onClose(); // Close the modal
      }, 1000);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAndSignup = async () => {
    setIsLoading(true);
    try {
      // Delete the unverified user
      await fetch("/api/auth/delete-unverified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizeEmail(formData.email) }),
      });

      // Switch to signup modal
      onSwitchToSignup();
    } catch (error) {
      console.error("Error deleting unverified user:", error);
      // Still switch to signup even if delete fails
      onSwitchToSignup();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 sm:p-10">

        {/* ================= HEADER ================= */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold font-raleway text-gray-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500 font-poppins">
            Log in to continue your housing search
          </p>
        </div>

        {/* ================= SUCCESS MESSAGE ================= */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-emerald-700 text-sm font-medium font-poppins">
              {successMessage}
            </p>
          </div>
        )}

        {/* ================= ERROR MESSAGE ================= */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium font-poppins">
              {apiError}
            </p>
          </div>
        )}

        {/* ================= FORM ================= */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@university.edu"
              className={`w-full font-nunito px-4 py-3 rounded-xl border bg-white transition-all duration-200 focus:outline-none focus:ring-2 ${errors.email
                ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                : "border-gray-300 focus:ring-gray-900/5 focus:border-gray-900"
                }`}
            />
            {errors.email && (
              <p className="mt-2 text-xs text-red-600 font-poppins">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full font-nunito px-4 py-3 pr-12 rounded-xl border bg-white transition-all duration-200 focus:outline-none focus:ring-2 ${errors.password
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-gray-300 focus:ring-gray-900/5 focus:border-gray-900"
                  }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="mt-2 text-xs text-red-600 font-poppins">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group font-poppins">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">
                Remember me
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold font-montserrat text-sm tracking-wide hover:bg-black transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>



        {/* ================= FOOTER ================= */}
        <div className="mt-8 text-center font-poppins">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-gray-900 font-semibold hover:underline transition"
            >
              Create one
            </button>
          </p>
        </div>

      </div>
    </AuthModal>

  );
}
