"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";
import PropertyMap from "../../components/PropertyMap";
import { useAuth } from "../../context/AuthContext";
import { getPublicLandlordProfile } from "../../services/landlordService";
import { Building2, CheckCircle, Calendar, User } from "lucide-react";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, openLoginModal } = useAuth();
  const hasRedirected = useRef(false);

  const [property, setProperty] = useState(null);
  const [landlord, setLandlord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Check authentication - redirect if not logged in
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Set flag for login modal
        sessionStorage.setItem("showLoginModal", "true");
        // Redirect immediately
        window.location.href = "/";
      }
    }
  }, [user, authLoading]);

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

      // Fetch landlord profile if owner exists
      if (data.owner) {
        try {
          const landlordData = await getPublicLandlordProfile(data.owner);
          console.log("Fetched landlord data:", landlordData);
          // Handle both cases: landlordData.profile or landlordData directly
          const landlordInfo = landlordData.profile || landlordData;
          // Ensure we have the _id field
          if (landlordInfo && !landlordInfo._id && data.owner) {
            landlordInfo._id = data.owner;
          }
          setLandlord(landlordInfo);
          console.log("Set landlord:", landlordInfo);
        } catch (err) {
          console.error("Failed to fetch landlord profile:", err);
          // Set basic landlord info with owner ID so chat can still work
          setLandlord({ _id: data.owner, name: "Property Owner" });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything while checking auth or if not authenticated
  if (authLoading || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

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
                  {/* Property Header */}
                  <div className="mb-6">
                    <h1 className="text-4xl font-bold text-zinc-900 mb-2">
                      {property.title}
                    </h1>
                    <p className="text-zinc-600 flex items-center gap-2">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {property.location?.address || "Location not specified"}
                    </p>

                    {/* Landlord Badge */}
                    {landlord && (
                      <Link
                        href={`/landlord/profile/${landlord.id}`}
                        className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all duration-300 group"
                      >
                        {landlord.profileImage ? (
                          <img
                            src={landlord.profileImage}
                            alt={landlord.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-blue-400"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-400">
                            <span className="text-xs font-bold text-white">
                              {getInitials(landlord.name)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                            {landlord.name}
                          </span>
                          {landlord.isVerified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </Link>
                    )}
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
                      onClick={() =>
                        window.open(`/navigate/${property._id}`, "_blank")
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-3"
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
                          strokeWidth={2.5}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
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
                  {/* Landlord Info Card */}
                  {landlord && (
                    <Link
                      href={`/landlord/profile/${landlord.id}`}
                      className="block bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-900">
                          Property Owner
                        </h3>
                        <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Profile →
                        </span>
                      </div>

                      <div className="flex items-start gap-4 mb-4">
                        {landlord.profileImage ? (
                          <img
                            src={landlord.profileImage}
                            alt={landlord.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 group-hover:border-blue-600 transition-colors"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-500 group-hover:border-blue-600 transition-colors">
                            <span className="text-lg font-bold text-white">
                              {getInitials(landlord.name)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {landlord.name}
                            </h4>
                            {landlord.isVerified && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>

                          {landlord.companyName && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                              <Building2 className="w-4 h-4" />
                              {landlord.companyName}
                            </p>
                          )}

                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Member since {formatDate(landlord.memberSince)}
                          </p>
                        </div>
                      </div>

                      {landlord.bio && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {landlord.bio}
                          </p>
                        </div>
                      )}

                      {landlord.yearsOfExperience !== null &&
                        landlord.yearsOfExperience !== undefined && (
                          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-600 font-semibold mb-1">
                              Experience
                            </p>
                            <p className="text-sm text-gray-900 font-medium">
                              {landlord.yearsOfExperience}{" "}
                              {landlord.yearsOfExperience === 1
                                ? "year"
                                : "years"}{" "}
                              in property rental
                            </p>
                          </div>
                        )}
                    </Link>
                  )}

                  {/* Action Card */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg top-24 sticky">
                    <h3 className="text-xl font-bold text-zinc-900 mb-6">
                      Interested?
                    </h3>

                    <div className="space-y-4">
                      <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-blue-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        Book Now
                      </button>
                      <button
                        onClick={async () => {
                          if (!user) {
                            alert("Please login to contact the landlord");
                            return;
                          }
                          if (!landlord || !landlord._id) {
                            alert("Landlord information not available");
                            return;
                          }
                          try {
                            const res = await fetch("/api/conversations", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                propertyId: property._id,
                                landlordId: landlord._id,
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              // Dispatch event to open chat
                              const event = new CustomEvent("openChat", {
                                detail: { conversation: data.conversation }
                              });
                              window.dispatchEvent(event);
                            } else {
                              const error = await res.json();
                              console.error("Failed to start conversation:", error);
                              alert(`Failed to start conversation: ${error.message || 'Unknown error'}`);
                            }
                          } catch (error) {
                            console.error("Error starting conversation:", error);
                            alert("Failed to start conversation");
                          }
                        }}
                        className="w-full bg-white text-zinc-700 border-2 border-gray-200 py-4 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
                      >
                        Contact Landlord
                      </button>
                    </div>

                    <p className="text-center text-xs text-zinc-400 mt-6">
                      Secure booking • Verified Landlord
                    </p>
                  </div>

                  {/* Map Preview */}
                  <div
                    className="rounded-2xl overflow-hidden border border-gray-200 h-64 shadow-md bg-gray-100 relative"
                    style={{ zIndex: 0, isolation: "isolate" }}
                  >
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
