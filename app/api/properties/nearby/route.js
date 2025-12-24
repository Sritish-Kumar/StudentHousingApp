import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");
        const radius = searchParams.get("radius") || 5; // default 5 km

        if (!lat || !lng) {
            return NextResponse.json(
                { message: "Latitude (lat) and Longitude (lng) are required" },
                { status: 400 }
            );
        }

        const longitude = Number(lng);
        const latitude = Number(lat);
        const radiusInMeters = Number(radius) * 1000;

        // Use MongoDB geospatial query ($near)
        // Note: $near requires a 2dsphere index on the location field
        const properties = await Property.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude], // GeoJSON standard: [lng, lat]
                    },
                    $maxDistance: radiusInMeters,
                },
            },
        });

        const formattedProperties = properties.map((prop) => ({
            id: prop._id,
            title: prop.title,
            price: prop.price,
            location: {
                // Map back to useful { lat, lng } structure for Frontend
                lat: prop.location.coordinates[1],
                lng: prop.location.coordinates[0],
            },
            distance: "Calculated by DB",
        }));

        return NextResponse.json(formattedProperties, { status: 200 });
    } catch (error) {
        console.error("GET /api/properties/nearby error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
