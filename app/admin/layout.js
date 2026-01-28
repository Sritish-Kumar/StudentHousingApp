"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const user = await res.json();
        if (user.role === "ADMIN") {
          setIsAuthorized(true);
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 w-full lg:w-auto p-3 sm:p-4 md:p-6 lg:p-8 pt-16 lg:pt-6 overflow-x-hidden">
        <div className="max-w-full">{children}</div>
      </main>
    </div>
  );
}
