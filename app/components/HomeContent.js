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
      {/* Split-Screen Hero - Asymmetric 60/40 */}
      <section className="min-h-screen flex flex-col lg:flex-row">
        {/* Left: Content - 60% */}
        <div className="lg:w-[60%] bg-gradient-to-br from-blue-50 via-white to-gray-50 px-6 sm:px-12 lg:px-20 py-20 lg:py-32 flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="inline-block mt-4 mb-6 px-4 py-2 bg-blue-600/10 rounded-full border border-blue-600/20">
              <span className="text-blue-700 text-sm font-medium">
                Live • {totalCount} properties available
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 mb-6 leading-[1.1]">
              Find your place
              <span className="block text-blue-600 mt-2">near campus</span>
            </h1>

            <p className="text-xl text-zinc-600 mb-10 leading-relaxed">
              Search verified student housing within walking distance of your
              university.
            </p>

            {/* Inline Search */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Enter your university..."
                className="w-full px-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-600 focus:outline-none transition-all duration-300 bg-white shadow-sm hover:shadow-md"
              />
              <Link href="/explore">
                <button className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                  Search
                </button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 flex gap-8">
              <div className="group cursor-pointer">
                <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  10K+
                </div>
                <div className="text-sm text-zinc-600">Students</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  {properties.length}+
                </div>
                <div className="text-sm text-zinc-600">Properties</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  4.9★
                </div>
                <div className="text-sm text-zinc-600">Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Featured Property - 40% */}
        <div className="lg:w-[40%] bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden group rounded-3xl">
          <div className="relative h-full flex flex-col justify-end p-8 lg:p-12">
            {/* Badge */}
            <div className="absolute top-8 right-8 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
              <span className="text-white text-sm font-medium">Featured</span>
            </div>

            {/* Content Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 transform group-hover:scale-105 transition-all duration-500">
              {featuredProperty ? (
                <>
                  {featuredProperty.images &&
                  featuredProperty.images.length > 0 ? (
                    <div className="w-24 h-24 mb-4 rounded-xl overflow-hidden">
                      <img
                        src={featuredProperty.images[0]}
                        alt={featuredProperty.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Building2 className="w-24 h-24 text-white" />
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {featuredProperty.title}
                  </h3>
                  <p className="text-blue-100 mb-4">
                    {featuredProperty.college} •{" "}
                    {featuredProperty.verified ? "Verified" : "Pending"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">
                      ₹{featuredProperty.price.toLocaleString("en-IN")}
                      <span className="text-lg text-blue-100">/mo</span>
                    </div>
                    <button
                      onClick={(e) =>
                        handlePropertyClick(
                          e,
                          `/explore/${featuredProperty._id}`,
                        )
                      }
                      className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300"
                    >
                      View
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-32 h-32 text-white mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No Properties Yet
                  </h3>
                  <p className="text-blue-100">Check back soon for listings</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Property Carousel - Left Aligned */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="px-6 sm:px-12 lg:px-20 mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">
            Available now
          </h2>
          <p className="text-xl text-zinc-600">
            Properties ready for immediate move-in
          </p>
        </div>

        <div className="flex gap-6 px-6 sm:px-12 lg:px-20 overflow-x-auto pb-6 scrollbar-hide">
          {isLoadingProperties ? (
            <div className="text-zinc-600">Loading properties...</div>
          ) : (
            properties.slice(0, 4).map((property, index) => (
              <a
                key={property.id}
                href="/explore"
                onClick={(e) => handlePropertyClick(e, "/explore")}
              >
                <div
                  className="min-w-[320px] bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-6 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {property.images && property.images.length > 0 ? (
                    <div className="w-20 h-20 mb-4 rounded-xl overflow-hidden group-hover:scale-110 transition-transform duration-300">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                      {getPropertyIcon(index)}
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{property.college}</span>
                    <span>•</span>
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{property.price.toLocaleString("en-IN")}
                      <span className="text-sm text-zinc-600">/mo</span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300">
                      Details
                    </button>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Alternating Content Blocks - Staggered */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        {/* Block 1: Image Right */}
        <div className="px-6 sm:px-12 lg:px-20 mb-32">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 lg:pr-12">
              <div className="inline-block mb-4 px-4 py-1 bg-blue-100 rounded-full">
                <span className="text-blue-700 text-sm font-medium">
                  Verified Listings
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-6">
                Every property is verified by our team
              </h2>
              <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
                We personally visit and verify each listing to ensure quality,
                safety, and accuracy. No surprises, no hidden fees.
              </p>
              <div className="flex gap-4">
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 transition-all duration-300">
                  <div className="mb-2">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    In-person verification
                  </div>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 transition-all duration-300">
                  <div className="mb-2">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Real photos only
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative rounded-3xl overflow-hidden aspect-square group-hover:scale-105 transition-transform duration-500">
                  <img
                    src="/verified-home.jpg"
                    alt="Verified Properties"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: Image Left */}
        <div className="px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
            <div className="lg:w-1/2 lg:pl-12">
              <div className="inline-block mb-4 px-4 py-1 bg-blue-100 rounded-full">
                <span className="text-blue-700 text-sm font-medium">
                  Instant Booking
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-6">
                Book your room in minutes
              </h2>
              <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
                Secure payment, instant confirmation, and direct communication
                with landlords. Move-in ready properties available now.
              </p>
              <Link href="/explore">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  Start Searching
                </button>
              </Link>
            </div>
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative rounded-3xl overflow-hidden aspect-square group-hover:scale-105 transition-transform duration-500">
                  <img
                    src="/instant-booking.jpg"
                    alt="Instant Booking"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side: Filters + Grid */}
      <section className="py-20 bg-white">
        <div className="px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left: Filters - 30% */}
            <div className="lg:w-[30%]">
              <h3 className="text-2xl font-bold text-zinc-900 mb-6">
                Filter by
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-3 block">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    {["$500-$1K", "$1K-$1.5K", "$1.5K+"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setActiveFilter(range)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          activeFilter === range
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-100 text-zinc-700 hover:bg-gray-200"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-3 block">
                    Distance
                  </label>
                  <div className="space-y-2">
                    {["< 0.5 mi", "< 1 mi", "< 2 mi"].map((distance) => (
                      <label
                        key={distance}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-zinc-700 group-hover:text-blue-600 transition-colors duration-300">
                          {distance}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-3 block">
                    Amenities
                  </label>
                  <div className="space-y-2">
                    {["Parking", "Furnished", "Utilities incl."].map(
                      (amenity) => (
                        <label
                          key={amenity}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-zinc-700 group-hover:text-blue-600 transition-colors duration-300">
                            {amenity}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Property Grid - 70% */}
            <div className="lg:w-[70%]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-zinc-900">
                  6 newest properties
                </h3>
                <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-600 focus:outline-none">
                  <option>Closest first</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property, index) => (
                  <a
                    key={property.id}
                    href="/explore"
                    onClick={(e) => handlePropertyClick(e, "/explore")}
                  >
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer group">
                      {property.images && property.images.length > 0 ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 h-48 flex items-center justify-center">
                          <div className="group-hover:scale-110 transition-transform duration-500">
                            {getPropertyIcon(index)}
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-zinc-900 mb-2">
                          {property.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{property.college}</span>
                          <span>•</span>
                          <Check className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600">Verified</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-blue-600">
                            ₹{property.price.toLocaleString("en-IN")}
                            <span className="text-sm text-zinc-600">/mo</span>
                          </div>
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-300">
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diagonal CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 transform -skew-y-3 origin-top-left"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

        <div className="relative px-6 sm:px-12 lg:px-20">
          <div className="max-w-4xl">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to find your perfect student home?
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl">
              Join 10,000+ students who found their ideal housing through
              CampusNest. Start your search today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/explore">
                <button className="bg-white text-blue-600 px-10 py-5 rounded-xl text-lg font-bold hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  Browse Properties
                </button>
              </Link>
              <Link href="/explore">
                <button className="border-2 border-white text-white px-10 py-5 rounded-xl text-lg font-bold hover:bg-white/10 transition-all duration-300 hover:scale-105">
                  List Your Property
                </button>
              </Link>
            </div>
          </div>

          {/* Floating Stats Card */}
          <div className="absolute bottom-0 right-20 hidden lg:block">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 transform hover:scale-105 transition-all duration-500">
              <div className="flex gap-8">
                <div>
                  <div className="text-4xl font-bold text-white">10K+</div>
                  <div className="text-blue-100 text-sm">Happy Students</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">6+</div>
                  <div className="text-blue-100 text-sm">Properties</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
