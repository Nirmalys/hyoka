import React from "react";
import EditorToggle from "../../EditorToggle";
import AlignmentButtons from "../shared/AlignmentButtons";

const STAR_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px"];

const WidgetStarsProperties = ({ form, updateField }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] font-bold text-gray-800">Show stars</span>
      <EditorToggle
        enabled={form.show_star_rating}
        onChange={(v) => updateField("show_star_rating", v)}
      />
    </div>

    <div>
      <label className="widget-editor-label">Star color</label>
      <div className="flex items-center gap-2 mt-2">
        <div
          className="w-9 h-9 rounded-xl border border-gray-200 relative overflow-hidden shrink-0"
          style={{ backgroundColor: form.primary_color || "#F59E0B" }}
        >
          <input
            type="color"
            value={form.primary_color || "#F59E0B"}
            onChange={(e) => updateField("primary_color", e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <input
          type="text"
          value={form.primary_color || "#F59E0B"}
          onChange={(e) => updateField("primary_color", e.target.value)}
          className="widget-editor-field flex-1 font-mono text-[12px]"
        />
      </div>
    </div>

    <div>
      <label className="widget-editor-label">Star size</label>
      <select
        value={form.star_size || "16px"}
        onChange={(e) => updateField("star_size", e.target.value)}
        className="widget-editor-field w-full mt-2"
      >
        {STAR_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="widget-editor-label">Star alignment</label>
      <div className="mt-2">
        <AlignmentButtons
          value={form.star_align || "left"}
          onChange={(id) => updateField("star_align", id)}
        />
      </div>
    </div>
  </div>
);

export default WidgetStarsProperties;
