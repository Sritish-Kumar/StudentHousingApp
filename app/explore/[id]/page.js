"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";
import PropertyMap from "../../components/PropertyMap";
import BookingModal from "../../components/BookingModal";
import { useAuth } from "../../context/AuthContext";
import { getPublicLandlordProfile } from "../../services/landlordService";
import { CheckCircle, Calendar, ChevronLeft, ChevronRight, BedDouble, Bath, Ruler, Car, Sparkles, Home, FileText, List, MapPin } from "lucide-react";


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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);

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
          // Ensure we have the _id field
          if (landlordInfo) {
            landlordInfo._id =
              landlordInfo._id || landlordInfo.id || data.owner;
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

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Format distance for display
  const formatDistance = (km) => {
    if (km < 1) {
      return "< 1 km";
    } else if (km < 10) {
      return `${km.toFixed(1)} km`;
    } else {
      return `${Math.round(km)} km`;
    }
  };

  // Request user location and calculate distance
  useEffect(() => {
    if (!property?.location?.coordinates) return;

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    // Request user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        setUserLocation({ lat: userLat, lon: userLon });

        // Property coordinates are [longitude, latitude] in GeoJSON format
        const [propLon, propLat] = property.location.coordinates;

        // Calculate distance
        const dist = calculateDistance(userLat, userLon, propLat, propLon);
        setDistance(dist);
      },
      (error) => {
        console.log("Geolocation error:", error.message);
        // Silently fail - distance will remain null
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  }, [property]);

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  const handleBookNow = async () => {
    if (!user) {
      alert("Please login to book this property");
      return;
    }
    if (user.role !== "STUDENT") {
      alert("Only students can book properties");
      return;
    }
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    try {
      setBookingLoading(true);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property._id }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowBookingModal(false);
        alert(
          "Booking request sent successfully! The landlord will review your request.",
        );
        router.push("/student/bookings");
      } else {
        alert(data.message || "Failed to create booking request");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking request");
    } finally {
      setBookingLoading(false);
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
  // Property meta items
  const {
    bedrooms = 0,
    bathrooms = 0,
    sqft = 0,
    garage = 0,
  } = property || {};

  const metaItems = [
    { icon: BedDouble, value: bedrooms, label: bedrooms === 1 ? "Bedroom" : "Bedrooms" },
    { icon: Bath, value: bathrooms, label: bathrooms === 1 ? "Bathroom" : "Bathrooms" },
    { icon: Ruler, value: sqft, label: "sq ft" },
    { icon: Car, value: garage, label: garage === 1 ? "Garage" : "Garages" },
  ];

  const totalImages = property?.images?.length || 0;

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const goToPrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-10">
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-[0_25px_70px_rgba(0,0,0,0.08)] bg-white">

            {/* ================= MAIN IMAGE ================= */}
            <div className="relative h-[420px] md:h-[540px] bg-gradient-to-br from-gray-100 to-gray-200">

              {/* Image */}
              <img
                key={currentImageIndex}
                src={property.images[currentImageIndex]}
                alt={`Property image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain transition-all duration-500 ease-in-out"
              />

              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

              {/* ================= NAVIGATION ================= */}
              {totalImages > 1 && (
                <>
                  {/* Previous */}
                  <button
                    onClick={goToPrev}
                    aria-label="Previous image"
                    className="group absolute left-6 top-1/2 -translate-y-1/2
                     bg-white/10 backdrop-blur-xl
                     border border-white/20
                     text-white
                     p-3 rounded-full
                     shadow-lg
                     hover:bg-white/20
                     active:scale-95
                     transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                  </button>

                  {/* Next */}
                  <button
                    onClick={goToNext}
                    aria-label="Next image"
                    className="group absolute right-6 top-1/2 -translate-y-1/2
                     bg-white/10 backdrop-blur-xl
                     border border-white/20
                     text-white
                     p-3 rounded-full
                     shadow-lg
                     hover:bg-white/20
                     active:scale-95
                     transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </>
              )}

              {/* ================= COUNTER ================= */}
              {totalImages > 1 && (
                <div className="absolute bottom-6 right-6
                      bg-black/40 backdrop-blur-xl
                      border border-white/20
                      text-white text-sm font-medium font-nunito
                      px-4 py-1.5 rounded-full shadow-md">
                  {currentImageIndex + 1} / {totalImages}
                </div>
              )}
            </div>


            {/* ================= THUMBNAILS ================= */}
            {totalImages > 1 && (
              <div className="bg-white px-6 py-5 flex gap-4 overflow-x-auto scrollbar-hide">

                {property.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300
            ${currentImageIndex === index
                        ? "ring-2 ring-blue-600/90 scale-105 shadow-md"
                        : "opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Active Overlay */}
                    {currentImageIndex === index && (
                      <div className="absolute inset-0 border-2 border-blue-600/80 rounded-xl pointer-events-none" />
                    )}
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-poppins">
            <div className="lg:col-span-2 space-y-8">
              {/* ===== TITLE SECTION ===== */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
                      {property.title}
                    </h1>

                    <div className="mt-1 flex items-center gap-3 text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
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
                        <span className="text-sm sm:text-base font-montserrat">
                          {property.location?.address ||
                            property.address ||
                            "Location not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {property.verified && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-sm font-medium border border-emerald-200 font-nunito">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== PROPERTY HIGHLIGHTS ===== */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-900 mb-6 font-poppins">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Property Highlights
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-nunito">
                  {/* Gender */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Gender
                      </p>
                      <p className="font-semibold text-gray-900">
                        {property.gender === "UNISEX"
                          ? "Co-ed"
                          : property.gender?.charAt(0) +
                          property.gender?.slice(1).toLowerCase() || "Any"}
                      </p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Availability
                      </p>
                      <p className="font-semibold text-gray-900">
                        Available Now
                      </p>
                    </div>
                  </div>

                  {/* Distance */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Distance
                      </p>
                      <p className="font-semibold text-gray-900">
                        {distance !== null ? formatDistance(distance) : "Distance unavailable"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== PROPERTY OVERVIEW ===== */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-900 mb-6 font-poppins">
                  <Home className="w-5 h-5 text-blue-600" />
                  Property Overview
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-poppins">
                  {metaItems.map((item, index) => (
                    <div key={index} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors">
                      <item.icon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-lg font-bold text-gray-900">{item.value}</span>
                      <span className="text-sm text-gray-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== ABOUT SECTION ===== */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-900 mb-6 font-poppins">
                  <FileText className="w-5 h-5 text-blue-600" />
                  About this place
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base font-nunito">
                  {property.description}
                </p>
              </div>

              {/* ===== AMENITIES ===== */}
              {property.amenities?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-900 mb-6 font-poppins">
                    <List className="w-5 h-5 text-blue-600" />
                    Amenities
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6 font-nunito">
                    {property.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-gray-700 text-sm"
                      >
                        <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-gray-600"
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
                        </div>
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== MAP ===== */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-900 font-poppins">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Property Location
                  </h2>
                </div>

                <div className="h-72">
                  {property.location?.coordinates &&
                    property.location.coordinates.length === 2 ? (
                    <PropertyMap
                      coordinates={property.location.coordinates}
                      title={property.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                      Map unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* ===== PROPERTY OWNER CARD ===== */}
              {landlord && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900 mb-5">
                    Property Owner
                  </h3>

                  <div className="flex items-center gap-4 mb-5 font-nunito">
                    {landlord.profileImage ? (
                      <img
                        src={landlord.profileImage}
                        alt={landlord.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                        {getInitials(landlord.name)}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 font-montserrat">
                          {landlord.name}
                        </h4>

                        {landlord.isVerified && (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verified
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Member since{" "}
                        {formatDate(landlord.memberSince || landlord.createdAt)}
                      </p>
                    </div>
                  </div>
                  {landlord?._id ? (
                    <Link
                      href={`/landlord/profile/${landlord._id}`}
                      className="block w-full text-center bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      View Profile
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="w-full bg-white border border-gray-200 text-gray-400 py-2 rounded-lg font-medium cursor-not-allowed"
                      disabled
                    >
                      View Profile
                    </button>
                  )}
                </div>
              )}

              {/* Interested Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Interested?
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  ₹{property.price?.toLocaleString("en-IN")}
                  <span className="text-base font-normal text-gray-600">
                    /mo
                  </span>
                </div>
                <div className="space-y-3">
                  {user && user.role === "STUDENT" && (
                    <button
                      onClick={handleBookNow}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Book Now
                    </button>
                  )}
                  {user &&
                    landlord &&
                    landlord._id &&
                    user.role !== "LANDLORD" &&
                    user.role !== "landlord" &&
                    user._id !== landlord._id &&
                    user.id !== landlord._id && (
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
                                detail: { conversation: data.conversation },
                              });
                              window.dispatchEvent(event);
                            } else {
                              const error = await res.json();
                              alert(
                                `Failed to start conversation: ${error.message || "Unknown error"}`,
                              );
                            }
                          } catch (error) {
                            console.error(
                              "Error starting conversation:",
                              error,
                            );
                            alert("Failed to start conversation");
                          }
                        }}
                        className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                      >
                        Contact Landlord
                      </button>
                    )}
                </div>

                {/* Trust Indicators */}
                <div className="mt-3 pt-5 border-t border-gray-100 text-xs text-gray-500 space-y-1 text-center">
                  <p>Secure booking process</p>
                  <p>Verified landlord profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {property && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          property={property}
          onConfirm={confirmBooking}
        />
      )}
    </Layout>
  );
}
