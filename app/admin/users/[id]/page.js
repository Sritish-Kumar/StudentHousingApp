"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  updateUserProfile,
} from "../../../services/adminService";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Building,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import ConfirmDialog from "../../../components/ConfirmDialog";

export default function AdminUserProfilePage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null,
    data: null,
  });

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      const data = await getUserProfile(id);
      setUser(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLandlord = async (shouldVerify) => {
    try {
      await updateUserProfile(id, { isVerified: shouldVerify });
      fetchUserProfile(); // Refresh data
    } catch (err) {
      console.error("Error updating verification:", err);
      alert("Failed to update verification status");
    }
  };

  const handleSuspendUser = async () => {
    const reason = prompt("Enter suspension reason:");
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/users/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        fetchUserProfile();
        setConfirmDialog({ isOpen: false, action: null, data: null });
      } else {
        throw new Error("Failed to suspend user");
      }
    } catch (err) {
      console.error("Error suspending user:", err);
      alert("Failed to suspend user");
    }
  };

  const handleUnsuspendUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "" }),
      });

      if (res.ok) {
        fetchUserProfile();
      } else {
        throw new Error("Failed to unsuspend user");
      }
    } catch (err) {
      console.error("Error unsuspending user:", err);
      alert("Failed to unsuspend user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">
          <h2 className="text-lg font-bold mb-2">Error Loading Profile</h2>
          <p>{error || "User not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {user.name}
              {user.role === "LANDLORD" && user.landlordProfile?.isVerified && (
                <ShieldCheck
                  className="w-6 h-6 text-blue-600"
                  title="Verified Landlord"
                />
              )}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-gray-500">
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
              <span>•</span>
              <span>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "LANDLORD" &&
              (user.landlordProfile?.isVerified ? (
                <button
                  onClick={() => handleVerifyLandlord(false)}
                  className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition border border-yellow-200 text-sm font-medium flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Revoke Verification
                </button>
              ) : (
                <button
                  onClick={() => handleVerifyLandlord(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify Landlord
                </button>
              ))}

            {user.role !== "ADMIN" && (
              <button
                onClick={() =>
                  user.suspended
                    ? handleUnsuspendUser()
                    : setConfirmDialog({
                        isOpen: true,
                        action: "suspend",
                        data: "",
                      })
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border flex items-center gap-2 ${
                  user.suspended
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                }`}
              >
                {user.suspended ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Unsuspend User
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Suspend User
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center text-center">
              {user.profileImage ||
              (user.role === "LANDLORD"
                ? user.landlordProfile?.profileImage
                : user.studentProfile?.profileImage) ? (
                <img
                  src={
                    user.profileImage ||
                    (user.role === "LANDLORD"
                      ? user.landlordProfile?.profileImage
                      : user.studentProfile?.profileImage)
                  }
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 mb-4">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>

              <div className="w-full mt-6 pt-6 border-t border-gray-100 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </div>
                {user.role === "LANDLORD" &&
                  user.landlordProfile?.phoneNumber && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {user.landlordProfile.phoneNumber}
                    </div>
                  )}
                {user.role === "STUDENT" &&
                  user.studentProfile?.emergencyContact?.phoneNumber && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {user.studentProfile.emergencyContact.phoneNumber}{" "}
                      (Emergency)
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  Status
                </label>
                <div className="mt-1">
                  <StatusBadge
                    status={user.suspended ? "suspended" : "active"}
                  />
                </div>
              </div>
              {user.suspended && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Suspension Reason
                  </label>
                  <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                    {user.suspensionReason}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Profile */}
        <div className="md:col-span-2 space-y-6">
          {/* Role Specific Details */}
          {user.role === "LANDLORD" && user.landlordProfile && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-500" />
                Landlord Details
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Company Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user.landlordProfile.companyName || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Experience
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user.landlordProfile.yearsOfExperience
                      ? `${user.landlordProfile.yearsOfExperience} years`
                      : "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Business Address
                  </label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <p className="text-gray-900">
                      {user.landlordProfile.businessAddress || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Bio
                  </label>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl text-sm leading-relaxed">
                    {user.landlordProfile.bio || "No bio provided"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.role === "STUDENT" && user.studentProfile && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-500" />
                Student Details
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    University
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user.studentProfile.universityName || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Student ID
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user.studentProfile.studentId || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Course
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user.studentProfile.course || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Year of Study
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user.studentProfile.yearOfStudy || "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Permanent Address
                  </label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <p className="text-gray-900">
                      {user.studentProfile.permanentAddress || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Bio
                  </label>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl text-sm leading-relaxed">
                    {user.studentProfile.bio || "No bio provided"}
                  </p>
                </div>

                {user.studentProfile.emergencyContact && (
                  <div className="sm:col-span-2 bg-red-50 p-4 rounded-xl border border-red-100">
                    <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Emergency Contact
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-red-500 block text-xs uppercase font-semibold">
                          Name
                        </span>
                        <span className="text-gray-900 font-medium">
                          {user.studentProfile.emergencyContact.name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-red-500 block text-xs uppercase font-semibold">
                          Relation
                        </span>
                        <span className="text-gray-900 font-medium">
                          {user.studentProfile.emergencyContact.relation ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-red-500 block text-xs uppercase font-semibold">
                          Phone
                        </span>
                        <span className="text-gray-900 font-medium">
                          {user.studentProfile.emergencyContact.phoneNumber ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, action: null, data: null })
        }
        onConfirm={() => {
          if (confirmDialog.action === "suspend") {
            handleSuspendUser();
          }
        }}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        variant="danger"
      />
    </div>
  );
}
