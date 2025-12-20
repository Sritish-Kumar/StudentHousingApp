import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/app/lib/jwt";
import User from "@/app/backend/models/User.model";
import { connectDB } from "@/app/backend/db/connect";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const decoded = verifyToken(token);

    await connectDB();
    const user = await User.findById(decoded.id).select("-password");

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { message: "Invalid token" },
      { status: 401 }
    );
  }
}
