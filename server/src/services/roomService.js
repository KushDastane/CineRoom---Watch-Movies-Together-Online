const Room = require("../models/Room.js");

const touchRoom = (room) => {
    room.lastActiveAt = new Date();
};

const toClient = (room) => {
    if (!room) return null;
    return room.toClient ? room.toClient() : room;
};

const generateRoomId = () => Math.random().toString(36).substring(2, 8);

const createRoom = async (requestedRoomId = null) => {
    let roomId = requestedRoomId || generateRoomId();

    if (requestedRoomId && await Room.exists({ roomId })) {
        const existingRoom = await Room.findOne({ roomId });
        return toClient(existingRoom);
    }

    while (await Room.exists({ roomId })) {
        roomId = generateRoomId();
    }

    const room = await Room.create({
        roomId,
        youtubeVideoId: null,
        users: [],
        messages: [],
        createdAt: Date.now(),
        videoUrl: null,
        playbackState: {
            isPlaying: false,
            currentTime: 0,
            updatedAt: Date.now(),
        },
        lastActiveAt: new Date(),
        emptySince: null,
    });

    return toClient(room);
};

const getRoom = async (roomId) => {
    const room = await Room.findOne({ roomId });
    return toClient(room);
};

const setYoutubeVideo = async (roomId, youtubeVideoId) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    room.youtubeVideoId = youtubeVideoId;
    room.videoUrl = null;
    room.playbackState.isPlaying = false;
    room.playbackState.currentTime = 0;
    room.playbackState.updatedAt = Date.now();
    touchRoom(room);
    await room.save();

    return toClient(room);
};

const addUserToRoom = async (roomId, username, socketId, userId) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    const stableUserId = userId || socketId;

    let user = room.users.find((u) => u.userId === stableUserId);

    if (user) {
        user.username = username;
        user.socketId = socketId;
    } else {
        user = room.users.find((u) => u.socketId === socketId);
        if (user) {
            user.userId = stableUserId;
            user.username = username;
        }
    }

    if (!user) {
        user = {
            userId: stableUserId,
            socketId,
            username,
            joinedAt: Date.now(),
            isHost: room.users.length === 0,
            isMuted: true,
            isCameraOn: false,
        };
        room.users.push(user);
    }

    if (!room.users.some((u) => u.isHost)) {
        room.users[0].isHost = true;
    }

    room.emptySince = null;
    touchRoom(room);
    await room.save();

    return { room: toClient(room), user };
};

const removeUserFromRoom = async (roomId, socketId, options = {}) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    room.users = room.users.filter((user) => user.socketId !== socketId);

    if (room.users.length === 0 && options.deleteIfEmpty) {
        await Room.deleteOne({ roomId });
        return null;
    }

    if (room.users.length > 0 && !room.users.some((user) => user.isHost)) {
        room.users[0].isHost = true;
    }

    room.emptySince = room.users.length === 0 ? new Date() : null;
    touchRoom(room);
    await room.save();

    return toClient(room);
};

const setRoomVideo = async (roomId, videoUrl) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    room.videoUrl = videoUrl;
    room.youtubeVideoId = null;
    room.playbackState.isPlaying = false;
    room.playbackState.currentTime = 0;
    room.playbackState.updatedAt = Date.now();
    touchRoom(room);
    await room.save();

    return toClient(room);
};

const addMessageToRoom = async (roomId, message) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    room.messages.push(message);
    touchRoom(room);
    await room.save();

    return toClient(room);
};

const getAllRooms = async () => {
    const rooms = await Room.find({}).sort({ lastActiveAt: -1 });
    return rooms.map(toClient);
};

const setUserMuteState = async (roomId, socketId, isMuted) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    room.users.forEach((u) => {
        if (u.socketId === socketId) {
            u.isMuted = isMuted;
        }
    });

    touchRoom(room);
    await room.save();

    return toClient(room);
};

const setUserCameraState = async (roomId, socketId, isCameraOn) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    room.users.forEach((u) => {
        if (u.socketId === socketId) {
            u.isCameraOn = isCameraOn;
        }
    });

    touchRoom(room);
    await room.save();

    return toClient(room);
};

const updatePlaybackState = async (roomId, playbackState) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;

    if (typeof playbackState.isPlaying === "boolean") {
        room.playbackState.isPlaying = playbackState.isPlaying;
    }
    if (typeof playbackState.currentTime === "number") {
        room.playbackState.currentTime = playbackState.currentTime;
    }
    room.playbackState.updatedAt = Date.now();
    touchRoom(room);
    await room.save();

    return toClient(room);
};

module.exports = {
    createRoom,
    getRoom,
    addUserToRoom,
    removeUserFromRoom,
    setRoomVideo,
    addMessageToRoom,
    setYoutubeVideo,
    getAllRooms,
    setUserMuteState,
    setUserCameraState,
    updatePlaybackState,
};
