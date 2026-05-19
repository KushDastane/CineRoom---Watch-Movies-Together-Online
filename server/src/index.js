const express = require("express");
const cors = require("cors");
const http = require("http");
const {Server} = require("socket.io");
const roomRoutes = require("./routes/roomRoutes.js");
const registerRoomSockets = require("./sockets/roomSocket.js");
const path = require("path");
const uploadRoutes = require("./routes/uploadRoutes.js");

const app = express();
app.use(cors({
    origin:"http://localhost:5173",
    methods:["GET","POST"],
    credentials:true,
}));

app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
)

app.use("/upload",uploadRoutes);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
})

app.use(express.json());
app.use("/room", roomRoutes)

app.get("/", (req, res) => {
    res.send("CineRoom backend running...");
});

io.on("connection", (socket)=>{
    console.log("User connected",socket.id);
    registerRoomSockets(io,socket);
    
    socket.on("disconnect",()=>{
        console.log("User disconnected",socket.id);
    })
})

const PORT = 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});