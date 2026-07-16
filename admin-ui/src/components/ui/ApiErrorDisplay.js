import React from "react";
import { AlertCircle } from "lucide-react";
import ConnectionProblem from "./ConnectionProblem";

const ApiErrorDisplay = ({ message, isNetwork = false, onRetry, className = "" }) => {
  if (!message) return null;

  if (isNetwork) {
    return <ConnectionProblem message={message} onRetry={onRetry} className={className} />;
  }

  return (
    <div
      className={`flex items-center gap-2 text-red-600 text-[13px] font-bold bg-red-50 border border-red-100 rounded-md px-3 py-2 ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
};

export default ApiErrorDisplay;
