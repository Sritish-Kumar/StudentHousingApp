"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import Link from "next/link";

export default function AdminPropertiesPage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("status") || "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null,
    propertyId: null,
  });

  useEffect(() => {
    fetchProperties();
  }, [activeTab, searchTerm]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/admin/properties?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched properties:", data);
        setProperties(data.properties || []);
      } else {
        const error = await res.json();
        console.error("Failed to fetch properties:", res.status, error);
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (propertyId) => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/verify`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });

      if (res.ok) {
        fetchProperties();
        setConfirmDialog({ isOpen: false, action: null, propertyId: null });
      }
    } catch (error) {
      console.error("Error verifying property:", error);
    }
  };

  const handleReject = async (propertyId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error("Error rejecting property:", error);
    }
  };

  const tabs = [
    { id: "all", label: "All Properties", count: properties.length },
    {
      id: "pending",
      label: "Pending",
      count: properties.filter((p) => !p.verified && !p.rejectedAt).length,
    },
    {
      id: "verified",
      label: "Verified",
      count: properties.filter((p) => p.verified).length,
    },
    {
      id: "rejected",
      label: "Rejected",
      count: properties.filter((p) => p.rejectedAt).length,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Property Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Review and manage all property listings
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search by title or college..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No properties found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Property Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-100">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-6xl">
                    🏠
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                  <StatusBadge
                    status={
                      property.rejectedAt
                        ? "rejected"
                        : property.verified
                          ? "verified"
                          : "pending"
                    }
                  />
                  {property.verifiedAt && (
                    <span className="text-xs font-medium text-gray-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                      {new Date(property.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {property.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                  {property.description}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    ₹{property.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {property.college}
                  </span>
                </div>

                {/* Owner Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">
                    Owner:{" "}
                    <span className="font-semibold text-gray-900">
                      {property.owner.name}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {property.owner.email}
                  </p>
                </div>

                {/* Rejection Reason */}
                {property.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">
                      <span className="font-semibold">Rejected:</span>{" "}
                      {property.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!property.verified && !property.rejectedAt && (
                    <>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            action: "verify",
                            propertyId: property.id,
                          })
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleReject(property.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <Link
                    href={`/explore/${property.id}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, action: null, propertyId: null })
        }
        onConfirm={() => handleVerify(confirmDialog.propertyId)}
        title="Verify Property"
        message="Are you sure you want to verify this property? It will be visible to all users."
        confirmText="Verify"
        variant="primary"
      />
    </div>
  );
}
