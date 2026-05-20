import { useState } from "react";
import api from "../services/api";
import { useTransition } from "../context/TransitionContext";
import { 
  FiZap, 
  FiClock, 
  FiTv, 
  FiUsers, 
  FiPlus, 
  FiLogIn, 
  FiUser
} from "react-icons/fi";

const getStoredUserId = () => {
  const existingUserId = localStorage.getItem("cineroomUserId");
  if (existingUserId) return existingUserId;

  const userId = crypto.randomUUID();
  localStorage.setItem("cineroomUserId", userId);
  return userId;
};

const Home = () => {
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "");
  const [roomCode, setRoomCode] = useState("");
  const [formError, setFormError] = useState("");
  const { navigateWithTransition } = useTransition();

  const validateUsername = () => {
    if (!username.trim()) {
      setFormError("Enter a username first.");
      return false;
    }
    sessionStorage.setItem("username", username.trim());
    getStoredUserId();
    return true;
  };

  const handleCreateRoom = async () => {
    setFormError("");
    if (!validateUsername()) return;
    try {
      await navigateWithTransition(
        (roomId) => `/room/${roomId}`,
        async () => {
          const createResponse = await api.post("/room/create");
          return createResponse.data.room.roomId;
        }
      );
    } catch (error) {
      console.error("Error creating room:", error);
      setFormError("Could not create room. Try again.");
    }
  };

  const handleJoinRoom = async (code) => {
    setFormError("");
    if (!validateUsername()) return;
    const targetCode = code || roomCode;
    if (!targetCode.trim()) {
      setFormError("Enter a room code.");
      return;
    }

    const trimmedCode = targetCode.trim();

    try {
      await api.get(`/room/${trimmedCode}`);
      navigateWithTransition(`/room/${trimmedCode}`);
    } catch (error) {
      console.error("Error joining room:", error);
      setFormError("Room not found.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 font-sans selection:bg-brand-blue selection:text-white">
      {/* Top Header */}
      <header className="border-b border-zinc-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold tracking-widest text-zinc-900 flex items-center">
            CINEROOM
            <span className="w-1.5 h-1.5 rounded-full bg-blue-800 inline-block ml-1"></span>
          </span>
        </div>
      </header>

      {/* Hero & Form Grid Container */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 pt-8 md:pt-14 pb-4 md:pb-8 flex flex-col justify-center gap-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Side: Editorial Presentation (Mockup Style) */}
          <section className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex flex-col justify-center">
              <h1 className="text-5xl md:text-[72px] font-extrabold tracking-tighter leading-[0.92] text-zinc-955 font-sans">
                WATCH
                <br />
                TOGETHER.
              </h1>
              <p className="text-zinc-650 mt-5 text-sm md:text-base leading-relaxed max-w-md font-sans">
                Stream movies, video files, or YouTube links in perfect synchronization with your friends. Connect via built-in WebRTC voice chat directly in your browser.
              </p>
            </div>
          </section>

          {/* Right Side: Inputs & Actions */}
          <section className="lg:col-span-6 flex flex-col gap-4">
            {/* Username Input Card */}
            <div className="border border-zinc-200/70 bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-extrabold tracking-widest text-zinc-500 uppercase">
                <FiUser className="text-blue-800 w-4 h-4" />
                <span>SET USERNAME</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFormError("");
                  }}
                  className="w-full min-w-0 h-12 px-4 border border-zinc-200 bg-zinc-50/40 rounded-lg font-sans text-sm md:text-base text-zinc-850 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all duration-150"
                />
              </div>
            </div>

            {/* Create & Join Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Room Card */}
              <div className="border border-zinc-200/70 bg-white rounded-xl p-6 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                <div>
                  <h3 className="font-extrabold text-sm md:text-base tracking-tight text-zinc-950 font-sans">Create Room</h3>
                </div>
                <button
                  onClick={handleCreateRoom}
                  className="w-full h-12 bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 shadow-sm hover:shadow"
                >
                  <FiPlus className="w-4 h-4 shrink-0" />
                  <span>CREATE ROOM</span>
                </button>
              </div>

              {/* Join Room Card */}
              <div className="border border-zinc-200/70 bg-white rounded-xl p-6 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                <div>
                  <h3 className="font-extrabold text-sm md:text-base tracking-tight text-zinc-955 font-sans">Join Room</h3>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value);
                      setFormError("");
                    }}
                    className="w-full min-w-0 flex-1 h-12 px-4 border border-zinc-200 bg-zinc-50/40 rounded-lg font-sans text-sm text-zinc-850 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all duration-150"
                  />
                  <button
                    onClick={() => handleJoinRoom()}
                    className="w-12 h-12 shrink-0 bg-white hover:bg-zinc-50 active:scale-[0.98] text-zinc-900 border border-zinc-300 hover:border-zinc-400 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 shadow-sm"
                  >
                    <FiLogIn className="w-4.5 h-4.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-red-600">
                {formError}
              </div>
            )}
          </section>
        </div>

        {/* Features list horizontal grid */}
        <div className="border-t border-zinc-200/60 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Feature 1 - Amber (Real-time Sync) */}
            <div className="relative overflow-visible group cursor-default">
              {/* Popcorn emoji popping from left top outside the card */}
              <span className="absolute -top-4 -left-2 text-2xl pointer-events-none transition-all duration-300 transform scale-0 -translate-y-2 opacity-0 group-hover:scale-100 group-hover:translate-y-0 group-hover:opacity-100 z-20">
                🍿
              </span>
              
              {/* Inner card container clipping the slanted background */}
              <div className="relative overflow-hidden flex items-center justify-between p-3.5 px-4 border border-zinc-200/50 bg-white rounded-xl text-xs font-bold text-zinc-800 shadow-sm transition-all duration-300">
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-amber-600/10 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out z-0 rounded-xl" />
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-amber-900 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] z-0 rounded-xl" />
                
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="font-mono text-amber-800 text-[10px] bg-amber-50/80 px-2 py-0.5 rounded leading-none transition-colors duration-300 group-hover:text-amber-200 group-hover:bg-amber-950/40">01</span>
                  <span className="font-sans text-zinc-800 font-semibold text-xs md:text-sm tracking-tight transition-colors duration-300 group-hover:text-white">Real-time Sync</span>
                </div>
                <FiClock className="relative z-10 text-zinc-400 w-4 h-4 shrink-0 transition-colors duration-300 group-hover:text-amber-200" />
              </div>
            </div>

            {/* Feature 2 - Rose/Crimson (Voice Chat) */}
            <div className="relative overflow-visible group cursor-default">
              {/* Popcorn emoji popping from left top outside the card */}
              <span className="absolute -top-4 -left-2 text-2xl pointer-events-none transition-all duration-300 transform scale-0 -translate-y-2 opacity-0 group-hover:scale-100 group-hover:translate-y-0 group-hover:opacity-100 z-20">
                🍿
              </span>

              {/* Inner card container clipping the slanted background */}
              <div className="relative overflow-hidden flex items-center justify-between p-3.5 px-4 border border-zinc-200/50 bg-white rounded-xl text-xs font-bold text-zinc-800 shadow-sm transition-all duration-300">
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-rose-600/10 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out z-0 rounded-xl" />
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-rose-950 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] z-0 rounded-xl" />
                
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="font-mono text-rose-800 text-[10px] bg-rose-50/80 px-2 py-0.5 rounded leading-none transition-colors duration-300 group-hover:text-rose-200 group-hover:bg-rose-950/40">02</span>
                  <span className="font-sans text-zinc-800 font-semibold text-xs md:text-sm tracking-tight transition-colors duration-300 group-hover:text-white">Voice Chat</span>
                </div>
                <FiZap className="relative z-10 text-zinc-400 w-4 h-4 shrink-0 transition-colors duration-300 group-hover:text-rose-200" />
              </div>
            </div>

            {/* Feature 3 - Emerald (Private Rooms) */}
            <div className="relative overflow-visible group cursor-default">
              {/* Popcorn emoji popping from left top outside the card */}
              <span className="absolute -top-4 -left-2 text-2xl pointer-events-none transition-all duration-300 transform scale-0 -translate-y-2 opacity-0 group-hover:scale-100 group-hover:translate-y-0 group-hover:opacity-100 z-20">
                🍿
              </span>

              {/* Inner card container clipping the slanted background */}
              <div className="relative overflow-hidden flex items-center justify-between p-3.5 px-4 border border-zinc-200/50 bg-white rounded-xl text-xs font-bold text-zinc-800 shadow-sm transition-all duration-300">
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-emerald-600/10 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out z-0 rounded-xl" />
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-emerald-950 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] z-0 rounded-xl" />
                
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="font-mono text-emerald-800 text-[10px] bg-emerald-50/80 px-2 py-0.5 rounded leading-none transition-colors duration-300 group-hover:text-emerald-200 group-hover:bg-emerald-950/40">03</span>
                  <span className="font-sans text-zinc-800 font-semibold text-xs md:text-sm tracking-tight transition-colors duration-300 group-hover:text-white">Private Rooms</span>
                </div>
                <FiUsers className="relative z-10 text-zinc-400 w-4 h-4 shrink-0 transition-colors duration-300 group-hover:text-emerald-200" />
              </div>
            </div>

            {/* Feature 4 - Indigo (Custom Uploads) */}
            <div className="relative overflow-visible group cursor-default">
              {/* Popcorn emoji popping from left top outside the card */}
              <span className="absolute -top-4 -left-2 text-2xl pointer-events-none transition-all duration-300 transform scale-0 -translate-y-2 opacity-0 group-hover:scale-100 group-hover:translate-y-0 group-hover:opacity-100 z-20">
                🍿
              </span>

              {/* Inner card container clipping the slanted background */}
              <div className="relative overflow-hidden flex items-center justify-between p-3.5 px-4 border border-zinc-200/50 bg-white rounded-xl text-xs font-bold text-zinc-800 shadow-sm transition-all duration-300">
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-indigo-600/10 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out z-0 rounded-xl" />
                <div className="absolute inset-y-0 -left-4 w-[115%] bg-indigo-950 origin-left -skew-x-12 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] z-0 rounded-xl" />
                
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="font-mono text-indigo-800 text-[10px] bg-indigo-50/80 px-2 py-0.5 rounded leading-none transition-colors duration-300 group-hover:text-indigo-200 group-hover:bg-indigo-950/40">04</span>
                  <span className="font-sans text-zinc-800 font-semibold text-xs md:text-sm tracking-tight transition-colors duration-300 group-hover:text-white">Custom Uploads</span>
                </div>
                <FiTv className="relative z-10 text-zinc-400 w-4 h-4 shrink-0 transition-colors duration-300 group-hover:text-indigo-200" />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/60 bg-white py-5 px-6 md:px-12 mt-auto">
        <div className="max-w-5xl mx-auto flex justify-center items-center text-xs font-mono text-zinc-400 font-bold">
          <span>Developed by Kush Dastane</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
