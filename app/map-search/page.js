"use client";

import dynamic from "next/dynamic";
import Head from "next/head";

// Import maplibre CSS globally
import "maplibre-gl/dist/maplibre-gl.css";

const Map = dynamic(() => import("../components/Map"), {
    ssr: false,
    loading: () => (
        <div style={{
            width: "100%",
            height: "600px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            fontSize: "18px",
            color: "#666"
        }}>
            Initializing Map...
        </div>
    )
});

export default function MapPage() {
    return (
        <>
            <Head>
                <title>Map Search | Student Housing</title>
            </Head>
            <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px", color: "#1a1a1a" }}>
                    Find Properties Nearby
                </h1>
                <p style={{ marginBottom: "24px", color: "#666" }}>
                    Explore student housing options near you. Use the map to find your perfect place.
                </p>

                <Map />
            </div>
        </>
    );
}
