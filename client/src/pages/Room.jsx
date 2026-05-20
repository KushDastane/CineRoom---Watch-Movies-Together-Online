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
  const localStream = useRef(null);
  const peerConnections = useRef({});
  const pendingCandidates = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const currentUser =
    room?.users.find(
      (user) => user.username === username
    );
  const [message, setMessage] = useState("");
  const isHost = currentUser?.isHost;

  const [loading, setLoading] = useState(true);

  const toggleMute = () => {
    const audioTrack = localStream.current?.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

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

const initializeVoice = async () => {

  try {

    const stream =
      await navigator.mediaDevices
        .getUserMedia({

          audio: {
            echoCancellation: true,
          },

          video: false,
        });

    const audioContext =
      new AudioContext();

    const source =
      audioContext
        .createMediaStreamSource(
          stream
        );

    const gainNode =
      audioContext.createGain();

    gainNode.gain.value = 3.0;

    source.connect(gainNode);

    const destination =
      audioContext
        .createMediaStreamDestination();

    gainNode.connect(destination);

    localStream.current =
      destination.stream;

    console.log(
      "Amplified microphone connected",
      localStream.current
    );

  } catch (error) {

    console.error(
      "Mic access denied",
      error
    );
  }
};

  const createPeerConnection = (targetSocket) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    });
    peerConnections.current[targetSocket] = pc;

    localStream.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream.current);
    });

    pc.ontrack = (event) => {
      console.log("Remote stream received for", targetSocket, event.streams[0]);
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocket]: event.streams[0],
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ICE_CANDIDATE", {
          roomId,
          targetSocketId: targetSocket,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  const startWebRTC = async (targetSocketId) => {
    const pc = createPeerConnection(targetSocketId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("WEBRTC_OFFER", {
      roomId,
      targetSocketId,
      offer,
    });
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("SEND_MESSAGE", {
      roomId,
      message: {
        id: Date.now(),
        username,
        text: message,
        createdAt: Date.now(),
      },
    });

    setMessage("");
  };

  useEffect(() => {
    const username = sessionStorage.getItem("username");

    if (!username) {
      return;
    }

    const setupVoiceAndJoin = async () => {
      await initializeVoice();
      socket.emit("JOIN_ROOM", {
        roomId,
        username
      });
    };

    setupVoiceAndJoin();

    socket.on("ROOM_UPDATED", (updatedRoom) => {
      console.log("Realtime room update:", updatedRoom);
      setRoom(updatedRoom);

      // Clean up stale connections for users who left
      const activeSocketIds = updatedRoom.users.map((u) => u.socketId);
      Object.keys(peerConnections.current).forEach((id) => {
        if (!activeSocketIds.includes(id)) {
          console.log("Cleaning up disconnected user connection:", id);
          peerConnections.current[id]?.close();
          delete peerConnections.current[id];
          if (pendingCandidates.current[id]) {
            delete pendingCandidates.current[id];
          }
          // Remove remote stream from state
          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      });

      // Establish mesh connections: lexicographically larger socket ID initiates WebRTC offer
      updatedRoom.users.forEach((user) => {
        if (user.socketId !== socket.id) {
          const alreadyConnected = peerConnections.current[user.socketId];
          if (!alreadyConnected) {
            if (socket.id > user.socketId) {
              console.log(`Initiating WebRTC connection from ${socket.id} to ${user.socketId}`);
              startWebRTC(user.socketId);
            } else {
              console.log(`Waiting for WebRTC connection from ${user.socketId} to ${socket.id}`);
            }
          }
        }
      });
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

    socket.on("WEBRTC_OFFER",
      async ({ offer, senderSocketId }) => {
        const pc = createPeerConnection(senderSocketId);

        await pc.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        // Process any queued ICE candidates for this sender
        const candidates = pendingCandidates.current[senderSocketId] || [];
        for (const candidate of candidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
            .catch((err) => console.error("Error adding queued ICE candidate", err));
        }
        pendingCandidates.current[senderSocketId] = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit(
          "WEBRTC_ANSWER",
          {
            roomId,
            targetSocketId: senderSocketId,
            answer,
          }
        );
      }
    );

    socket.on(
      "WEBRTC_ANSWER",
      async ({
        answer,
        senderSocketId
      }) => {
        const pc = peerConnections.current[senderSocketId];
        if (pc) {
          await pc.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          // Process any queued ICE candidates for this sender
          const candidates = pendingCandidates.current[senderSocketId] || [];
          for (const candidate of candidates) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
              .catch((err) => console.error("Error adding queued ICE candidate", err));
          }
          pendingCandidates.current[senderSocketId] = [];

          console.log(
            "WEBRTC Connected"
          );
        }
      }
    );

    socket.on(
      "ICE_CANDIDATE",
      async ({
        candidate,
        senderSocketId
      }) => {
        try {
          const pc = peerConnections.current[senderSocketId];
          if (!pc) return;

          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("ICE Candidate added directly");
          } else {
            if (!pendingCandidates.current[senderSocketId]) {
              pendingCandidates.current[senderSocketId] = [];
            }
            pendingCandidates.current[senderSocketId].push(candidate);
            console.log("ICE Candidate queued");
          }
        } catch (error) {
          console.error("ICE error", error);
        }
      }
    );

    return () => {
      // Clean up all active WebRTC connections and state on unmount
      Object.keys(peerConnections.current).forEach((id) => {
        peerConnections.current[id]?.close();
      });
      peerConnections.current = {};
      pendingCandidates.current = {};
      setRemoteStreams({});

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }

      socket.off("ROOM_UPDATED");
      socket.off("SEEK_VIDEO");
      socket.off("PLAY_VIDEO");
      socket.off("PAUSE_VIDEO");
      socket.off("WEBRTC_OFFER");
      socket.off("WEBRTC_ANSWER");
      socket.off("ICE_CANDIDATE");
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
  };

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
  };

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
            src={room.videoUrl}
            type="video/mp4"
          />
        </video>
      </div>

      <button
        onClick={toggleMute}
        className="
          bg-black
          text-white
          px-4
          py-2
          rounded-lg
          mb-4
        "
      >
        {isMuted ? "Unmute Mic" : "Mute Mic"}
      </button>

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

      <div className="mt-10">
        <h3 className="text-2xl font-bold mb-4">
          Chat
        </h3>

        <div
          className="
            border
            rounded-lg
            p-4
            h-64
            overflow-y-auto
            mb-4
          "
        >
          {room.messages?.map((msg) => (
            <div
              key={msg.id}
              className="mb-3"
            >
              <span className="font-bold">
                {msg.username}
              </span>
              : {msg.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
            className="
              border
              p-3
              rounded-lg
              flex-1
            "
          />

          <button
            onClick={sendMessage}
            className="
              bg-blue-500
              text-white
              px-4
              rounded-lg
            "
          >
            Send
          </button>
        </div>
      </div>

      {/* Render invisible HTML5 audio tags for each remote WebRTC stream */}
      {Object.entries(remoteStreams).map(([socketId, stream]) => (
        <audio
          key={socketId}
          ref={(el) => {
            if (el && el.srcObject !== stream) {
              el.srcObject = stream;
            }
          }}
          autoPlay
        />
      ))}
    </div>
  );
};

export default Room;