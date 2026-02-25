"use client";

import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";


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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const normalizeEmail = (email) => email.trim().toLowerCase();

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT",
        otp: "",
      });
      setErrors({});
      setApiError("");
      setSuccessMessage("");
      setCountdown(30);
    }
  }, [isOpen]);

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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validateSignup = () => {
    const newErrors = {};
    const email = normalizeEmail(formData.email);
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
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
          email: normalizeEmail(formData.email),
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setApiError("");
      setSuccessMessage("Code sent!");
      setStep(2);
      setCountdown(30);
    } catch (error) {
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
          email: normalizeEmail(formData.email),
          otp: formData.otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setSuccessMessage("Verified! Logging in...");

      setTimeout(() => {
        login();
        onClose();
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
        body: JSON.stringify({ email: normalizeEmail(formData.email) }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("New code sent!");
        setCountdown(30);
      } else {
        throw new Error(data.message || "Failed to resend code");
      }
    } catch (error) {
      setApiError(error.message);
    }
  };

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>

      {step === 1 ? (
        <>
          {/* ================= STEP 1: SIGNUP FORM ================= */}
          <div className="p-6 sm:p-8">

            {/* Header with Compact Progress */}
            <div className="mb-6">
              {/* Compact Progress Indicator */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 w-24">
                  <div className="flex-1 h-1 bg-gray-900 rounded-full"></div>
                  <div className="flex-1 h-1 bg-gray-200 rounded-full"></div>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold font-raleway text-gray-900 text-center">
                Create Account
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-poppins text-center">
                Step 1 of 2
              </p>
            </div>

            {/* Messages */}
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r">
                <p className="text-red-700 text-sm font-medium font-poppins">{apiError}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r">
                <p className="text-emerald-700 text-sm font-medium font-poppins">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-4">

              {/* Role Selection - Compact */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 font-poppins">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "STUDENT" }))}
                    className={`relative p-3 rounded-lg border-2 transition-all ${formData.role === "STUDENT"
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.role === "STUDENT" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-semibold font-montserrat ${formData.role === "STUDENT" ? "text-gray-900" : "text-gray-600"
                        }`}>
                        Student
                      </span>
                    </div>
                    {formData.role === "STUDENT" && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: "LANDLORD" }))}
                    className={`relative p-3 rounded-lg border-2 transition-all ${formData.role === "LANDLORD"
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.role === "LANDLORD" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <span className={`text-xs font-semibold font-montserrat ${formData.role === "LANDLORD" ? "text-gray-900" : "text-gray-600"
                        }`}>
                        Landlord
                      </span>
                    </div>
                    {formData.role === "LANDLORD" && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full font-nunito pl-10 pr-4 py-3 text-sm rounded-xl border bg-white transition-all focus:outline-none focus:ring-2 ${errors.name
                        ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                        : "border-gray-300 focus:ring-gray-900/5 focus:border-gray-900"
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600 font-poppins">{errors.name}</p>
                )}
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@university.edu"
                    className={`w-full font-nunito pl-10 pr-4 py-3 text-sm rounded-xl border bg-white transition-all focus:outline-none focus:ring-2 ${errors.email
                        ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                        : "border-gray-300 focus:ring-gray-900/5 focus:border-gray-900"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 font-poppins">{errors.email}</p>
                )}
              </div>

              {/* Password Inputs - Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full font-nunito pl-10 pr-10 py-3 text-sm rounded-xl border bg-white transition-all focus:outline-none focus:ring-2 ${errors.password
                          ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                          : "border-gray-300 focus:ring-gray-900/5 focus:border-gray-900"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full font-nunito pl-10 pr-10 py-3 text-sm rounded-xl border bg-white transition-all focus:outline-none focus:ring-2 ${errors.confirmPassword
                          ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                          : "border-gray-300 focus:ring-gray-900/5 focus:border-gray-900"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gray-900 text-white font-semibold font-montserrat text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] shadow-sm group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-center text-gray-600 font-poppins">
                Already have an account?{" "}
                <button
                  onClick={onSwitchToLogin}
                  className="text-gray-900 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ================= STEP 2: OTP VERIFICATION ================= */}
          <div className="p-6 sm:p-8">

            {/* Header with Compact Progress */}
            <div className="mb-6">
              {/* Compact Progress Indicator - Both Filled */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 w-24">
                  <div className="flex-1 h-1 bg-gray-900 rounded-full"></div>
                  <div className="flex-1 h-1 bg-gray-900 rounded-full"></div>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold font-raleway text-gray-900 text-center">
                Verify Email
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-poppins text-center">
                Step 2 of 2
              </p>
            </div>

            {/* Email Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-900" />
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 font-poppins">
                Enter the 6-digit code sent to
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 font-poppins">
                {formData.email}
              </p>
            </div>

            {/* Messages */}
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r">
                <p className="text-red-700 text-sm font-medium font-poppins">{apiError}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r">
                <p className="text-emerald-700 text-sm font-medium font-poppins">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-5">
              {/* OTP Input */}
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
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-3xl tracking-[0.5em] font-montserrat font-bold px-4 py-4 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
                />
                <p className="mt-2 text-xs text-center text-gray-500 font-poppins">
                  {formData.otp.length}/6 digits
                </p>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || formData.otp.length !== 6}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold font-montserrat text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <p className="text-sm text-center text-gray-600 font-poppins">
                Didn't receive the code?{" "}
                {countdown > 0 ? (
                  <span className="text-gray-400 font-medium">
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-gray-900 font-semibold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </p>

              <button
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline font-poppins"
              >
                ← Change email
              </button>
            </div>
          </div>
        </>
      )}
    </AuthModal>
  );
}
