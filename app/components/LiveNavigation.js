"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export default function LiveNavigation({ destination, propertyTitle }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const userMarker = useRef(null);
    const destinationMarker = useRef(null);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [route, setRoute] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [bearing, setBearing] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const [error, setError] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [showTurnByTurn, setShowTurnByTurn] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const watchId = useRef(null);
    const lastPosition = useRef(null);
    const lastSpokenStep = useRef(-1);

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
                center: destination.coordinates,
                zoom: 14,
                pitch: 0,
                bearing: 0
            });

            map.current.on('load', () => {
                console.log("Map loaded successfully");
                setMapLoaded(true);
            });

            // Add zoom controls
            map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
        });

        return () => {
            if (watchId.current) {
                navigator.geolocation.clearWatch(watchId.current);
            }
            if (map.current) map.current.remove();
        };
    }, [destination.coordinates]);

    // Add destination marker when map loads
    useEffect(() => {
        if (!mapLoaded || !map.current) return;

        import('maplibre-gl').then((module) => {
            const maplibregl = module.default;

            // Create destination marker (red)
            const el = document.createElement('div');
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.backgroundColor = '#ef4444';
            el.style.border = '3px solid white';
            el.style.borderRadius = '50%';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

            destinationMarker.current = new maplibregl.Marker({ element: el })
                .setLngLat(destination.coordinates)
                .addTo(map.current);

            console.log("Destination marker added");
        });
    }, [mapLoaded, destination.coordinates]);

    // Start live tracking
    useEffect(() => {
        if (!mapLoaded) return;

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setIsLoadingLocation(false);
            return;
        }

        console.log("Starting geolocation...");

        // First, get current position once
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude, speed: gpsSpeed, heading } = position.coords;
                const newLocation = [longitude, latitude];

                console.log("Got initial location:", newLocation);

                setUserLocation(newLocation);
                setIsLoadingLocation(false);
                setIsNavigating(true);

                if (gpsSpeed !== null && gpsSpeed > 0) setSpeed(gpsSpeed * 3.6);
                if (heading !== null) setBearing(heading);

                // Calculate initial route
                calculateRoute(newLocation);

                // Update user marker
                updateUserMarker(newLocation, heading);

                lastPosition.current = newLocation;

                // Now start watching position
                watchId.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        const { longitude, latitude, speed: gpsSpeed, heading } = pos.coords;
                        const loc = [longitude, latitude];

                        setUserLocation(loc);
                        if (gpsSpeed !== null && gpsSpeed > 0) setSpeed(gpsSpeed * 3.6);
                        if (heading !== null) setBearing(heading);

                        // Check if route needs recalculation
                        if (route && shouldRecalculateRoute(loc)) {
                            console.log("Recalculating route...");
                            calculateRoute(loc);
                        }

                        // Update user marker
                        updateUserMarker(loc, heading);

                        // Update current step based on proximity
                        updateCurrentStep(loc);

                        lastPosition.current = loc;
                    },
                    (err) => {
                        console.error("Location watch error:", err);
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 1000,
                        timeout: 10000
                    }
                );
            },
            (err) => {
                console.error("Initial location error:", err);
                setIsLoadingLocation(false);

                if (err.code === 1) {
                    setError("Location permission denied. Please enable location access in your browser settings.");
                } else if (err.code === 2) {
                    setError("Location unavailable. Please check your GPS settings.");
                } else if (err.code === 3) {
                    setError("Location request timed out. Please try again.");
                } else {
                    setError("Unable to get your location. Please enable GPS and refresh.");
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );

        return () => {
            if (watchId.current) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, [mapLoaded]);

    // Calculate route using OSRM
    const calculateRoute = async (from) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${destination.coordinates[0]},${destination.coordinates[1]}?overview=full&geometries=geojson&steps=true`;

            console.log("Fetching route from OSRM...");

            const res = await fetch(url);
            const data = await res.json();

            console.log("OSRM Response:", data);

            if (!data.routes || !data.routes.length) {
                console.error("No routes found in response");
                return;
            }

            const routeData = data.routes[0];
            console.log("Route distance:", routeData.distance, "meters");
            console.log("Route duration:", routeData.duration, "seconds");

            const distanceKm = (routeData.distance / 1000).toFixed(1);
            const etaMin = Math.round(routeData.duration / 60);

            setRoute(routeData);
            setDistance(distanceKm);
            setEta(etaMin);
            setCurrentStep(0);

            console.log("Set distance:", distanceKm, "km");
            console.log("Set ETA:", etaMin, "min");

            // Draw route on map (wait for map to be ready)
            setTimeout(() => {
                if (map.current && map.current.loaded()) {
                    drawRoute(routeData.geometry);
                    // Fit map to route
                    setTimeout(() => {
                        fitMapToRoute(routeData.geometry.coordinates);
                    }, 300);
                }
            }, 100);

        } catch (err) {
            console.error("Route calculation error:", err);
        }
    };

    // Draw route on map
    const drawRoute = (geometry) => {
        if (!map.current) {
            console.error("Map not initialized");
            return;
        }

        if (!map.current.loaded()) {
            console.error("Map not loaded yet");
            return;
        }

        console.log("Drawing route...");

        try {
            // Remove existing route if it exists
            if (map.current.getSource("route")) {
                console.log("Removing existing route");
                if (map.current.getLayer("route")) {
                    map.current.removeLayer("route");
                }
                map.current.removeSource("route");
            }

            // Add new route source
            map.current.addSource("route", {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: geometry
                }
            });

            console.log("Added route source");

            // Add route layer
            map.current.addLayer({
                id: "route",
                type: "line",
                source: "route",
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                    "visibility": "visible"
                },
                paint: {
                    "line-color": "#3b82f6",
                    "line-width": 5,
                    "line-opacity": 1
                }
            });

            console.log("Route layer added successfully - blue line should be visible");
        } catch (error) {
            console.error("Error drawing route:", error);
        }
    };

    // Update user marker with smooth animation
    const updateUserMarker = (location, heading) => {
        if (!map.current) return;

        import('maplibre-gl').then((module) => {
            const maplibregl = module.default;

            if (!userMarker.current) {
                // Create user marker (blue dot)
                const el = document.createElement('div');
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.backgroundColor = '#3b82f6';
                el.style.border = '3px solid white';
                el.style.borderRadius = '50%';
                el.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.3)';
                el.style.transition = 'transform 0.3s ease-out';

                userMarker.current = new maplibregl.Marker({ element: el })
                    .setLngLat(location)
                    .addTo(map.current);

                console.log("User marker created");
            } else {
                userMarker.current.setLngLat(location);
            }

            // Center map on user with smooth animation
            map.current.easeTo({
                center: location,
                zoom: 16,
                duration: 1000
            });
        });
    };

    // Check if route needs recalculation
    const shouldRecalculateRoute = (currentLocation) => {
        if (!route || !lastPosition.current) return false;

        // Calculate distance from last position
        const distanceMoved = calculateDistance(currentLocation, lastPosition.current);

        // Recalculate every 100m moved
        return distanceMoved > 0.1; // 100 meters in km
    };

    // Haversine distance formula
    const calculateDistance = (point1, point2) => {
        const R = 6371; // Earth radius in km
        const dLat = (point2[1] - point1[1]) * Math.PI / 180;
        const dLon = (point2[0] - point1[0]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Voice navigation - speak instruction
    const speakInstruction = (instruction, distanceMeters) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        let text = instruction;
        if (distanceMeters) {
            if (distanceMeters < 100) {
                text = `In ${Math.round(distanceMeters)} meters, ${instruction}`;
            } else if (distanceMeters < 1000) {
                text = `In ${Math.round(distanceMeters / 100) * 100} meters, ${instruction}`;
            }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        console.log("🔊 Speaking:", text);
        window.speechSynthesis.speak(utterance);
    };


    // Update current navigation step
    const updateCurrentStep = (location) => {
        if (!route || !route.legs || !route.legs[0].steps) return;

        const steps = route.legs[0].steps;

        for (let i = currentStep; i < steps.length; i++) {
            const step = steps[i];
            if (!step.maneuver || !step.maneuver.location) continue;

            const stepLocation = step.maneuver.location;
            const dist = calculateDistance(location, stepLocation);
            const distMeters = dist * 1000;

            // Announce upcoming turn when 200m away
            if (distMeters < 200 && distMeters > 50 && lastSpokenStep.current !== i) {
                speakInstruction(step.maneuver.instruction, distMeters);
                lastSpokenStep.current = i;
            }

            // If within 30m of next step, advance
            if (dist < 0.03 && i > currentStep) {
                setCurrentStep(i);
                // Speak the new instruction immediately
                speakInstruction(step.maneuver.instruction);
                break;
            }
        }
    };

    // Fit map to route bounds
    const fitMapToRoute = async (coordinates) => {
        if (!map.current || !coordinates.length) return;

        const maplibregl = (await import('maplibre-gl')).default;
        const bounds = coordinates.reduce(
            (bounds, coord) => bounds.extend(coord),
            new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );

        map.current.fitBounds(bounds, {
            padding: { top: 150, bottom: 350, left: 50, right: 50 },
            duration: 1000
        });
    };

    // Get current instruction
    const getCurrentInstruction = () => {
        if (!route || !route.legs || !route.legs[0].steps) return "Calculating route...";
        const step = route.legs[0].steps[currentStep];
        if (!step || !step.maneuver) return "Continue straight";
        return step.maneuver.instruction || "Continue";
    };

    // Get distance to next turn
    const getDistanceToNextTurn = () => {
        if (!route || !route.legs || !route.legs[0].steps || !userLocation) return null;
        const step = route.legs[0].steps[currentStep];
        if (!step || !step.maneuver || !step.maneuver.location) return null;

        const dist = calculateDistance(userLocation, step.maneuver.location);
        return (dist * 1000).toFixed(0); // Convert to meters
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            overflow: 'hidden'
        }}>
            {/* Map Container */}
            <div
                ref={mapContainer}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%'
                }}
            />

            {/* Loading State */}
            {isLoadingLocation && !error && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid #e5e7eb',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }}></div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Getting your location...</div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Please allow location access</div>
                    </div>
                </div>
            )}

            {/* Navigation Info Card */}
            {isNavigating && !error && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    right: '16px',
                    zIndex: 50,
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        padding: '20px',
                        border: '1px solid #e5e7eb'
                    }}>
                        {/* Current Instruction */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Next Turn</div>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: '#1f2937',
                                lineHeight: '1.3'
                            }}>
                                {getCurrentInstruction()}
                            </div>
                            {getDistanceToNextTurn() && (
                                <div style={{
                                    fontSize: '16px',
                                    color: '#3b82f6',
                                    marginTop: '4px',
                                    fontWeight: '600'
                                }}>
                                    in {getDistanceToNextTurn()}m
                                </div>
                            )}
                        </div>

                        {/* ETA and Distance */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid #e5e7eb',
                            paddingTop: '16px'
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>ETA</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                    {eta !== null ? `${eta} min` : "..."}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Distance</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                    {distance !== null ? `${distance} km` : "..."}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Speed</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                    {speed.toFixed(0)} km/h
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    right: '16px',
                    zIndex: 50,
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '16px',
                        padding: '16px'
                    }}>
                        <div style={{ color: '#991b1b', fontWeight: '600', marginBottom: '8px' }}>⚠️ Location Error</div>
                        <div style={{ color: '#7f1d1d', fontSize: '14px' }}>{error}</div>
                    </div>
                </div>
            )}

            {/* Exit Button */}
            <button
                onClick={() => window.close()}
                style={{
                    position: 'absolute',
                    bottom: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 50,
                    backgroundColor: 'white',
                    color: '#1f2937',
                    padding: '14px 32px',
                    borderRadius: '9999px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
                Exit Navigation
            </button>

            {/* Destination Info */}
            <div style={{
                position: 'absolute',
                bottom: '96px',
                left: '16px',
                right: '16px',
                zIndex: 50,
                maxWidth: '600px',
                margin: '0 auto'
            }}>
                {!showTurnByTurn && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '16px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Navigating to</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginTop: '2px' }}>{propertyTitle}</div>
                    </div>
                )}
            </div>

            {/* Turn-by-Turn Toggle Button */}
            {isNavigating && !error && route && (
                <>
                    <button
                        onClick={() => setShowTurnByTurn(!showTurnByTurn)}
                        style={{
                            position: 'absolute',
                            bottom: '180px',
                            right: '16px',
                            zIndex: 50,
                            backgroundColor: 'white',
                            color: '#1f2937',
                            padding: '12px',
                            borderRadius: '50%',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </button>

                    {/* Voice Toggle Button */}
                    <button
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        style={{
                            position: 'absolute',
                            bottom: '240px',
                            right: '16px',
                            zIndex: 50,
                            backgroundColor: voiceEnabled ? '#3b82f6' : 'white',
                            color: voiceEnabled ? 'white' : '#1f2937',
                            padding: '12px',
                            borderRadius: '50%',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            border: voiceEnabled ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                            cursor: 'pointer',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        {voiceEnabled ? (
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        )}
                    </button>
                </>
            )}

            {/* Turn-by-Turn Panel */}
            {showTurnByTurn && isNavigating && !error && route && route.legs && route.legs[0].steps && (
                <div style={{
                    position: 'absolute',
                    bottom: '96px',
                    left: '16px',
                    right: '16px',
                    zIndex: 51,
                    maxWidth: '600px',
                    margin: '0 auto',
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    border: '1px solid #e5e7eb'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'white',
                        borderRadius: '16px 16px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                            Turn-by-Turn Directions
                        </div>
                        <button
                            onClick={() => setShowTurnByTurn(false)}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#6b7280'
                            }}
                        >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Steps List */}
                    <div style={{ padding: '8px' }}>
                        {route.legs[0].steps.map((step, index) => {
                            const isCurrentStep = index === currentStep;
                            const isPastStep = index < currentStep;
                            const stepDistance = (step.distance / 1000).toFixed(2);

                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '12px',
                                        margin: '4px 0',
                                        borderRadius: '12px',
                                        backgroundColor: isCurrentStep ? '#eff6ff' : isPastStep ? '#f9fafb' : 'white',
                                        border: isCurrentStep ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                        opacity: isPastStep ? 0.6 : 1,
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    {/* Step Number/Icon */}
                                    <div style={{
                                        minWidth: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: isCurrentStep ? '#3b82f6' : isPastStep ? '#9ca3af' : '#e5e7eb',
                                        color: isCurrentStep || isPastStep ? 'white' : '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '14px'
                                    }}>
                                        {isPastStep ? '✓' : index + 1}
                                    </div>

                                    {/* Step Details */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: isCurrentStep ? 'bold' : '500',
                                            color: '#1f2937',
                                            marginBottom: '4px'
                                        }}>
                                            {step.maneuver?.instruction || 'Continue'}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#6b7280'
                                        }}>
                                            {stepDistance} km
                                            {isCurrentStep && userLocation && (
                                                <span style={{ color: '#3b82f6', marginLeft: '8px', fontWeight: '600' }}>
                                                    • Current
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                body {
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
