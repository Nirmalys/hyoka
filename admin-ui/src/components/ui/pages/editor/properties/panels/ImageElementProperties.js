import React from "react";
import AlignmentButtons from "../shared/AlignmentButtons";

const ImageElementProperties = ({ selectedElement, updateElement }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Image URL</label>
      <input
        type="text"
        value={selectedElement.url}
        onChange={(e) => updateElement(selectedElement.id, "url", e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 focus:border-gray-300 outline-none"
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Alt Text</label>
      <input
        type="text"
        value={selectedElement.alt || ""}
        onChange={(e) => updateElement(selectedElement.id, "alt", e.target.value)}
        placeholder="Describe the image..."
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 focus:border-gray-300 outline-none"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Border Radius</label>
        <input
          type="number"
          min={0}
          max={50}
          value={parseInt(selectedElement.borderRadius) || 0}
          onChange={(e) => updateElement(selectedElement.id, "borderRadius", e.target.value + "px")}
          className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Max Width</label>
        <select
          value={selectedElement.maxWidth || "100%"}
          onChange={(e) => updateElement(selectedElement.id, "maxWidth", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="50%">50%</option>
          <option value="75%">75%</option>
          <option value="100%">100%</option>
          <option value="200px">200px</option>
          <option value="300px">300px</option>
          <option value="400px">400px</option>
        </select>
      </div>
    </div>
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Align</label>
      <AlignmentButtons
        value={selectedElement.imageAlign}
        onChange={(id) => updateElement(selectedElement.id, "imageAlign", id)}
      />
    </div>
  </div>
);

export default ImageElementProperties;
