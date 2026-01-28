"use client";

import Link from "next/link";

export default function PropertyCard({ property }) {
  const {
    id,
    title,
    description,
    price,
    distance,
    verified,
    amenities = [],
    gender,
    college,
    images = [],
  } = property;

  // Format price in INR
  const formattedPrice =
    typeof price === "number" ? `₹${price.toLocaleString("en-IN")}` : price;

  // Format distance
  const formattedDistance =
    typeof distance === "number"
      ? `${distance} mi`
      : distance?.toString().includes("km")
        ? distance
        : `${distance} mi`;

  // Get first 3 amenities for display
  const displayAmenities = amenities.slice(0, 3);

  return (
    <Link
      href={`/explore/${id}`}
      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer group"
    >
      {/* Property Image */}
      <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 h-48 overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl group-hover:scale-110 transition-transform duration-500">
              🏠
            </div>
          </div>
        )}

        {/* Verified Badge */}
        {verified && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </div>
        )}

        {/* Gender Badge */}
        {gender && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-zinc-700">
            {gender === "UNISEX"
              ? "Co-ed"
              : gender.charAt(0) + gender.slice(1).toLowerCase()}
          </div>
        )}

        {/* Image Count Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            {images.length}
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-zinc-900 mb-2 line-clamp-1">
          {title}
        </h3>

        {/* College */}
        {college && (
          <p className="text-sm text-zinc-600 mb-3 flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            {college}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-zinc-600 mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Distance & Amenities */}
        <div className="flex items-center gap-2 text-sm text-zinc-600 mb-4 flex-wrap">
          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
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
            {formattedDistance}
          </span>

          {displayAmenities.length > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                {displayAmenities.join(", ")}
                {amenities.length > 3 && ` +${amenities.length - 3}`}
              </span>
            </>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formattedPrice}
              <span className="text-sm text-zinc-600 font-normal">/mo</span>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-300">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}
