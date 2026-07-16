import React from "react";

const SpacerElementProperties = ({ selectedElement, updateElement }) => (
  <div>
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Height</label>
    <select
      value={selectedElement.height || "24px"}
      onChange={(e) => updateElement(selectedElement.id, "height", e.target.value)}
      className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
    >
      <option value="8px">XS (8px)</option>
      <option value="16px">Small (16px)</option>
      <option value="24px">Medium (24px)</option>
      <option value="32px">Large (32px)</option>
      <option value="48px">XL (48px)</option>
    </select>
  </div>
);

export default SpacerElementProperties;
