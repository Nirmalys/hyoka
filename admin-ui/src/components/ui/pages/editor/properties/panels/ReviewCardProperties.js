import React from "react";
import LayoutBlockStyleControls from "../../../Settings/components/tab/email/preview/LayoutBlockStyleControls";

const ReviewCardProperties = ({ form, updateField }) => (
  <>
    <div className="space-y-3">
      <h5 className="widget-editor-section-title">Card Style</h5>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="widget-editor-label">Radius (px)</label>
          <input
            type="number"
            value={form.card_radius ?? 12}
            onChange={(e) => updateField("card_radius", Number(e.target.value))}
            className="widget-editor-field w-full mt-1.5"
          />
        </div>
        <div>
          <label className="widget-editor-label">Gap (px)</label>
          <input
            type="number"
            value={form.card_gap ?? 24}
            onChange={(e) => updateField("card_gap", Number(e.target.value))}
            className="widget-editor-field w-full mt-1.5"
          />
        </div>
      </div>
      <div>
        <label className="widget-editor-label">Border color</label>
        <input
          type="color"
          value={form.border_color || "#EAECF0"}
          onChange={(e) => updateField("border_color", e.target.value)}
          className="w-full h-8 rounded-lg border border-gray-100 cursor-pointer mt-1.5"
        />
      </div>
      <div>
        <label className="widget-editor-label">Star color</label>
        <input
          type="color"
          value={form.primary_color || "#F59E0B"}
          onChange={(e) => updateField("primary_color", e.target.value)}
          className="w-full h-8 rounded-lg border border-gray-100 cursor-pointer mt-1.5"
        />
      </div>
      <p className="text-[11px] text-gray-400 leading-snug">
        Click stars in the preview to adjust size, alignment, and visibility.
      </p>
    </div>

    <div className="pt-4 border-t border-gray-100 space-y-3">
      <h5 className="widget-editor-section-title">Title Typography</h5>
      <LayoutBlockStyleControls
        blockKey="card-title"
        style={{
          fontSize: form.card_title_font_size,
          fontWeight: form.card_title_font_weight,
          color: form.card_title_text_color,
        }}
        onChange={(key, val) => {
          if (key === "fontSize") updateField("card_title_font_size", val);
          if (key === "fontWeight") updateField("card_title_font_weight", val);
          if (key === "color") updateField("card_title_text_color", val);
        }}
      />
    </div>

    <div className="pt-4 border-t border-gray-100 space-y-3">
      <h5 className="widget-editor-section-title">Content Typography</h5>
      <LayoutBlockStyleControls
        blockKey="card-body"
        style={{
          fontSize: form.card_body_font_size,
          fontWeight: form.card_body_font_weight,
          color: form.card_body_text_color,
        }}
        onChange={(key, val) => {
          if (key === "fontSize") updateField("card_body_font_size", val);
          if (key === "fontWeight") updateField("card_body_font_weight", val);
          if (key === "color") updateField("card_body_text_color", val);
        }}
      />
    </div>
  </>
);

export default ReviewCardProperties;
