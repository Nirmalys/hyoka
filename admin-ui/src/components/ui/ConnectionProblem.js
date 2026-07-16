import React from "react";
import noInternetUrl from "../../assets/images/nointernet.webp";

const ConnectionProblem = ({ message, onRetry, className = "" }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/40 px-6 py-10 text-center ${className}`}
    >
      <div className="mb-5 h-60 w-60 shrink-0">
        <img
          src={noInternetUrl}
          alt="No internet connection"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="text-xl font-bold text-gray-900">Connection problem</div>
      <p className="mt-2 max-w-md text-[13px] font-medium text-gray-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-[13px] font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default ConnectionProblem;
