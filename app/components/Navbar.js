"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, Edit } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    user,
    isLoading,
    logout,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
  } = useAuth();

  // Check if we should open login modal (from protected route redirect)
  useEffect(() => {
    const checkLoginModal = () => {
      const shouldShowLogin = sessionStorage.getItem("showLoginModal");
      if (shouldShowLogin === "true") {
        sessionStorage.removeItem("showLoginModal");
        openLoginModal();
      }
    };

    // Check on mount
    checkLoginModal();

    // Listen for storage events (from other tabs/windows or manual triggers)
    window.addEventListener("storage", checkLoginModal);

    // Listen for custom event (for same-window updates)
    window.addEventListener("checkLoginModal", checkLoginModal);

    return () => {
      window.removeEventListener("storage", checkLoginModal);
      window.removeEventListener("checkLoginModal", checkLoginModal);
    };
  }, [openLoginModal]);

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    closeLoginModal();
    setIsMobileMenuOpen(false);
  };

  const handleOpenLoginModal = () => {
    openLoginModal();
    setIsSignupModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    logout();
  };

  const getInitials = (name) => {
    if (!name) return "LL";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer">
                  CampusNest
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-zinc-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Home
                </Link>

                {/* Show Explore for non-logged in or Students */}
                {(!user || user.role !== "LANDLORD") && (
                  <Link
                    href="/explore"
                    className="text-zinc-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    Explore
                  </Link>
                )}

                {/* Show Dashboard for Landlords */}
                {user && user.role === "LANDLORD" && (
                  <Link
                    href="/landlord/dashboard"
                    className="text-zinc-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    Dashboard
                  </Link>
                )}

                {!isLoading && (
                  <>
                    {user ? (
                      // Logged in state
                      <>
                        {user.role === "LANDLORD" ? (
                          // Landlord with profile avatar and dropdown
                          <div className="relative" ref={dropdownRef}>
                            <button
                              onClick={() =>
                                setIsProfileDropdownOpen(!isProfileDropdownOpen)
                              }
                              className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 focus:outline-none"
                            >
                              {user.landlordProfile?.profileImage ? (
                                <img
                                  src={user.landlordProfile.profileImage}
                                  alt={user.name}
                                  className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-500">
                                  <span className="text-xs font-bold text-white">
                                    {getInitials(user.name)}
                                  </span>
                                </div>
                              )}
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileDropdownOpen && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-3 border-b border-gray-100">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.email}
                                  </p>
                                </div>
                                <Link
                                  href="/landlord/profile"
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                                  onClick={() =>
                                    setIsProfileDropdownOpen(false)
                                  }
                                >
                                  <User className="w-4 h-4" />
                                  View Profile
                                </Link>
                                <Link
                                  href="/landlord/profile/edit"
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                                  onClick={() =>
                                    setIsProfileDropdownOpen(false)
                                  }
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Profile
                                </Link>
                                <button
                                  onClick={handleLogout}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                >
                                  <LogOut className="w-4 h-4" />
                                  Logout
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Non-landlord users (students, admin)
                          <>
                            <span className="text-zinc-600 px-3 py-2 text-sm font-medium">
                              Hi, {user.name}
                            </span>
                            <button
                              onClick={handleLogout}
                              className="text-zinc-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                            >
                              Logout
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      // Logged out state
                      <>
                        <button
                          onClick={handleOpenLoginModal}
                          className="text-zinc-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                        >
                          Login
                        </button>
                        <button
                          onClick={openSignupModal}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
                className="text-zinc-600 hover:text-blue-600 focus:outline-none transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 backdrop-blur-xl bg-white/95 rounded-2xl mt-2 shadow-lg border border-gray-200">
                <Link
                  href="/"
                  className="text-zinc-900 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>

                {(!user || user.role !== "LANDLORD") && (
                  <Link
                    href="/explore"
                    className="text-zinc-600 hover:text-blue-600 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Explore
                  </Link>
                )}

                {user && user.role === "LANDLORD" && (
                  <Link
                    href="/landlord/dashboard"
                    className="text-zinc-600 hover:text-blue-600 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}

                {!isLoading && (
                  <>
                    {user ? (
                      // Logged in state (mobile)
                      <>
                        {user.role === "LANDLORD" ? (
                          // Landlord mobile menu
                          <>
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                              {user.landlordProfile?.profileImage ? (
                                <img
                                  src={user.landlordProfile.profileImage}
                                  alt={user.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-500">
                                  <span className="text-base font-bold text-white">
                                    {getInitials(user.name)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <Link
                              href="/landlord/profile"
                              className="text-zinc-600 hover:text-blue-600 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              View Profile
                            </Link>
                            <Link
                              href="/landlord/profile/edit"
                              className="text-zinc-600 hover:text-blue-600 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Edit Profile
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="text-red-600 hover:text-red-700 block w-full text-left px-4 py-3 text-base font-medium rounded-xl hover:bg-red-50 transition-colors"
                            >
                              Logout
                            </button>
                          </>
                        ) : (
                          // Non-landlord mobile menu
                          <>
                            <div className="text-zinc-600 block px-4 py-3 text-base font-medium">
                              Hi, {user.name}
                            </div>
                            <button
                              onClick={handleLogout}
                              className="text-zinc-600 hover:text-blue-600 block w-full text-left px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
                            >
                              Logout
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      // Logged out state (mobile)
                      <>
                        <button
                          onClick={handleOpenLoginModal}
                          className="text-zinc-600 hover:text-blue-600 block w-full text-left px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
                        >
                          Login
                        </button>
                        <button
                          onClick={openSignupModal}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white block w-full text-left px-4 py-3 rounded-xl text-base font-semibold mt-2"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={openLoginModal}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSwitchToSignup={openSignupModal}
      />
    </>
  );
}
