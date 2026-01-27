"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import SearchBar from "./SearchBar";

export default function Map({ onLocationSelect, selectedLocation }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const userMarker = useRef(null);
    const destMarker = useRef(null);
    const selectedMarker = useRef(null);

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

            // Handle Map Click for Selection
            map.current.on('click', (e) => {
                if (onLocationSelect) {
                    const { lng, lat } = e.lngLat;
                    onLocationSelect({ lng, lat });
                }
            });

            // Add zoom controls
            map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
        });

        return () => {
            if (map.current) map.current.remove();
        };
    }, []);

    // Handle Selected Location Prop Updates
    useEffect(() => {
        if (!mapLoaded || !map.current || !selectedLocation) return;

        import('maplibre-gl').then((module) => {
            const maplibregl = module.default;
            const { lng, lat } = selectedLocation;

            if (selectedMarker.current) {
                selectedMarker.current.setLngLat([lng, lat]);
            } else {
                selectedMarker.current = new maplibregl.Marker({ color: "#ef4444", draggable: true })
                    .setLngLat([lng, lat])
                    .addTo(map.current);

                selectedMarker.current.on('dragend', () => {
                    const { lng, lat } = selectedMarker.current.getLngLat();
                    if (onLocationSelect) onLocationSelect({ lng, lat });
                });
            }

            // Fly to location if it's new
            map.current.flyTo({ center: [lng, lat], zoom: 15 });
        });
    }, [mapLoaded, selectedLocation]);


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
                        el.style.backgroundColor = '#ef4444'; // Red to match the "red rogo" request
                        el.style.border = '3px solid white';
                        el.style.borderRadius = '50%';
                        el.style.boxShadow = '0 0 0 rgba(239, 68, 68, 0.4)';
                        el.style.animation = 'pulse 2s infinite';
                        el.style.cursor = 'pointer';

                        userMarker.current = new maplibregl.Marker({ element: el })
                            .setLngLat([lng, lat])
                            .addTo(map.current);

                        // Clicking user location also selects it
                        el.addEventListener('click', () => {
                            if (onLocationSelect) onLocationSelect({ lng, lat });
                        });

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

    // Handle place selection from SearchBar
    const onPlaceSelect = async (place) => {
        const [lng, lat] = place.geometry.coordinates;

        // Update parent state
        if (onLocationSelect) {
            onLocationSelect({ lng, lat });
        }
    };

    const [isLocating, setIsLocating] = useState(false);

    const recenterUser = () => {
        setIsLocating(true);
        if (userLocation && map.current) {
            map.current.flyTo({
                center: userLocation,
                zoom: 16,
                speed: 0.8,
                curve: 1,
                essential: true
            });

            // Also select this location if the parent needs it
            if (onLocationSelect) {
                onLocationSelect({ lng: userLocation[0], lat: userLocation[1] });
            }
            setIsLocating(false);
        } else {
            // Trigger native request if not yet found
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const { longitude, latitude } = pos.coords;
                        setUserLocation([longitude, latitude]);

                        // Wait slightly for map ref to be safe or just use it
                        if (map.current) {
                            map.current.flyTo({ center: [longitude, latitude], zoom: 16 });
                        }

                        // Manually update marker if it doesn't exist yet via watchPosition
                        // This ensures "not showing the pin" is addressed
                        if (onLocationSelect) onLocationSelect({ lng: longitude, lat: latitude });
                        setIsLocating(false);
                    },
                    (error) => {
                        console.error("Error getting location", error);
                        alert("Could not access your location. Please check browser permissions.");
                        setIsLocating(false);
                    },
                    { enableHighAccuracy: true }
                );
            } else {
                setIsLocating(false);
            }
        }
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>

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
                type="button"
                onClick={recenterUser}
                disabled={isLocating}
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
                    transition: "all 0.2s",
                    opacity: isLocating ? 0.7 : 1
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
                {isLocating ? (
                    <div style={{ width: "20px", height: "20px", border: "2px solid #ccc", borderTopColor: "#333", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )}
                <span>{isLocating ? "Locating..." : "Locate Me"}</span>
            </button>

            <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
                    }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
