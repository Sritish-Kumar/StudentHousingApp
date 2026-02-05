import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isAdmin } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    // Check authorization
    const admin = await isAdmin(req);

    const { id } = params;
    const body = await req.json();
    const { verified } = body;

    if (typeof verified !== "boolean") {
      return NextResponse.json(
        { message: "Invalid payload: 'verified' must be a boolean" },
        { status: 400 },
      );
    }

    const updateData = { verified };

    if (verified) {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = admin.id;
      updateData.rejectedAt = undefined;
      updateData.rejectionReason = undefined;
    }

    const property = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate('owner', 'name email');

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    // Send approval email to landlord if property is verified
    if (verified && property.owner) {
      try {
        const { getLandlordPropertyApprovalTemplate } = await import('@/app/lib/emailTemplates');
        const { sendData } = await import('@/app/lib/email');

        const propertyData = {
          propertyId: property._id.toString(),
          title: property.title,
          address: property.address,
          price: property.price,
          images: property.images
        };

        const landlordName = property.owner.name;
        const landlordEmail = property.owner.email;

        console.log(`📧 Sending approval email to landlord: ${landlordEmail}`);

        // Send email with proper await
        try {
          await sendData({
            to: landlordEmail,
            subject: `🎉 Congratulations! Your Property Has Been Approved`,
            html: getLandlordPropertyApprovalTemplate(propertyData, landlordName)
          });
          console.log(`✅ Approval email sent successfully to landlord: ${landlordEmail}`);
        } catch (error) {
          console.error(`❌ CRITICAL: Failed to send approval email to landlord ${landlordEmail}`);
          console.error(`   Error details:`, error);
          console.error(`   Error message:`, error.message);
          console.error(`   Error stack:`, error.stack);
        }
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      {
        message: `Property ${verified ? "verified" : "unverified"} successfully`,
        property,
        landlordEmail: property.owner?.email,
        emailSent: verified && property.owner ? true : false
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying property:", error);
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
