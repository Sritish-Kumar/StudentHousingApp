const { io } = require("socket.io-client");

const URL = "http://localhost:3000";
const BOOKING_ID = "test-room-101";

console.log("--- Starting Socket.IO Verification ---");

// Client 1
const client1 = io(URL, { autoConnect: false });
// Client 2
const client2 = io(URL, { autoConnect: false });

let stepsPassed = 0;

function checkDone() {
    stepsPassed++;
    if (stepsPassed >= 2) {
        console.log("✅ Verification Passed: messages exchanged successfully.");
        client1.disconnect();
        client2.disconnect();
        process.exit(0);
    }
}

// Setup Client 1
client1.on("connect", () => {
    console.log("Client 1: Connected");
    client1.emit("join-room", BOOKING_ID);
});

client1.on("receive-message", (data) => {
    if (data.senderId !== client1.id) {
        console.log(`Client 1: Received message from ${data.senderId}: "${data.message}"`);
        checkDone();
    }
});

// Setup Client 2
client2.on("connect", () => {
    console.log("Client 2: Connected");
    client2.emit("join-room", BOOKING_ID);

    // Wait a bit for join to complete then send message
    setTimeout(() => {
        console.log("Client 2: Sending message...");
        client2.emit("send-message", {
            bookingId: BOOKING_ID,
            message: "Hello from Client 2"
        });
    }, 1000);
});

client2.on("receive-message", (data) => {
    if (data.senderId !== client2.id) {
        console.log(`Client 2: Received message from ${data.senderId}: "${data.message}"`);
        checkDone();
    }
});

// Start
console.log("Connecting clients...");
client1.connect();
client2.connect();

// Make Client 1 also send a message after a delay
setTimeout(() => {
    console.log("Client 1: Sending message...");
    client1.emit("send-message", {
        bookingId: BOOKING_ID,
        message: "Hello back from Client 1"
    });
}, 2000);


// Timeout safety
setTimeout(() => {
    console.log("❌ Verification Timeout");
    client1.disconnect();
    client2.disconnect();
    process.exit(1);
}, 5000);
