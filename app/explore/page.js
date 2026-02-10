"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import FilterSidebar from "../components/FilterSidebar";
import PropertyCard from "../components/PropertyCard";
import useDebounce from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";

export default function ExplorePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, openLoginModal } = useAuth();
  const hasRedirected = useRef(false);

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    maxDistance: null,
    gender: "",
    amenities: [],
    verified: true,
  });

  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

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
        return sorted;
    }
  };

  const fetchProperties = async () => {
    setIsLoading(true);
    setLocationError(null);
    try {
      const params = new URLSearchParams();

      if (filters.priceMin) params.append("priceMin", filters.priceMin);
      if (filters.priceMax) params.append("priceMax", filters.priceMax);
      if (filters.maxDistance) params.append("distance", filters.maxDistance);
      if (filters.gender) params.append("gender", filters.gender);
      params.append("verified", filters.verified ? "true" : "false");
      if (searchTerm) params.append("college", searchTerm);

      if (userLocation) {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
      }

      const response = await fetch(`/api/properties?${params.toString()}`);

      if (response.ok) {
        let data = await response.json();

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
        setSearchTerm("");
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to retrieve your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please enable location access in your browser settings.";
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
      },
    );
  };

  useEffect(() => {
    console.log("Auth check - authLoading:", authLoading, "user:", user);
    if (!authLoading) {
      if (!user) {
        console.log("No user detected, redirecting to home...");
        sessionStorage.setItem("showLoginModal", "true");
        console.log("SessionStorage set, redirecting now...");
        window.location.href = "/";
      } else {
        console.log("User is authenticated:", user);
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 1) {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(
            `/api/properties/autocomplete?q=${encodeURIComponent(debouncedSearch)}`,
          );
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

  useEffect(() => {
    fetchProperties();
  }, [filters, sortBy, userLocation]);

  if (authLoading || !user) {
    console.log("Showing loading - authLoading:", authLoading, "user:", user);
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

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
      verified: true,
    });
    setSearchTerm("");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const activeFilterCount = [
    filters.priceMin !== null,
    filters.maxDistance !== null,
    filters.gender !== "",
    filters.amenities?.length > 0,
    filters.verified === false,
  ].filter(Boolean).length;

  return (
    <Layout>
      <div className="min-h-screen bg-white pt-16">
        {/* Breadcrumb */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">Explore Properties</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
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
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 flex items-center justify-between text-gray-900 font-medium hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

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

              {/* Results Count */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isLoading
                    ? "Loading properties..."
                    : `${properties.length} ${properties.length === 1 ? "property" : "properties"} found`}
                </h1>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && properties.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No properties found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search criteria
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Properties Grid */}
              {!isLoading && properties.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
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
