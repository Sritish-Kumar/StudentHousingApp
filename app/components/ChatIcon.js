"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";
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
                const total = data.conversations.reduce(
                    (sum, conv) => {
                        // Ignore conversations with no messages (they can't have unread messages)
                        if (!conv.lastMessage) return sum;
                        return sum + (conv.unreadCount?.[user?._id || user?.id] || 0);
                    },
                    0
                );
                setUnreadCount(total);
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

    // Prevent background scrolling when chat is open on small devices only
    useEffect(() => {
        if (typeof window === "undefined") return;

        const isSmallDevice = window.innerWidth < 768; // match mobile breakpoint

        if (isOpen && isSmallDevice) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Get current pathname
    const pathname = usePathname();

    // Hide chat on map/navigation pages
    const isMapPage = pathname?.startsWith('/navigate') || pathname === '/map';
    const isAdmin = pathname?.startsWith('/admin');

    // Don't render during SSR, if user not logged in, or on map pages
    if (!isMounted || !user || isMapPage) return null;

    return (
        <>
            {/* Floating Chat Button - Works on Mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed ${isAdmin ? 'bottom-24 lg:bottom-6' : 'bottom-6'} right-6 z-[2000] md:z-[100] w-14 h-14
             bg-white text-gray-800
             border border-gray-200
             rounded-full
             shadow-lg
             hover:shadow-xl
             hover:scale-105
             active:scale-95
             transition-all duration-200
             flex items-center justify-center`}
                aria-label="Open chat"
                style={{ minWidth: '56px', minHeight: '56px' }}
            >
                {isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <>
                        <MessageCircle className="w-5 h-5" />

                        {/* Unread Indicator */}
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
                        )}
                    </>
                )}
            </button>

            {/* Chat Panel - Responsive for Mobile */}
            {isOpen && (
                <div className="fixed inset-0 z-[2001] md:z-[101] bg-white md:fixed md:bottom-24 md:right-6 md:w-96 md:h-[600px] md:inset-auto md:rounded-xl md:shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-fadeIn">
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
