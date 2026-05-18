const express = require("express");
const cors = require("cors");
const roomRoutes = require("./routes/roomRoutes.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/room", roomRoutes)

app.get("/", (req, res) => {
    res.send("CineRoom backend running...");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});