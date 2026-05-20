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

    socket.on(
        "PLAY_VIDEO",

        ({ roomId, currentTime }) => {

            socket.to(roomId).emit(
                "PLAY_VIDEO",

                { currentTime }
            );
        }
    );

    socket.on(
        "PAUSE_VIDEO",

        ({ roomId, currentTime }) => {

            socket.to(roomId).emit(
                "PAUSE_VIDEO",

                { currentTime }
            );
        }
    );

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

    socket.on(
        "SET_YOUTUBE_VIDEO",

        ({
            roomId,
            youtubeVideoId
        }) => {

            const updatedRoom =
                roomService.setYoutubeVideo(
                    roomId,
                    youtubeVideoId
                );

            io.to(roomId).emit(
                "ROOM_UPDATED",
                updatedRoom
            );
        }
    );

    socket.on("TOGGLE_MUTE", ({ roomId, isMuted }) => {
        const updatedRoom = roomService.setUserMuteState(roomId, socket.id, isMuted);
        if (updatedRoom) {
            io.to(roomId).emit("ROOM_UPDATED", updatedRoom);
        }
    });

    socket.on("TOGGLE_CAMERA", ({ roomId, isCameraOn }) => {
        const updatedRoom = roomService.setUserCameraState(roomId, socket.id, isCameraOn);
        if (updatedRoom) {
            io.to(roomId).emit("ROOM_UPDATED", updatedRoom);
        }
    });

    socket.on("SEND_REACTION", ({ roomId, emoji, username }) => {
        io.to(roomId).emit("REACTION_RECEIVED", { emoji, username, id: Date.now() });
    });

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