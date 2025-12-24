const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketIo = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        // Be sure to pass `true` as the second argument to `url.parse`.
        // This tells it to parse the query portion of the URL.
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = socketIo(server);

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        // Join Chat Room
        socket.on("join-room", (bookingId) => {
            socket.join(bookingId);
            console.log(`User ${socket.id} joined room: ${bookingId}`);
        });

        // Send Message
        socket.on("send-message", ({ bookingId, message }) => {
            console.log(`Message in room ${bookingId}: ${message}`);
            // Broadcast to everyone in the room INCLUDING sender (or use socket.to(room) to exclude sender)
            // Usually for chat we want everyone to receive it to update UI
            io.to(bookingId).emit("receive-message", {
                message,
                senderId: socket.id, // In real app, associate with User ID from session
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
