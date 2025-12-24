"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import L from "leaflet";

// Dynamic imports for Leaflet plugins (to avoid SSR issues)
// In a real optimized app, we import these inside useEffect, but for simplicity we rely on 'window' checks or dynamic imports if available.
// Since leaflet-routing-machine attaches to 'L', we just need to ensure 'L' is global or imported.

// --- Helper Components ---

function MapController({ selectedProperty, userLocation, setRouteInfo }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Import plugins dynamically on client side
        (async () => {
            if (typeof window !== "undefined") {
                await import("leaflet-routing-machine");
                await import("leaflet-control-geocoder");
            }

            // Cleanup previous routing
            if (routingControlRef.current) {
                map.removeControl(routingControlRef.current);
                routingControlRef.current = null;
            }

            if (selectedProperty && userLocation && L.Routing) {
                const waypoints = [
                    L.latLng(userLocation.lat, userLocation.lng),
                    L.latLng(selectedProperty.location.lat, selectedProperty.location.lng)
                ];

                routingControlRef.current = L.Routing.control({
                    waypoints,
                    routeWhileDragging: false,
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: true,
                    showAlternatives: false,
                    lineOptions: {
                        styles: [{ color: '#0066ff', weight: 4, opacity: 0.7 }]
                    },
                    createMarker: () => null, // Don't create extra markers on route start/end
                }).on('routesfound', function (e) {
                    const routes = e.routes;
                    const summary = routes[0].summary;
                    // summary.totalDistance (meters), summary.totalTime (seconds)
                    setRouteInfo({
                        dist: (summary.totalDistance / 1000).toFixed(1),
                        time: Math.round(summary.totalTime / 60)
                    });
                }).addTo(map);
            }
        })();

        return () => {
            if (map && routingControlRef.current) {
                map.removeControl(routingControlRef.current);
            }
        };
    }, [map, selectedProperty, userLocation]);

    return null;
}


// --- Main Component ---

export default function PropertyMap() {
    const [properties, setProperties] = useState([]);
    const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 }); // User Location
    const [radius, setRadius] = useState(10);

    // UI States
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLocating, setIsLocating] = useState(false);

    // Icons
    const [icon, setIcon] = useState(null);
    const [userIcon, setUserIcon] = useState(null);

    useEffect(() => {
        // Initialize Icons
        const blueIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        });
        const redIcon = L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        });
        setIcon(blueIcon);
        setUserIcon(redIcon);

        // Fetch initial properties around default/current location
        fetchProperties(location.lat, location.lng, radius);
    }, []);

    const fetchProperties = async (lat, lng, r) => {
        try {
            const res = await fetch(`/api/properties/nearby?lat=${lat}&lng=${lng}&radius=${r}`);
            if (res.ok) {
                const data = await res.json();
                setProperties(data);
            }
        } catch (error) {
            console.error("Fetch failed", error);
        }
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lng: longitude });
                fetchProperties(latitude, longitude, radius);
                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                alert("Location access denied");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const newLoc = { lat: parseFloat(lat), lng: parseFloat(lon) };
            setLocation(newLoc);
            fetchProperties(newLoc.lat, newLoc.lng, radius);
            // setLocation updates map center via re-render if we had a <ChangeView> but here we let MapController/user handle it or we should add a Recenter helper
        }
    };

    // Helper to recenter map when location changes
    function RecenterMap({ center }) {
        const map = useMap();
        useEffect(() => {
            map.setView(center, 13, { animate: true });
        }, [center]);
        return null;
    }

    if (!icon || !userIcon) return <div className="h-[600px] bg-gray-100 animate-pulse rounded-lg"></div>;

    return (
        <div className="relative w-full h-[80vh] rounded-xl overflow-hidden shadow-2xl border border-gray-200 font-sans">

            {/* --- Top Floating Search Bar --- */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%] max-w-md">
                <form onSubmit={handleSearch} className="flex shadow-lg rounded-full overflow-hidden">
                    <input
                        className="flex-1 px-5 py-3 text-gray-700 bg-white focus:outline-none"
                        placeholder="Search for a location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="bg-white px-4 text-gray-500 hover:text-blue-600 border-l">
                        🔍
                    </button>
                </form>
            </div>

            {/* --- Floating Action Buttons (Right) --- */}
            <div className="absolute top-24 right-4 z-[1000] flex flex-col gap-3">
                <button
                    onClick={handleLocateMe}
                    className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all text-xl"
                    title="Locate Me"
                >
                    {isLocating ? '⏳' : '📍'}
                </button>
            </div>

            {/* --- Bottom Sheet / Info Panel (Like Rapido/Uber) --- */}
            {selectedProperty && (
                <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white rounded-xl shadow-2xl p-4 animate-slide-up transition-all transform">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{selectedProperty.title}</h2>
                            <p className="text-gray-500 text-sm">₹{selectedProperty.price}/mo • Student Housing</p>
                        </div>
                        <button
                            onClick={() => { setSelectedProperty(null); setRouteInfo(null); }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    {/* ETA Section */}
                    <div className="mt-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white p-2 rounded-full">
                                🚲
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Estimated Travel</p>
                                {routeInfo ? (
                                    <p className="text-blue-900 font-bold text-lg leading-none">
                                        {routeInfo.time} min <span className="text-sm font-normal text-gray-600">({routeInfo.dist} km)</span>
                                    </p>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Calculating...</p>
                                )}
                            </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition">
                            Book Now
                        </button>
                    </div>
                </div>
            )}

            <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <RecenterMap center={[location.lat, location.lng]} />

                {/* User Marker */}
                <Marker position={[location.lat, location.lng]} icon={userIcon}>
                    {/* No popup, just visual */}
                </Marker>

                {/* Property Markers */}
                {properties.map(p => (
                    <Marker
                        key={p.id}
                        position={[p.location.lat, p.location.lng]}
                        icon={icon}
                        eventHandlers={{
                            click: () => {
                                setSelectedProperty(p);
                                // Don't wipe route info yet, allow MapController to update it
                            },
                        }}
                    />
                ))}

                <MapController
                    selectedProperty={selectedProperty}
                    userLocation={location}
                    setRouteInfo={setRouteInfo}
                />

            </MapContainer>
        </div>
    );
}

// Ensure CSS for slide-up animation is global or inline
// For now, we rely on standard Tailwind classes or assumes simple transition.
