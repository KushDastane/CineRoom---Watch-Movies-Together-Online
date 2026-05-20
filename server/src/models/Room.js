const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        socketId: { type: String, default: null },
        username: { type: String, required: true },
        joinedAt: { type: Number, required: true },
        isHost: { type: Boolean, default: false },
        isMuted: { type: Boolean, default: true },
        isCameraOn: { type: Boolean, default: false },
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema(
    {
        id: { type: mongoose.Schema.Types.Mixed, required: true },
        userId: { type: String, default: null },
        username: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Number, required: true },
    },
    { _id: false }
);

const roomSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true, unique: true, index: true },
        youtubeVideoId: { type: String, default: null },
        users: { type: [userSchema], default: [] },
        messages: { type: [messageSchema], default: [] },
        videoUrl: { type: String, default: null },
        playbackState: {
            isPlaying: { type: Boolean, default: false },
            currentTime: { type: Number, default: 0 },
            updatedAt: { type: Number, default: Date.now },
        },
        createdAt: { type: Number, default: Date.now },
        lastActiveAt: { type: Date, default: Date.now, expires: 86400 },
        emptySince: { type: Date, default: null, expires: 300 },
    },
    {
        versionKey: false,
    }
);

roomSchema.methods.toClient = function toClient() {
    const room = this.toObject();
    return {
        ...room,
        lastActiveAt: room.lastActiveAt?.getTime?.() || Date.now(),
    };
};

module.exports = mongoose.model("Room", roomSchema);
