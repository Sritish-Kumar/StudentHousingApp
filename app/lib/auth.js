import { verifyToken } from "./jwt";
import { headers } from "next/headers";

export const getUserFromRequest = async (req) => {
    let token;

    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.cookies) {
        if (typeof req.cookies.get === 'function') {
            token = req.cookies.get("token")?.value;
        } else {
            // Fallback if req.cookies is just an object
            token = req.cookies.token;
        }
    }

    if (!token) {
        return null;
    }

    try {
        const decoded = verifyToken(token);
        return decoded;
    } catch (error) {
        return null;
    }
};

export const isAuthenticated = async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
};

export const isLandlord = async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) {
        throw new Error("Unauthorized");
    }
    if (user.role !== "LANDLORD") {
        throw new Error("Forbidden: Landlords only");
    }
    return user;
};

export const isAdmin = async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) {
        throw new Error("Unauthorized");
    }
    if (user.role !== "ADMIN") {
        throw new Error("Forbidden: Admins only");
    }
    return user;
};
