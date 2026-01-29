"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";
import ImageUpload from "../../../components/ImageUpload";
import dynamic from "next/dynamic";

// Map component must be loaded dynamically for ssr: false
const Map = dynamic(() => import("../../../components/Map"), { ssr: false });

export default function CreatePropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    price: "",
    gender: "UNISEX",
    amenities: "",
    college: "",
    location: null, // { lat: number, lng: number }
    images: [], // Array of image URLs
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (latlng) => {
    setFormData((prev) => ({ ...prev, location: latlng }));
  };

  const handleImagesChange = (imageUrls) => {
    setFormData((prev) => ({ ...prev, images: imageUrls }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.location) {
      setError("Please select a location on the map.");
      setIsLoading(false);
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      setError("Please upload at least one image.");
      setIsLoading(false);
      return;
    }

    try {
      const amenitiesArray = formData.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        price: Number(formData.price),
        amenities: amenitiesArray,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create property");
      }

      // Success - Redirect to Dashboard
      router.push("/landlord/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">
            List a New Property
          </h1>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Property Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Modern Apartment near UCLA"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your property..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Property Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete address (Street, Area, City, Pincode)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                  minLength={10}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Minimum 10 characters, maximum 200 characters
                </p>
              </div>

              {/* Price & College */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="15000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">
                    Nearest College/University
                  </label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="e.g. Delhi University"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Gender & Amenities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">
                    Gender Preference
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  >
                    <option value="UNISEX">Any / Co-ed</option>
                    <option value="MALE">Male Only</option>
                    <option value="FEMALE">Female Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">
                    Amenities (Comma separated)
                  </label>
                  <input
                    type="text"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleChange}
                    placeholder="Wifi, AC, Parking, Gym"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Map Location */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Location (Click on map to pin)
                </label>
                <div className="h-[500px] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner group-hover:border-blue-400 transition-colors">
                  <Map
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={formData.location}
                    showSearch={false}
                  />
                </div>
                {formData.location ? (
                  <div className="flex items-center gap-2 mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in fade-in">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium">
                      Location pinned successfully!
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Use the <strong>"Locate Me"</strong> button or click on the
                    map.
                  </p>
                )}
              </div>

              {/* Property Images */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Property Images *
                </label>
                <ImageUpload
                  onImagesChange={handleImagesChange}
                  existingImages={formData.images}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload at least 1 image. The first image will be used as the
                  primary thumbnail.
                </p>
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Listing..." : "List Property"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
