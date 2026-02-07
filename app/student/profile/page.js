"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { getStudentProfile } from "../../services/studentService";
import {
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit,
  ShieldAlert,
} from "lucide-react";

export default function StudentProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getStudentProfile();
      setProfile(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="text-red-500 text-xl font-bold mb-4">
            Error loading profile
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  const studentProfile = profile.studentProfile || {};

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="flex items-end gap-6">
                  {studentProfile.profileImage ? (
                    <img
                      src={studentProfile.profileImage}
                      alt={profile.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(profile.name)}
                      </span>
                    </div>
                  )}
                  <div className="mb-1">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.name}
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/student/profile/edit")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

              {/* Bio Section */}
              {studentProfile.bio ? (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">
                    About Me
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {studentProfile.bio}
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                  <p className="text-blue-800 font-medium mb-2">
                    Complete your profile
                  </p>
                  <p className="text-blue-600 text-sm mb-4">
                    Add a bio and details to help landlords get to know you
                    better.
                  </p>
                  <button
                    onClick={() => router.push("/student/profile/edit")}
                    className="text-sm px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg border border-blue-200 hover:bg-blue-50 transition"
                  >
                    Add Details
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Academic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Academic Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">
                      Student ID
                    </label>
                    <p className="text-gray-900 font-medium">
                      {studentProfile.studentId || "Not added"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">
                      University
                    </label>
                    <p className="text-gray-900 font-medium">
                      {studentProfile.universityName || "Not added"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">
                      Course & Year
                    </label>
                    <p className="text-gray-900 font-medium">
                      {studentProfile.course ? (
                        <>
                          {studentProfile.course}
                          {studentProfile.yearOfStudy && (
                            <span className="text-gray-500 font-normal">
                              {" • "}
                              {studentProfile.yearOfStudy}
                            </span>
                          )}
                        </>
                      ) : (
                        "Not added"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal & Emergency Contact */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Address
                </h2>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">
                      Permanent Address
                    </label>
                    <p className="text-gray-900">
                      {studentProfile.permanentAddress || "Not added"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Emergency Contact
                </h2>
                {studentProfile.emergencyContact &&
                studentProfile.emergencyContact.name ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">
                          Contact Person
                        </label>
                        <p className="text-gray-900 font-medium">
                          {studentProfile.emergencyContact.name}
                          {studentProfile.emergencyContact.relation && (
                            <span className="text-gray-500 font-normal text-sm ml-2">
                              ({studentProfile.emergencyContact.relation})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">
                          Phone Number
                        </label>
                        <p className="text-gray-900 font-medium">
                          {studentProfile.emergencyContact.phoneNumber ||
                            "Not added"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No emergency contact added
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
