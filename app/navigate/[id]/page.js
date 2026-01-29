"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const LiveNavigation = dynamic(() => import("@/app/components/LiveNavigation"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <div className="text-xl font-semibold text-gray-700">Initializing Navigation...</div>
                <div className="text-sm text-gray-500 mt-2">Getting your location</div>
            </div>
        </div>
    )
});

export default function NavigatePage() {
    const { id } = useParams();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const res = await fetch(`/api/properties/${id}`);
            if (!res.ok) throw new Error("Property not found");

            const data = await res.json();
            setProperty(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-xl font-semibold text-gray-700">Loading Property...</div>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</div>
                    <div className="text-gray-600 mb-6">{error || "Unable to load property details"}</div>
                    <button
                        onClick={() => window.close()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <LiveNavigation
            destination={{
                coordinates: property.location.coordinates
            }}
            propertyTitle={property.title}
        />
    );
}
