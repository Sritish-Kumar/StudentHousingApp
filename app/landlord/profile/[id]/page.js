"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPublicLandlordProfile } from "@/app/services/landlordService";
import {
  Building2,
  CheckCircle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from "lucide-react";

export default function PublicLandlordProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getPublicLandlordProfile(id);
      setProfile(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Landlord Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find the landlord profile you&apos;re looking for.
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            {/* Avatar */}
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-blue-500 shadow-lg">
                <span className="text-4xl font-bold text-white">
                  {getInitials(profile.name)}
                </span>
              </div>
            )}

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.name}
                </h1>
                {profile.isVerified && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {profile.companyName && (
                <p className="text-lg text-gray-600 flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5" />
                  {profile.companyName}
                </p>
              )}

              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member since {formatDate(profile.memberSince)}
              </p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Contact & Professional Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Email</p>
                  <p className="text-sm text-gray-900">{profile.email}</p>
                </div>
              </div>
              {profile.phoneNumber && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Phone</p>
                    <p className="text-sm text-gray-900">
                      {profile.phoneNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Professional Details
            </h2>
            <div className="space-y-3">
              {profile.yearsOfExperience !== null &&
                profile.yearsOfExperience !== undefined && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">
                        Experience
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile.yearsOfExperience}{" "}
                        {profile.yearsOfExperience === 1 ? "year" : "years"} in
                        property rental
                      </p>
                    </div>
                  </div>
                )}
              {profile.businessAddress && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">
                      Business Address
                    </p>
                    <p className="text-sm text-gray-900">
                      {profile.businessAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
