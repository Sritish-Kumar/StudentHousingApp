import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import User from "@/app/backend/models/User.model";
import { isLandlord, isLandlordOrAdmin } from "@/app/lib/auth";
import { sendData } from "@/app/lib/email";
import { getAdminPropertyUpdateNotificationTemplate } from "@/app/lib/emailTemplates";

// GET Single Property
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(property, { status: 200 });
  } catch (error) {
    console.error("GET /api/properties/[id] error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// UPDATE Property
export async function PUT(req, { params }) {
  try {
    const user = await isLandlord(req); // Ensure user is landlord
    const { id } = params;
    const body = await req.json();

    await connectDB();
    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    // Check ownership
    if (property.owner.toString() !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized: You do not own this property" },
        { status: 403 },
      );
    }

    // Update fields
    const {
      title,
      description,
      address,
      price,
      gender,
      amenities,
      college,
      location,
      images,
    } = body;

    // Debug logging
    console.log('PUT /api/properties/[id] - Received address:', address);
    console.log('PUT /api/properties/[id] - Current property address:', property.address);

    // Detect changes in critical fields
    const criticalFields = ['price', 'address', 'college', 'location', 'images'];
    const changes = {};
    let hasCriticalChanges = false;

    // Check price
    if (price && price !== property.price) {
      changes.price = { old: property.price, new: price };
      hasCriticalChanges = true;
    }

    // Check address
    if (address !== undefined && address !== property.address) {
      changes.address = { old: property.address, new: address };
      hasCriticalChanges = true;
    }

    // Check college
    if (college && college !== property.college) {
      changes.college = { old: property.college, new: college };
      hasCriticalChanges = true;
    }

    // Check location
    if (location && location.lat && location.lng) {
      const oldLat = property.location.coordinates[1];
      const oldLng = property.location.coordinates[0];
      if (location.lat !== oldLat || location.lng !== oldLng) {
        changes.location = {
          old: `${oldLat}, ${oldLng}`,
          new: `${location.lat}, ${location.lng}`
        };
        hasCriticalChanges = true;
      }
    }

    // Check images
    if (images !== undefined && Array.isArray(images)) {
      const oldImages = JSON.stringify(property.images.sort());
      const newImages = JSON.stringify([...images].sort());
      if (oldImages !== newImages) {
        changes.images = {
          old: `${property.images.length} image(s)`,
          new: `${images.length} image(s)`
        };
        hasCriticalChanges = true;
      }
    }

    console.log('🔍 Critical changes detected:', hasCriticalChanges);
    console.log('📝 Changes:', changes);

    // Construct update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (price) updateData.price = price;
    if (gender) updateData.gender = gender;
    if (amenities) updateData.amenities = amenities;
    if (college) updateData.college = college;

    // If critical fields changed, unverify the property
    if (hasCriticalChanges) {
      updateData.verified = false;
      console.log('⚠️ Property will be unverified due to critical changes');
    }

    // Explicitly handle images array checks before update
    if (images !== undefined) {
      if (!Array.isArray(images) || images.length > 10) {
        return NextResponse.json(
          { message: "Images must be an array with maximum 10 URLs" },
          { status: 400 },
        );
      }
      updateData.images = images;
    }

    if (location && location.lat && location.lng) {
      updateData.location = {
        type: "Point",
        coordinates: [location.lng, location.lat],
      };
    }

    console.log('PUT /api/properties/[id] - Update payload:', JSON.stringify(updateData, null, 2));

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    console.log('PUT /api/properties/[id] - Successfully updated property. New address:', updatedProperty.address);

    // Send admin notification if critical changes were made
    if (hasCriticalChanges && Object.keys(changes).length > 0) {
      try {
        console.log('📧 Sending admin notifications for property update...');

        // Fetch landlord details
        const landlord = await User.findById(user.id).select('name email');

        // Fetch all admin users
        const admins = await User.find({ role: "ADMIN" }).select('email name');

        if (admins && admins.length > 0 && landlord) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

          const propertyData = {
            propertyId: updatedProperty._id.toString(),
            title: updatedProperty.title,
            address: updatedProperty.address,
            images: updatedProperty.images
          };

          const landlordData = {
            landlordName: landlord.name,
            landlordEmail: landlord.email
          };

          console.log(`📧 Sending update notifications to ${admins.length} admin(s)`);

          // Send email to each admin with proper error handling
          for (const admin of admins) {
            try {
              console.log(`📨 Attempting to send update email to: ${admin.email}`);
              await sendData({
                to: admin.email,
                subject: `🔄 Property Updated - ${updatedProperty.title}`,
                html: getAdminPropertyUpdateNotificationTemplate(propertyData, landlordData, changes, siteUrl)
              });
              console.log(`✅ Update email sent successfully to: ${admin.email}`);
            } catch (error) {
              console.error(`❌ CRITICAL: Failed to send update email to admin ${admin.email}`);
              console.error(`   Error details:`, error);
              console.error(`   Error message:`, error.message);
              console.error(`   Error stack:`, error.stack);
            }
          }

          console.log(`✅ Admin update notification process completed`);
        } else {
          console.log('⚠️ No admins found or landlord not found - skipping update notifications');
        }
      } catch (emailError) {
        console.error('❌ Error sending admin update notifications:', emailError);
      }
    }

    return NextResponse.json(
      {
        message: "Property updated successfully",
        property: updatedProperty,
        unverified: hasCriticalChanges
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/properties/[id] error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE Property
export async function DELETE(req, { params }) {
  try {
    const user = await isLandlord(req);
    const { id } = params;

    await connectDB();
    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    // Check ownership
    if (property.owner.toString() !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await Property.deleteOne({ _id: id });

    return NextResponse.json({ message: "Property deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/properties/[id] error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
