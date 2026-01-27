"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export default function PropertyMap({ coordinates, title }) {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (map.current) return;

        // Default to New Delhi if no coordinates
        const center = coordinates || [77.2090, 28.6139];

        import("maplibre-gl").then((module) => {
            const maplibregl = module.default;

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        osm: {
                            type: "raster",
                            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                            tileSize: 256,
                            attribution: "&copy; OpenStreetMap Contributors"
                        }
                    },
                    layers: [
                        {
                            id: "osm",
                            type: "raster",
                            source: "osm"
                        }
                    ]
                },
                center: center,
                zoom: 14 // Closer zoom for property detail
            });

            // Add marker if coordinates exist
            if (coordinates) {
                new maplibregl.Marker({ color: "#2563eb" }) // Blue marker
                    .setLngLat(coordinates)
                    .setPopup(new maplibregl.Popup({ offset: 25 }).setText(title || "Property Location"))
                    .addTo(map.current);
            }
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [coordinates]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <div
                ref={mapContainer}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}