import { connectDB } from "@/app/backend/db/connect";
import bcrypt from "bcryptjs";
import User from "@/app/backend/models/User.model";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "All fields required" },
      { status: 400 }
    );
  }

  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "STUDENT",
  });

  return NextResponse.json(
    { message: "Signup successful" },
    { status: 201 }
  );
}
