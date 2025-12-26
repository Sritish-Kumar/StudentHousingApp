"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";

// --- Professional SVG Icons ---
const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LocationArrowIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </svg>
);

const NavigationIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// --- Map Logic Components ---

function MapController({ destination, userLocation, setRouteInfo, transportMode, showRoute }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        let mounted = true;

        (async () => {
            // Dynamic import for client-side only libraries
            if (typeof window !== "undefined") {
                await import("leaflet-routing-machine");
            }

            if (!mounted) return;

            // Cleanup previous controller
            if (routingControlRef.current) {
                try { map.removeControl(routingControlRef.current); } catch (e) { }
                routingControlRef.current = null;
            }

            if (showRoute && destination && userLocation && L.Routing) {
                // Professional route colors
                // Drive: Blue, Walk: Green, Bike: Orange/Amber
                let lineColor = '#2563EB'; // Blue-600
                if (transportMode === 'walk') lineColor = '#16A34A'; // Green-600
                if (transportMode === 'bike') lineColor = '#EA580C'; // Orange-600

                routingControlRef.current = L.Routing.control({
                    waypoints: [
                        L.latLng(userLocation.lat, userLocation.lng),
                        L.latLng(destination.lat, destination.lng)
                    ],
                    routeWhileDragging: false,
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: true,
                    showAlternatives: false, // Keep UI clean
                    lineOptions: {
                        styles: [
                            { color: 'white', opacity: 0.8, weight: 8 }, // Border
                            { color: lineColor, opacity: 1, weight: 5 }  // Main line
                        ]
                    },
                    createMarker: () => null, // No default markers
                    containerClassName: 'hidden', // Hide the default instructions box
                }).on('routesfound', function (e) {
                    const summary = e.routes[0].summary;
                    const distKm = summary.totalDistance / 1000;

                    // Realistic speed adjustments (Routing machine defaults are sometimes off)
                    let speedFactor = 1;
                    // Leaflet routing machine is usually car-based. 
                    // Approx speeds: Car ~40km/h, Bike ~20km/h, Walk ~5km/h
                    // These are just modifiers if the base calculation is car-based
                    if (transportMode === 'walk') speedFactor = 8;
                    if (transportMode === 'bike') speedFactor = 2;

                    // But actually, OSRM (demo) gives time based on profile. 
                    // Since we can't easily switch profiles in the basic demo server effectively without api keys sometimes,
                    // we'll simulate the time adjustment for display perfection:

                    let adjustedTime = Math.round(summary.totalTime / 60);
                    if (transportMode === 'walk') adjustedTime *= 8;
                    if (transportMode === 'bike') adjustedTime *= 3;

                    setRouteInfo({
                        dist: distKm.toFixed(1),
                        time: adjustedTime || 1
                    });
                }).addTo(map);
            }
        })();

        return () => {
            mounted = false;
            if (routingControlRef.current) {
                try { map.removeControl(routingControlRef.current); } catch (e) { }
            }
        };
    }, [map, destination, userLocation, transportMode, showRoute]);

    return null;
}

function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView([center.lat, center.lng], 15, { animate: true, duration: 1.2 });
        }
    }, [center, map]);
    return null;
}

