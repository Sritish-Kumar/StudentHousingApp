const BASE_URL = "http://localhost:3000/api";
let landlordToken = "";

async function signupAndLogin() {
    const timestamp = Date.now();
    const email = `maplandlord_${timestamp}@test.com`;
    console.log(`Setting up Landlord: ${email}`);

    await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Map Owner", email, password: "password123", role: "LANDLORD" })
    });

    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" })
    });

    if (res.status === 200) {
        const cookie = res.headers.get("set-cookie");
        return cookie ? cookie.split(";")[0] : "";
    }
    throw new Error("Login Failed");
}

async function createProperty(title, lat, lng, price) {
    const res = await fetch(`${BASE_URL}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": landlordToken },
        body: JSON.stringify({
            title,
            description: "Map test property",
            price,
            gender: "UNISEX",
            amenities: ["Wifi", "Map"],
            location: { lat, lng }, // API will convert to GeoJSON
            college: "Delhi Technology University"
        })
    });

    if (res.status === 201) {
        console.log(`✅ Created: ${title} at [${lat}, ${lng}]`);
    } else {
        const d = await res.json();
        console.log(`❌ Failed: ${title}`, d);
    }
}

(async () => {
    try {
        landlordToken = await signupAndLogin();

        // Coordinates around New Delhi (Default center in PropertyMap.js)
        const centerLat = 28.6139;
        const centerLng = 77.2090;

        console.log("\n--- Seeding Map Properties ---");

        // 1. Exact Center (Connaught Place area)
        await createProperty("Central Hub Hostel", centerLat, centerLng, 8000);

        // 2. ~1km North
        await createProperty("North Campus Stay", centerLat + 0.01, centerLng, 6000);

        // 3. ~2km East
        await createProperty("East End PG", centerLat, centerLng + 0.02, 5500);

        // 4. ~5km South
        await createProperty("South Delhi Luxury", centerLat - 0.045, centerLng, 12000);

        // 5. ~15km West (Should be outside default 10km radius)
        await createProperty("Far West Dorms", centerLat, centerLng - 0.15, 4000);

        console.log("\n✅ Seeding Complete. Open http://localhost:3000/map-search to view.");
    } catch (e) {
        console.error(e);
    }
})();
