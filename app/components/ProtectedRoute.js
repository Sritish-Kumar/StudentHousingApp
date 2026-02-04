"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { user, isLoading, openLoginModal } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user && !hasRedirected.current) {
        hasRedirected.current = true;
        // Open login modal and redirect to home
        openLoginModal();
        router.push("/");
      } else if (user) {
        setShouldRender(true);
      }
    }
  }, [user, isLoading, router, openLoginModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}
