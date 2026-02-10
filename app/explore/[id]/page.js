"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";
import PropertyMap from "../../components/PropertyMap";
import { useAuth } from "../../context/AuthContext";
import { getPublicLandlordProfile } from "../../services/landlordService";
import { CheckCircle, Calendar } from "lucide-react";

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
        sessionStorage.setItem("showLoginModal", "true");
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
      setProperty(data);

      if (data.owner) {
        try {
          const landlordData = await getPublicLandlordProfile(data.owner);
          const landlordInfo = landlordData.profile || landlordData;
          if (landlordInfo && !landlordInfo._id && data.owner) {
            landlordInfo._id = data.owner;
          }
          setLandlord(landlordInfo);
        } catch (err) {
          console.error("Failed to fetch landlord profile:", err);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Property Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find the property you&apos;re looking for.
          </p>
          <Link
            href="/explore"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Explore
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white pt-16">
        {/* Main Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Image Gallery */}
          <div className="bg-gray-100 rounded-2xl overflow-hidden mb-6">
            {property.images && property.images.length > 0 ? (
              <div>
                {/* Main Image */}
                <div className="relative h-96 sm:h-[500px] bg-gray-900">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={`${property.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />

                  {/* Navigation Arrows */}
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === 0 ? property.images.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800/80 hover:bg-gray-800 text-white p-3 rounded-full transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === property.images.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800/80 hover:bg-gray-800 text-white p-3 rounded-full transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {property.images.length > 1 && (
                  <div className="bg-white p-4 flex gap-2 overflow-x-auto">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index
                            ? "border-blue-600 scale-105"
                            : "border-gray-200 opacity-60 hover:opacity-100"
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
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <span className="text-8xl">🏠</span>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Verified Badge */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {property.title}
                  </h1>
                  {property.verified && (
                    <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-semibold">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified Property
                    </div>
                  )}
                </div>
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {property.location?.address || property.address || "Location not specified"}
                </p>
              </div>

              {/* Highlights */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="font-semibold text-gray-900">
                        {property.gender === "UNISEX" ? "Co-ed" : property.gender?.charAt(0) + property.gender?.slice(1).toLowerCase() || "Any"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Availability</p>
                      <p className="font-semibold text-gray-900">Available Now</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="font-semibold text-gray-900">&lt; 1 km to Campus</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* About this place */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About this place</h2>
                <p className="text-gray-700 leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              <div>
                <div className="rounded-xl overflow-hidden border border-gray-200 h-64">
                  {property.location?.coordinates && property.location.coordinates.length === 2 ? (
                    <PropertyMap
                      coordinates={property.location.coordinates}
                      title={property.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      Map unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Property Owner Card */}
              {landlord && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Property Owner</h3>
                  <div className="flex items-start gap-3 mb-4">
                    {landlord.profileImage ? (
                      <img
                        src={landlord.profileImage}
                        alt={landlord.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {getInitials(landlord.name)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{landlord.name}</h4>
                        {landlord.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Member since {formatDate(landlord.memberSince || landlord.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                </div>
              )}

              {/* Interested Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Interested?</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  ₹{property.price?.toLocaleString("en-IN")}
                  <span className="text-base font-normal text-gray-600">/mo</span>
                </div>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors">
                    Book Now
                  </button>
                  {user && landlord && landlord._id && user.role !== 'LANDLORD' && user.role !== 'landlord' && (user._id !== landlord._id && user.id !== landlord._id) && (
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
                            const event = new CustomEvent("openChat", {
                              detail: { conversation: data.conversation }
                            });
                            window.dispatchEvent(event);
                          } else {
                            const error = await res.json();
                            alert(`Failed to start conversation: ${error.message || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error("Error starting conversation:", error);
                          alert("Failed to start conversation");
                        }
                      }}
                      className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                    >
                      Contact Landlord
                    </button>
                  )}
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">
                  Secure booking • Verified Landlord
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
