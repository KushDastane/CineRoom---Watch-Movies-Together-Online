const rooms = new Map();

const createRoom = () =>{
    const roomId = Math.random().toString(36).substring(2,8);
    
    const room = {
        roomId,
        users : [],
        createdAt: Date.now(),
        playbackState:{
            isPlaying: false,
            currentTime: 0,
        },
    };

    rooms.set(roomId,room);
    return room;
};

const getRoom = (roomId) => {
    return rooms.get(roomId);
};

const joinRoom = (roomId, username)=>{
    const room = rooms.get(roomId);
    
    if(!room){
        return null;
    }

    const user = {
        id: Math.random().toString(36).substring(2,9),
        username,
        joinedAt: Date.now(),
        isHost: room.users.length === 0, //first user = host
    };

    room.users.push(user);
    return { room, user };
};

module.exports = {createRoom , getRoom , joinRoom};