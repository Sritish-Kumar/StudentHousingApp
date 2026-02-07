import Ably from "ably";
import { getUserFromRequest } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
    try {
        const user = await getUserFromRequest(request);

        // If no user, we can still allow anonymous access for public channels if needed,
        // but for chat app we likely want auth. For simplicity in dev, let's allow basic token,
        // but in prod we should enforce user. 
        // Let's enforce user for now.
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const client = new Ably.Rest(process.env.ABLY_API_KEY);
        const tokenRequestData = await client.auth.createTokenRequest({
            clientId: user.id || user._id,
        });

        return NextResponse.json(tokenRequestData);
    } catch (error) {
        console.error("Error creating token request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
