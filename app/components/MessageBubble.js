"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, Download, Image as ImageIcon, Edit2, Trash2, MoreVertical } from "lucide-react";

export default function MessageBubble({ message, isOwn, onEdit, onDelete }) {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const longPressTimer = useRef(null);
    const menuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const messageRef = useRef(null);

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")} `;
    };

    const reactionCounts = message.reactions?.reduce((acc, curr) => {
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
        return acc;
    }, {});

    // Handle long press for mobile
    const handleTouchStart = (e) => {
        if (!isOwn) return; // Only for own messages

        longPressTimer.current = setTimeout(() => {
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }

            const touch = e.touches[0];
            setMenuPosition({ x: touch.clientX, y: touch.clientY });
            setShowMenu(true);
        }, 500); // 500ms long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Handle right-click for desktop
    const handleContextMenu = (e) => {
        if (!isOwn) return; // Only for own messages

        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    };

    // Close menu when clicking outside - FIXED: Check both desktop and mobile refs
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Check if click is inside the desktop menu
            const isInsideDesktopMenu = menuRef.current && menuRef.current.contains(e.target);
            // Check if click is inside the mobile bottom sheet
            const isInsideMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(e.target);

            // Only close if click is outside BOTH menus
            if (!isInsideDesktopMenu && !isInsideMobileMenu) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            // Use a small delay to prevent immediate closure on the same touch that opened the menu
            const timeoutId = setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
                document.addEventListener("touchstart", handleClickOutside, { passive: false });
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("touchstart", handleClickOutside);
            };
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showMenu]);

    const handleEdit = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowMenu(false);
        if (onEdit) onEdit(message);
    };

    const handleDelete = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowMenu(false);
        if (onDelete) onDelete(message);
    };

    // State for portal mounting
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Portal for mobile menu
    const MobileMenuPortal = ({ children }) => {
        if (!mounted || typeof window === 'undefined') return null;
        return createPortal(children, document.body);
    };

    return (
        <>
            <div
                ref={messageRef}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 px-1 animate-fadeIn relative`}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >

                <div
                    className={`max-w-[75%] md:max-w-[65%] ${isOwn
                        ? "bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                        : "bg-white text-gray-900 shadow-md border border-gray-100"
                        } rounded-2xl ${message.messageType === "text" ? "px-4 py-3" : "p-2"
                        } relative transition-all duration-200 hover:shadow-xl ${isOwn ? "hover:shadow-blue-600/30" : "hover:shadow-gray-300"
                        }`}
                >
                    {/* Replied Message Context */}
                    {message.replyTo && (
                        <div
                            className={`mb-2 rounded-lg p-2 text-xs border-l-4 ${isOwn
                                ? "bg-white/10 border-white/50 text-white/90"
                                : "bg-gray-50 border-blue-500 text-gray-600"
                                } cursor-pointer opacity-90`}
                        >
                            <div className="font-bold mb-0.5">{message.replyTo.sender?.name || message.replyTo.sender?.firstName || message.replyTo.senderName || "Someone"}</div>
                            <div className="truncate">
                                {message.replyTo.messageType === "text" ? message.replyTo.content : "Media attachment"}
                            </div>
                        </div>
                    )}

                    {/* Text Message */}
                    {message.messageType === "text" && (
                        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {message.content}
                        </p>
                    )}

                    {/* Image Message */}
                    {message.messageType === "image" && (
                        <div className="rounded-xl overflow-hidden bg-gray-100">
                            <img
                                src={message.fileUrl}
                                alt="Shared image"
                                className="max-w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(message.fileUrl, "_blank")}
                            />
                        </div>
                    )}

                    {/* Voice Message */}
                    {message.messageType === "voice" && (
                        <div className={`flex items-center gap-3 min-w-[220px] ${isOwn ? "px-2 py-1" : "px-3 py-2"}`}>
                            <audio
                                controls
                                className="w-full rounded-lg"
                                style={{
                                    height: "36px",
                                    filter: isOwn ? "invert(1) brightness(1.2)" : "none",
                                }}
                            >
                                <source src={message.fileUrl} type="audio/webm" />
                                <source src={message.fileUrl} type="audio/ogg" />
                                Your browser does not support audio.
                            </audio>
                            {message.duration && (
                                <span className={`text-xs font-medium whitespace-nowrap ${isOwn ? "text-blue-100" : "text-gray-600"}`}>
                                    {formatDuration(message.duration)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* File Attachment */}
                    {message.messageType === "file" && (
                        <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-xl ${isOwn
                                ? "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                                : "bg-gray-50 hover:bg-gray-100"
                                } transition-all duration-200 min-w-[240px]`}
                        >
                            <div className={`p-3 rounded-lg ${isOwn ? "bg-white/20" : "bg-blue-50"}`}>
                                <FileText className={`w-6 h-6 ${isOwn ? "text-white" : "text-blue-600"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isOwn ? "text-white" : "text-gray-900"}`}>
                                    {message.fileName || "Attachment"}
                                </p>
                                <p className={`text-xs mt-0.5 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                                    {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : "File"}
                                </p>
                            </div>
                            <Download className={`w-5 h-5 flex-shrink-0 ${isOwn ? "text-white/80" : "text-gray-400"}`} />
                        </a>
                    )}

                    {/* GIF Message */}
                    {message.messageType === "gif" && (
                        <div className="rounded-xl overflow-hidden">
                            <img
                                src={message.fileUrl}
                                alt="GIF"
                                className="max-w-full h-auto"
                            />
                        </div>
                    )}

                    {/* Metadata Row */}
                    <div className={`flex items-center ${message.messageType === "text" ? "justify-end gap-1.5 mt-1" : "justify-end gap-1.5 px-2 pb-1"
                        } text-[10px] font-medium ${isOwn ? "text-blue-100/90" : "text-gray-500"}`}>
                        {message.isEdited && (
                            <span className="italic opacity-80">(edited)</span>
                        )}
                        <span className="opacity-90">{formatTime(message.createdAt)}</span>
                    </div>

                    {/* Reactions Display */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className={`absolute -bottom-2 ${isOwn ? "right-2" : "left-2"} flex gap-1 z-10`}>
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <span
                                    key={emoji}
                                    className="bg-white border-2 border-gray-200 rounded-full px-2 py-0.5 text-xs shadow-md flex items-center gap-1 hover:scale-110 transition-transform cursor-pointer"
                                >
                                    <span className="text-sm">{emoji}</span>
                                    {count > 1 && <span className="font-bold text-gray-700 text-[10px]">{count}</span>}
                                </span>
                            ))}
                        </div>
                    )}
                </div>



                {/* Menu Trigger - 3 Dots Button (All Devices) */}
                {isOwn && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(true);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({ x: rect.left, y: rect.top });
                        }}
                        className="self-center p-2 text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                        aria-label="Message options"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Desktop Context Menu */}
            {showMenu && isOwn && (
                <div
                    ref={menuRef}
                    className="hidden md:block fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-[99999] min-w-[160px] animate-fadeIn"
                    style={{
                        top: `${menuPosition.y}px`,
                        left: `${menuPosition.x}px`,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-8px'
                    }}
                >
                    {message.messageType === "text" && onEdit && (
                        <button
                            onClick={handleEdit}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                        >
                            <Edit2 className="w-4 h-4" />
                            <span className="font-medium">Edit Message</span>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="font-medium">Delete Message</span>
                        </button>
                    )}
                </div>
            )}

            {/* Mobile Bottom Sheet Actions - Rendered via Portal */}
            {showMenu && isOwn && (
                <MobileMenuPortal>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/40 z-[99998] animate-fadeIn"
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                    />

                    {/* Bottom Sheet */}
                    <div
                        ref={mobileMenuRef}
                        className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[99999] animate-slideUp shadow-[0_-4px_30px_rgba(0,0,0,0.15)]"
                        onTouchEnd={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

                        <div className="space-y-2">
                            {message.messageType === "text" && onEdit && (
                                <button
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEdit(e);
                                    }}
                                    onClick={handleEdit}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl active:bg-gray-50 transition-colors text-gray-800"
                                    style={{ touchAction: 'manipulation' }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Edit2 className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-lg">Edit Message</span>
                                </button>
                            )}

                            {onDelete && (
                                <button
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete(e);
                                    }}
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl active:bg-red-50 transition-colors text-red-600"
                                    style={{ touchAction: 'manipulation' }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-lg">Delete Message</span>
                                </button>
                            )}

                            <button
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                                className="w-full p-4 text-center font-medium text-gray-500 mt-2"
                                style={{ touchAction: 'manipulation' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </MobileMenuPortal>
            )}


            {/* Mobile Actions for Received Messages - Rendered via Portal */}
            {showMenu && !isOwn && (
                <MobileMenuPortal>
                    <div
                        className="fixed inset-0 bg-black/40 z-[99998] animate-fadeIn"
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                    />
                    <div
                        ref={mobileMenuRef}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[99999] animate-slideUp shadow-[0_-4px_30px_rgba(0,0,0,0.15)]"
                        onTouchEnd={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                        <div className="space-y-2">
                            <button
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                                className="w-full p-4 text-center font-medium text-gray-500 mt-2"
                                style={{ touchAction: 'manipulation' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </MobileMenuPortal>
            )}
        </>
    );
}
