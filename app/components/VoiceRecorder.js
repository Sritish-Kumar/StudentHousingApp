"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X } from "lucide-react";

export default function VoiceRecorder({ onClose, onSend }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob, duration);
            onClose();
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Voice Message</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-6">
                    {/* Recording Indicator */}
                    <div className="relative">
                        <div
                            className={`w-24 h-24 rounded-full flex items-center justify-center ${isRecording
                                    ? "bg-red-500 animate-pulse"
                                    : audioBlob
                                        ? "bg-green-500"
                                        : "bg-blue-600"
                                }`}
                        >
                            <Mic className="w-12 h-12 text-white" />
                        </div>
                        {isRecording && (
                            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></div>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="text-3xl font-bold text-gray-900">
                        {formatDuration(duration)}
                    </div>

                    {/* Audio Preview */}
                    {audioBlob && !isRecording && (
                        <audio
                            controls
                            className="w-full"
                            src={URL.createObjectURL(audioBlob)}
                        />
                    )}

                    {/* Controls */}
                    <div className="flex gap-4 w-full">
                        {!isRecording && !audioBlob && (
                            <button
                                onClick={startRecording}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Mic className="w-5 h-5" />
                                Start Recording
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Square className="w-5 h-5" />
                                Stop Recording
                            </button>
                        )}

                        {audioBlob && !isRecording && (
                            <>
                                <button
                                    onClick={() => {
                                        setAudioBlob(null);
                                        setDuration(0);
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Re-record
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Send
                                </button>
                            </>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 text-center">
                        {isRecording
                            ? "Recording... Click stop when done"
                            : audioBlob
                                ? "Preview your voice message"
                                : "Click to start recording"}
                    </p>
                </div>
            </div>
        </div>
    );
}
