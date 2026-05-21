import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTransition } from "../context/TransitionContext";
import socket from "../socket/socket";
import api from "../services/api";
import YouTube from "react-youtube";
import NotFound from "./NotFound";
import {
  FiMic,
  FiMicOff,
  FiSend,
  FiUploadCloud,
  FiLink,
  FiLogOut,
  FiCopy,
  FiCheck,
  FiUsers,
  FiVideo,
  FiVideoOff,
  FiActivity,
  FiMessageSquare,
  FiChevronDown,
  FiSettings,
  FiTv,
  FiMaximize2,
  FiMinimize2,
  FiX
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";

const getStoredUserId = () => {
  const existingUserId = localStorage.getItem("cineroomUserId");
  if (existingUserId) return existingUserId;

  const userId = crypto.randomUUID();
  localStorage.setItem("cineroomUserId", userId);
  return userId;
};

const extractYoutubeVideoId = (url) => {
  const trimmedUrl = url.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
    return trimmedUrl;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    let videoId = null;

    if (hostname === "youtu.be") {
      videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v");
      }

      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) {
        videoId = parts[1] || null;
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId || "") ? videoId : null;
  } catch {
    return null;
  }

  return null;
};

const getIceServers = () => {
  const fallbackIceServers = [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ];

  try {
    const configuredIceServers = import.meta.env.VITE_ICE_SERVERS;
    if (!configuredIceServers) return fallbackIceServers;

    const parsedIceServers = JSON.parse(configuredIceServers);
    return Array.isArray(parsedIceServers) && parsedIceServers.length > 0
      ? parsedIceServers
      : fallbackIceServers;
  } catch (error) {
    console.error("Invalid VITE_ICE_SERVERS config", error);
    return fallbackIceServers;
  }
};

const ParticipantVideo = ({ stream, isMuted = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="w-full h-full object-cover rounded-md bg-zinc-950"
    />
  );
};

