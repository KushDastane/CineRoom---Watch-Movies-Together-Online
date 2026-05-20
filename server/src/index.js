require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const {Server} = require("socket.io");
const roomRoutes = require("./routes/roomRoutes.js");
const registerRoomSockets = require("./sockets/roomSocket.js");
const uploadRoutes = require("./routes/uploadRoutes.js");
const connectDB = require("./config/db.js");

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({
    origin: CLIENT_URL,
    methods:["GET","POST"],
    credentials:true,
}));

app.use("/upload",uploadRoutes);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: CLIENT_URL
    }
})

app.use(express.json());
app.use("/room", roomRoutes)

app.get("/", (req, res) => {
    res.send("CineRoom backend running...");
});

app.use((error, req, res, next) => {
    console.error(error);

    res.status(500).json({
        success: false,
        message: error.message || "Something went wrong.",
    });
});

io.on("connection", (socket)=>{
    console.log("User connected",socket.id);
    registerRoomSockets(io,socket);
    
    socket.on("disconnect",()=>{
        console.log("User disconnected",socket.id);
    })
})

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    });
