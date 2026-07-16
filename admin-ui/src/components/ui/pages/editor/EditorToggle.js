import React from "react";

const EditorToggle = ({ enabled, onChange }) => (
  <button
    onClick={() => typeof onChange === "function" && onChange(!enabled)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
      enabled ? "bg-[#F59E0B]" : "bg-gray-200"
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-500 ${
        enabled ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);

export default EditorToggle;
