const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketIo = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = socketIo(server, {
        cors: {
            origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    });

    const userSockets = new Map(); // userId -> socketId

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join", (userId) => {
            userSockets.set(userId, socket.id);
            socket.userId = userId;
            console.log(`User ${userId} joined with socket ${socket.id}`);

            // Broadcast user online status (without DB update for now to ensure stability)
            io.emit("user_status", { userId, isOnline: true });
        });

        socket.on("send_message", async (data) => {
            const { conversationId, recipientId, message } = data;
            const recipientSocketId = userSockets.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("receive_message", {
                    conversationId,
                    message,
                });
            }
        });

        socket.on("typing", (data) => {
            const { conversationId, recipientId, isTyping } = data;
            const recipientSocketId = userSockets.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("user_typing", {
                    conversationId,
                    isTyping,
                });
            }
        });

        // Handle status request - check if user is online
        socket.on("request_status", (userId) => {
            const isOnline = userSockets.has(userId);
            socket.emit("user_status", {
                userId,
                isOnline,
                lastSeen: isOnline ? null : new Date()
            });
        });

        // Legacy booking chat support
        socket.on("join-room", (bookingId) => {
            socket.join(bookingId);
        });

        socket.on("send-message", ({ bookingId, message }) => {
            io.to(bookingId).emit("receive-message", {
                message,
                senderId: socket.id,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("disconnect", () => {
            if (socket.userId) {
                const userId = socket.userId;
                userSockets.delete(userId);
                console.log(`User ${userId} disconnected`);

                // Broadcast user offline status
                io.emit("user_status", {
                    userId,
                    isOnline: false,
                    lastSeen: new Date()
                });
            } else {
                console.log("Client disconnected", socket.id);
            }
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, "0.0.0.0", (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
        console.log(`> Network access: http://192.168.1.8:${PORT}`);
    });
});
