"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, Search, ArrowLeft, X, MessageSquare } from "lucide-react";
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

                // Update unread count - check both user.id and user._id
                if (onUpdateUnread && user) {
                    const userId = user._id || user.id;
                    const total = (data.conversations || []).reduce(
                        (sum, conv) => {
                            // Check for unreadCount as both object property and Map
                            const unread = conv.unreadCount?.[userId] ||
                                conv.unreadCount?.get?.(userId) ||
                                0;
                            return sum + unread;
                        },
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
        const userId = user._id || user.id;
        return conversation.participants.find((p) => p._id !== userId);
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
        <div className="flex flex-col h-full bg-white border-r border-gray-100">

            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>

                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 tracking-tight font-raleway">
                            <MessageSquare className="hidden md:block w-5 h-5 text-gray-600" />
                            Messages
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 hover:bg-gray-200 focus:bg-white
                     rounded-xl text-sm outline-none border border-transparent
                     focus:border-blue-500 transition-all duration-200 font-poppins"
                        />
                    </div>
                </div>
            </div>


            {/* Conversations */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 font-montserrat">

                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-medium text-gray-900">No conversations yet</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Start chatting with landlords to see messages here.
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => {
                        const other = getOtherParticipant(conversation);
                        const userId = user?._id || user?.id;
                        // Check for unreadCount as both object property and Map
                        const unread = conversation.unreadCount?.[userId] ||
                            conversation.unreadCount?.get?.(userId) ||
                            0;

                        return (
                            <button
                                key={conversation._id}
                                onClick={() => setSelectedConversation(conversation)}
                                className="w-full px-5 py-4 border-b border-gray-50
                       hover:bg-gray-50 transition-all duration-200 text-left group"
                            >
                                <div className="flex items-start gap-4">

                                    {/* Avatar */}
                                    <div className="relative">
                                        {other?.landlordProfile?.profileImage ? (
                                            <img
                                                src={other.landlordProfile.profileImage}
                                                alt={other.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-900 font-semibold text-sm font-raleway">
                                                    {(other?.name || "U").charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Unread dot */}
                                        {unread > 0 && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full ring-2 ring-white"></span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">

                                        {/* Top row */}
                                        <div className="flex items-center justify-between">
                                            <h3
                                                className={`text-sm font-semibold font-raleway truncate ${unread > 0 ? "text-gray-900" : "text-gray-700"
                                                    }`}
                                            >
                                                {other?.name || "Unknown User"}
                                            </h3>

                                            {conversation.lastMessageAt && (
                                                <span className="text-xs text-gray-400">
                                                    {formatTime(conversation.lastMessageAt)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Property */}
                                        <p className="text-xs text-gray-400 truncate mb-1 font-nunito">
                                            {conversation.property?.title || "Property"}
                                        </p>

                                        {/* Last message */}
                                        {conversation.lastMessage && (
                                            <p
                                                className={`text-sm truncate font-montserrat ${unread > 0
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
