const roomService = require("../services/roomService.js");

const registerRoomSockets = (io, socket) => {
    socket.on("JOIN_ROOM", ({ roomId, username }) => {

        const result = roomService.addUserToRoom(roomId, username);

        if (!result) {
            return;
        }

        const { room, user } = result;

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = user.id;

        console.log(`${username} joined room ${roomId}`);

        io.to(roomId).emit("ROOM_UPDATED", room);
    })

    socket.on("PLAY_VIDEO", ({ roomId }) => {
        socket.to(roomId).emit("PLAY_VIDEO");
    });

    socket.on("PAUSE_VIDEO", ({ roomId }) => {
        socket.to(roomId).emit("PAUSE_VIDEO");
    });

    socket.on("SEEK_VIDEO", ({ roomId, currentTime }) => {
        socket.to(roomId).emit("SEEK_VIDEO", { currentTime });
    })

    socket.on(
        "SET_VIDEO",

        ({ roomId, videoUrl }) => {

            const updatedRoom =
                roomService.setRoomVideo(
                    roomId,
                    videoUrl
                );

            io.to(roomId).emit(
                "ROOM_UPDATED",
                updatedRoom
            );
        }
    );

    socket.on(
        "WEBRTC_OFFER",
        ({ roomId, offer }) => {
            socket.to(roomId).emit("WEBRTC_OFFER", offer);
        }
    );

    socket.on(
        "WEBRTC_ANSWER",
        ({ roomId, answer }) => {
            socket.to(roomId).emit("WEBRTC_ANSWER", answer);
        }
    );

    socket.on(
        "ICE_CANDIDATE",
        ({ roomId, candidate }) => {
            socket.to(roomId).emit("ICE_CANDIDATE", candidate);
        }
    )

    socket.on(
        "SEND_MESSAGE",
        ({roomId, message})=>{
            const updatedRoom
                =roomService.addMessageToRoom(
                    roomId,
                    message
                );
            io.to(roomId).emit("ROOM_UPDATED", updatedRoom);
        }
    )

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);

        if (!socket.roomId || !socket.userId) {
            return;
        }

        const updatedRoom =
            roomService.removeUserFromRoom(
                socket.roomId,
                socket.userId
            );

        io.to(socket.roomId).emit("ROOM_UPDATED", updatedRoom);
    })


}

const startWebRTC = async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);
    socket.emit("WEBRTC_OFFER", {
        roomId,
        offer,
    })
}

module.exports = registerRoomSockets;