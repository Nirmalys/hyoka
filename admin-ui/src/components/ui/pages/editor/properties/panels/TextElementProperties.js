import React from "react";
import { Italic, Strikethrough, Underline } from "lucide-react";
import AlignmentButtons from "../shared/AlignmentButtons";

const TextElementProperties = ({ selectedElement, updateElement }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        Text Content
      </label>
      <textarea
        value={selectedElement.content}
        onChange={(e) => updateElement(selectedElement.id, "content", e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 focus:border-gray-300 outline-none min-h-[80px]"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Size</label>
        <select
          value={selectedElement.fontSize || "14px"}
          onChange={(e) => updateElement(selectedElement.id, "fontSize", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="10px">Tiny (10px)</option>
          <option value="12px">Small (12px)</option>
          <option value="14px">Normal (14px)</option>
          <option value="16px">Large (16px)</option>
          <option value="18px">XL (18px)</option>
          <option value="20px">2XL (20px)</option>
          <option value="24px">Heading (24px)</option>
          <option value="28px">Title (28px)</option>
          <option value="32px">Display (32px)</option>
          <option value="40px">Hero (40px)</option>
          <option value="48px">Jumbo (48px)</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Weight</label>
        <select
          value={selectedElement.fontWeight || "400"}
          onChange={(e) => updateElement(selectedElement.id, "fontWeight", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="100">Thin</option>
          <option value="200">Extra Light</option>
          <option value="300">Light</option>
          <option value="400">Regular</option>
          <option value="500">Medium</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
          <option value="800">Extra Bold</option>
          <option value="900">Black</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Line Height</label>
        <select
          value={selectedElement.lineHeight || "1.5"}
          onChange={(e) => updateElement(selectedElement.id, "lineHeight", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="1">Tight (1)</option>
          <option value="1.2">Compact (1.2)</option>
          <option value="1.4">Normal (1.4)</option>
          <option value="1.5">Default (1.5)</option>
          <option value="1.6">Relaxed (1.6)</option>
          <option value="1.8">Loose (1.8)</option>
          <option value="2">Double (2)</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Letter Spacing</label>
        <select
          value={selectedElement.letterSpacing || "0px"}
          onChange={(e) => updateElement(selectedElement.id, "letterSpacing", e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
        >
          <option value="-1px">Tight (-1px)</option>
          <option value="-0.5px">Slightly Tight</option>
          <option value="0px">Normal (0)</option>
          <option value="0.5px">Slightly Wide</option>
          <option value="1px">Wide (1px)</option>
          <option value="2px">Extra Wide (2px)</option>
          <option value="4px">Ultra Wide (4px)</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Text color</label>
        <input
          type="color"
          value={selectedElement.color || "#1D2939"}
          onChange={(e) => updateElement(selectedElement.id, "color", e.target.value)}
          className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Background</label>
        <input
          type="color"
          value={selectedElement.backgroundColor || "#ffffff"}
          onChange={(e) => updateElement(selectedElement.id, "backgroundColor", e.target.value)}
          className="w-full h-9 rounded-md border border-gray-100 cursor-pointer"
        />
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Format</label>
      <div className="flex rounded-md border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() =>
            updateElement(
              selectedElement.id,
              "fontStyle",
              selectedElement.fontStyle === "italic" ? "normal" : "italic"
            )
          }
          className={`flex-1 p-1.5 flex justify-center transition-colors ${
            selectedElement.fontStyle === "italic"
              ? "bg-gray-100 text-gray-900"
              : "bg-white text-gray-300 hover:text-gray-900"
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            updateElement(
              selectedElement.id,
              "textDecoration",
              selectedElement.textDecoration === "underline" ? "none" : "underline"
            )
          }
          className={`flex-1 p-1.5 flex justify-center transition-colors ${
            selectedElement.textDecoration === "underline"
              ? "bg-gray-100 text-gray-900"
              : "bg-white text-gray-300 hover:text-gray-900"
          }`}
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            updateElement(
              selectedElement.id,
              "textDecoration",
              selectedElement.textDecoration === "line-through" ? "none" : "line-through"
            )
          }
          className={`flex-1 p-1.5 flex justify-center transition-colors ${
            selectedElement.textDecoration === "line-through"
              ? "bg-gray-100 text-gray-900"
              : "bg-white text-gray-300 hover:text-gray-900"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Transform</label>
      <select
        value={selectedElement.textTransform || "none"}
        onChange={(e) => updateElement(selectedElement.id, "textTransform", e.target.value)}
        className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
      >
        <option value="none">None</option>
        <option value="uppercase">UPPERCASE</option>
        <option value="lowercase">lowercase</option>
        <option value="capitalize">Capitalize</option>
      </select>
    </div>

    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Align</label>
      <AlignmentButtons
        value={selectedElement.textAlign}
        onChange={(id) => updateElement(selectedElement.id, "textAlign", id)}
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Padding X</label>
        <input
          type="number"
          min={0}
          max={100}
          value={parseInt(selectedElement.paddingX) || 0}
          onChange={(e) => updateElement(selectedElement.id, "paddingX", e.target.value + "px")}
          className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Padding Y</label>
        <input
          type="number"
          min={0}
          max={100}
          value={parseInt(selectedElement.paddingY) || 0}
          onChange={(e) => updateElement(selectedElement.id, "paddingY", e.target.value + "px")}
          className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold"
        />
      </div>
    </div>
  </div>
);

export default TextElementProperties;
