"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const ChatList = dynamic(() => import("./ChatList"), { ssr: false });

export default function ChatIcon() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const [currentConversation, setCurrentConversation] = useState(null);

    // Client-side only
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch unread count function
    const fetchUnreadCount = async () => {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                if (data.conversations) {
                    const total = data.conversations.reduce(
                        (sum, conv) => sum + (conv.unreadCount?.[user?._id || user?.id] || 0),
                        0
                    );
                    setUnreadCount(total);
                }
            }
        } catch (error) {
            // Silent fail - don't break the app
        }
    };

    useEffect(() => {
        if (user && isMounted) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);

            // Listen for openChat event
            const handleOpenChat = (event) => {
                setIsOpen(true);
                // If event has conversation details, pass them to ChatList
                if (event.detail?.conversation) {
                    // We'll pass this via a ref or context, but for now let's just force open
                    // A better way is to pass it as a prop to ChatList, so let's add state
                    setCurrentConversation(event.detail.conversation);
                }
            };

            window.addEventListener("openChat", handleOpenChat);

            return () => {
                clearInterval(interval);
                window.removeEventListener("openChat", handleOpenChat);
            };
        }
    }, [user, isMounted]);

    // Don't render during SSR or if user not logged in
    if (!isMounted || !user) return null;

    return (
        <>
            {/* Floating Chat Button - Works on Mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300"
                aria-label="Open chat"
                style={{ minWidth: '56px', minHeight: '56px' }}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <MessageCircle className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </>
                )}
            </button>

            {/* Chat Panel - Responsive for Mobile */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-white md:fixed md:bottom-24 md:right-6 md:w-96 md:h-[600px] md:inset-auto md:rounded-xl md:shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-fadeIn">
                    <ChatList
                        onClose={() => {
                            setIsOpen(false);
                            setCurrentConversation(null);
                        }}
                        onUpdateUnread={setUnreadCount}
                        initialConversation={currentConversation}
                    />
                </div>
            )}
        </>
    );
}
