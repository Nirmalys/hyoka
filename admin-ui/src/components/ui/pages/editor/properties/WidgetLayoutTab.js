import React from "react";
import {
  FieldLabel,
  FieldGroup,
  Segmented,
} from "./shared/WidgetFormControls";

const CORNER_MAP = { sharp: 4, soft: 12, rounded: 20 };
const DENSITY_MAP = { compact: 12, cozy: 24, roomy: 36 };

const getCornerStyle = (radius) => {
  const value = Number(radius) || 12;
  if (value <= 6) return "sharp";
  if (value >= 18) return "rounded";
  return "soft";
};

const getDensityStyle = (gap) => {
  const value = Number(gap) || 24;
  if (value <= 16) return "compact";
  if (value >= 32) return "roomy";
  return "cozy";
};

const getLayoutStyle = (layout) => {
  if (layout === "grid") return "grid";
  if (layout === "list") return "list";
  return "carousel";
};

const WidgetLayoutTab = ({ mode, widgetId, form, updateField }) => {
  if (mode !== "widget") {
    return <p className="text-[12px] text-gray-400 text-center py-8">No layout options for this mode.</p>;
  }

  const layoutStyle = getLayoutStyle(form.widget_layout || "carousel");

  return (
    <FieldGroup>
      <div>
        <FieldLabel>Widget theme</FieldLabel>
        <Segmented
          value={form.widget_theme || "standard"}
          onChange={(v) => updateField("widget_theme", v)}
          options={[
            { value: "minimal", label: "Minimal" },
            { value: "standard", label: "Standard" },
            { value: "modern", label: "Modern" },
          ]}
        />
      </div>

      {(widgetId === "testimonials-carousel" || widgetId === "card-carousel") && (
        <div>
          <FieldLabel>Layout style</FieldLabel>
          <Segmented
            value={layoutStyle}
            onChange={(v) => {
              const next = v === "grid" ? "grid" : v === "list" ? "list" : "carousel";
              updateField("widget_layout", next);
            }}
            options={[
              { value: "list", label: "List" },
              { value: "grid", label: "Grid" },
              { value: "carousel", label: "Carousel" },
            ]}
          />
        </div>
      )}

      <div>
        <FieldLabel>Columns (desktop)</FieldLabel>
        <Segmented
          value={String(form.layout_columns || 3)}
          onChange={(v) => updateField("layout_columns", Number(v))}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ]}
        />
      </div>

      <div>
        <FieldLabel>Corner radius</FieldLabel>
        <Segmented
          value={getCornerStyle(form.card_radius)}
          onChange={(v) => updateField("card_radius", CORNER_MAP[v] ?? 12)}
          options={[
            { value: "sharp", label: "Sharp" },
            { value: "soft", label: "Soft" },
            { value: "rounded", label: "Rounded" },
          ]}
        />
      </div>

      <div>
        <FieldLabel>Card density</FieldLabel>
        <Segmented
          value={getDensityStyle(form.card_gap)}
          onChange={(v) => updateField("card_gap", DENSITY_MAP[v] ?? 24)}
          options={[
            { value: "compact", label: "Compact" },
            { value: "cozy", label: "Cozy" },
            { value: "roomy", label: "Roomy" },
          ]}
        />
      </div>
    </FieldGroup>
  );
};

export default WidgetLayoutTab;
