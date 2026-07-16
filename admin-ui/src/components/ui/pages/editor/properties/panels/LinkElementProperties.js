import React from "react";

const LinkElementProperties = ({ selectedElement, form, updateElement }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Link text</label>
      <input
        type="text"
        value={selectedElement.text || ""}
        onChange={(e) => updateElement(selectedElement.id, "text", e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 outline-none focus:border-gray-300"
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">URL</label>
      <input
        type="text"
        value={selectedElement.url || ""}
        onChange={(e) => updateElement(selectedElement.id, "url", e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 outline-none focus:border-gray-300"
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Color</label>
      <input
        type="color"
        value={selectedElement.color || form.primary_color || "#F59E0B"}
        onChange={(e) => updateElement(selectedElement.id, "color", e.target.value)}
        className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
      />
    </div>
  </div>
);

export default LinkElementProperties;
