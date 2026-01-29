"use client";

import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: Signup Form, 2: OTP Verification
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(30);

  // Timer for OTP resend
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validateSignup()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      console.log("Signup success, response:", data);

      // Explicitly prevent any auto-closing here
      setApiError("");
      setSuccessMessage("Verification code sent to your email!");

      console.log("Setting step to 2 (OTP)");
      setStep(2); // Move to OTP step
      setCountdown(30); // Reset timer
    } catch (error) {
      console.error("Signup error:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setSuccessMessage("Email verified successfully! Logging in...");

      // Complete signup & login
      setTimeout(() => {
        login(); // Refresh auth context
        onClose(); // Close modal
      }, 1500);

    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setApiError("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setSuccessMessage("New code sent!");
        setCountdown(30);
      } else {
        throw new Error("Failed to resend code");
      }
    } catch (error) {
      setApiError(error.message);
    }
  };

  console.log("Rendering SignupModal, Step:", step, "IsOpen:", isOpen);

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>
      <div className="p-8">
        {step === 1 ? (
          // STEP 1: SIGNUP FORM
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-zinc-900 mb-2">
                Create Account
              </h2>
              <p className="text-zinc-600">
                Join our community to find your perfect home
              </p>
            </div>

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="flex gap-4 p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "STUDENT" }))}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${formData.role === "STUDENT"
                    ? "bg-white text-blue-600 shadow-md transform scale-105"
                    : "text-zinc-500 hover:text-zinc-700"
                    }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "LANDLORD" }))}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${formData.role === "LANDLORD"
                    ? "bg-white text-blue-600 shadow-md transform scale-105"
                    : "text-zinc-500 hover:text-zinc-700"
                    }`}
                >
                  Landlord
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${errors.name ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-600"
                    }`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${errors.email ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-600"
                    }`}
                  placeholder="john@university.edu"
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${errors.password ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-600"
                    }`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-600"
                    }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 mt-4"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">
                Already have an account?{" "}
                <button onClick={onSwitchToLogin} className="text-blue-600 hover:text-blue-700 font-semibold">
                  Log in
                </button>
              </p>
            </div>
          </>
        ) : (
          // STEP 2: OTP VERIFICATION
          <>
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Verify your Email</h2>
              <p className="text-zinc-600 text-sm">
                We sent a 6-digit code to <br />
                <span className="font-semibold text-zinc-900">{formData.email}</span>
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
                {successMessage}
              </div>
            )}

            {apiError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                {apiError}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="otp"
                  maxLength="6"
                  value={formData.otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setFormData(prev => ({ ...prev, otp: val }));
                  }}
                  className="w-full px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 transition-all font-mono"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || formData.otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">
                Didn't receive the code?{" "}
                {countdown > 0 ? (
                  <span className="text-zinc-400 font-medium">Resend in {countdown}s</span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Resend Code
                  </button>
                )}
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-4 text-sm text-zinc-500 hover:text-zinc-700 underline"
              >
                Use a different email
              </button>
            </div>
          </>
        )}
      </div>
    </AuthModal>
  );
}
