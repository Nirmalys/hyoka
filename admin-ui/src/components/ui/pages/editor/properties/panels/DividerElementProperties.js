import React from "react";

const DividerElementProperties = ({ selectedElement, updateElement }) => (
  <div>
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Line color</label>
    <input
      type="color"
      value={selectedElement.color || "#EAECF0"}
      onChange={(e) => updateElement(selectedElement.id, "color", e.target.value)}
      className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
    />
  </div>
);

export default DividerElementProperties;
