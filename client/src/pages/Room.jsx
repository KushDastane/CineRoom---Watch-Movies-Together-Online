import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket/socket";
import { useRef } from "react";
import api from "../services/api";

const Room = () => {
  const { roomId } = useParams();
  const videoRef = useRef(null);
  const isRemoteAction = useRef(false);
  const [room, setRoom] = useState(null);
  const username = sessionStorage.getItem("username");
  const currentUser =
    room?.users.find(
      (user) => user.username === username
    );

  const isHost = currentUser?.isHost;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/room/${roomId}`);

        setRoom(response.data.room);

      } catch (error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    };

    fetchRoom();

  }, [roomId]);

  useEffect(() => {
    const username = sessionStorage.getItem("username");

    if (!username) {
      return;
    }

    socket.emit("JOIN_ROOM", {
      roomId,
      username
    });

    socket.on("ROOM_UPDATED", (updatedRoom) => {
      console.log("Realtime room update:", updatedRoom);
      setRoom(updatedRoom);
    });

    socket.on("PLAY_VIDEO", () => {
      isRemoteAction.current = true;
      videoRef.current?.play();
    });

    socket.on("PAUSE_VIDEO", () => {
      isRemoteAction.current = true;
      videoRef.current?.pause();
    });

    socket.on("SEEK_VIDEO", ({ currentTime }) => {
      isRemoteAction.current = true;
      if (videoRef.current) {
        isRemoteAction.current = true;
        videoRef.current.currentTime = currentTime;
      }
    });

    return () => {
      socket.off("ROOM_UPDATED");
      socket.off("SEEK_VIDEO");
      socket.off("PLAY_VIDEO");
      socket.off("PAUSE_VIDEO");
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="p-10 text-2xl">
        Loading...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-10 text-2xl text-red-500">
        Room not found
      </div>
    );
  }

  const handlePlay = () => {
    if (!isHost) return;
    if (isRemoteAction.current) {
      isRemoteAction.current = false;
      return;
    }
    socket.emit("PLAY_VIDEO", {
      roomId,
    });
  };

  const handlePause = () => {
    if (!isHost) return;
    if (isRemoteAction.current) {
      isRemoteAction.current = false;
      return;
    }
    socket.emit("PAUSE_VIDEO", {
      roomId,
    });
  };

  const handleSeeked = () => {
    if (!isHost) return;
    if (isRemoteAction.current) {
      isRemoteAction.current = false;
      return;
    }

    if (!videoRef.current) return;
    socket.emit("SEEK_VIDEO", {
      roomId,
      currentTime: videoRef.current?.currentTime,
    });
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("video", file);
      const response = await api.post(
        "/upload/video",
        formData
      );

      socket.emit("SET_VIDEO", {
        roomId,
        videoUrl: response.data.videoUrl,
      });
    }
    catch (error) {
      console.error("Upload error:", error);
    }
  }

  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-6">
        CineRoom
      </h1>

      <h2 className="text-2xl mb-4">
        Room ID: {room.roomId}
      </h2>

      {isHost && (

        <div className="mb-6">

          <input
            type="file"
            accept="video/mp4"
            onChange={handleVideoUpload}
          />

        </div>
      )}

      <div className="mb-8">

        <video
          key={room.videoUrl}
          ref={videoRef}
          controls={isHost}
          className="w-full max-w-3xl rounded-xl"
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeking={handleSeeked}
        >
          <source
            src={
              room.videoUrl
            }
            type="video/mp4"
          />
        </video>

      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">
          Users
        </h3>

        <div className="flex flex-col gap-2">
          {room.users.map((user) => (
            <div
              key={user.id}
              className="border p-3 rounded-lg"
            >
              {user.username}

              {user.isHost && " 👑"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Room;