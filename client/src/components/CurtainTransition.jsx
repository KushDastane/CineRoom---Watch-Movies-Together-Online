import React from "react";
import "./CurtainTransition.css";

const CurtainTransition = ({ state }) => {
  return (
    <div className={`curtain-container ${state}`}>
      <div className="curtain-overlay-dim" />
      <div className="curtain-panel curtain-left" />
      <div className="curtain-panel curtain-right" />
      <div className="curtain-spotlight" />
    </div>
  );
};

export default CurtainTransition;
