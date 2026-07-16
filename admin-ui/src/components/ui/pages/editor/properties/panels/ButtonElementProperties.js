import React from "react";
import AlignmentButtons from "../shared/AlignmentButtons";
import EditorToggle from "../../EditorToggle";

const ButtonElementProperties = ({ selectedElement, form, updateElement }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Button Text</label>
      <input
        type="text"
        value={selectedElement.text}
        onChange={(e) => updateElement(selectedElement.id, "text", e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 focus:border-gray-300 outline-none"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Font Size</label>
        <select
          value={selectedElement.fontSize || "15px"}
          onChange={(e) => updateElement(selectedElement.id, "fontSize", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="11px">Tiny</option>
          <option value="13px">Small</option>
          <option value="15px">Normal</option>
          <option value="18px">Large</option>
          <option value="22px">XL</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Font Weight</label>
        <select
          value={selectedElement.fontWeight || "600"}
          onChange={(e) => updateElement(selectedElement.id, "fontWeight", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="400">Regular</option>
          <option value="500">Medium</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
          <option value="800">Extra Bold</option>
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">BG Color</label>
        <input
          type="color"
          value={selectedElement.bgColor || form.primary_color || "#F59E0B"}
          onChange={(e) => updateElement(selectedElement.id, "bgColor", e.target.value)}
          className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Text Color</label>
        <input
          type="color"
          value={selectedElement.textColor || "#ffffff"}
          onChange={(e) => updateElement(selectedElement.id, "textColor", e.target.value)}
          className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Border Radius</label>
        <input
          type="number"
          min={0}
          max={50}
          value={parseInt(selectedElement.borderRadius) || 8}
          onChange={(e) => updateElement(selectedElement.id, "borderRadius", e.target.value + "px")}
          className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Padding</label>
        <select
          value={selectedElement.padding || "12px 24px"}
          onChange={(e) => updateElement(selectedElement.id, "padding", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="8px 16px">Small</option>
          <option value="12px 24px">Normal</option>
          <option value="16px 32px">Large</option>
          <option value="20px 40px">XL</option>
        </select>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-black text-gray-700">Full Width</span>
      <EditorToggle
        enabled={selectedElement.fullWidth}
        onChange={(v) => updateElement(selectedElement.id, "fullWidth", v)}
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Align</label>
      <AlignmentButtons
        value={selectedElement.textAlign}
        onChange={(id) => updateElement(selectedElement.id, "textAlign", id)}
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Action URL</label>
      <input
        type="text"
        value={selectedElement.url}
        onChange={(e) => updateElement(selectedElement.id, "url", e.target.value)}
        placeholder="https://..."
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 focus:border-gray-300 outline-none"
      />
    </div>
  </div>
);

export default ButtonElementProperties;
