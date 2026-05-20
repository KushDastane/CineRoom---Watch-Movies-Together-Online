const rooms = new Map();

const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8);

    const room = {
        roomId,
        users: [],
        messages: [],
        createdAt: Date.now(),
        videoUrl: null,
        playbackState: {
            isPlaying: false,
            currentTime: 0,
        },
    };

    rooms.set(roomId, room);
    return room;
};

const getRoom = (roomId) => {
    return rooms.get(roomId);
};

const addUserToRoom = (roomId, username, socketId) => {
    const room = rooms.get(roomId);

    if (!room) {
        return null;
    }

    const user = {
        socketId,
        id: Math.random().toString(36).substring(2, 9),
        username,
        joinedAt: Date.now(),
        isHost: room.users.length === 0, //first user = host
    };

    room.users.push(user);
    return { room, user };
};

const removeUserFromRoom = (roomId, socketId) => {
    const room = rooms.get(roomId);

    if (!room) {
        return null;
    }

    room.users = room.users.filter(
        (user) => user.socketId !== socketId //keep everyone except leaving user & replace old array with filtered array.
    );

    if (room.users.length > 0) {
        const hasHost = room.users.some(
            (user) => user.isHost
        );

        if (!hasHost) {
            room.users[0].isHost = true;
        }
    }

    if (room.users.length === 0) {
        rooms.delete(roomId);
        return null;
    }
    return room;
}

const setRoomVideo = (roomId, videoUrl) => {
    const room = rooms.get(roomId);
    if (!room) {
        return null;
    }
    room.videoUrl = videoUrl;
    return room;
};

const addMessageToRoom = (
    roomId,
    message,
)=>{
    const room = rooms.get(roomId);
    if(!room){
        return null;
    }
    room.messages.push(message);
    return room;
}

module.exports = { createRoom, getRoom, addUserToRoom, removeUserFromRoom, setRoomVideo, addMessageToRoom };