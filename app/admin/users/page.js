"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Eye, CheckCircle, ShieldCheck } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null,
    userId: null,
  });

  useEffect(() => {
    fetchUsers();
  }, [activeTab, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("role", activeTab.toUpperCase());
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    const reason = prompt("Enter suspension reason:");
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        fetchUsers();
        setConfirmDialog({ isOpen: false, action: null, userId: null });
      }
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

  const handleUnsuspend = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "" }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error unsuspending user:", error);
    }
  };

  const tabs = [
    { id: "all", label: "All Users" },
    { id: "student", label: "Students" },
    { id: "landlord", label: "Landlords" },
    { id: "admin", label: "Admins" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          User Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Manage all users and their accounts
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        {/* Avatar */}
                        <div className="shrink-0 h-10 w-10 mr-4">
                          {user.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              src={user.profileImage}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* User Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                              {user.name}
                            </div>
                            {user.role === "LANDLORD" && user.isVerified && (
                              <ShieldCheck
                                className="w-4 h-4 text-blue-600"
                                title="Verified Landlord"
                              />
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "LANDLORD"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <span className="text-gray-900 font-medium">
                        {user.propertyCount}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <StatusBadge
                        status={user.suspended ? "suspended" : "active"}
                      />
                      {user.suspended && user.suspensionReason && (
                        <div
                          className="text-xs text-gray-500 mt-1 max-w-[150px] truncate"
                          title={user.suspensionReason}
                        >
                          {user.suspensionReason}
                        </div>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() =>
                              user.suspended
                                ? handleUnsuspend(user.id)
                                : setConfirmDialog({
                                    isOpen: true,
                                    action: "suspend",
                                    userId: user.id,
                                  })
                            }
                            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                              user.suspended
                                ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            }`}
                          >
                            {user.suspended ? "Unsuspend" : "Suspend"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, action: null, userId: null })
        }
        onConfirm={() => handleSuspend(confirmDialog.userId)}
        title="Suspend User"
        message="Are you sure you want to suspend this user? They will not be able to access the platform."
        confirmText="Suspend"
        variant="danger"
      />
    </div>
  );
}
