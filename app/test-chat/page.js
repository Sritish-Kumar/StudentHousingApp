"use client";

import ChatInterface from "../components/ChatInterface";

export default function TestChatPage() {
    const bookingId = "room-123"; // Simulating a shared booking ID

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8 gap-8">
            <h1 className="text-2xl font-bold text-gray-800">Chat Simulation</h1>
            <p className="text-gray-600 max-w-md text-center">
                Open this page in two different tabs. Both will join <b>{bookingId}</b> and can chat with each other in real-time.
            </p>

            <ChatInterface bookingId={bookingId} userName="Test User" />
        </div>
    );
}
