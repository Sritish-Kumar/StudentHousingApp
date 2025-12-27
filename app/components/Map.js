"use client";

import { useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const userMarker = useRef(null);
    const destMarker = useRef(null);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        import('maplibre-gl').then((module) => {
            const maplibregl = module.default;

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        osm: {
                            type: "raster",
                            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                            tileSize: 256
                        }
                    },
                    layers: [{
                        id: "osm",
                        type: "raster",
                        source: "osm"
                    }]
                },
                center: [77.2090, 28.6139],
                zoom: 12
            });

            map.current.on('load', () => {
                setMapLoaded(true);
            });

            // Add zoom controls
            map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
        });

        return () => {
            if (map.current) map.current.remove();
        };
    }, []);

    // Live Location Tracking
    useEffect(() => {
        if (!navigator.geolocation || !mapLoaded) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lng = position.coords.longitude;
                const lat = position.coords.latitude;
                setUserLocation([lng, lat]);

                import('maplibre-gl').then((module) => {
                    const maplibregl = module.default;

                    if (!userMarker.current) {
                        // Create blue dot marker
                        const el = document.createElement('div');
                        el.style.width = '20px';
                        el.style.height = '20px';
                        el.style.backgroundColor = '#3b82f6';
                        el.style.border = '3px solid white';
                        el.style.borderRadius = '50%';
                        el.style.boxShadow = '0 0 0 rgba(59, 130, 246, 0.4)';
                        el.style.animation = 'pulse 2s infinite';

                        userMarker.current = new maplibregl.Marker({ element: el })
                            .setLngLat([lng, lat])
                            .addTo(map.current);

                        // Fly to user location once
                        map.current.flyTo({ center: [lng, lat], zoom: 14 });
                    } else {
                        userMarker.current.setLngLat([lng, lat]);
                    }
                });
            },
            (err) => console.warn("Location error:", err),
            { enableHighAccuracy: true, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [mapLoaded]);

    // Draw Route
    const drawRoute = async (from, to) => {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data.routes || !data.routes.length) return;

            const route = data.routes[0];

            // Remove existing route
            if (map.current.getSource("route")) {
                map.current.removeLayer("route");
                map.current.removeSource("route");
            }

            // Add route
            map.current.addSource("route", {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: route.geometry
                }
            });

            map.current.addLayer({
                id: "route",
                type: "line",
                source: "route",
                paint: {
                    "line-color": "#3b82f6",
                    "line-width": 5,
                    "line-opacity": 0.8
                }
            });

            // Set route info
            setRouteInfo({
                distance: (route.distance / 1000).toFixed(1),
                duration: Math.round(route.duration / 60)
            });

            // Fit bounds
            const coords = route.geometry.coordinates;
            const bounds = coords.reduce((bounds, coord) => bounds.extend(coord),
                new (await import('maplibre-gl')).default.LngLatBounds(coords[0], coords[0])
            );
            map.current.fitBounds(bounds, { padding: 80 });

        } catch (e) {
            console.error("Routing error:", e);
        }
    };

    // Handle place selection
    const onPlaceSelect = async (place) => {
        const [lng, lat] = place.geometry.coordinates;

        const maplibregl = (await import('maplibre-gl')).default;

        // Remove old destination marker
        if (destMarker.current) {
            destMarker.current.remove();
        }

        // Add new destination marker
        destMarker.current = new maplibregl.Marker({ color: "#ef4444" })
            .setLngLat([lng, lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setText(place.name))
            .addTo(map.current)
            .togglePopup();

        // Draw route if user location exists
        if (userLocation) {
            drawRoute(userLocation, [lng, lat]);
        } else {
            map.current.flyTo({ center: [lng, lat], zoom: 14 });
        }
    };

    const recenterUser = () => {
        if (userLocation && map.current) {
            map.current.flyTo({ center: userLocation, zoom: 15 });
        }
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "600px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>

            <SearchBar onSelect={onPlaceSelect} />

            {/* Route Info Card */}
            {routeInfo && (
                <div style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "20px",
                    zIndex: 50,
                    backgroundColor: "white",
                    padding: "16px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    minWidth: "200px"
                }}>
                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                        Trip Details
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a" }}>{routeInfo.duration}</span>
                        <span style={{ fontSize: "16px", fontWeight: 500, color: "#666" }}>min</span>
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                        Distance: <span style={{ fontWeight: 600, color: "#333" }}>{routeInfo.distance} km</span>
                    </div>
                </div>
            )}

            {/* Locate Me Button */}
            <button
                onClick={recenterUser}
                style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                    zIndex: 400,
                    backgroundColor: "white",
                    color: "#444",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "1px solid #ddd",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f8f8f8";
                    e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "white";
                    e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
            >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Locate Me</span>
            </button>

            <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
                    }
                }
            `}</style>
        </div>
    );
}
