"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";
import {
  getStudentProfile,
  updateStudentProfile,
} from "../../../services/studentService";
import ImageUpload from "../../../components/ImageUpload";
import {
  User,
  GraduationCap,
  BookOpen,
  MapPin,
  Phone,
  ShieldAlert,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function EditStudentProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    universityName: "",
    course: "",
    yearOfStudy: "",
    studentId: "",
    bio: "",
    permanentAddress: "",
    profileImage: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getStudentProfile();
      const student = data.profile.studentProfile || {};

      setFormData({
        universityName: student.universityName || "",
        course: student.course || "",
        yearOfStudy: student.yearOfStudy || "",
        studentId: student.studentId || "",
        bio: student.bio || "",
        permanentAddress: student.permanentAddress || "",
        profileImage: student.profileImage || "",
        emergencyContactName: student.emergencyContact?.name || "",
        emergencyContactRelation: student.emergencyContact?.relation || "",
        emergencyContactPhone: student.emergencyContact?.phoneNumber || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImagesChange = (images) => {
    setFormData((prev) => ({
      ...prev,
      profileImage: images.length > 0 ? images[0] : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate phone number if provided
      if (
        formData.emergencyContactPhone &&
        !/^\d{10}$/.test(formData.emergencyContactPhone)
      ) {
        throw new Error(
          "Emergency contact phone number must be exactly 10 digits",
        );
      }

      const updateData = {
        universityName: formData.universityName,
        course: formData.course,
        yearOfStudy: formData.yearOfStudy,
        studentId: formData.studentId,
        bio: formData.bio,
        permanentAddress: formData.permanentAddress,
        profileImage: formData.profileImage,
        emergencyContact: {
          name: formData.emergencyContactName,
          relation: formData.emergencyContactRelation,
          phoneNumber: formData.emergencyContactPhone,
        },
      };

      await updateStudentProfile(updateData);
      setSuccess("Profile updated successfully!");

      // Redirect after short delay
      setTimeout(() => {
        router.push("/student/profile");
      }, 1500);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
              <p className="text-blue-100 mt-1">
                Update your student information
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {/* Profile Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Profile Photo
                </label>
                <ImageUpload
                  onImagesChange={handleImagesChange}
                  existingImages={
                    formData.profileImage ? [formData.profileImage] : []
                  }
                  maxImages={1}
                />
              </div>

              {/* Academic Info */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Academic Details
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University Name
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="universityName"
                        value={formData.universityName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                        placeholder="e.g. Stanford University"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                        placeholder="e.g. ST123456"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course / Major
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year of Study
                    </label>
                    <select
                      name="yearOfStudy"
                      value={formData.yearOfStudy}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none bg-white"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  About Me
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({formData.bio.length}/500)
                  </span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none resize-none"
                  placeholder="Tell landlords a bit about yourself..."
                />
              </div>

              {/* Address & Emergency Contact */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permanent Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                      placeholder="Your home address"
                    />
                  </div>
                </div>

                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                  <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-4 h-4" />
                    Emergency Contact
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-red-700 mb-1 uppercase">
                        Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition outline-none"
                        placeholder="Contact Person Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-red-700 mb-1 uppercase">
                        Relation
                      </label>
                      <input
                        type="text"
                        name="emergencyContactRelation"
                        value={formData.emergencyContactRelation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition outline-none"
                        placeholder="e.g. Parent, Guardian"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-red-700 mb-1 uppercase">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-red-400" />
                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition outline-none"
                          placeholder="xxxxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-70 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