const RoomWarmupModal = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm px-4">
    <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/50">
      <div className="relative min-h-[360px] px-6 py-7 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-600/20 to-transparent" />
        <div className="cine-spotlight cine-spotlight-left" />
        <div className="cine-spotlight cine-spotlight-right" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-36 w-full items-end justify-center gap-5">
            <div className="cine-actor cine-actor-left">
              <div className="cine-actor-head">
                <span className="cine-actor-hair" />
                <span className="cine-actor-eye cine-actor-eye-left" />
                <span className="cine-actor-eye cine-actor-eye-right" />
                <span className="cine-actor-smile" />
              </div>
              <div className="cine-actor-body">
                <span className="cine-bowtie" />
              </div>
            </div>

            <div className="cine-snack-stage">
              <div className="cine-popcorn">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="cine-drink">
                <span />
              </div>
            </div>

            <div className="cine-actor cine-actor-right">
              <div className="cine-actor-head">
                <span className="cine-actor-hair" />
                <span className="cine-actor-eye cine-actor-eye-left" />
                <span className="cine-actor-eye cine-actor-eye-right" />
                <span className="cine-actor-smile" />
              </div>
              <div className="cine-actor-body">
                <span className="cine-bowtie" />
              </div>
            </div>
          </div>

          
          <h1 className="text-2xl font-black tracking-normal text-white sm:text-3xl">
            Grab your popcorn and drinks
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            The server is getting ready to stream your audio & video!
          </p>

          <div className="mt-6 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <span className="cine-dot" />
            <span>Loading...</span>
            <span className="cine-dot cine-dot-delay" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RoomLoadingShell = ({ showModal = true }) => (
  <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-brand-blue selection:text-white">
    <header className="border-b border-white/10 bg-zinc-900/55 backdrop-blur-md px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-50">
      <span className="font-mono text-base md:text-lg font-bold tracking-widest text-zinc-100 flex items-center">
        CINEROOM
        <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-700 inline-block ml-1"></span>
      </span>
      <div className="h-8 w-32 rounded border border-white/10 bg-white/5 backdrop-blur" />
    </header>

    <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full opacity-70 blur-[1px] pointer-events-none">
      <section className="lg:col-span-8 flex flex-col gap-3 lg:gap-5">
        <div className="aspect-video rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full border border-white/10 bg-white/5 animate-active-pulse" />
        </div>
        <div className="h-16 rounded-md border border-white/10 bg-white/5 backdrop-blur-xl" />
      </section>
      <section className="lg:col-span-4 flex flex-col gap-4 lg:gap-5">
        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="mx-auto aspect-[4/3] max-w-[190px] rounded-lg border border-blue-500/30 bg-white/5" />
          <div className="mt-4 flex justify-center gap-4">
            <div className="h-12 w-12 rounded-full border border-red-500/30 bg-red-500/10" />
            <div className="h-12 w-12 rounded-full border border-red-500/30 bg-red-500/10" />
          </div>
        </div>
        <div className="h-[420px] rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="h-8 border-b border-white/10" />
          <div className="mt-4 h-52 rounded border border-white/10 bg-black/10" />
          <div className="mt-4 h-12 rounded border border-white/10 bg-white/5" />
        </div>
      </section>
    </main>

    {showModal && <RoomWarmupModal />}
  </div>
);

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { navigateWithTransition } = useTransition();
  const videoRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const isRemoteAction = useRef(false);
  const [room, setRoom] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const username = sessionStorage.getItem("username");
  const userId = getStoredUserId();
  const localStream = useRef(null);
  const rawStream = useRef(null);
  const peerConnections = useRef({});
  const [isCameraOn, setIsCameraOn] = useState(false);
  const localVideoTrackRef = useRef(null);
  const placeholderTrackRef = useRef(null);
  const pendingCandidates = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(true);
  isMutedRef.current = isMuted;
  const gainNodeRef = useRef(null);

  const currentUser = room?.users.find((user) => user.userId === userId || user.username === username);
  const [message, setMessage] = useState("");
  const isHost = currentUser?.isHost;

  const roomRef = useRef(null);
  roomRef.current = room;
  const isHostRef = useRef(false);
  isHostRef.current = isHost;

  const [loading, setLoading] = useState(true);
  const [roomLoadError, setRoomLoadError] = useState("");
  const [showRoomWarmup, setShowRoomWarmup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState({
    isLoading: false,
    error: "",
  });
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    fileName: "",
    error: "",
  });
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [theatreMode, setTheatreMode] = useState(false);
  const [projectorOff, setProjectorOff] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [callFocusMode, setCallFocusMode] = useState(false);
  const [showCallPreview, setShowCallPreview] = useState(true);
  const chatListRef = useRef(null);
  const chatPanelRef = useRef(null);
  const chatBottomRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTheatreMode(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll chat to latest message smoothly
  useEffect(() => {
    const chatList = chatListRef.current;
    if (!chatList) return;

    chatList.scrollTo({
      top: chatList.scrollHeight,
      behavior: "smooth",
    });
  }, [room?.messages]);

  useEffect(() => {
    const messageCount = room?.messages?.length || 0;

    if (messageCount > previousMessageCountRef.current) {
      const lastMessage = room?.messages?.[messageCount - 1];
      const chatPanel = chatPanelRef.current;
      const chatVisible = chatPanel
        ? chatPanel.getBoundingClientRect().top < window.innerHeight && chatPanel.getBoundingClientRect().bottom > 0
        : false;

      if (lastMessage?.username !== username && !chatVisible) {
        setUnreadChatCount((count) => count + (messageCount - previousMessageCountRef.current));
      }
    }

    previousMessageCountRef.current = messageCount;
  }, [room?.messages, username]);

  const scrollToChat = () => {
    setUnreadChatCount(0);
    chatPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  useEffect(() => {
    if (!loading) {
      setShowRoomWarmup(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowRoomWarmup(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [loading]);

  const handleLeaveRoom = () => {
    socket.emit("LEAVE_ROOM");
    setProjectorOff(true);
    setTheatreMode(false);
    setTimeout(() => {
      navigateWithTransition("/");
    }, 550);
  };

  // Copy room code function
  const handleCopyKey = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendReaction = (emoji) => {
    socket.emit("SEND_REACTION", { roomId, emoji, username });
  };

  const handleSetYoutubeVideo = () => {
    setYoutubeStatus({ isLoading: false, error: "" });
    const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);

    if (!youtubeVideoId) {
      setYoutubeStatus({ isLoading: false, error: "Paste a valid YouTube link." });
      return;
    }

    if (!socket.connected) {
      setYoutubeStatus({ isLoading: false, error: "Room connection is still waking up. Try again." });
      return;
    }

    setYoutubeStatus({ isLoading: true, error: "" });

    socket.timeout(7000).emit(
      "SET_YOUTUBE_VIDEO",
      {
        roomId,
        youtubeVideoId,
      },
      (error, response) => {
        if (error || !response?.success) {
          setYoutubeStatus({
            isLoading: false,
            error: response?.message || "Could not load that YouTube video.",
          });
          return;
        }

        setYoutubeUrl("");
        setYoutubeStatus({ isLoading: false, error: "" });
      }
    );
  };

  const handleYoutubeReady = (event) => {
    youtubePlayerRef.current = event.target;
    const playbackState = roomRef.current?.playbackState;

    if (!playbackState) return;

    const elapsedSeconds = playbackState.isPlaying
      ? Math.max(0, (Date.now() - playbackState.updatedAt) / 1000)
      : 0;
    const targetTime = (playbackState.currentTime || 0) + elapsedSeconds;

    event.target.seekTo(targetTime, true);

    if (playbackState.isPlaying) {
      event.target.playVideo();
    }
  };

  const handleYoutubeStateChange = (event) => {
    if (!isHostRef.current) return;
    if (!youtubePlayerRef.current) return;

    const currentTime = youtubePlayerRef.current.getCurrentTime();

    if (event.data === 1) {
      socket.emit("PLAY_VIDEO", {
        roomId,
        currentTime,
      });
    }

    if (event.data === 2) {
      socket.emit("PAUSE_VIDEO", {
        roomId,
        currentTime,
      });
    }
  };

  const toggleMute = () => {
    const rawTrack = rawStream.current?.getAudioTracks()[0];
    const localTrack = localStream.current?.getAudioTracks()[0];

    const nextMuted = !isMutedRef.current;

    // 1. Hardware/Raw track level
    if (rawTrack) {
      rawTrack.enabled = !nextMuted;
    }

    // 2. Web Audio layer Gain Node
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMuted ? 0.0 : 3.0;
    }

    // 3. Output track level
    if (localTrack) {
      localTrack.enabled = !nextMuted;
    }

    // 4. WebRTC Senders level
    Object.values(peerConnections.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = !nextMuted;
        }
      });
    });

    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    // 5. Sync state with other peers via socket
    socket.emit("TOGGLE_MUTE", { roomId, isMuted: nextMuted });
  };

  useEffect(() => {
    let retryTimer = null;
    let cancelled = false;

    const fetchRoom = async () => {
      try {
        setRoomLoadError("");
        const pendingCreateRoomId = sessionStorage.getItem("pendingCreateRoomId");
        if (pendingCreateRoomId === roomId) {
          const createResponse = await api.post("/room/create", { roomId });
          if (cancelled) return;
          setRoom(createResponse.data.room);
          sessionStorage.removeItem("pendingCreateRoomId");
          return;
        }

        const response = await api.get(`/room/${roomId}`);
        if (cancelled) return;
        setRoom(response.data.room);
      } catch (error) {
        if (cancelled) return;

        const isPendingCreate = sessionStorage.getItem("pendingCreateRoomId") === roomId;
        const status = error?.response?.status;

        if (isPendingCreate && status !== 404) {
          setRoomLoadError("unavailable");
          retryTimer = setTimeout(fetchRoom, 2500);
          console.error(error);
          return;
        }

        if (isPendingCreate) {
          sessionStorage.removeItem("pendingCreateRoomId");
        }

        setRoomLoadError(status === 404 ? "not-found" : "unavailable");
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRoom();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [roomId]);

  const createPlaceholderVideoTrack = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e1b4b"; // deep indigo background
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CAMERA OFF", 160, 120);
    const stream = canvas.captureStream(10);
    const track = stream.getVideoTracks()[0];
    placeholderTrackRef.current = track;
    return track;
  };

  const toggleCamera = async () => {
    try {
      const nextCameraOn = !isCameraOn;

      // Stop the real camera track IMMEDIATELY (synchronously) so the hardware
      // indicator light turns off before the async getUserMedia call even starts.
      if (!nextCameraOn && localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current = null;
      }

      setIsCameraOn(nextCameraOn);

      const audioTrack = localStream.current?.getAudioTracks()[0];
      if (!audioTrack) return;

      let newVideoTrack;

      if (nextCameraOn) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, frameRate: 15 }
          });
          newVideoTrack = videoStream.getVideoTracks()[0];
          localVideoTrackRef.current = newVideoTrack;
        } catch (camErr) {
          console.error("Webcam access denied or unavailable", camErr);
          alert("Could not access webcam. Please check permissions or device connection.");
          setIsCameraOn(false);
          return;
        }
      } else {
        newVideoTrack = createPlaceholderVideoTrack();
      }

      if (localStream.current) {
        const oldVideoTrack = localStream.current.getVideoTracks()[0];
        if (oldVideoTrack) localStream.current.removeTrack(oldVideoTrack);
        localStream.current.addTrack(newVideoTrack);
      }

      Object.values(peerConnections.current).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack)
            .then(() => console.log("Video track replaced in peer connection"))
            .catch((err) => console.error("Failed to replace video track", err));
        }
      });

      socket.emit("TOGGLE_CAMERA", { roomId, isCameraOn: nextCameraOn });
    } catch (error) {
      console.error("Error toggling camera", error);
    }
  };

  const initializeVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
        },
        video: false,
      });

      rawStream.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();

      gainNode.gain.value = isMutedRef.current ? 0.0 : 3.0;
      gainNodeRef.current = gainNode;

      source.connect(gainNode);

      const destination = audioContext.createMediaStreamDestination();
      gainNode.connect(destination);

      const audioTrack = destination.stream.getAudioTracks()[0];
      const videoTrack = createPlaceholderVideoTrack();

      localStream.current = new MediaStream([audioTrack, videoTrack]);

      // Initialize the track state according to current mute state
      const rawTrack = stream.getAudioTracks()[0];
      if (rawTrack) {
        rawTrack.enabled = !isMutedRef.current;
      }
      if (audioTrack) {
        audioTrack.enabled = !isMutedRef.current;
      }

      console.log("Amplified microphone and placeholder camera connected", localStream.current);
    } catch (error) {
      console.error("Mic access denied", error);
    }
  };

  const createPeerConnection = (targetSocket) => {
    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
    });
    peerConnections.current[targetSocket] = pc;

    localStream.current?.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        track.enabled = !isMutedRef.current;
      }
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
        userId,
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
      navigate("/");
      return;
    }

    const setupVoiceAndJoin = async () => {
      await initializeVoice();
      socket.emit("JOIN_ROOM", {
        roomId,
        username,
        userId
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
      setRemoteStreams((prev) => (
        Object.fromEntries(
          Object.entries(prev).filter(([id]) => activeSocketIds.includes(id))
        )
      ));

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

    socket.on("PLAY_VIDEO", ({ currentTime }) => {
      if (roomRef.current?.youtubeVideoId) {
        youtubePlayerRef.current?.seekTo(currentTime, true);
        youtubePlayerRef.current?.playVideo();
      } else {
        isRemoteAction.current = true;
        videoRef.current?.play();
      }
    });

    socket.on("PAUSE_VIDEO", ({ currentTime }) => {
      if (roomRef.current?.youtubeVideoId) {
        youtubePlayerRef.current?.seekTo(currentTime, true);
        youtubePlayerRef.current?.pauseVideo();
      } else {
        isRemoteAction.current = true;
        videoRef.current?.pause();
      }
    });

    socket.on("SEEK_VIDEO", ({ currentTime }) => {
      if (roomRef.current?.youtubeVideoId) {
        youtubePlayerRef.current?.seekTo(currentTime, true);
      } else {
        isRemoteAction.current = true;
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
        }
      }
    });

    socket.on("WEBRTC_OFFER", async ({ offer, senderSocketId }) => {
      const pc = createPeerConnection(senderSocketId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process any queued ICE candidates for this sender
      const candidates = pendingCandidates.current[senderSocketId] || [];
      for (const candidate of candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.error("Error adding queued ICE candidate", err));
      }
      pendingCandidates.current[senderSocketId] = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("WEBRTC_ANSWER", {
        roomId,
        targetSocketId: senderSocketId,
        answer,
      });
    });

    socket.on("WEBRTC_ANSWER", async ({ answer, senderSocketId }) => {
      const pc = peerConnections.current[senderSocketId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Process any queued ICE candidates for this sender
        const candidates = pendingCandidates.current[senderSocketId] || [];
        for (const candidate of candidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
            .catch((err) => console.error("Error adding queued ICE candidate", err));
        }
        pendingCandidates.current[senderSocketId] = [];

        console.log("WEBRTC Connected");
      }
    });

    socket.on("ICE_CANDIDATE", async ({ candidate, senderSocketId }) => {
      try {
        const pc = peerConnections.current[senderSocketId];
        if (!pc) {
          if (!pendingCandidates.current[senderSocketId]) {
            pendingCandidates.current[senderSocketId] = [];
          }
          pendingCandidates.current[senderSocketId].push(candidate);
          console.log("ICE Candidate queued before peer connection");
          return;
        }

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
    });

    socket.on("REACTION_RECEIVED", ({ emoji, username, id }) => {
      const left = Math.random() * 80 + 10;
      setFloatingReactions((prev) => [...prev, { id, emoji, username, left }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2000);
    });

    return () => {
      // Clean up all active WebRTC connections and state on unmount
      Object.keys(peerConnections.current).forEach((id) => {
        peerConnections.current[id]?.close();
      });
      peerConnections.current = {};
      pendingCandidates.current = {};
      setRemoteStreams({});

      if (rawStream.current) {
        rawStream.current.getTracks().forEach((track) => track.stop());
        rawStream.current = null;
      }

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current = null;
      }

      if (placeholderTrackRef.current) {
        placeholderTrackRef.current.stop();
        placeholderTrackRef.current = null;
      }

      socket.off("ROOM_UPDATED");
      socket.off("SEEK_VIDEO");
      socket.off("PLAY_VIDEO");
      socket.off("PAUSE_VIDEO");
      socket.off("WEBRTC_OFFER");
      socket.off("WEBRTC_ANSWER");
      socket.off("ICE_CANDIDATE");
      socket.off("REACTION_RECEIVED");
    };
  }, [roomId]);

  if (loading) {
    return <RoomLoadingShell showModal={showRoomWarmup} />;
  }

  if (roomLoadError === "unavailable") {
    return <RoomLoadingShell showModal />;
  }

  if (!room) {
    return <NotFound />;
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
      setUploadState({
        isUploading: true,
        progress: 0,
        fileName: file.name,
        error: "",
      });
      const formData = new FormData();
      formData.append("video", file);
      const response = await api.post("/upload/video", formData, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadState((prev) => ({
            ...prev,
            progress: Math.min(progress, 99),
          }));
        },
      });

      setUploadState((prev) => ({
        ...prev,
        progress: 100,
      }));

      socket.emit("SET_VIDEO", {
        roomId,
        videoUrl: response.data.videoUrl,
      });
      e.target.value = "";
      setTimeout(() => {
        setUploadState({
          isUploading: false,
          progress: 0,
          fileName: "",
          error: "",
        });
      }, 700);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState({
        isUploading: false,
        progress: 0,
        fileName: "",
        error: "Upload failed. Try a smaller video or check your connection.",
      });
    }
  };

  const uploadFeedback = (compact = false) => (
    <>
      {uploadState.isUploading && (
        <div className={`mt-3 w-full rounded border border-blue-500/30 bg-blue-500/10 ${compact ? "p-2" : "p-3"}`}>
          <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[9px] font-bold uppercase tracking-wider text-blue-200">
            <span className="truncate">{uploadState.fileName || "Uploading video"}</span>
            <span>{uploadState.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
            Uploading to the projector...
          </p>
        </div>
      )}
      {uploadState.error && (
        <div className={`mt-3 rounded border border-red-500/30 bg-red-500/10 ${compact ? "p-2" : "p-3"} font-mono text-[9px] font-bold uppercase tracking-wider text-red-300`}>
          {uploadState.error}
        </div>
      )}
    </>
  );

  const renderParticipantTile = (user, size = "normal") => {
    const isPeerHost = user.isHost;
    const isSelf = user.username === username;
    const userStream = isSelf ? localStream.current : remoteStreams[user.socketId];
    const hasCamera = user.isCameraOn;
    const avatarSize = size === "large" ? "w-16 h-16 text-2xl" : "w-9 h-9 text-sm";

    return (
      <div
        key={user.socketId}
        className={`relative aspect-[4/3] w-full rounded-lg overflow-hidden border transition-all duration-300 ${
          isSelf
            ? "border-blue-500/40 bg-zinc-950"
            : "border-zinc-800/80 bg-zinc-950"
        }`}
      >
        {userStream ? (
          <ParticipantVideo stream={userStream} isMuted={isSelf} />
        ) : (
          <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
            <span className="text-[10px] font-mono text-zinc-500">CONNECTING...</span>
          </div>
        )}

        {!hasCamera && (
          <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center select-none z-10">
            <div className={`${avatarSize} rounded-full bg-gradient-to-tr ${
              isSelf ? "from-blue-600 to-indigo-500" : "from-zinc-700 to-zinc-600"
            } flex items-center justify-center text-white font-bold shadow-md`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 z-20 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-mono text-white flex items-center gap-1 select-none">
          <span className="truncate max-w-[70px]">{user.username}</span>
          {isSelf && <span className="text-blue-400 font-bold">(YOU)</span>}
          {isPeerHost && <FaCrown className="w-2.5 h-2.5 text-amber-400" />}
        </div>

        <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/60 backdrop-blur p-1 rounded-full text-white select-none">
          {user.isMuted ? (
            <FiMicOff className="w-2.5 h-2.5 text-red-500" />
          ) : (
            <FiMic className="w-2.5 h-2.5 text-emerald-400" />
          )}
        </div>
      </div>
    );
  };

  const renderMiniWatchPreview = () => (
    <div className="absolute bottom-28 right-4 z-30 w-[52vw] max-w-xs min-w-[170px] aspect-video overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl sm:bottom-5">
      <button
        onClick={() => setShowCallPreview(false)}
        className="absolute right-2 top-2 z-20 rounded-full border border-white/10 bg-black/70 p-1.5 text-zinc-300 backdrop-blur transition-colors hover:text-white cursor-pointer"
        title="Hide movie preview"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>
      {room.youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(room.youtubeVideoId) ? (
        <YouTube
          videoId={room.youtubeVideoId}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
            },
          }}
          className="w-full h-full pointer-events-none"
          iframeClassName="w-full h-full"
        />
      ) : room.videoUrl ? (
        <video
          src={room.videoUrl.startsWith("http") ? room.videoUrl : `http://localhost:5000${room.videoUrl}`}
          className="w-full h-full object-contain"
          muted
          playsInline
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-950 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
          No video
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-[2000ms] ease-in-out ${theatreMode ? "bg-zinc-950 text-zinc-200" : "bg-zinc-50 text-zinc-900"
      } font-sans selection:bg-brand-blue selection:text-white`}>
      {/* Top Header Navigation */}
      <header className={`border-b transition-all duration-[2000ms] ease-in-out ${theatreMode ? "border-zinc-900 bg-zinc-900/60" : "border-zinc-200 bg-white/80"
        } backdrop-blur-md px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-50`}>
        <div className="flex items-center gap-2 md:gap-3">
          <span className={`font-mono text-base md:text-lg font-bold tracking-widest transition-all duration-[2000ms] ease-in-out ${theatreMode ? "text-zinc-100" : "text-zinc-900"
            } flex items-center`}>
            CINEROOM
            <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-800 inline-block ml-1"></span>
          </span>
        </div>

        {/* Center: Room Code badge */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className={`flex items-center gap-1.5 md:gap-2 border transition-all duration-[2000ms] ease-in-out ${theatreMode ? "border-zinc-850 bg-zinc-900 text-zinc-400" : "border-zinc-200 bg-white text-zinc-500"
            } px-2.5 md:px-3.5 py-1 md:py-1.5 rounded font-mono text-[10px] md:text-xs shadow-sm`}>
            <span className="hidden sm:inline font-bold">Room Code:</span>
            <span className={`font-bold transition-all duration-[2000ms] ease-in-out ${theatreMode ? "text-zinc-100" : "text-zinc-900"}`}>{roomId}</span>
            <button
              onClick={handleCopyKey}
              className={`ml-1 transition-colors p-0.5 cursor-pointer ${theatreMode ? "text-zinc-500 hover:text-zinc-100" : "text-zinc-400 hover:text-zinc-900"
                }`}
              title="Copy Room Code"
            >
              {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
            </button>
          </div>
        </div>

        {/* Right: Leave Room */}
        <button
          onClick={handleLeaveRoom}
          className={`border transition-all duration-[2000ms] ease-in-out ${theatreMode
            ? "border-zinc-850 hover:border-red-650 hover:bg-red-950/30 text-zinc-455 hover:text-red-500 bg-zinc-900"
            : "border-zinc-200 hover:border-red-600 hover:bg-red-50 text-zinc-600 hover:text-red-600 bg-white"
            } px-3 md:px-4 py-1 md:py-1.5 rounded font-mono text-[10px] md:text-xs font-bold tracking-wider flex items-center gap-1 md:gap-1.5 transition-all cursor-pointer`}
        >
          <FiLogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">LEAVE ROOM</span>
        </button>
      </header>

      {/* Main Grid View */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {/* Left Side: Video viewport and host controllers */}
        <section className="lg:col-span-8 flex flex-col gap-3 lg:gap-5">
          {/* Cinema Player Container */}
          <div className={`relative border transition-all duration-[2000ms] ease-in-out ${theatreMode ? "border-zinc-900 bg-black" : "border-zinc-200 bg-zinc-950"
            } rounded-xl overflow-hidden aspect-video flex items-center justify-center box-glow`}>
            {/* Inline floating reactions stylesheet */}
            <style>{`
              @keyframes float-up {
                0% {
                  transform: translateY(0) scale(0.5);
                  opacity: 0;
                }
                15% {
                  transform: translateY(-10px) scale(1.25);
                  opacity: 1;
                }
                100% {
                  transform: translateY(-160px) scale(1);
                  opacity: 0;
                }
              }
              .animate-float-up {
                animation: float-up 2s forwards ease-out;
              }
            `}</style>

            {/* Watching Count Overlay (Top-Left Corner) */}
            <div className="absolute top-4 left-4 z-40 bg-zinc-900/80 hover:bg-zinc-900 backdrop-blur border border-zinc-800 rounded px-2.5 py-1 flex items-center gap-1.5 shadow text-[9px] font-mono font-bold text-zinc-300 select-none tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <FiUsers className="w-3.5 h-3.5 text-zinc-500" />
              <span>{room.users.length}</span>
            </div>

            {/* Render video content with Projector Shutdown effect */}
            <div className={`w-full h-full flex items-center justify-center transition-all ${projectorOff ? "projector-shutdown-active" : ""
              }`}>
              {room.youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(room.youtubeVideoId) ? (
                <div className={`w-full h-full ${!isHost ? "pointer-events-none" : ""}`}>
                  <YouTube
                    videoId={room.youtubeVideoId}
                    onReady={handleYoutubeReady}
                    onStateChange={handleYoutubeStateChange}
                    opts={{
                      width: "100%",
                      height: "100%",
                      playerVars: {
                        autoplay: 0,
                        modestbranding: 1,
                        rel: 0,
                      },
                    }}
                    className="w-full h-full"
                    iframeClassName="w-full h-full rounded-lg"
                  />
                </div>
              ) : room.videoUrl ? (
                <div className={`w-full h-full ${!isHost ? "pointer-events-none" : ""}`}>
                  <video
                    ref={videoRef}
                    controls={isHost}
                    className="w-full h-full rounded-lg bg-black object-contain"
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeeking={handleSeeked}
                    key={room.videoUrl}
                  >
                    <source
                      src={room.videoUrl.startsWith("http") ? room.videoUrl : `http://localhost:5000${room.videoUrl}`}
                      type="video/mp4"
                    />
                  </video>
                </div>
              ) : isHost ? (
                /* Empty state screen with direct Host controls */
                <div className="w-full h-full flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-zinc-900 select-none">
                  <div className="max-w-md lg:max-w-3xl w-full flex flex-row items-center justify-center gap-2 sm:gap-6 lg:gap-10 font-mono">
                    {/* Local file upload block */}
                    <div className="flex flex-col gap-1.5 sm:gap-2 lg:gap-4 bg-zinc-950 border border-zinc-800 p-2 sm:p-4 lg:p-6 rounded-lg w-[115px] sm:w-[180px] lg:w-[260px]">

                      <label className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 p-2 sm:p-4 lg:p-6 rounded flex flex-col items-center justify-center gap-1 lg:gap-3 cursor-pointer transition-colors h-[50px] sm:h-[76px] lg:h-[145px]">
                        <FiUploadCloud className="text-zinc-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-8 lg:h-8" />
                        <span className="text-[8px] sm:text-[9px] lg:text-sm font-sans font-bold text-zinc-300 text-center truncate w-full">Choose File</span>
                        <input
                          type="file"
                          accept="video/mp4"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </label>
                      {uploadFeedback(true)}
                    </div>

                    <span className="text-zinc-500 text-[8px] sm:text-[10px] lg:text-sm font-bold uppercase tracking-wider select-none">OR</span>

                    {/* YouTube feed block */}
                    <div className="flex flex-col gap-1.5 sm:gap-2 lg:gap-4 bg-zinc-950 border border-zinc-800 p-2 sm:p-4 lg:p-6 rounded-lg w-[115px] sm:w-[180px] lg:w-[260px]">

                      <div className="flex flex-col gap-1.5 sm:gap-2 lg:gap-4 justify-center h-[50px] sm:h-[76px] lg:h-[145px]">
                        <input
                          type="text"
                          placeholder="YouTube URL..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          className="border border-zinc-800 bg-zinc-900 px-1 py-0.5 sm:px-2 sm:py-1 lg:px-4 lg:py-3 rounded font-sans text-[8px] sm:text-[10px] lg:text-sm text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-zinc-700 transition-all w-full text-center"
                        />
                        <button
                          onClick={handleSetYoutubeVideo}
                          disabled={youtubeStatus.isLoading}
                          className="
                            w-full
                            h-6 sm:h-10 lg:h-12
                            bg-white
                            hover:bg-zinc-100
                            disabled:opacity-70
                            disabled:cursor-wait
                            active:scale-[0.98]
                            text-black
                            font-mono
                            text-[8px] sm:text-[11px] lg:text-sm
                            font-semibold
                            tracking-[0.1em] sm:tracking-[0.18em]
                            rounded-md
                            border border-zinc-200
                            transition-all duration-200
                            flex items-center justify-center gap-1 sm:gap-2
                            cursor-pointer
                          "
                        >
                          <FiLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                          {youtubeStatus.isLoading ? "LOADING" : "LOAD"}
                        </button>
                        {youtubeStatus.error && (
                          <p className="text-center font-mono text-[8px] lg:text-[10px] font-bold uppercase tracking-wider text-red-400">
                            {youtubeStatus.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Guest empty state screen */
                <div className="flex flex-col items-center justify-center text-center p-6 text-zinc-400 font-mono bg-zinc-900 w-full h-full">
                  <FiTv className="text-zinc-700 text-5xl mb-3 animate-active-pulse" />
                  <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">NO VIDEO LOADED</span>
                  <p className="text-[10px] text-zinc-500 mt-2 max-w-xs leading-relaxed">
                    Waiting for the host to load a video feed.
                  </p>
                </div>
              )}
            </div>

            {/* Floating Emoji Reactions */}
            {floatingReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="absolute bottom-16 text-3xl animate-float-up pointer-events-none z-50 flex flex-col items-center select-none gap-1 -translate-x-1/2"
                style={{ left: `${reaction.left}%` }}
              >
                <span className="bg-white border-2 border-black px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-black text-black shadow-md tracking-wider">
                  {reaction.username}
                </span>
                <span className="text-3xl sm:text-4xl drop-shadow-md">{reaction.emoji}</span>
              </div>
            ))}

            {/* Reaction Selector Dock — YouTube Live style */}
            <div className="absolute bottom-3 right-3 z-40 flex flex-col items-end gap-1.5">
              {/* Emoji picker tray — slides up on open */}
              <div
                className={`flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 shadow-lg transition-all duration-200 ${showReactionPicker
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}
              >
                {["❤️", "😂", "😮", "👏", "🔥"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="hover:scale-125 active:scale-90 transition-transform duration-100 p-0.5 text-base cursor-pointer select-none"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Trigger button */}
              <button
                onClick={() => setShowReactionPicker((v) => !v)}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 flex items-center justify-center text-base shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="React"
              >
                {showReactionPicker ? '✕' : '😊'}
              </button>
            </div>
          </div>

          {/* Room Media Controls (For Host Control) */}
          {isHost && (
            <div className={`border transition-all duration-[2000ms] ease-in-out ${theatreMode ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 bg-white"
              } rounded-md overflow-hidden shadow-sm`}>
              <button
                onClick={() => setShowMediaManager(!showMediaManager)}
                className={`w-full flex items-center justify-between p-4 transition-all duration-[2000ms] ease-in-out ${theatreMode ? "bg-zinc-900/50 text-zinc-300 hover:bg-zinc-850" : "bg-zinc-50 text-zinc-655 hover:bg-zinc-100"
                  } text-xs font-mono font-bold tracking-wider uppercase cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <FiSettings className={theatreMode ? "text-zinc-400" : "text-zinc-600"} />
                  <span>Change Video Feed</span>
                </div>
                <FiChevronDown className={`w-4 h-4 transition-all duration-[2000ms] ${theatreMode ? "text-zinc-400" : "text-zinc-450"
                  } ${showMediaManager ? 'transform rotate-180' : ''}`} />
              </button>

              <div className={`transition-all duration-300 ease-in-out ${showMediaManager
                ? `max-h-[400px] border-t ${theatreMode ? 'border-zinc-850' : 'border-zinc-200'} opacity-100`
                : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                <div className="p-5 flex flex-col md:flex-row gap-5">
                  {/* Upload video block */}
                  <div className="flex-grow flex flex-col gap-2">
                    <label className={`text-[10px] font-mono font-bold tracking-wider uppercase ${theatreMode ? "text-zinc-500" : "text-zinc-400"
                      }`}>Upload Local Video</label>
                    <label className={`border border-dashed transition-all duration-[2000ms] ease-in-out ${theatreMode
                      ? "border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900/50"
                      : "border-zinc-200 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100/50"
                      } p-4 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full min-h-[90px]`}>
                      <FiUploadCloud className={theatreMode ? "text-zinc-500" : "text-zinc-400"} w-6 h-6 />
                      <span className={`text-[10px] font-sans font-bold transition-all duration-[2000ms] ${theatreMode ? "text-zinc-300" : "text-zinc-700"
                        }`}>Select MP4 File</span>
                      <input
                        type="file"
                        accept="video/mp4"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadFeedback()}
                  </div>

                  {/* Divider line for MD screen */}
                  <div className={`hidden md:block w-px transition-colors duration-[2000ms] ${theatreMode ? "bg-zinc-850" : "bg-zinc-200"
                    }`}></div>

                  {/* YouTube Link Feed block */}
                  <div className="flex-grow flex flex-col gap-2 justify-between">
                    <div className="flex flex-col gap-2">
                      <label className={`text-[10px] font-mono font-bold tracking-wider uppercase ${theatreMode ? "text-zinc-500" : "text-zinc-400"
                        }`}>Load YouTube Video</label>
                      <div className="relative w-full">
                        <FiLink className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
                        <input
                          type="text"
                          placeholder="Paste YouTube video link..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          className={`w-full border transition-all duration-[2000ms] ease-in-out ${theatreMode
                            ? "border-zinc-850 bg-zinc-950 text-zinc-200 focus:border-zinc-700 focus:bg-zinc-900"
                            : "border-zinc-200 bg-zinc-50 text-zinc-800 focus:border-zinc-900 focus:bg-white"
                            } pl-9 pr-3 py-1.5 rounded font-sans text-xs placeholder:text-zinc-400 focus:outline-none`}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSetYoutubeVideo}
                      disabled={youtubeStatus.isLoading}
                      className={`w-full transition-colors duration-[2000ms] ${theatreMode ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950" : "bg-zinc-950 hover:bg-zinc-800 text-white"
                        } font-mono text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait disabled:opacity-70 mt-2`}
                    >
                      <FiLink className="w-3.5 h-3.5" />
                      {youtubeStatus.isLoading ? "LOADING VIDEO" : "LOAD VIDEO"}
                    </button>
                    {youtubeStatus.error && (
                      <p className={`font-mono text-[10px] font-bold uppercase tracking-wider ${theatreMode ? "text-red-400" : "text-red-600"}`}>
                        {youtubeStatus.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Side: Sidebar containing Voice Chat & Chat logs */}
        <section className="lg:col-span-4 flex flex-col gap-4 lg:gap-5 h-auto lg:h-[calc(100svh-140px)] lg:min-h-0 lg:sticky lg:top-[90px]">
          {/* Peer Voice Stream panel */}
          <div className={`relative border transition-all duration-[2000ms] ease-in-out ${theatreMode ? "border-zinc-800 bg-zinc-900/90 backdrop-blur-md shadow-lg shadow-black/30" : "border-zinc-200 bg-white"
            } rounded-lg p-4 flex flex-col lg:flex-none shadow-sm`}>
            <button
              onClick={() => {
                setShowCallPreview(true);
                setCallFocusMode(true);
              }}
              className={`absolute right-3 top-3 z-30 rounded border p-2 transition-colors cursor-pointer ${
                theatreMode
                  ? "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:text-zinc-100"
                  : "border-zinc-200 bg-white/80 text-zinc-500 hover:text-zinc-900"
              }`}
              title="Focus video call"
            >
              <FiMaximize2 className="h-3.5 w-3.5" />
            </button>
            {/* List of active room peers */}
            <div className="overflow-visible pt-9">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(112px,140px))] justify-center gap-2 w-full">
                {[
                  ...new Map(
                    room.users.map((user) => [user.socketId, user])
                  ).values()
                ].map((user) => renderParticipantTile(user))}
              </div>
            </div>

            {/* Control Row: Mic and Camera Toggles */}
            <div className="flex gap-4 mt-4 justify-center">
              {/* Mic button */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm border ${isMuted
                  ? theatreMode
                    ? "border-red-900 bg-red-950/30 text-red-400 hover:bg-red-900/40"
                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : theatreMode
                    ? "border-emerald-900 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40"
                    : "border-emerald-250 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
              </button>

              {/* Camera button */}
              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm border ${!isCameraOn
                  ? theatreMode
                    ? "border-red-900 bg-red-950/30 text-red-400 hover:bg-red-900/40"
                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : theatreMode
                    ? "border-emerald-900 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40"
                    : "border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                title={isCameraOn ? "Stop Camera" : "Start Camera"}
              >
                {isCameraOn ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Unit conversation chat panel */}
          <div ref={chatPanelRef} className={`border transition-all duration-[2000ms] ease-in-out ${theatreMode ? "border-zinc-800 bg-zinc-900/90 backdrop-blur-md shadow-lg shadow-black/30" : "border-zinc-200 bg-white"
            } rounded-lg p-4 flex flex-col min-h-[300px] h-[420px] sm:h-[500px] lg:min-h-0 lg:h-auto lg:flex-1 overflow-hidden shadow-sm`}>
            <div className={`flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase border-b transition-all duration-[2000ms] ease-in-out ${theatreMode ? "text-zinc-300 border-zinc-800" : "text-zinc-600 border-zinc-200"
              } pb-2`}>
              <FiMessageSquare className="text-brand-blue" />
              <span>Chat</span>
            </div>

            {/* Chat list viewport */}
            <div ref={chatListRef} className={`flex-grow overflow-y-auto cine-scrollbar mt-3 mb-3 p-3 transition-all duration-[2000ms] ease-in-out ${theatreMode ? "bg-zinc-900/40 border-zinc-800/60 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800"
              } border rounded font-sans text-xs flex flex-col gap-3`}>
              {room.messages?.length === 0 ? (
                <div className={`flex-grow flex items-center justify-center text-center p-4 transition-all duration-[2000ms] ${theatreMode ? "text-zinc-500" : "text-zinc-400"
                  } text-[10px] font-mono`}>
                  Send a message to start.
                </div>
              ) : (
                room.messages?.map((msg) => {
                  const isSelf = msg.username === username;
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 max-w-[85%] ${isSelf ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`flex items-baseline gap-2 text-[9px] text-zinc-400 font-mono ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <span className={`font-bold ${isSelf
                          ? 'text-brand-blue'
                          : theatreMode ? 'text-zinc-350' : 'text-zinc-650'
                          }`}>
                          {msg.username}
                        </span>
                        <span>
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className={`relative pr-7 leading-normal break-all transition-all duration-[2000ms] ease-in-out ${isSelf
                          ? theatreMode
                            ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-indigo-500/30"
                            : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-500/20"
                          : theatreMode
                            ? "bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-100 border-zinc-850"
                            : "bg-gradient-to-br from-white to-zinc-50 text-zinc-850 border-zinc-200"
                        } px-2.5 py-1.5 rounded border shadow-sm`}>
                        {msg.text}
                        <span className="absolute right-1.5 bottom-1 text-[10px] select-none pointer-events-none opacity-80" title="Popcorn!">🍿</span>
                      </p>
                    </div>
                  );
                })
              )}
              {/* Invisible anchor — always scrolled into view on new messages */}
              <div ref={chatBottomRef} />
            </div>

            {/* Message input tray */}
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className={`flex-grow border transition-all duration-[2000ms] ease-in-out ${theatreMode
                  ? "border-zinc-800 bg-zinc-900/80 text-zinc-200 focus:border-zinc-700 focus:bg-zinc-850"
                  : "border-zinc-200 bg-zinc-50 text-zinc-850 focus:border-zinc-900 focus:bg-white"
                  } px-3 py-2 rounded font-sans text-xs placeholder:text-zinc-500 focus:outline-none`}
              />
              <button
                onClick={sendMessage}
                className={`transition-colors duration-[2000ms] ${theatreMode ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950" : "bg-zinc-950 hover:bg-zinc-800 text-white"
                  } px-4 py-2 rounded flex items-center justify-center cursor-pointer`}
                title="Send Message"
              >
                <FiSend className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {unreadChatCount > 0 && !callFocusMode && (
        <button
          onClick={scrollToChat}
          className="fixed bottom-5 right-5 z-[80] flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-white shadow-2xl shadow-black/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Jump to chat"
        >
          <FiMessageSquare className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 font-mono text-[10px] font-black text-white ring-2 ring-zinc-950">
            {unreadChatCount > 9 ? "9+" : unreadChatCount}
          </span>
        </button>
      )}

      {callFocusMode && (
        <div className="fixed inset-0 z-[90] bg-zinc-950 text-white">
          <div className="absolute left-4 top-4 z-40 flex items-center gap-2 rounded border border-white/10 bg-black/50 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-300 backdrop-blur">
            <FiVideo className="h-3.5 w-3.5 text-blue-400" />
            <span>Video Call</span>
          </div>

          <button
            onClick={() => setCallFocusMode(false)}
            className="absolute right-4 top-4 z-40 rounded border border-white/10 bg-black/50 p-3 text-zinc-300 backdrop-blur transition-colors hover:text-white cursor-pointer"
            title="Exit call focus"
          >
            <FiMinimize2 className="h-4 w-4" />
          </button>

          <div className="h-full w-full overflow-y-auto p-4 pt-16 pb-64 sm:p-6 sm:pt-20 sm:pb-32">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ...new Map(
                  room.users.map((user) => [user.socketId, user])
                ).values()
              ].map((user) => renderParticipantTile(user, "large"))}
            </div>
          </div>

          <div className="absolute bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-4 rounded-full border border-white/10 bg-black/60 px-5 py-3 backdrop-blur">
            <button
              onClick={toggleMute}
              className={`h-12 w-12 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                isMuted
                  ? "border-red-800 bg-red-950/70 text-red-300"
                  : "border-emerald-800 bg-emerald-950/70 text-emerald-300"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <FiMicOff className="h-5 w-5" /> : <FiMic className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleCamera}
              className={`h-12 w-12 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                !isCameraOn
                  ? "border-red-800 bg-red-950/70 text-red-300"
                  : "border-emerald-800 bg-emerald-950/70 text-emerald-300"
              }`}
              title={isCameraOn ? "Stop Camera" : "Start Camera"}
            >
              {isCameraOn ? <FiVideo className="h-5 w-5" /> : <FiVideoOff className="h-5 w-5" />}
            </button>
          </div>

          {showCallPreview && renderMiniWatchPreview()}
        </div>
      )}

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
