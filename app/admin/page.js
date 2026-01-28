"use client";

import { useEffect, useState } from "react";
import StatsCard from "../components/StatsCard";
import StatusBadge from "../components/StatusBadge";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Welcome to the admin panel
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          icon={
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
          change={`+${stats?.users?.newThisWeek || 0} this week`}
          changeType="positive"
        />

        <StatsCard
          title="Total Properties"
          value={stats?.properties?.total || 0}
          icon={
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          change={`+${stats?.properties?.newThisWeek || 0} this week`}
          changeType="positive"
        />

        <StatsCard
          title="Pending Verification"
          value={stats?.properties?.pending || 0}
          icon={
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        <StatsCard
          title="Active Landlords"
          value={stats?.users?.landlords || 0}
          icon={
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            User Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Students</span>
              <span className="font-semibold text-gray-900">
                {stats?.users?.students || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Landlords</span>
              <span className="font-semibold text-gray-900">
                {stats?.users?.landlords || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Admins</span>
              <span className="font-semibold text-gray-900">
                {stats?.users?.admins || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-600">Suspended</span>
              <span className="font-semibold text-red-600">
                {stats?.users?.suspended || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Property Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verified</span>
              <span className="font-semibold text-green-600">
                {stats?.properties?.verified || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">
                {stats?.properties?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">
                {stats?.properties?.rejected || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Recent Properties</h3>
          <Link
            href="/admin/properties"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            View All →
          </Link>
        </div>

        <div className="space-y-4">
          {stats?.recentActivity?.map((property) => (
            <div
              key={property.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {property.title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  by {property.owner?.name} ({property.owner?.email})
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <StatusBadge
                  status={property.verified ? "verified" : "pending"}
                />
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                  {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link
          href="/admin/properties?status=pending"
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-200 rounded-xl group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-yellow-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Review Properties</h4>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.properties?.pending || 0} pending
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-200 rounded-xl group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-blue-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.users?.total || 0} total users
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/properties"
          className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-200 rounded-xl group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-green-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">All Properties</h4>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.properties?.total || 0} listings
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
