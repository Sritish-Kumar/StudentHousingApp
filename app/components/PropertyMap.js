"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function PropertyMap() {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (map.current) return; // already initialized

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
            center: [77.2090, 28.6139],
            zoom: 12
        });

        return () => map.current?.remove();
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "600px", border: "2px solid red" }}>
            <div
                ref={mapContainer}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}