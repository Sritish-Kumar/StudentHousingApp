"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Home,
  Building,
  Landmark,
  MapPin,
  Check,
  Camera,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function HomeContent() {
  const router = useRouter();
  const { user, isLoading, openLoginModal } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [properties, setProperties] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [featuredProperty, setFeaturedProperty] = useState(null);

  // Handle property click with authentication check
  const handlePropertyClick = (e, path) => {
    e.preventDefault();
    if (!user) {
      // Open login modal directly
      openLoginModal();
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        // API returns array directly, not {properties: []}
        const allProperties = Array.isArray(data) ? data : [];
        // Store total count for display
        setTotalCount(allProperties.length);
        // Limit to 6 newest properties for homepage
        const newestProperties = allProperties.slice(0, 6);
        setProperties(newestProperties);
        // Set first verified property as featured, or first property if none verified
        const verified = newestProperties.find((p) => p.verified);
        setFeaturedProperty(verified || newestProperties[0] || null);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  // Icon mapping for variety
  const getPropertyIcon = (index) => {
    const icons = [Building2, Home, Building, Landmark];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-20 h-20 text-blue-600" />;
  };

  return (
    <>
      {/* Hero Section - Modern Split Design */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 sm:pt-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
              {/* Live Badge */}
              <div className="flex justify-center lg:justify-start">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 shadow-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>
                  <span className="text-sm font-semibold text-blue-900">
                    {totalCount} Live Properties
                  </span>
                </div>
              </div>

              {/* Heading */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-tight mb-4">
                  Find Your Dream
                  <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Student Home
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
                  Discover verified properties near campus. Book instantly. Join
                  10,000+ happy students.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto lg:mx-0">
                <div className="relative flex items-center bg-white rounded-2xl shadow-xl border-2 border-transparent focus-within:border-blue-500 transition-all">
                  <input
                    type="text"
                    placeholder="Search university or location..."
                    className="flex-1 px-5 sm:px-6 py-4 sm:py-5 text-sm sm:text-base rounded-2xl focus:outline-none"
                  />
                  <Link href="/explore">
                    <button className="m-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg">
                      Search
                    </button>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8">
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    10K+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">
                    Happy Students
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {properties.length}+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">
                    Properties
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    4.9★
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">
                    Average Rating
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Featured Property Card */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500">
                {featuredProperty ? (
                  <>
                    {/* Property Image */}
                    <div className="relative h-64 sm:h-80 overflow-hidden">
                      {featuredProperty.images &&
                      featuredProperty.images.length > 0 ? (
                        <img
                          src={featuredProperty.images[0]}
                          alt={featuredProperty.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Building2 className="w-20 h-20 text-white" />
                        </div>
                      )}
                      {/* Featured Badge */}
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                        ⭐ Featured
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="p-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        {featuredProperty.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {featuredProperty.college}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ₹{featuredProperty.price.toLocaleString("en-IN")}
                          </div>
                          <div className="text-xs text-gray-500">per month</div>
                        </div>
                        <button
                          onClick={(e) =>
                            handlePropertyClick(
                              e,
                              `/explore/${featuredProperty._id}`,
                            )
                          }
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <Building2 className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No Properties Yet
                    </h3>
                    <p className="text-gray-600">
                      Check back soon for listings
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Carousel */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Available Now
              </h2>
              <p className="text-gray-600">Ready for immediate move-in</p>
            </div>
            <Link href="/explore">
              <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group">
                View All
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </Link>
          </div>

          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {isLoadingProperties ? (
              <div className="text-gray-600">Loading properties...</div>
            ) : (
              properties.slice(0, 4).map((property, index) => (
                <a
                  key={property.id}
                  href="/explore"
                  onClick={(e) => handlePropertyClick(e, "/explore")}
                  className="min-w-[260px] sm:min-w-[300px] shrink-0"
                >
                  <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    {property.images && property.images.length > 0 ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        {getPropertyIcon(index)}
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{property.college}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-blue-600">
                          ₹{property.price.toLocaleString("en-IN")}
                          <span className="text-xs text-gray-500">/mo</span>
                        </div>
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose CampusNest?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make finding student housing simple, safe, and stress-free
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Verified Properties
              </h3>
              <p className="text-gray-600">
                Every listing is personally verified. Real photos, accurate
                details, zero surprises.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Instant Booking
              </h3>
              <p className="text-gray-600">
                Book your room in minutes with secure payment and instant
                confirmation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Near Campus
              </h3>
              <p className="text-gray-600">
                All properties within walking distance of major universities and
                colleges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Property Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Newest Properties
            </h3>
            <select className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none bg-white">
              <option>Closest first</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.slice(0, 6).map((property, index) => (
              <a
                key={property.id}
                href="/explore"
                onClick={(e) => handlePropertyClick(e, "/explore")}
              >
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  {property.images && property.images.length > 0 ? (
                    <div className="h-56 overflow-hidden">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-56 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      {getPropertyIcon(index)}
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {property.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{property.college}</span>
                      <span>•</span>
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-green-600 font-medium">
                        Verified
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-blue-600">
                        ₹{property.price.toLocaleString("en-IN")}
                        <span className="text-xs text-gray-500">/mo</span>
                      </div>
                      <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCAxIDQgNC0yIDQtNCA0LTQtMi00LTR6bTAgMjRjMC0yIDItNCA0LTRzNCAxIDQgNC0yIDQtNCA0LTQtMi00LTR6TTEyIDM0YzAtMiAyLTQgNC00czQgMSA0IDQtMiA0LTQgNC00LTItNC00em0wIDI0YzAtMiAyLTQgNC00czQgMSA0IDQtMiA0LTQgNC00LTItNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Find Your Perfect Home?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of students who found their ideal housing through
            CampusNest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/explore">
              <button className="w-full sm:w-auto bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl">
                Browse Properties
              </button>
            </Link>
            <Link href="/explore">
              <button className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all hover:scale-105">
                List Your Property
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
