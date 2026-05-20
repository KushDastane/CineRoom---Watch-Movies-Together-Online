import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
  <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 font-sans text-zinc-950 selection:bg-brand-blue selection:text-white">
    <div className="relative flex flex-col items-center text-center">
      <div className="absolute -top-16 h-28 w-28 rounded-full bg-red-100 blur-2xl animate-active-pulse" />
      <div className="relative mb-7 h-24 w-32">
        <div className="cine-404-reel cine-404-reel-left">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="cine-404-reel cine-404-reel-right">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="cine-404-projector" />
        <div className="cine-404-beam" />
      </div>
      <span className="relative font-mono text-xs font-black uppercase tracking-[0.32em] text-red-600">
        Error 404
      </span>
      <h1 className="relative mt-3 text-3xl sm:text-5xl font-black tracking-tight">
        Oops wrong room
      </h1>
      <button
        onClick={() => navigate("/")}
        className="relative mt-8 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 font-mono text-xs font-bold tracking-wider text-zinc-900 shadow-sm transition-colors hover:border-zinc-500 hover:bg-zinc-100 cursor-pointer"
      >
        BACK TO LOBBY
      </button>
    </div>
  </div>
  );
};

export default NotFound;
