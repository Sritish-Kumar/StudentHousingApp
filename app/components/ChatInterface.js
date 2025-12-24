"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

let socket;

export default function ChatInterface({ bookingId, userName, userId }) {
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initialize Socket connection
        socket = io(); // Connects to the same host/port

        socket.on("connect", () => {
            console.log("Connected to Socket.IO server");
            setConnected(true);

            // Join the specific room for this booking
            socket.emit("join-room", bookingId);
        });

        socket.on("receive-message", (msg) => {
            setChat((prev) => [...prev, msg]);
        });

        // Cleanup on unmount
        return () => {
            if (socket) socket.disconnect();
        };
    }, [bookingId]);

    // Auto-scroll to bottom when chat updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Send message to server
        socket.emit("send-message", {
            bookingId,
            message,
            // In a real app, you might also send userId/userName here
            // But server usually attaches the socket.id or user session
        });

        setMessage("");
    };

    return (
        <div className="flex flex-col h-[500px] w-full max-w-md border rounded-lg shadow-lg bg-white">
            {/* Header */}
            <div className="p-4 border-b bg-indigo-600 text-white rounded-t-lg flex justify-between items-center">
                <h3 className="font-bold">Live Chat</h3>
                <span className={`text-xs px-2 py-1 rounded ${connected ? 'bg-green-500' : 'bg-red-500'}`}>
                    {connected ? 'Online' : 'Connecting...'}
                </span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chat.length === 0 && (
                    <p className="text-gray-400 text-center text-sm">No messages yet. Say hello!</p>
                )}

                {chat.map((msg, index) => {
                    const isMyMessage = msg.senderId === socket.id;
                    return (
                        <div
                            key={index}
                            className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-lg text-sm ${isMyMessage
                                        ? "bg-indigo-600 text-white rounded-br-none"
                                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                                    }`}
                            >
                                <p>{msg.message}</p>
                                <span className={`text-[10px] block mt-1 ${isMyMessage ? "text-indigo-200" : "text-gray-400"}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 border-t bg-white rounded-b-lg flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    type="submit"
                    disabled={!message.trim() || !connected}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
