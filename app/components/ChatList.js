"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, Search } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import for ChatWindow to avoid SSR issues
const ChatWindow = dynamic(() => import("./ChatWindow"), { ssr: false });

export default function ChatList({ onClose, onUpdateUnread, initialConversation }) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(
        initialConversation || null
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Update selected conversation if initialConversation changes
    useEffect(() => {
        if (initialConversation) {
            setSelectedConversation(initialConversation);
        }
    }, [initialConversation]);

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);

                // Update unread count
                if (onUpdateUnread && user) {
                    const total = (data.conversations || []).reduce(
                        (sum, conv) => sum + (conv.unreadCount?.[user._id || user.id] || 0),
                        0
                    );
                    onUpdateUnread(total);
                }
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getOtherParticipant = (conversation) => {
        if (!conversation?.participants || !user) return null;
        return conversation.participants.find((p) => p._id !== (user._id || user.id));
    };

    const formatTime = (date) => {
        if (!date) return "";
        const now = new Date();
        const messageDate = new Date(date);
        const diffMs = now - messageDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return messageDate.toLocaleDateString();
    };

    const filteredConversations = conversations.filter((conv) => {
        const other = getOtherParticipant(conv);
        const otherName = other?.name || "";
        const propertyTitle = conv.property?.title || "";
        return (
            otherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (selectedConversation) {
        return (
            <ChatWindow
                conversation={selectedConversation}
                onBack={() => {
                    setSelectedConversation(null);
                    fetchConversations(); // Refresh list
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header - Instagram Style */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    </button>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MessageCircle className="w-6 h-6" />
                        Messages
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="hidden md:block p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 animate-fadeIn">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-gray-400 opacity-50" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No conversations yet</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Start chatting with landlords!
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => {
                        const other = getOtherParticipant(conversation);
                        const unread = conversation.unreadCount?.[user?.id] || 0;

                        return (
                            <button
                                key={conversation._id}
                                onClick={() => setSelectedConversation(conversation)}
                                className="w-full p-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-left group"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    {other?.landlordProfile?.profileImage ? (
                                        <img
                                            src={other.landlordProfile.profileImage}
                                            alt={other.name || "User"}
                                            className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-gray-200">
                                            <span className="text-white font-bold text-lg">
                                                {(other?.name || "U").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3
                                                className={`font-semibold truncate ${unread > 0 ? "text-gray-900" : "text-gray-700"
                                                    }`}
                                            >
                                                {other?.name || "Unknown User"}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {conversation.lastMessageAt && (
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(conversation.lastMessageAt)}
                                                    </span>
                                                )}
                                                {unread > 0 && (
                                                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                                        {unread > 99 ? "99+" : unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mb-1 flex items-center gap-1">
                                            <span>🏠</span>
                                            {conversation.property?.title || "Property"}
                                        </p>
                                        {conversation.lastMessage && (
                                            <p
                                                className={`text-sm truncate ${unread > 0
                                                    ? "text-gray-900 font-medium"
                                                    : "text-gray-500"
                                                    }`}
                                            >
                                                {conversation.lastMessage.messageType === "text"
                                                    ? conversation.lastMessage.content
                                                    : conversation.lastMessage.messageType === "image"
                                                        ? "📷 Photo"
                                                        : "🎤 Voice message"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