export default function PropertyMap() {
    const [userLocation, setUserLocation] = useState(null);
    const [destination, setDestination] = useState(null);
    const [destinationName, setDestinationName] = useState("");
    const [routeInfo, setRouteInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [transportMode, setTransportMode] = useState('drive');
    const [showRoute, setShowRoute] = useState(false);

    const searchTimeout = useRef(null);
    const watchId = useRef(null);

    // --- Clean, Professional Markers ---

    // User: Pulsing Blue Dot (Apple Maps style)
    const userIcon = L.divIcon({
        className: 'bg-transparent',
        html: `
            <div class="relative flex items-center justify-center w-6 h-6">
                <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping"></div>
                <div class="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

    // Destination: Modern Pin
    const destIcon = L.divIcon({
        className: 'bg-transparent',
        html: `
            <div class="relative group -top-8">
                <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white transform transition-transform group-hover:scale-110">
                    <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div class="w-2 h-1 bg-black/20 mx-auto rounded-full blur-sm mt-1"></div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });

    // --- Logic ---

    useEffect(() => {
        startTracking();
        return () => stopTracking();
    }, []);

    const startTracking = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);

        // 1. Initial Quick Fix
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                updateLocation(pos);
                setIsLocating(false);
            },
            (err) => {
                console.warn("Initial GPS failed, falling back to IP/Default", err);
                // Optional: IP Fallback here if needed, but GPS is preferred for nav apps
                if (!userLocation) setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Default Delhi
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );

        // 2. Watch for updates
        watchId.current = navigator.geolocation.watchPosition(
            updateLocation,
            null,
            { enableHighAccuracy: true, distanceFilter: 10 } // Update every 10 meters
        );
    };

    const stopTracking = () => {
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };

    const updateLocation = (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                // Bias search towards user location if available
                let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=in&limit=5`;
                if (userLocation) {
                    // Viewbox bias roughly 1 degree box around user (~100km)
                    const box = `${userLocation.lng - 1},${userLocation.lat + 1},${userLocation.lng + 1},${userLocation.lat - 1}`;
                    url += `&viewbox=${box}&bounded=0`; // bounded=0 means prefer but don't restrict strictly
                }

                const res = await fetch(url);
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (error) {
                console.error("Search error", error);
            }
        }, 300);
    };

    const handleSelectSuggestion = (s) => {
        setDestination({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
        setDestinationName(s.display_name);
        setSearchQuery(s.display_name.split(',')[0]);
        setShowSuggestions(false);
        setRouteInfo(null);
        setShowRoute(false);
    };

    const startNavigation = () => {
        if (!userLocation || !destination) return;

        const modeMap = { drive: 'driving', bike: 'bicycling', walk: 'walking' };
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=${modeMap[transportMode]}`;
        window.open(url, '_blank');
    };

    const center = userLocation || { lat: 28.6139, lng: 77.2090 };

    return (
        <div className="relative w-full h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">

            {/* --- Top Search Area --- */}
            <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none flex flex-col items-center">
                <div className="w-full max-w-md pointer-events-auto">
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 flex items-center p-3 transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        <div className="ml-2 mr-3">
                            <SearchIcon />
                        </div>
                        <input
                            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                            placeholder="Search destination..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>

                    {/* Suggestions Panel */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto">
                            {suggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectSuggestion(s)}
                                    className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-start gap-4 border-b border-gray-50 last:border-0 transition-colors group"
                                >
                                    <div className="mt-1 p-2 bg-gray-100 rounded-full text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <NavigationIcon />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{s.display_name.split(',')[0]}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-[250px]">{s.display_name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Location FAB --- */}
            <button
                onClick={startTracking}
                className="absolute top-24 right-4 z-[1000] bg-white w-12 h-12 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] flex items-center justify-center text-gray-700 hover:text-blue-600 hover:shadow-lg transition-all active:scale-95 border border-gray-100"
                title="Locate Me"
            >
                {isLocating ? <span className="animate-spin text-xl">◌</span> : <LocationArrowIcon />}
            </button>

            {/* --- Bottom Navigation Card (Responsive) --- */}
            {destination && (
                <div className="absolute bottom-6 left-4 right-4 z-[1000] flex justify-center pointer-events-none">
                    <div className="bg-white pointer-events-auto w-full max-w-md rounded-3xl shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] border border-gray-100 p-5 animate-in slide-in-from-bottom-10 duration-500">

                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 leading-tight">{destinationName.split(',')[0]}</h2>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{destinationName.split(',').slice(1).join(',')}</p>
                            </div>
                            <button
                                onClick={() => { setDestination(null); setShowRoute(false); setRouteInfo(null); setSearchQuery(""); }}
                                className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Transport Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl mb-5">
                            {[
                                { id: 'drive', label: 'Drive', icon: '🚗' },
                                { id: 'bike', label: 'Bike', icon: '🛵' },
                                { id: 'walk', label: 'Walk', icon: '🚶' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setTransportMode(mode.id)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${transportMode === mode.id
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <span>{mode.icon}</span>
                                    <span>{mode.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Route Stats */}
                        {showRoute && routeInfo && (
                            <div className="flex items-center justify-between mb-5 px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                <div>
                                    <span className="block text-2xl font-bold text-blue-600">{routeInfo.time} <span className="text-base font-medium">min</span></span>
                                    <span className="text-sm text-blue-400 font-medium">Est. Travel Time</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-gray-700">{routeInfo.dist} km</span>
                                    <span className="text-sm text-gray-400">Distance</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!showRoute ? (
                            <button
                                onClick={() => setShowRoute(true)}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98]"
                            >
                                Get Directions
                            </button>
                        ) : (
                            <button
                                onClick={startNavigation}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Navigate</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* --- Map Container --- */}
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={14}
                className="w-full flex-1 z-0 outline-none"
                zoomControl={false}
            >
                {/* Professional Light Tiles (CartoDB Voyager) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                    maxZoom={20}
                />

                <RecenterMap center={userLocation} />

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                        <Popup className="rounded-lg shadow-sm border-none">You</Popup>
                    </Marker>
                )}

                {destination && (
                    <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                        <Popup className="rounded-lg shadow-sm border-none font-semibold">{destinationName.split(',')[0]}</Popup>
                    </Marker>
                )}

                <MapController
                    destination={destination}
                    userLocation={userLocation}
                    setRouteInfo={setRouteInfo}
                    transportMode={transportMode}
                    showRoute={showRoute}
                />
            </MapContainer>

            <style jsx global>{`
                .leaflet-routing-container { display: none !important; }
                .leaflet-touch .leaflet-control-layers, .leaflet-touch .leaflet-bar { border: none !important; }
            `}</style>
        </div>
    );
}