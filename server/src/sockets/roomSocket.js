const roomService = require("../services/roomService.js");

const registerRoomSockets = (io, socket) => {
    socket.on("JOIN_ROOM", ({ roomId, username }) => {

        const result = roomService.addUserToRoom(roomId, username, socket.id);

        if (!result) {
            return;
        }

        const { room, user } = result;

        socket.join(roomId);
        socket.roomId = roomId;
        socket.socketId = socket.id;

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

        ({ targetSocketId, offer }) => {

            io.to(targetSocketId).emit(

                "WEBRTC_OFFER",

                {
                    offer,

                    senderSocketId:
                        socket.id,
                }
            );
        }
    );

    socket.on(
        "WEBRTC_ANSWER",

        ({ targetSocketId, answer }) => {

            io.to(targetSocketId).emit(
                "WEBRTC_ANSWER",

                {
                    answer,

                    senderSocketId:
                        socket.id,
                }
            );
        }
    );

    socket.on(
        "ICE_CANDIDATE",

        ({ targetSocketId, candidate }) => {

            io.to(targetSocketId).emit(

                "ICE_CANDIDATE",

                {
                    candidate,

                    senderSocketId:
                        socket.id,
                }
            );
        }
    );

    socket.on(
        "SEND_MESSAGE",
        ({ roomId, message }) => {
            const updatedRoom
                = roomService.addMessageToRoom(
                    roomId,
                    message
                );
            io.to(roomId).emit("ROOM_UPDATED", updatedRoom);
        }
    )

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);

        if (!socket.roomId) {
            return;
        }

        const updatedRoom =
            roomService.removeUserFromRoom(
                socket.roomId,
                socket.id
            )

        io.to(socket.roomId).emit("ROOM_UPDATED", updatedRoom);
    })


}

module.exports = registerRoomSockets;