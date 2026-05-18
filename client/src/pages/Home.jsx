import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
        if(!username.trim()){
            alert("Please enter username");
            return;
        }
      const createResponse = await api.post("/room/create");
      const roomId = createResponse.data.room.roomId;

      await api.post(`/room/${roomId}/join`,{
        username,
      });

      localStorage.setItem("username",username);

      navigate(`/room/${roomId}`);

    } catch (error) {
      console.error(error);
    }
  };

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

        <button
          onClick={handleCreateRoom}
          className="bg-black text-white p-3 rounded-lg"
        >
          Create Room
        </button>
      </div>
    </div>
  );
};

export default Home;