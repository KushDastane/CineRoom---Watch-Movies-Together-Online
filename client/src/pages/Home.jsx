import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const handleCreateRoom = async () => {
    try {
      if (!username.trim()) {
        alert("Please enter username");
        return;
      }
      const createResponse = await api.post("/room/create");
      const roomId = createResponse.data.room.roomId;

      sessionStorage.setItem("username",username);

      navigate(`/room/${roomId}`);

    } catch (error) {
      console.error(error);
    }
  };

  const handleJoinRoom = async () => {
    try {
      if (!username.trim()) {
        return alert("Enter username");
      }
      if (!roomCode.trim()) {
        return alert("Enter room code");
      }

      sessionStorage.setItem("username", username);

      navigate(`/room/${roomCode}`);

    } catch (error) {
      console.error(error);

      alert("Failed to join room")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-4 w-[300px]">
        <h1 className="text-3xl font-bold text-center">
          CineRoom
        </h1>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <input
          type="text"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <button
          onClick={handleCreateRoom}
          className="bg-black text-white p-3 rounded-lg"
        >
          Create Room
        </button>

        <button
          onClick={handleJoinRoom}
          className="bg-blue-500 text-white p-3 rounded-lg"
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Home;