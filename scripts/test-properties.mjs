

const BASE_URL = 'http://localhost:3000/api';
let cookie = '';
let propertyId = '';

async function login() {
    console.log('\n--- 1. Testing Signup/Login (Landlord) ---');
    const email = `landlord_${Date.now()}@test.com`;
    const password = 'password123';

    // Signup
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Landlord', email, password, role: 'LANDLORD' }),
    });
    console.log(`Signup Status: ${signupRes.status}`);

    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    console.log(`Login Status: ${loginRes.status}`);

    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
        cookie = setCookie.split(';')[0];
        console.log('Login successful, cookie received.');
    } else {
        console.error('Login failed, no cookie received.');
        process.exit(1);
    }
}

async function createProperty() {
    console.log('\n--- 2. Testing Create Property ---');
    const res = await fetch(`${BASE_URL}/properties`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
        },
        body: JSON.stringify({
            title: "Luxury Student Apt",
            description: "Close to campus",
            price: 5000,
            gender: "UNISEX",
            amenities: ["Wifi", "Gym"],
            location: { lat: 12.34, lng: 56.78 },
            college: "Test University"
        }),
    });

    const data = await res.json();
    console.log(`Create Status: ${res.status}`);
    console.log('Response:', data);

    if (res.status === 201) {
        propertyId = data.propertyId;
    }
}

async function getProperties() {
    console.log('\n--- 3. Testing Get Properties ---');
    const res = await fetch(`${BASE_URL}/properties?priceMin=4000`, {
        method: 'GET',
    });
    const data = await res.json();
    console.log(`Get Status: ${res.status}`);
    console.log(`Found ${data.length} properties`);
    if (data.length > 0) {
        console.log('First property:', data[0].title);
    }
}

async function getPropertyDetails() {
    console.log('\n--- 4. Testing Get Property Details ---');
    if (!propertyId) return;
    const res = await fetch(`${BASE_URL}/properties/${propertyId}`, {
        method: 'GET',
    });
    const data = await res.json();
    console.log(`Get ID Status: ${res.status}`);
    console.log('Title:', data.title);
}

async function updateProperty() {
    console.log('\n--- 5. Testing Update Property ---');
    if (!propertyId) return;
    const res = await fetch(`${BASE_URL}/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
        },
        body: JSON.stringify({
            price: 6000,
            title: "Updated Luxury Apt"
        }),
    });
    const data = await res.json();
    console.log(`Update Status: ${res.status}`);
    console.log('New Price:', data.price);
}

async function deleteProperty() {
    console.log('\n--- 6. Testing Delete Property ---');
    if (!propertyId) return;
    const res = await fetch(`${BASE_URL}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
            'Cookie': cookie
        },
    });
    const data = await res.json();
    console.log(`Delete Status: ${res.status}`);
    console.log('Message:', data.message);
}

async function run() {
    try {
        await login();
        await createProperty();
        await getProperties();
        await getPropertyDetails();
        await updateProperty();
        await deleteProperty();
    } catch (err) {
        console.error('Test script error:', err);
    }
}

run();
