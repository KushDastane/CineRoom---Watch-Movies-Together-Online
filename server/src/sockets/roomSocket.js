const roomService = require("../services/roomService.js");

const registerRoomSockets = (io, socket) => {
    socket.on("JOIN_ROOM", async ({ roomId, username, userId }) => {

        const result = await roomService.addUserToRoom(roomId, username, socket.id, userId);

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

        async ({ roomId, currentTime }) => {

            await roomService.updatePlaybackState(roomId, {
                isPlaying: true,
                currentTime,
            });

            socket.to(roomId).emit(
                "PLAY_VIDEO",

                { currentTime }
            );
        }
    );

    socket.on(
        "PAUSE_VIDEO",

        async ({ roomId, currentTime }) => {

            await roomService.updatePlaybackState(roomId, {
                isPlaying: false,
                currentTime,
            });

            socket.to(roomId).emit(
                "PAUSE_VIDEO",

                { currentTime }
            );
        }
    );

    socket.on("SEEK_VIDEO", async ({ roomId, currentTime }) => {
        await roomService.updatePlaybackState(roomId, { currentTime });
        socket.to(roomId).emit("SEEK_VIDEO", { currentTime });
    })

    socket.on(
        "SET_VIDEO",

        async ({ roomId, videoUrl }) => {

            const updatedRoom =
                await roomService.setRoomVideo(
                    roomId,
                    videoUrl
                );

            if (updatedRoom) {
                io.to(roomId).emit(
                    "ROOM_UPDATED",
                    updatedRoom
                );
            }
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
        async ({ roomId, message }) => {
            const updatedRoom
                = await roomService.addMessageToRoom(
                    roomId,
                    message
                );
            if (updatedRoom) {
                io.to(roomId).emit("ROOM_UPDATED", updatedRoom);
            }
        }
    )

    socket.on(
        "SET_YOUTUBE_VIDEO",

        async ({
            roomId,
            youtubeVideoId
        }) => {

            const updatedRoom =
                await roomService.setYoutubeVideo(
                    roomId,
                    youtubeVideoId
                );

            if (updatedRoom) {
                io.to(roomId).emit(
                    "ROOM_UPDATED",
                    updatedRoom
                );
            }
        }
    );

    socket.on("TOGGLE_MUTE", async ({ roomId, isMuted }) => {
        const updatedRoom = await roomService.setUserMuteState(roomId, socket.id, isMuted);
        if (updatedRoom) {
            io.to(roomId).emit("ROOM_UPDATED", updatedRoom);
        }
    });

    socket.on("TOGGLE_CAMERA", async ({ roomId, isCameraOn }) => {
        const updatedRoom = await roomService.setUserCameraState(roomId, socket.id, isCameraOn);
        if (updatedRoom) {
            io.to(roomId).emit("ROOM_UPDATED", updatedRoom);
        }
    });

    socket.on("SEND_REACTION", ({ roomId, emoji, username }) => {
        io.to(roomId).emit("REACTION_RECEIVED", { emoji, username, id: Date.now() });
    });

    socket.on("disconnect", async () => {
        console.log("Disconnected:", socket.id);

        if (!socket.roomId) {
            return;
        }

        const updatedRoom =
            await roomService.removeUserFromRoom(
                socket.roomId,
                socket.id
            )

        if (updatedRoom) {
            io.to(socket.roomId).emit("ROOM_UPDATED", updatedRoom);
        }
    })


}

module.exports = registerRoomSockets;
