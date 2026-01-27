"use client";

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import LandlordPropertyCard from "../../components/LandlordPropertyCard";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandlordDashboard() {
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchMyProperties();
    }, []);

    const fetchMyProperties = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/landlord/properties");
            if (res.ok) {
                const data = await res.json();
                setProperties(data);
            } else {
                if (res.status === 403 || res.status === 401) {
                    // Not a landlord or not logged in
                    router.push("/explore"); // Redirect to explore or login
                }
                console.error("Failed to fetch properties");
            }
        } catch (error) {
            console.error("Error fetching properties", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const res = await fetch(`/api/properties/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            // Remove from state immediately
            setProperties((prev) => prev.filter((p) => p.id !== id));
        } else {
            alert("Failed to delete property");
        }
    };

    const handleEdit = (id) => {
        router.push(`/landlord/properties/${id}/edit`);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 pt-20 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Dashboard Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900">Landlord Dashboard</h1>
                            <p className="text-zinc-600">Manage your listings and view their status</p>
                        </div>

                        <Link
                            href="/landlord/properties/create" // Assumes this route or modal exists/will exist
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            List New Property
                        </Link>
                    </div>

                    {/* Metrics Overview (Optional but "Production Level") */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-zinc-500 font-semibold mb-2">Total Listings</div>
                            <div className="text-3xl font-bold text-blue-600">{properties.length}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-zinc-500 font-semibold mb-2">Active Approvals</div>
                            <div className="text-3xl font-bold text-green-600">
                                {properties.filter(p => p.verified).length}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-zinc-500 font-semibold mb-2">Pending Review</div>
                            <div className="text-3xl font-bold text-yellow-500">
                                {properties.filter(p => !p.verified).length}
                            </div>
                        </div>
                    </div>

                    {/* Properties Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                            <div className="text-6xl mb-4">🏠</div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">No properties listed yet</h3>
                            <p className="text-zinc-500 mb-6">Start earning by listing your student housing today.</p>
                            <Link
                                href="/landlord/properties/create"
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Create your first listing &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {properties.map((property) => (
                                <LandlordPropertyCard
                                    key={property.id}
                                    property={property}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </Layout>
    );
}
