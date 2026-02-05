import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isAdmin } from "@/app/lib/auth";

export async function POST(req, { params }) {
  try {
    // Authentication Check (Admin only)
    await isAdmin(req);

    // Connect to database
    await connectDB();

    const { id } = params;
    const body = await req.json();
    const { reason } = body;

    // Find property
    const property = await Property.findById(id).populate('owner', 'name email');
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    // Reject property
    property.verified = false;
    property.rejectedAt = new Date();
    property.rejectionReason = reason || "No reason provided";
    property.verifiedAt = undefined;
    property.verifiedBy = undefined;

    await property.save();

    // Send rejection email to landlord
    if (property.owner) {
      try {
        const { getLandlordPropertyRejectionTemplate } = await import('@/app/lib/emailTemplates');
        const { sendData } = await import('@/app/lib/email');

        const propertyData = {
          propertyId: property._id.toString(),
          title: property.title,
          address: property.address
        };

        const landlordName = property.owner.name;
        const landlordEmail = property.owner.email;
        const rejectionReason = property.rejectionReason;

        console.log(`📧 Sending rejection email to landlord: ${landlordEmail}`);

        // Send email with proper await
        try {
          await sendData({
            to: landlordEmail,
            subject: `📋 Property Listing Update Required`,
            html: getLandlordPropertyRejectionTemplate(propertyData, landlordName, rejectionReason)
          });
          console.log(`✅ Rejection email sent successfully to landlord: ${landlordEmail}`);
        } catch (error) {
          console.error(`❌ CRITICAL: Failed to send rejection email to landlord ${landlordEmail}`);
          console.error(`   Error details:`, error);
          console.error(`   Error message:`, error.message);
          console.error(`   Error stack:`, error.stack);
        }
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      {
        message: "Property rejected successfully",
        property: {
          id: property._id,
          title: property.title,
          verified: property.verified,
          rejectedAt: property.rejectedAt,
          rejectionReason: property.rejectionReason,
        },
        landlordEmail: property.owner?.email,
        emailSent: property.owner ? true : false
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/admin/properties/[id]/reject error:", error);
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
