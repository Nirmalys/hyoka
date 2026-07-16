import React from "react";
import LayoutBlockStyleControls from "../../../Settings/components/tab/email/preview/LayoutBlockStyleControls";

const WidgetSubtitleProperties = ({ form, updateField }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Subtitle Text</label>
      <input
        type="text"
        value={form.widget_subtitle || ""}
        onChange={(e) => updateField("widget_subtitle", e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300"
        placeholder="Real feedback from verified buyers"
      />
      <p className="mt-2 text-[11px] text-gray-400 font-medium">
        Leave empty to hide the subtitle on the storefront.
      </p>
    </div>
    <div className="space-y-4">
      <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">Subtitle Typography</h5>
      <LayoutBlockStyleControls
        blockKey="widget-subtitle"
        style={{
          fontSize: form.card_body_font_size || "13px",
          fontWeight: form.card_body_font_weight || "400",
          color: form.card_body_text_color || "#667085",
          textAlign: form.header_text_align || "center",
        }}
        onChange={(key, val) => {
          if (key === "fontSize") updateField("card_body_font_size", val);
          if (key === "fontWeight") updateField("card_body_font_weight", val);
          if (key === "color") updateField("card_body_text_color", val);
          if (key === "textAlign") updateField("header_text_align", val);
        }}
      />
    </div>
  </div>
);

export default WidgetSubtitleProperties;
