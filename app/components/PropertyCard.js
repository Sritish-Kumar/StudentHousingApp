"use client";

import Link from "next/link";

export default function PropertyCard({ property }) {
  const {
    id,
    title,
    description,
    address,
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

  // Format distance - handle both number and string formats
  const formattedDistance =
    distance === null || distance === undefined || distance === "0km"
      ? null
      : typeof distance === "string"
        ? distance // Already formatted as "X.Xkm" from API
        : `${distance}km`;

  // Get first 3 amenities for display
  const displayAmenities = amenities.slice(0, 3);

  return (
    <Link
      href={`/explore/${id}`}
      className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      {/* Property Image */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 h-48 overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl group-hover:scale-105 transition-transform duration-300">
              🏠
            </div>
          </div>
        )}

        {/* Verified Badge - Green with checkmark */}
        {verified && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Price */}
        <div className="text-xl font-bold text-gray-900 mb-1">
          {formattedPrice}
          <span className="text-sm text-gray-500 font-normal">/mo</span>
        </div>

        {/* ITER Testing Badge */}
        {college && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>ITER Testing</span>
          </div>
        )}

        {/* College/Location */}
        {college && (
          <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-2">
            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">Near {college}</span>
          </div>
        )}

        {/* Distance from campus */}
        {formattedDistance && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>{formattedDistance} from campus</span>
          </div>
        )}

        {/* Amenities */}
        <div className="flex items-center gap-2 text-xs text-gray-700">
          {displayAmenities.includes("WiFi") && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <span>WiFi</span>
            </div>
          )}
          {displayAmenities.includes("Furnished") && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Furnished</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
          View Details
        </button>
      </div>
    </Link>
  );
}
