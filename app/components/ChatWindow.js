"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
    ArrowLeft,
    Send,
    Image as ImageIcon,
    Mic,
    Trash2,
    MoreVertical,
    Smile,
    Paperclip,
    Edit2,
    X,
    Plus,
} from "lucide-react";
import { io } from "socket.io-client";
import MessageBubble from "./MessageBubble";
import dynamic from "next/dynamic";
import EmojiPicker from "emoji-picker-react";

// Dynamic import for VoiceRecorder
const VoiceRecorder = dynamic(() => import("./VoiceRecorder"), { ssr: false });

export default function ChatWindow({ conversation, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null); // Message object being edited

    const [showAttachMenu, setShowAttachMenu] = useState(false);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const docInputRef = useRef(null); // For file attachments
    const typingTimeoutRef = useRef(null);

    const otherParticipant = conversation?.participants?.find(
        (p) => p._id !== (user?._id || user?.id)
    );

    const [userStatus, setUserStatus] = useState({ isOnline: false, lastSeen: null });

    useEffect(() => {
        const userId = user?._id || user?.id;
        if (!conversation?._id || !userId) return;

        // Initialize Socket.IO
        const socketUrl = typeof window !== 'undefined'
            ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
            : 'http://localhost:3000';

        const newSocket = io(socketUrl);
        newSocket.emit("join", userId);
        setSocket(newSocket);

        // Fetch messages
        fetchMessages();

        // Request status for other participant via socket
        if (otherParticipant?._id) {
            newSocket.emit("request_status", otherParticipant._id);
        }

        // Listen for new messages
        newSocket.on("receive_message", (data) => {
            if (data.conversationId === conversation._id) {
                setMessages((prev) => [...prev, data.message]);
                scrollToBottom();
            }
        });

        // Listen for typing
        newSocket.on("user_typing", (data) => {
            if (data.conversationId === conversation._id) {
                setIsTyping(data.isTyping);
            }
        });

        // Listen for user status updates
        newSocket.on("user_status", (data) => {
            if (data.userId === otherParticipant?._id) {
                setUserStatus(prev => ({
                    ...prev,
                    isOnline: data.isOnline,
                    lastSeen: data.lastSeen || prev.lastSeen
                }));
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [conversation?._id, user?._id, user?.id, otherParticipant?._id]);

    const formatLastSeen = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            day: "numeric",
            month: "short",
        });
    };

    const fetchMessages = async () => {
        if (!conversation?._id) return;

        try {
            const res = await fetch(
                `/api/conversations/${conversation._id}/messages`
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending || !conversation?._id) return;

        if (editingMessage) {
            handleEditMessage();
            return;
        }

        setIsSending(true);
        const messageText = newMessage.trim();
        setNewMessage("");
        setShowEmojiPicker(false);

        try {
            const res = await fetch(
                `/api/conversations/${conversation._id}/messages`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messageType: "text",
                        content: messageText,
                    }),
                }
            );

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, data.message]);

                // Emit via socket
                if (socket && otherParticipant?._id) {
                    socket.emit("send_message", {
                        conversationId: conversation._id,
                        recipientId: otherParticipant._id,
                        message: data.message,
                    });
                }

                scrollToBottom();
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setNewMessage(messageText); // Restore message on error
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e, type = "image") => {
        const file = e.target.files?.[0];
        if (!file || !conversation?._id) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("File size must be less than 10MB");
            return;
        }

        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type === "image" ? "image" : "file");

            const uploadRes = await fetch("/api/upload/chat", {
                method: "POST",
                body: formData,
            });

            if (uploadRes.ok) {
                const { url, publicId } = await uploadRes.json();

                const messageData = {
                    messageType: type,
                    fileUrl: url,
                    filePublicId: publicId,
                };

                if (type === "file") {
                    messageData.fileName = file.name;
                    messageData.fileSize = file.size;
                }

                const res = await fetch(
                    `/api/conversations/${conversation._id}/messages`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(messageData),
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    setMessages((prev) => [...prev, data.message]);
                    if (socket && otherParticipant?._id) {
                        socket.emit("send_message", {
                            conversationId: conversation._id,
                            recipientId: otherParticipant._id,
                            message: data.message,
                        });
                    }
                    scrollToBottom();
                }
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file");
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (docInputRef.current) docInputRef.current.value = "";
        }
    };

    const handleVoiceSent = async (audioBlob, duration) => {
        if (!conversation?._id) return;

        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "voice.webm");
            formData.append("type", "voice");

            const uploadRes = await fetch("/api/upload/chat", {
                method: "POST",
                body: formData,
            });

            if (uploadRes.ok) {
                const { url, publicId } = await uploadRes.json();

                const res = await fetch(
                    `/api/conversations/${conversation._id}/messages`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            messageType: "voice",
                            fileUrl: url,
                            filePublicId: publicId,
                            duration,
                        }),
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    setMessages((prev) => [...prev, data.message]);
                    if (socket && otherParticipant?._id) {
                        socket.emit("send_message", {
                            conversationId: conversation._id,
                            recipientId: otherParticipant._id,
                            message: data.message,
                        });
                    }
                    scrollToBottom();
                }
            }
        } catch (error) {
            console.error("Error sending voice message:", error);
            alert("Failed to send voice message");
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteChat = async () => {
        if (!confirm("Delete this entire chat? This cannot be undone.")) return;
        if (!conversation?._id) return;

        try {
            const res = await fetch(
                `/api/conversations/${conversation._id}/delete`,
                { method: "DELETE" }
            );

            if (res.ok) {
                onBack();
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
            alert("Failed to delete chat");
        }
    };

    // --- New Features Handlers ---

    const handleEditMessage = async () => {
        if (!editingMessage || !newMessage.trim()) return;

        try {
            const res = await fetch(`/api/messages/${editingMessage._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage.trim() }),
            });

            if (res.ok) {
                const { message } = await res.json();
                setMessages((prev) =>
                    prev.map((m) => (m._id === message._id ? message : m))
                );
                setEditingMessage(null);
                setNewMessage("");
            }
        } catch (error) {
            console.error("Error editing message:", error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm("Delete this message for everyone?")) return;
        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deleteForEveryone: true })
            });

            if (res.ok) {
                // Remove message from local state
                setMessages((prev) => prev.filter((m) => m._id !== messageId));
            }
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            const res = await fetch(`/api/messages/${messageId}/react`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emoji }),
            });

            if (res.ok) {
                const { message } = await res.json();
                setMessages((prev) =>
                    prev.map((m) => (m._id === message._id ? message : m))
                );
            }
        } catch (error) {
            console.error("Error reacting:", error);
        }
    };

    const handleTyping = () => {
        if (!socket || !otherParticipant?._id) return;

        socket.emit("typing", {
            conversationId: conversation._id,
            recipientId: otherParticipant._id,
            isTyping: true,
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit("typing", {
                conversationId: conversation._id,
                recipientId: otherParticipant._id,
                isTyping: false,
            });
        }, 1000);
    };

    const startEditing = (message) => {
        setEditingMessage(message);
        setNewMessage(message.content);
        fileInputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-full bg-white md:rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-xl border-b-2 border-white/10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                        onClick={onBack}
                        className="hover:bg-white/20 p-2 rounded-full transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    {otherParticipant?.landlordProfile?.profileImage ? (
                        <img
                            src={otherParticipant.landlordProfile.profileImage}
                            alt={otherParticipant.name || "User"}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-white/60 flex-shrink-0 shadow-md"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/60 flex-shrink-0 shadow-md">
                            <span className="font-bold text-lg">
                                {(otherParticipant?.name || "U").charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                            {otherParticipant?.name || "Unknown User"}
                        </h3>
                        <p className="text-xs opacity-95 truncate font-medium flex items-center gap-1.5">
                            {userStatus.isOnline ? (
                                <>
                                    <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse"></span>
                                    <span>Online</span>
                                </>
                            ) : userStatus.lastSeen ? (
                                <span className="opacity-90">Last seen {formatLastSeen(userStatus.lastSeen)}</span>
                            ) : (
                                <span className="opacity-90">{conversation?.property?.title || "Property"}</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 min-w-[160px]">
                                <button
                                    onClick={handleDeleteChat}
                                    className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100 chat-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-lg"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 animate-fadeIn">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg">
                            <Send className="w-12 h-12 text-blue-600" />
                        </div>
                        <p className="text-base font-semibold text-gray-800 mb-2">
                            No messages yet
                        </p>
                        <p className="text-sm text-gray-500 text-center">
                            Start the conversation!
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div key={message._id} className="relative group">
                                <MessageBubble
                                    message={message}
                                    isOwn={message.sender?._id === (user?._id || user?.id)}
                                />
                                {/* Message Actions (Edit/Delete) - Only for own text messages */}
                                {message.sender?._id === (user?._id || user?.id) && (
                                    <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 flex gap-0.5 bg-white rounded-full shadow-lg border border-gray-100 p-1 z-20">
                                        {message.messageType === "text" && (
                                            <button
                                                onClick={() => startEditing(message)}
                                                className="p-1.5 hover:bg-blue-50 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteMessage(message._id)}
                                            className="p-1.5 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-gray-200 rounded-2xl px-4 py-2 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.1s" }}
                                    ></span>
                                    <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                    ></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-end gap-2 z-20">
                {/* Editing Indicator */}
                {editingMessage && (
                    <div className="absolute top-0 left-0 w-full -translate-y-full bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 p-3 flex items-center justify-between text-sm text-blue-700 shadow-md animate-slideIn z-10">
                        <span className="flex items-center gap-2 font-medium">
                            <Edit2 className="w-4 h-4" />
                            Editing message...
                        </span>
                        <button
                            onClick={() => {
                                setEditingMessage(null);
                                setNewMessage("");
                                if (textareaRef.current) textareaRef.current.style.height = 'auto';
                            }}
                            className="hover:bg-blue-100 p-1 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-4 mr-4 z-50 shadow-2xl rounded-xl overflow-hidden animate-fadeIn">
                        <EmojiPicker
                            onEmojiClick={(emojiData) => {
                                setNewMessage((prev) => prev + emojiData.emoji);
                                setShowEmojiPicker(false);
                            }}
                            width={300}
                            height={400}
                        />
                    </div>
                )}

                {/* Hidden File Inputs */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e, "image")}
                    accept="image/*"
                    className="hidden"
                />
                <input
                    type="file"
                    ref={docInputRef}
                    onChange={(e) => handleFileUpload(e, "file")}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                />

                {/* Attachment Menu Button */}
                <div className="relative pb-1">
                    <button
                        type="button"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className={`p-2.5 rounded-full transition-all duration-300 ${showAttachMenu ? "bg-blue-100 text-blue-600 rotate-45" : "text-gray-500 hover:bg-gray-100 hover:text-blue-600"}`}
                    >
                        <Plus className="w-6 h-6" />
                    </button>

                    {showAttachMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)}></div>
                            <div className="absolute bottom-full left-0 mb-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[180px] flex flex-col gap-1 animate-fadeIn z-50 origin-bottom-left">
                                <button
                                    onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-gray-700 w-full text-left transition-colors"
                                >
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full shadow-sm"><ImageIcon className="w-4 h-4" /></div>
                                    <span className="font-medium text-sm">Photos & Videos</span>
                                </button>
                                <button
                                    onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-gray-700 w-full text-left transition-colors"
                                >
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shadow-sm"><Paperclip className="w-4 h-4" /></div>
                                    <span className="font-medium text-sm">Document</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Textarea Input */}
                <div className="flex-1 bg-gray-100 rounded-[24px] flex items-end border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            handleTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                // Trigger submit programmatically
                                if (newMessage.trim() && !isSending) {
                                    handleSendMessage(e);
                                    e.target.style.height = 'auto'; // Reset height
                                }
                            }
                        }}
                        placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                        disabled={isSending}
                        className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 max-h-32 resize-none text-sm text-gray-800 placeholder:text-gray-400 leading-relaxed scrollbar-hide"
                    />
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors mb-1 mr-1 hover:scale-110 active:scale-95"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                </div>

                {/* Send / Mic Button */}
                <div className="pb-1">
                    {newMessage.trim() === "" && !editingMessage ? (
                        <button
                            type="button"
                            onClick={() => setShowVoiceRecorder(true)}
                            disabled={isSending}
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 shadow-sm"
                        >
                            <Mic className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                handleSendMessage(e);
                                if (textareaRef.current) textareaRef.current.style.height = 'auto';
                            }}
                            disabled={!newMessage.trim() || isSending}
                            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex-shrink-0"
                        >
                            {isSending ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                editingMessage ? <Edit2 className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Voice Recorder Modal */}
            {showVoiceRecorder && (
                <VoiceRecorder
                    onClose={() => setShowVoiceRecorder(false)}
                    onSend={handleVoiceSent}
                />
            )}
        </div>
    );
}
