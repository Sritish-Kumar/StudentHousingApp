"use client";

import { FileText, Download, Image as ImageIcon } from "lucide-react";

export default function MessageBubble({ message, isOwn }) {
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

    return (
        <div
            className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 px-1 animate-fadeIn`}
        >
            <div
                className={`max-w-[75%] md:max-w-[65%] ${isOwn
                    ? "bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white text-gray-900 shadow-md border border-gray-100"
                    } rounded-2xl ${message.messageType === "text" ? "px-4 py-3" : "p-2"
                    } relative transition-all duration-200 hover:shadow-xl ${isOwn ? "hover:shadow-blue-600/30" : "hover:shadow-gray-300"
                    }`}
            >
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
        </div>
    );
}
