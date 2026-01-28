import { NextResponse } from "next/server";
import { isLandlord } from "@/app/lib/auth";
import { uploadImagesToCloudinary } from "@/app/backend/utils/uploadToCloudinary";

export async function POST(req) {
  try {
    // 1. Authentication Check (Landlord only)
    const user = await isLandlord(req);

    // 2. Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll("images");

    // 3. Validation
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "No images provided" },
        { status: 400 },
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { message: "Maximum 10 images allowed" },
        { status: 400 },
      );
    }

    // 4. Validate file types and sizes
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const imageBuffers = [];
    const filenames = [];

    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            message: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.`,
          },
          { status: 400 },
        );
      }

      // Check file size
      if (file.size > maxSize) {
        return NextResponse.json(
          { message: `File ${file.name} exceeds 5MB limit` },
          { status: 400 },
        );
      }

      // Convert to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBuffers.push(buffer);
      filenames.push(file.name);
    }

    // 5. Upload to Cloudinary
    const imageUrls = await uploadImagesToCloudinary(imageBuffers, filenames);

    return NextResponse.json(
      {
        message: "Images uploaded successfully",
        urls: imageUrls,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: error.message || "Failed to upload images" },
      { status: 500 },
    );
  }
}
