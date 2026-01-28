"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import FilterSidebar from "../components/FilterSidebar";
import PropertyCard from "../components/PropertyCard";
import useDebounce from "../hooks/useDebounce";

export default function ExplorePage() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Suggestions
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 1) {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`/api/properties/autocomplete?q=${encodeURIComponent(debouncedSearch)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
          }
        } catch (err) {
          console.error("Suggestion fetch error", err);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch]);

  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    maxDistance: null,
    gender: "",
    amenities: [],
    verified: true, // Default to showing only verified properties
  });

  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Fetch properties from API
  useEffect(() => {
    fetchProperties();
  }, [filters, sortBy, userLocation]);

  const fetchProperties = async () => {
    setIsLoading(true);
    setLocationError(null);
    try {
      // Build query params
      const params = new URLSearchParams();

      if (filters.priceMin) params.append("priceMin", filters.priceMin);
      if (filters.priceMax) params.append("priceMax", filters.priceMax);
      if (filters.maxDistance) params.append("distance", filters.maxDistance);
      if (filters.gender) params.append("gender", filters.gender);
      // Always send verified parameter - true or false
      params.append("verified", filters.verified ? "true" : "false");
      if (searchTerm) params.append("college", searchTerm);

      // Add geolocation params if user location is available
      if (userLocation) {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
        // No radius - we want ALL properties sorted by distance
      }

      const response = await fetch(`/api/properties?${params.toString()}`);

      if (response.ok) {
        let data = await response.json();

        // Apply client-side sorting only if NOT using geolocation (API auto-sorts by distance)
        if (!userLocation) {
          data = sortProperties(data, sortBy);
        }

        setProperties(data);
      } else {
        console.error("Failed to fetch properties");
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNearbyMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setIsLocating(false);
        // Clear search term when using location to avoid conflicts
        setSearchTerm("");
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to retrieve your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const sortProperties = (props, sort) => {
    const sorted = [...props];

    switch (sort) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "distance":
        return sorted.sort((a, b) => {
          const distA =
            typeof a.distance === "number"
              ? a.distance
              : parseFloat(a.distance);
          const distB =
            typeof b.distance === "number"
              ? b.distance
              : parseFloat(b.distance);
          return distA - distB;
        });
      case "newest":
      default:
        return sorted; // Already sorted by createdAt desc from API
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      priceMin: null,
      priceMax: null,
      maxDistance: null,
      gender: "",
      amenities: [],
      verified: true, // Keep verified as true even when clearing filters
    });
    setSearchTerm("");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  // Count active filters (don't count verified=true as an active filter since it's default)
  const activeFilterCount = [
    filters.priceMin !== null,
    filters.maxDistance !== null,
    filters.gender !== "",
    filters.amenities?.length > 0,
    filters.verified === false, // Only count as active if user explicitly wants unverified
  ].filter(Boolean).length;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Explore Properties
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Find your perfect student home near campus
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl relative z-10">
              <div className="relative group">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search by college, title, or keyword..."
                  className="w-full px-6 py-4 text-lg border-2 border-white/20 bg-white/10 backdrop-blur-md rounded-2xl focus:border-white focus:outline-none transition-all duration-300 text-white placeholder-blue-200"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bg-white text-blue-600 px-6 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300"
                >
                  Search
                </button>

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-FULL left-0 w-full mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Suggestions
                      </div>
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion._id}
                          onClick={() => {
                            setSearchTerm(suggestion.title);
                            setShowSuggestions(false);
                            // Optional: Navigate directly
                            window.location.href = `/explore/${suggestion._id}`;
                          }}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between group/item transition-colors"
                        >
                          <div>
                            <div className="font-medium text-gray-900 group-hover/item:text-blue-600">
                              {suggestion.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {suggestion.college}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-300 group-hover/item:text-blue-500 opacity-0 group-hover/item:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between font-semibold text-zinc-900 hover:border-blue-300 transition-colors"
              >
                <span className="flex items-center gap-2">
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Mobile Filter Sidebar */}
              {showFilters && (
                <div className="mt-4">
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    activeFilterCount={activeFilterCount}
                    userLocation={userLocation}
                    isLocating={isLocating}
                    locationError={locationError}
                    onNearbyMe={handleNearbyMe}
                    onClearLocation={() => setUserLocation(null)}
                  />
                </div>
              )}
            </div>

            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={handleClearFilters}
                activeFilterCount={activeFilterCount}
                userLocation={userLocation}
                isLocating={isLocating}
                locationError={locationError}
                onNearbyMe={handleNearbyMe}
                onClearLocation={() => setUserLocation(null)}
              />
            </aside>

            {/* Properties Grid */}
            <main className="flex-1">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-zinc-900">
                  {isLoading
                    ? "Loading..."
                    : `${properties.length} ${properties.length === 1 ? "property" : "properties"} found`}
                </h2>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-zinc-700">
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="distance">Closest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-zinc-600">Loading properties...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && properties.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                    No properties found
                  </h3>
                  <p className="text-zinc-600 mb-6">
                    Try adjusting your filters or search criteria
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Properties Grid */}
              {!isLoading && properties.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
