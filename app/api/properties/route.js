import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import User from "@/app/backend/models/User.model";
import { isLandlord } from "@/app/lib/auth";
import { sendData } from "@/app/lib/email";
import { getAdminPropertyNotificationTemplate } from "@/app/lib/emailTemplates";

export async function POST(req) {
    try {
        // 1. Authentication Check (Landlord only)
        const user = await isLandlord(req);

        // 2. Parse Body
        const body = await req.json();
        const {
            title,
            description,
            address,
            price,
            gender,
            amenities,
            location,
            college,
            images,
        } = body;

        // 3. Validation (Basic)
        if (!title || !address || !price || !location || !college) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 },
            );
        }

        // Validate images array if provided
        if (images && (!Array.isArray(images) || images.length > 10)) {
            return NextResponse.json(
                { message: "Images must be an array with maximum 10 URLs" },
                { status: 400 },
            );
        }

        // 4. Connect DB
        await connectDB();

        // 5. Create Property with GeoJSON location
        const newProperty = await Property.create({
            title,
            description,
            address,
            price,
            gender,
            amenities,
            images: images || [],
            location: {
                type: "Point",
                coordinates: [location.lng, location.lat], // GeoJSON format: [longitude, latitude]
            },
            college,
            owner: user.id, // from token payload
            verified: false, // Default
            distance: 0, // Default or calculated
        });

        console.log('✅ Property created successfully:', newProperty._id);

        // 6. Send email notifications to all admins (async, don't block response)
        try {
            console.log('🔍 Starting admin notification process...');

            // Fetch landlord details
            const landlord = await User.findById(user.id).select('name email');
            console.log('👤 Landlord found:', landlord ? landlord.email : 'NOT FOUND');

            // Fetch all admin users
            const admins = await User.find({ role: "ADMIN" }).select('email name');
            console.log('👥 Admin users found:', admins.length, admins.map(a => a.email));

            if (admins && admins.length > 0 && landlord) {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
                console.log('🌐 Site URL:', siteUrl);

                const propertyData = {
                    propertyId: newProperty._id.toString(),
                    title: newProperty.title,
                    description: newProperty.description,
                    address: newProperty.address,
                    price: newProperty.price,
                    gender: newProperty.gender,
                    college: newProperty.college,
                    images: newProperty.images
                };

                const landlordData = {
                    landlordName: landlord.name,
                    landlordEmail: landlord.email
                };

                console.log(`📧 Preparing to send emails to ${admins.length} admin(s) for property: ${title}`);

                // Send email to each admin with proper error handling
                for (const admin of admins) {
                    try {
                        console.log(`📨 Attempting to send email to: ${admin.email}`);
                        await sendData({
                            to: admin.email,
                            subject: `🏠 New Property Listed - ${title}`,
                            html: getAdminPropertyNotificationTemplate(propertyData, landlordData, siteUrl)
                        });
                        console.log(`✅ Email sent successfully to: ${admin.email}`);
                    } catch (error) {
                        console.error(`❌ CRITICAL: Failed to send email to admin ${admin.email}`);
                        console.error(`   Error details:`, error);
                        console.error(`   Error message:`, error.message);
                        console.error(`   Error stack:`, error.stack);
                    }
                }

                console.log(`✅ Admin email notification process completed for property: ${newProperty._id}`);
            } else {
                console.log('⚠️ No admins found or landlord not found - skipping email notifications');
                console.log('   Admins count:', admins ? admins.length : 0);
                console.log('   Landlord found:', !!landlord);
            }
        } catch (emailError) {
            // Log email error but don't fail property creation
            console.error('❌ Error sending admin notifications:', emailError);
        }


        return NextResponse.json(
            {
                propertyId: newProperty._id,
                verified: newProperty.verified,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("POST /api/properties error:", error);
        if (error.name === "ValidationError") {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        if (
            error.message.includes("Unauthorized") ||
            error.message.includes("Forbidden")
        ) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 },
        );
    }
}

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const priceMin = searchParams.get("priceMin");
        const priceMax = searchParams.get("priceMax");
        const gender = searchParams.get("gender");
        const verified = searchParams.get("verified");
        const distance = searchParams.get("distance");
        const college = searchParams.get("college");
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");
        const radius = searchParams.get("radius"); // in meters

        const query = {};

        // Geospatial Search (Priority 1 - if coordinates provided)
        // This will sort ALL properties by distance, not filter them
        if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    // No $maxDistance - show ALL properties sorted by distance
                },
            };
        }

        // Filter by Price
        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = Number(priceMin);
            if (priceMax) query.price.$lte = Number(priceMax);
        }

        // Filter by Gender
        if (gender) {
            query.gender = gender;
        }

        // Filter by Verified
        if (verified === "true") {
            query.verified = true;
        } else if (verified === "false") {
            query.verified = false;
        }

        // Filter by College (Fuzzy search)
        if (college) {
            query.college = { $regex: college, $options: "i" };
        }

        // Filter by Distance (Only if not using geospatial search)
        if (distance && !lat) {
            query.distance = { $lte: Number(distance) };
        }

        // When using $near, results are automatically sorted by distance
        const properties =
            lat && lng
                ? await Property.find(query)
                : await Property.find(query).sort({ createdAt: -1 });

        const formattedProperties = properties.map((prop) => {
            // Calculate distance if coordinates provided
            let calculatedDistance = prop.distance;

            if (
                lat &&
                lng &&
                !isNaN(parseFloat(lat)) &&
                !isNaN(parseFloat(lng)) &&
                prop.location &&
                prop.location.coordinates
            ) {
                // Haversine formula for accurate distance calculation
                const R = 6371; // Earth's radius in km
                const dLat =
                    (prop.location.coordinates[1] - parseFloat(lat)) * (Math.PI / 180);
                const dLon =
                    (prop.location.coordinates[0] - parseFloat(lng)) * (Math.PI / 180);
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(parseFloat(lat) * (Math.PI / 180)) *
                    Math.cos(prop.location.coordinates[1] * (Math.PI / 180)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                calculatedDistance = (R * c).toFixed(1); // Distance in km with 1 decimal
            }

            return {
                id: prop._id,
                title: prop.title,
                description: prop.description,
                address: prop.address,
                price: prop.price,
                gender: prop.gender,
                amenities: prop.amenities,
                images: prop.images,
                college: prop.college,
                location: prop.location,
                verified: prop.verified,
                distance: `${calculatedDistance}km`,
            };
        });

        return NextResponse.json(formattedProperties, { status: 200 });
    } catch (error) {
        console.error("GET /api/properties error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 },
        );
    }
}
