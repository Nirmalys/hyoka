import React from "react";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";

const ALIGN_OPTIONS = [
  { id: "left", icon: AlignLeft },
  { id: "center", icon: AlignCenter },
  { id: "right", icon: AlignRight },
];

const AlignmentButtons = ({ value, onChange }) => (
  <div className="flex rounded-md border border-gray-100 overflow-hidden">
    {ALIGN_OPTIONS.map((btn) => (
      <button
        type="button"
        key={btn.id}
        onClick={() => onChange(btn.id)}
        className={`flex-1 p-1.5 flex justify-center transition-colors outline-none focus:outline-none ${
          value === btn.id ? "bg-gray-100 text-gray-900" : "bg-white text-gray-300 hover:text-gray-900"
        }`}
      >
        {btn.icon && <btn.icon className="w-3.5 h-3.5" />}
      </button>
    ))}
  </div>
);

export default AlignmentButtons;
