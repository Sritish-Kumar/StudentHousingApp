"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";
import PropertyMap from "../../components/PropertyMap";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) throw new Error("Failed to fetch property details");
      const data = await res.json();
      console.log("Fetched property data:", data);
      console.log("Location data:", data.location);
      console.log("Location coordinates:", data.location?.coordinates);
      setProperty(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">
            Property Not Found
          </h1>
          <p className="text-zinc-600 mb-6">
            We couldn't find the property you're looking for.
          </p>
          <Link
            href="/explore"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Back to Explore
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
            {/* Image Gallery */}
            <div className="relative bg-gradient-to-br from-blue-100 to-indigo-50 overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <div className="relative">
                  {/* Main Image Display */}
                  <div className="relative h-96 bg-black">
                    <img
                      src={property.images[currentImageIndex]}
                      alt={`${property.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />

                    {/* Navigation Arrows */}
                    {property.images.length > 1 && (
                      <>
                        {/* Previous Button */}
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === 0
                                ? property.images.length - 1
                                : prev - 1,
                            )
                          }
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-zinc-900 p-3 rounded-full shadow-lg transition-all hover:scale-110"
                          aria-label="Previous image"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        {/* Next Button */}
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === property.images.length - 1
                                ? 0
                                : prev + 1,
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-zinc-900 p-3 rounded-full shadow-lg transition-all hover:scale-110"
                          aria-label="Next image"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                          {currentImageIndex + 1} / {property.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {property.images.length > 1 && (
                    <div className="bg-gray-900 px-4 py-3">
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {property.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${currentImageIndex === index
                              ? "ring-4 ring-blue-500 scale-105"
                              : "opacity-60 hover:opacity-100"
                              }`}
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 group">
                  <span className="text-9xl transform group-hover:scale-110 transition-transform duration-500">
                    🏠
                  </span>
                </div>
              )}

              {/* Verified Badge */}
              {property.verified && (
                <div className="absolute top-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-10">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Property
                </div>
              )}
            </div>

            <div className="p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row gap-10">
                {/* Left Column: Details */}
                <div className="flex-1 space-y-8">
                  {/* Title & Location */}
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 mb-3">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-2 text-zinc-600 text-lg">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {property.distance
                        ? `${property.distance} km from campus`
                        : "Near campus"}
                    </div>
                  </div>

                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-blue-600 text-sm font-semibold mb-1">
                        Monthly Rent
                      </p>
                      <p className="text-zinc-900 text-xl font-bold">
                        ₹{property.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      <p className="text-indigo-600 text-sm font-semibold mb-1">
                        Gender
                      </p>
                      <p className="text-zinc-900 text-xl font-bold capitalize">
                        {property.gender?.toLowerCase() || "Any"}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                      <p className="text-purple-600 text-sm font-semibold mb-1">
                        College
                      </p>
                      <p className="text-zinc-900 text-lg font-bold truncate">
                        {property.college}
                      </p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-emerald-600 text-sm font-semibold mb-1">
                        Status
                      </p>
                      <p className="text-zinc-900 text-xl font-bold">
                        Available
                      </p>
                    </div>
                  </div>

                  {/* Get Directions Button */}
                  <div>
                    <button
                      onClick={() => window.open(`/navigate/${property._id}`, '_blank')}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Get Live Directions
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Opens turn-by-turn navigation in new tab
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-4">
                      About this place
                    </h3>
                    <p className="text-zinc-600 leading-relaxed text-lg">
                      {property.description}
                    </p>
                  </div>

                  {/* Address */}
                  {property.address && (
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-4">
                        Address
                      </h3>
                      <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <svg
                          className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <p className="text-zinc-700 leading-relaxed text-lg">
                          {property.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {property.amenities?.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-4">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {property.amenities.map((amenity, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100"
                          >
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-zinc-700 font-medium">
                              {amenity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Map & Contact */}
                <div className="w-full lg:w-96 space-y-6">
                  {/* Action Card */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg top-24 sticky">
                    <h3 className="text-xl font-bold text-zinc-900 mb-6">
                      Interested?
                    </h3>

                    <div className="space-y-4">
                      <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-blue-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        Book Now
                      </button>
                      <button className="w-full bg-white text-zinc-700 border-2 border-gray-200 py-4 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all">
                        Contact Landlord
                      </button>
                    </div>

                    <p className="text-center text-xs text-zinc-400 mt-6">
                      Secure booking • Verified Landlord
                    </p>
                  </div>

                  {/* Map Preview */}
                  <div className="rounded-2xl overflow-hidden border border-gray-200 h-64 shadow-md bg-gray-100 relative">
                    {property.location?.coordinates &&
                      property.location.coordinates.length === 2 ? (
                      <PropertyMap
                        coordinates={property.location.coordinates}
                        title={property.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        Map unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
