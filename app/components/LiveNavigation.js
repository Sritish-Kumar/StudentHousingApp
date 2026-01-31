"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { formatInstruction, getTurnIcon } from "../lib/navigationHelpers";

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
    const routeGeometryRef = useRef(null); // Store geometry for immediate access

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        import('maplibre-gl').then((module) => {
            const maplibregl = module.default;

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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

            // Force route redraw on style change (fixes disappearing route)
            map.current.on('styledata', () => {
                // Use ref to access current geometry (state won't work in closure)
                if (map.current.loaded() && routeGeometryRef.current) {
                    const hasLayer = map.current.getLayer('route');
                    if (!hasLayer) {
                        console.log("🎨 Style loaded/changed, redrawing route from ref...");
                        drawRoute(routeGeometryRef.current);
                    }
                }
            });

            return () => {
                if (watchId.current) {
                    navigator.geolocation.clearWatch(watchId.current);
                }
                if (map.current) map.current.remove();
            };
        });
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

    // Handle Device Orientation (Compass)
    useEffect(() => {
        const handleOrientation = (event) => {
            // alpha is the compass direction (0-360)
            // webkitCompassHeading is for iOS
            let compass = event.webkitCompassHeading || Math.abs(event.alpha - 360);

            if (compass !== null && compass !== undefined) {
                // If we aren't moving fast (speed < 5 km/h), use compass for bearing
                if (!speed || speed < 5) {
                    setBearing(compass);
                    if (userLocation) {
                        updateUserMarker(userLocation, compass);
                    }
                }
            }
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [speed, userLocation]);

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

            // Store geometry in ref for immediate access
            routeGeometryRef.current = routeData.geometry;

            console.log("Set distance:", distanceKm, "km");
            console.log("Set ETA:", etaMin, "min");

            // Draw route immediately if map is ready
            if (map.current && map.current.loaded()) {
                console.log("Drawing route immediately after calculation...");
                drawRoute(routeData.geometry);
                // Fit map to route
                setTimeout(() => {
                    fitMapToRoute(routeData.geometry.coordinates);
                }, 300);
            } else {
                // Retry after map loads
                console.log("Map not ready, will retry route drawing...");
                const retryInterval = setInterval(() => {
                    if (map.current && map.current.loaded()) {
                        console.log("Map now ready, drawing route...");
                        drawRoute(routeData.geometry);
                        fitMapToRoute(routeData.geometry.coordinates);
                        clearInterval(retryInterval);
                    }
                }, 200);
                // Clear after 5 seconds max
                setTimeout(() => clearInterval(retryInterval), 5000);
            }

        } catch (err) {
            console.error("Route calculation error:", err);
        }
    };


    // AGGRESSIVE route persistence - ensure route stays visible
    useEffect(() => {
        if (!map.current || !map.current.loaded() || !route) return;

        console.log("=== ROUTE PERSISTENCE CHECK ===");
        const hasRouteLayer = map.current.getLayer("route");
        console.log("Route layer exists:", !!hasRouteLayer);

        if (!hasRouteLayer) {
            console.log("⚠️ Route layer missing! Redrawing...");
            drawRoute(route.geometry);
        }
    }, [mapLoaded, route]);

    // ADDITIONAL: Redraw route every 2 seconds as failsafe
    useEffect(() => {
        if (!routeGeometryRef.current || !map.current) return;

        const interval = setInterval(() => {
            if (map.current && map.current.loaded() && routeGeometryRef.current && !map.current.getLayer("route")) {
                console.log("🔄 Failsafe: Redrawing missing route from ref");
                drawRoute(routeGeometryRef.current);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [route]); // Still depends on route state to trigger effect setup

    // Draw route on map - PRODUCTION VERSION with extensive debugging
    const drawRoute = (geometry) => {
        console.log("=== DRAW ROUTE CALLED ===");
        console.log("Map current:", !!map.current);
        console.log("Map loaded:", map.current ? map.current.loaded() : false);
        console.log("Geometry:", geometry);

        if (!map.current) {
            console.error("❌ Map not initialized");
            return;
        }

        if (!map.current.loaded()) {
            console.error("❌ Map not loaded yet");
            return;
        }

        if (!geometry || !geometry.coordinates || geometry.coordinates.length < 2) {
            console.error("❌ Invalid geometry:", geometry);
            return;
        }

        console.log("✅ All validations passed, drawing route...");
        console.log("Coordinates count:", geometry.coordinates.length);

        try {
            // STEP 1 & 2: Update or Add Source
            if (map.current.getSource("route")) {
                console.log("  Updating existing route source...");
                map.current.getSource("route").setData({
                    type: "Feature",
                    properties: {},
                    geometry: geometry
                });
            } else {
                console.log("  Adding new route source...");
                map.current.addSource("route", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        properties: {},
                        geometry: geometry
                    }
                });
            }

            // STEP 3: Ensure Route Layer Exists
            if (!map.current.getLayer("route")) {
                console.log("  Adding route layer...");
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
                        "line-color": "#4285F4",  // Google Blue
                        "line-width": 10,          // THICK line for visibility
                        "line-opacity": 1.0
                    }
                });
            } else {
                console.log("  Route layer already exists");
            }

            // STEP 4: Add directional arrows (optional, may fail if glyphs not loaded)
            console.log("Step 4: Adding arrow layer...");
            try {
                map.current.addLayer({
                    id: "route-arrows",
                    type: "symbol",
                    source: "route",
                    layout: {
                        "symbol-placement": "line",
                        "text-field": "▶",
                        "text-size": 20,
                        "symbol-spacing": 100,
                        "text-keep-upright": false,
                        "text-allow-overlap": true,
                        "text-ignore-placement": true
                    },
                    paint: {
                        "text-color": "#ffffff",
                        "text-halo-color": "#4285F4",
                        "text-halo-width": 2
                    }
                });
                console.log("✅ Arrow layer added");
            } catch (arrowError) {
                console.warn("⚠️ Arrow layer failed (non-critical):", arrowError);
            }

            // STEP 5: Verify layers exist
            console.log("Step 5: Verifying layers...");
            const routeLayer = map.current.getLayer("route");
            const routeSource = map.current.getSource("route");
            console.log("Route layer exists:", !!routeLayer);
            console.log("Route source exists:", !!routeSource);

            if (routeLayer && routeSource) {
                console.log("🎉 ROUTE SUCCESSFULLY DRAWN!");
            } else {
                console.error("❌ Route drawing verification FAILED");
            }

        } catch (error) {
            console.error("❌ CRITICAL ERROR in drawRoute:", error);
            console.error("Error stack:", error.stack);
        }
    };

    // Update user marker with rotation - MODERN GOOGLE MAPS STYLE
    const updateUserMarker = (location, heading) => {
        if (!map.current) return;

        import('maplibre-gl').then((module) => {
            const maplibregl = module.default;

            const rotation = heading || 0;

            if (!userMarker.current) {
                // Create modern navigation marker container
                const el = document.createElement('div');
                el.className = 'user-marker-modern';
                el.style.cssText = `
                    width: 60px;
                    height: 60px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                // Modern marker with directional cone and pulsing effect
                el.innerHTML = `
                    <!-- Pulsing outer ring -->
                    <div style="
                        position: absolute;
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: rgba(66, 133, 244, 0.2);
                        animation: pulse 2s ease-in-out infinite;
                    "></div>
                    
                    <!-- Direction cone (fan shape) -->
                    <div class="direction-cone" style="
                        position: absolute;
                        width: 80px;
                        height: 80px;
                        transform: rotate(${rotation}deg) translateY(-15px);
                        transition: transform 0.3s ease-out;
                    ">
                        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                            <defs>
                                <linearGradient id="coneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:rgba(66,133,244,0.4);stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:rgba(66,133,244,0);stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            <path d="M50,50 L30,15 Q50,5 70,15 Z" fill="url(#coneGradient)"/>
                        </svg>
                    </div>
                    
                    <!-- Center dot -->
                    <div style="
                        position: absolute;
                        width: 24px;
                        height: 24px;
                        background: linear-gradient(135deg, #4285F4 0%, #1a73e8 100%);
                        border-radius: 50%;
                        border: 4px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px rgba(66,133,244,0.3);
                        z-index: 2;
                    "></div>
                    
                    <!-- Arrow indicator inside dot -->
                    <div class="arrow-indicator" style="
                        position: absolute;
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-bottom: 10px solid white;
                        transform: rotate(${rotation}deg) translateY(-2px);
                        transition: transform 0.3s ease-out;
                        z-index: 3;
                    "></div>
                `;

                // Add keyframe animation for pulse
                if (!document.getElementById('marker-animations')) {
                    const style = document.createElement('style');
                    style.id = 'marker-animations';
                    style.textContent = `
                        @keyframes pulse {
                            0% { transform: scale(0.8); opacity: 1; }
                            50% { transform: scale(1.2); opacity: 0.5; }
                            100% { transform: scale(0.8); opacity: 1; }
                        }
                    `;
                    document.head.appendChild(style);
                }

                userMarker.current = new maplibregl.Marker({ element: el })
                    .setLngLat(location)
                    .addTo(map.current);
            } else {
                userMarker.current.setLngLat(location);
                // Update rotation of direction cone and arrow
                const markerEl = userMarker.current.getElement();
                const cone = markerEl.querySelector('.direction-cone');
                const arrow = markerEl.querySelector('.arrow-indicator');
                if (cone) {
                    cone.style.transform = `rotate(${rotation}deg) translateY(-15px)`;
                }
                if (arrow) {
                    arrow.style.transform = `rotate(${rotation}deg) translateY(-2px)`;
                }
            }

            map.current.easeTo({
                center: location,
                bearing: rotation,
                zoom: 18,
                pitch: 60,
                duration: 1000
            });
        });
    };

    // Check if route needs recalculation
    const shouldRecalculateRoute = (currentLocation) => {
        if (!route || !lastPosition.current) return false;
        const distanceMoved = calculateDistance(currentLocation, lastPosition.current);
        return distanceMoved > 0.1;
    };

    // Haversine distance formula
    const calculateDistance = (point1, point2) => {
        const R = 6371;
        const dLat = (point2[1] - point1[1]) * Math.PI / 180;
        const dLon = (point2[0] - point1[0]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Voice navigation - Google Maps style with distance
    const speakInstruction = (instruction, distanceMeters = null) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return;

        let speechText = instruction;

        // Add distance if provided (like Google Maps)
        if (distanceMeters !== null && distanceMeters > 0) {
            if (distanceMeters < 1000) {
                speechText = `In ${Math.round(distanceMeters)} meters, ${instruction.toLowerCase()}`;
            } else {
                const km = (distanceMeters / 1000).toFixed(1);
                speechText = `In ${km} kilometers, ${instruction.toLowerCase()}`;
            }
        }

        console.log("🔊 Speaking:", speechText);

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.cancel();
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
                speakInstruction(formatInstruction(step), distMeters);
                lastSpokenStep.current = i;
            }

            // If within 30m of next step, advance
            if (dist < 0.03 && i > currentStep) {
                setCurrentStep(i);
                // Speak the new instruction immediately
                speakInstruction(formatInstruction(step));
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
        return formatInstruction(step);
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
            {/* 1. Map Container */}
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

            {/* 2. Loading State Overlay */}
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

            {/* 3. Top Instruction Card */}
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
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        {/* Turn Icon */}
                        <div style={{
                            fontSize: '48px',
                            minWidth: '60px',
                            textAlign: 'center',
                            lineHeight: '1'
                        }}>
                            {route && route.legs && route.legs[0].steps[currentStep] && route.legs[0].steps[currentStep].maneuver ?
                                getTurnIcon(route.legs[0].steps[currentStep].maneuver.modifier) : "⬆️"}
                        </div>

                        {/* Turn Details */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '13px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                fontWeight: '600',
                                marginBottom: '4px'
                            }}>Next Turn</div>

                            <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#1f2937',
                                lineHeight: '1.2',
                                marginBottom: '4px'
                            }}>
                                {getCurrentInstruction()}
                            </div>

                            {/* Distance to Turn */}
                            {getDistanceToNextTurn() && (
                                <div style={{
                                    fontSize: '20px',
                                    color: '#2563eb',
                                    fontWeight: '800'
                                }}>
                                    In {getDistanceToNextTurn()}m
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Floating Controls (Right Side) */}
            {isNavigating && !error && (
                <div style={{
                    position: 'absolute',
                    bottom: '200px',
                    right: '16px',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    alignItems: 'flex-end'
                }}>
                    {/* Recenter Button */}
                    <button
                        onClick={() => {
                            if (userLocation && map.current) {
                                map.current.flyTo({
                                    center: userLocation,
                                    zoom: 18,
                                    pitch: 60,
                                    bearing: bearing
                                });
                                setIsNavigating(true);
                            }
                        }}
                        title="Recenter"
                        style={{
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
                    >
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    {/* Voice Toggle */}
                    <button
                        onClick={() => {
                            const newState = !voiceEnabled;
                            setVoiceEnabled(newState);
                            if (newState) {
                                const utterance = new SpeechSynthesisUtterance("Voice navigation enabled");
                                window.speechSynthesis.speak(utterance);
                            }
                        }}
                        title="Toggle Voice"
                        style={{
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

                    {/* Turn List Toggle */}
                    {route && (
                        <button
                            onClick={() => setShowTurnByTurn(!showTurnByTurn)}
                            title="Turn List"
                            style={{
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
                        >
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* 5. Bottom Stats Card */}
            {isNavigating && !error && (
                <div style={{
                    position: 'absolute',
                    bottom: '32px',
                    left: '16px',
                    right: '16px',
                    zIndex: 50,
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        padding: '16px 24px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>ETA</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                                {eta !== null ? `${eta} min` : "..."}
                            </div>
                        </div>
                        <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Distance</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                {distance !== null ? `${distance} km` : "..."}
                            </div>
                        </div>
                        <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Speed</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                {speed.toFixed(0)} km/h
                            </div>
                        </div>
                        <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }}></div>

                        {/* Exit Button */}
                        <button
                            onClick={() => window.close()}
                            style={{
                                color: '#ef4444',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Exit
                        </button>
                    </div>
                </div>
            )}

            {/* 6. Turn-by-Turn Panel Overlay */}
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
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 7. Error Toast */}
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
