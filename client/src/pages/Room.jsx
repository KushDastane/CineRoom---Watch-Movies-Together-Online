import { useParams } from "react-router-dom";

const Room = () => {
  const { roomId } = useParams();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Room: {roomId}
      </h1>
    </div>
  );
};

export default Room;