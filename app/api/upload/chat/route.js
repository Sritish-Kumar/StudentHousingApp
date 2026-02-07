import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getUserFromRequest } from "@/app/lib/auth";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST upload image or voice message
export async function POST(req) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file");
        const type = formData.get("type"); // 'image' or 'voice'

        if (!file) {
            return NextResponse.json(
                { message: "No file provided" },
                { status: 400 }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataURI = `data:${file.type};base64,${base64}`;

        // Upload to Cloudinary
        const uploadOptions = {
            folder: type === "voice" ? "chat/voice" : "chat/images",
            resource_type: type === "voice" ? "video" : "image",
        };

        const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

        return NextResponse.json(
            {
                url: result.secure_url,
                publicId: result.public_id,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("POST /api/upload/chat error:", error);
        return NextResponse.json(
            { message: "Upload failed" },
            { status: 500 }
        );
    }
}
