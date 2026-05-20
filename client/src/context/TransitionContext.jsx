import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import CurtainTransition from "../components/CurtainTransition";

const TransitionContext = createContext(null);

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  return context;
};

export const TransitionProvider = ({ children }) => {
  const [transitionState, setTransitionState] = useState("idle"); // "idle" | "closing" | "closed" | "opening"
  const navigate = useNavigate();

  const navigateWithTransition = async (targetPathOrFn, asyncAction = null) => {
    if (transitionState !== "idle") return;

    setTransitionState("closing");

    const animTime = 900; // Match 0.9s duration from CSS
    const closingPromise = new Promise((resolve) => setTimeout(resolve, animTime));

    let actionResult = null;
    let success = true;

    if (asyncAction) {
      try {
        // Execute dynamic action (e.g. room creation API call) and wait for the closing transition
        const [result] = await Promise.all([asyncAction(), closingPromise]);
        actionResult = result;
      } catch (error) {
        success = false;
        // In case of error, wait for curtains to finish closing before opening them again
        await closingPromise;
        setTransitionState("opening");
        setTimeout(() => setTransitionState("idle"), animTime);
        throw error; // Propagate the error so the caller can show alerts/errors
      }
    } else {
      // Just wait for closing animation to complete
      await closingPromise;
    }

    if (success) {
      setTransitionState("closed");

      // Short cinematic pause with fully closed curtains
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Resolve the target navigation path
      const resolvedPath = typeof targetPathOrFn === "function" 
        ? targetPathOrFn(actionResult) 
        : targetPathOrFn;

      navigate(resolvedPath);

      // Start the opening phase
      setTransitionState("opening");
      setTimeout(() => {
        setTransitionState("idle");
      }, animTime);
    }

    return actionResult;
  };

  return (
    <TransitionContext.Provider value={{ navigateWithTransition, transitionState }}>
      {children}
      <CurtainTransition state={transitionState} />
    </TransitionContext.Provider>
  );
};
