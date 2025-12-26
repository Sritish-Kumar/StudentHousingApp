"use client";

import { useState } from "react";

export default function HomeContent() {
  const [activeFilter, setActiveFilter] = useState("all");

  const properties = [
    {
      id: 1,
      title: "Modern Studio near MIT",
      price: "$1,200",
      distance: "0.3 mi",
      image: "🏢",
    },
    {
      id: 2,
      title: "Shared 2BR - Harvard Sq",
      price: "$850",
      distance: "0.5 mi",
      image: "🏠",
    },
    {
      id: 3,
      title: "Cozy 1BR with Parking",
      price: "$1,400",
      distance: "0.8 mi",
      image: "🏘️",
    },
    {
      id: 4,
      title: "Luxury Apartment",
      price: "$1,800",
      distance: "1.2 mi",
      image: "🏛️",
    },
  ];

  return (
    <>
      {/* Split-Screen Hero - Asymmetric 60/40 */}
      <section className="min-h-screen flex flex-col lg:flex-row">
        {/* Left: Content - 60% */}
        <div className="lg:w-[60%] bg-gradient-to-br from-blue-50 via-white to-gray-50 px-6 sm:px-12 lg:px-20 py-20 lg:py-32 flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="inline-block mb-6 px-4 py-2 bg-blue-600/10 rounded-full border border-blue-600/20">
              <span className="text-blue-700 text-sm font-medium">
                Live • 847 properties available
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
              <button className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                Search
              </button>
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
                  850+
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
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Modern Studio
              </h3>
              <p className="text-blue-100 mb-4">
                0.2 mi from campus • Verified
              </p>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">
                  $1,200<span className="text-lg text-blue-100">/mo</span>
                </div>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300">
                  View
                </button>
              </div>
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
          {properties.map((property, index) => (
            <div
              key={property.id}
              className="min-w-[320px] bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-6 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {property.image}
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                {property.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-zinc-600 mb-4">
                <span>📍 {property.distance}</span>
                <span>•</span>
                <span>✓ Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-600">
                  {property.price}
                  <span className="text-sm text-zinc-600">/mo</span>
                </div>
                <button className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300">
                  Details
                </button>
              </div>
            </div>
          ))}
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
                  <div className="text-2xl mb-2">✓</div>
                  <div className="text-sm font-semibold text-zinc-900">
                    In-person verification
                  </div>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 transition-all duration-300">
                  <div className="text-2xl mb-2">📸</div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Real photos only
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl p-12 aspect-square flex items-center justify-center text-8xl group-hover:scale-105 transition-transform duration-500">
                  🏠
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl">
                Start Searching
              </button>
            </div>
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl p-12 aspect-square flex items-center justify-center text-8xl group-hover:scale-105 transition-transform duration-500">
                  ⚡
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
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Property Grid - 70% */}
            <div className="lg:w-[70%]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-zinc-900">
                  247 properties found
                </h3>
                <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-600 focus:outline-none">
                  <option>Closest first</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property, index) => (
                  <div
                    key={property.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer group"
                  >
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 h-48 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                      {property.image}
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-zinc-900 mb-2">
                        {property.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 mb-4">
                        <span>📍 {property.distance}</span>
                        <span>•</span>
                        <span className="text-blue-600">✓ Verified</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-600">
                          {property.price}
                          <span className="text-sm text-zinc-600">/mo</span>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-300">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
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
              <button className="bg-white text-blue-600 px-10 py-5 rounded-xl text-lg font-bold hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                Browse Properties
              </button>
              <button className="border-2 border-white text-white px-10 py-5 rounded-xl text-lg font-bold hover:bg-white/10 transition-all duration-300 hover:scale-105">
                List Your Property
              </button>
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
                  <div className="text-4xl font-bold text-white">850+</div>
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
