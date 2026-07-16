import React from "react";
import AlignmentButtons from "../shared/AlignmentButtons";

const StarsElementProperties = ({ selectedElement, form, updateElement }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hint text</label>
      <input
        type="text"
        value={selectedElement.hintText || ""}
        onChange={(e) => updateElement(selectedElement.id, "hintText", e.target.value)}
        placeholder="Click a star to leave a review"
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 outline-none focus:border-gray-300"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Star color</label>
        <input
          type="color"
          value={selectedElement.starColor || form.primary_color || "#F59E0B"}
          onChange={(e) => updateElement(selectedElement.id, "starColor", e.target.value)}
          className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hint color</label>
        <input
          type="color"
          value={selectedElement.hintColor || "#4b5563"}
          onChange={(e) => updateElement(selectedElement.id, "hintColor", e.target.value)}
          className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Star size</label>
        <select
          value={selectedElement.starSize || "36px"}
          onChange={(e) => updateElement(selectedElement.id, "starSize", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="24px">Small (24px)</option>
          <option value="32px">Medium (32px)</option>
          <option value="36px">Large (36px)</option>
          <option value="44px">Extra large (44px)</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hint size</label>
        <select
          value={selectedElement.hintFontSize || "13px"}
          onChange={(e) => updateElement(selectedElement.id, "hintFontSize", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="11px">Small (11px)</option>
          <option value="13px">Normal (13px)</option>
          <option value="14px">Large (14px)</option>
          <option value="16px">XL (16px)</option>
        </select>
      </div>
    </div>
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Align</label>
      <AlignmentButtons
        value={selectedElement.textAlign}
        onChange={(id) => updateElement(selectedElement.id, "textAlign", id)}
      />
    </div>
  </div>
);

export default StarsElementProperties;
