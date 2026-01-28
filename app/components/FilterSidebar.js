"use client";

export default function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  userLocation,
  isLocating,
  locationError,
  onNearbyMe,
  onClearLocation,
}) {
  const priceRanges = [
    { label: "₹5K-₹10K", min: 5000, max: 10000 },
    { label: "₹10K-₹15K", min: 10000, max: 15000 },
    { label: "₹15K-₹25K", min: 15000, max: 25000 },
    { label: "₹25K+", min: 25000, max: 999999 },
  ];

  const distances = [
    { label: "< 1 km", value: 1 },
    { label: "< 2 km", value: 2 },
    { label: "< 5 km", value: 5 },
    { label: "5+ km", value: 999 },
  ];

  const propertyTypes = [
    { label: "Studio", value: "studio" },
    { label: "1 Bedroom", value: "1br" },
    { label: "2 Bedroom", value: "2br" },
    { label: "3+ Bedroom", value: "3br+" },
    { label: "Shared Room", value: "shared" },
  ];

  const amenitiesList = [
    "Parking",
    "Furnished",
    "Utilities Included",
    "WiFi",
    "Laundry",
    "Pet Friendly",
    "Air Conditioning",
  ];

  const genderOptions = [
    { label: "All", value: "" },
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
    { label: "Co-ed", value: "UNISEX" },
  ];

  const handlePriceChange = (range) => {
    onFilterChange({
      ...filters,
      priceMin: range.min,
      priceMax: range.max,
    });
  };

  const handleDistanceChange = (distance) => {
    onFilterChange({
      ...filters,
      maxDistance: distance,
    });
  };

  const handleAmenityToggle = (amenity) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];

    onFilterChange({
      ...filters,
      amenities: newAmenities,
    });
  };

  const handleVerifiedToggle = () => {
    onFilterChange({
      ...filters,
      verified: !filters.verified,
    });
  };

  const handleGenderChange = (gender) => {
    onFilterChange({
      ...filters,
      gender,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 mb-3 block">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            {priceRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => handlePriceChange(range)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${filters.priceMin === range.min &&
                    filters.priceMax === range.max
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-zinc-700 hover:bg-gray-200"
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 mb-3 block">
            Distance from Campus
          </label>
          <div className="space-y-2">
            {distances.map((dist) => (
              <label
                key={dist.label}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="distance"
                  checked={filters.maxDistance === dist.value}
                  onChange={() => handleDistanceChange(dist.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-700 group-hover:text-blue-600 transition-colors duration-300">
                  {dist.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 mb-3 block">
            Gender Preference
          </label>
          <div className="space-y-2">
            {genderOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="gender"
                  checked={filters.gender === option.value}
                  onChange={() => handleGenderChange(option.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-700 group-hover:text-blue-600 transition-colors duration-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="text-sm font-semibold text-zinc-700 mb-3 block">
            Amenities
          </label>
          <div className="space-y-2">
            {amenitiesList.map((amenity) => (
              <label
                key={amenity}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={(filters.amenities || []).includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-700 group-hover:text-blue-600 transition-colors duration-300">
                  {amenity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Verified Only */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer group p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            <input
              type="checkbox"
              checked={filters.verified !== false} // Checked by default (true), unchecked only if explicitly false
              onChange={handleVerifiedToggle}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-zinc-900 block">
                Verified Properties Only
              </span>
              <span className="text-xs text-zinc-600">
                {filters.verified ? "Showing only verified listings" : "Showing all listings"}
              </span>
            </div>
          </label>
        </div>

        {/* Nearby Me */}
        <div className="border-t border-gray-200 pt-6">
          <label className="text-sm font-semibold text-zinc-700 mb-3 block">
            Location-Based Search
          </label>
          <button
            type="button"
            onClick={onNearbyMe}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${isLocating
                ? "bg-gray-100 cursor-not-allowed text-gray-400"
                : userLocation
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-md"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              }`}
          >
            {isLocating ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Locating...</span>
              </>
            ) : userLocation ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sorted by Distance</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Find Nearby Me</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {locationError && (
            <div className="mt-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-xs text-center">
              {locationError}
            </div>
          )}

          {/* Clear Location Button */}
          {userLocation && !isLocating && (
            <button
              type="button"
              onClick={onClearLocation}
              className="w-full mt-2 text-sm text-zinc-600 hover:text-zinc-900 underline"
            >
              Clear location sorting
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
