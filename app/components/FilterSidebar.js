"use client";

export default function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filters.priceMin === range.min &&
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
          <label className="flex items-center gap-3 cursor-pointer group p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <input
              type="checkbox"
              checked={filters.verified || false}
              onChange={handleVerifiedToggle}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-zinc-900 block">
                Verified Properties Only
              </span>
              <span className="text-xs text-zinc-600">
                Show only verified listings
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
