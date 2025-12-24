"use client";

import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CampusNest
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#"
                className="text-zinc-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Home
              </a>
              <a
                href="#"
                className="text-zinc-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Explore
              </a>
              <a
                href="#"
                className="text-zinc-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Login
              </a>
              <a
                href="#"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
              >
                Sign Up
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
              <a
                href="#"
                className="text-zinc-900 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
              >
                Home
              </a>
              <a
                href="#"
                className="text-zinc-600 hover:text-blue-600 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
              >
                Explore
              </a>
              <a
                href="#"
                className="text-zinc-600 hover:text-blue-600 block px-4 py-3 text-base font-medium rounded-xl hover:bg-blue-50 transition-colors"
              >
                Login
              </a>
              <a
                href="#"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white block px-4 py-3 rounded-xl text-base font-semibold mt-2"
              >
                Sign Up
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
