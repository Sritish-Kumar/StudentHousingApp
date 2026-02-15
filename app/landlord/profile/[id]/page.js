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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ================= PROFILE HEADER ================= */}
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-[0_25px_70px_rgba(0,0,0,0.06)] p-10 mb-10">

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">

            {/* Avatar */}
            <div className="relative">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-xl">
                  <span className="text-4xl font-bold text-white font-montserrat">
                    {getInitials(profile.name)}
                  </span>
                </div>
              )}

              {/* Verification Badge Floating */}
              {profile.isVerified && (
                <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-2 rounded-full shadow-md">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">

              <h1 className="text-4xl font-bold text-gray-900 font-montserrat tracking-tight mb-2">
                {profile.name}
              </h1>

              {profile.companyName && (
                <p className="text-lg text-gray-600 flex items-center gap-2 mb-3 font-poppins">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  {profile.companyName}
                </p>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-500 font-nunito">
                <Calendar className="w-4 h-4" />
                Member since {formatDate(profile.memberSince)}
              </div>

            </div>
          </div>

          {/* Bio Section */}
          {profile.bio && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 font-raleway mb-4">
                About
              </h2>
              <p className="text-gray-600 leading-relaxed font-poppins max-w-3xl">
                {profile.bio}
              </p>
            </div>
          )}

        </div>


        {/* ================= DETAILS GRID ================= */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Contact Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-8">

            <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-2 font-raleway">
              <Mail className="w-5 h-5 text-indigo-600" />
              Contact Information
            </h2>

            <div className="space-y-6">

              <div className="flex items-start gap-4">
                <div className="bg-indigo-50 p-3 rounded-xl">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-nunito font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-gray-900 font-poppins text-sm">
                    {profile.email}
                  </p>
                </div>
              </div>

              {profile.phoneNumber && (
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-nunito font-semibold text-gray-500 uppercase tracking-wide">
                      Phone
                    </p>
                    <p className="text-gray-900 font-poppins text-sm">
                      {profile.phoneNumber}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>


          {/* Professional Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-8">

            <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-2 font-raleway">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Professional Details
            </h2>

            <div className="space-y-6">

              {profile.yearsOfExperience !== null &&
                profile.yearsOfExperience !== undefined && (
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-nunito font-semibold text-gray-500 uppercase tracking-wide">
                        Experience
                      </p>
                      <p className="text-gray-900 font-poppins text-sm">
                        {profile.yearsOfExperience}{" "}
                        {profile.yearsOfExperience === 1 ? "year" : "years"} in property rental
                      </p>
                    </div>
                  </div>
                )}

              {profile.businessAddress && (
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-nunito font-semibold text-gray-500 uppercase tracking-wide">
                      Business Address
                    </p>
                    <p className="text-gray-900 font-poppins text-sm">
                      {profile.businessAddress}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>


        {/* ================= BACK BUTTON ================= */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-8 py-3
                   bg-white border border-gray-200
                   hover:bg-gray-50
                   text-gray-700 font-semibold font-nunito
                   rounded-xl shadow-sm
                   transition-all duration-200"
          >
            ← Go Back
          </button>
        </div>

      </div>
    </div>
  );
}
