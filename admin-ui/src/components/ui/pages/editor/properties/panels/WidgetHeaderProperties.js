import React from "react";
import LayoutBlockStyleControls from "../../../Settings/components/tab/email/preview/LayoutBlockStyleControls";
import EditorToggle from "../../EditorToggle";

const WidgetHeaderProperties = ({ form, updateField }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Widget Title</label>
      <input
        type="text"
        value={form.widget_title || ""}
        onChange={(e) => updateField("widget_title", e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300"
        placeholder="Customer Reviews"
      />
    </div>
    <div className="flex items-center justify-between py-2 border-b border-gray-50 pb-4">
      <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest opacity-60">Show Star Rating</span>
      <EditorToggle enabled={form.show_star_rating} onChange={(v) => updateField("show_star_rating", v)} />
    </div>

    <div className="space-y-4">
      <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">Title Typography</h5>
      <LayoutBlockStyleControls
        blockKey="widget-header"
        style={{
          fontSize: form.header_font_size || "24px",
          fontWeight: form.header_font_weight || "700",
          color: form.header_text_color || "#1D2939",
          textAlign: form.header_text_align || "center",
        }}
        onChange={(key, val) => {
          if (key === "fontSize") updateField("header_font_size", val);
          if (key === "fontWeight") updateField("header_font_weight", val);
          if (key === "color") updateField("header_text_color", val);
          if (key === "textAlign") updateField("header_text_align", val);
        }}
      />
    </div>
    <p className="text-[11px] text-gray-400 font-medium">
      Click the subtitle below the title in the preview to edit it.
    </p>
  </div>
);

export default WidgetHeaderProperties;
