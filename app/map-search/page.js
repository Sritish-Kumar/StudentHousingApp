"use client";

import dynamic from "next/dynamic";
// Dynamic import is crucial for Leaflet in Next.js to avoid "window is not defined" error
const PropertyMap = dynamic(() => import("../components/PropertyMap"), {
    ssr: false,
    loading: () => <p className="text-center p-10">Loading Map...</p>
});

export default function MapPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Find Properties Nearby</h1>
            <p className="mb-4 text-gray-600">
                Explore student housing options near you. Use the slider to adjust the search radius.
            </p>

            <PropertyMap />
        </div>
    );
}
