import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  FieldLabel,
  FieldGroup,
  TextField,
  SelectField,
  ToggleRow,
  ColorRow,
  Segmented,
  SectionLabel,
} from "./shared/WidgetFormControls";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "rating_high", label: "Highest rating" },
  { value: "rating_low", label: "Lowest rating" },
];

const REVIEWS_PER_PAGE_OPTIONS = [
  { value: "5", label: "5 reviews" },
  { value: "10", label: "10 reviews" },
  { value: "15", label: "15 reviews" },
  { value: "20", label: "20 reviews" },
];

const HEADER_SIZE_OPTIONS = [
  { value: "18px", label: "Small (18px)" },
  { value: "24px", label: "Medium (24px)" },
  { value: "30px", label: "Large (30px)" },
];

const BODY_SIZE_OPTIONS = [
  { value: "12px", label: "12px" },
  { value: "14px", label: "14px" },
  { value: "16px", label: "16px" },
];

const NAME_FORMAT_OPTIONS = [
  { value: "full", label: "Full name" },
  { value: "first", label: "First name only" },
  { value: "initials", label: "Initials" },
  { value: "anonymous", label: "Anonymous" },
];

const WidgetGeneralTab = ({ form, updateField }) => (
  <FieldGroup>
    <div>
      <FieldLabel>Widget title</FieldLabel>
      <TextField
        value={form.widget_title}
        onChange={(v) => updateField("widget_title", v)}
        placeholder="What customers say"
      />
    </div>
    <ToggleRow
      label="Show widget title"
      enabled={form.show_widget_title !== false}
      onChange={(v) => updateField("show_widget_title", v)}
    />
    <div>
      <FieldLabel>Default sorting</FieldLabel>
      <SelectField
        value={form.default_sorting || "newest"}
        onChange={(v) => updateField("default_sorting", v)}
        options={SORT_OPTIONS}
      />
    </div>
    <div>
      <FieldLabel>Reviews per page</FieldLabel>
      <SelectField
        value={String(form.reviews_per_page || 10)}
        onChange={(v) => updateField("reviews_per_page", Number(v))}
        options={REVIEWS_PER_PAGE_OPTIONS}
      />
    </div>
  </FieldGroup>
);

const WidgetColorsTab = ({ form, updateField }) => {
  const colors = [
    { key: "primary_color", label: "Primary color", fallback: "#F59E0B" },
    { key: "accent_color", label: "Secondary color", fallback: "#E3E3E4" },
    { key: "star_color", label: "Star color", fallback: form.primary_color || "#F59E0B" },
    { key: "button_color", label: "Button color", fallback: form.primary_color || "#F59E0B" },
    { key: "button_text_color", label: "Button text color", fallback: "#131720" },
  ];

  return (
    <FieldGroup>
      {colors.map(({ key, label, fallback }) => (
        <ColorRow
          key={key}
          label={label}
          value={form[key]}
          fallback={fallback}
          onChange={(v) => updateField(key, v)}
        />
      ))}
    </FieldGroup>
  );
};

const WidgetTypographyTab = ({ form, updateField }) => (
  <FieldGroup>
    <div>
      <FieldLabel>Header size</FieldLabel>
      <SelectField
        value={form.header_font_size || "24px"}
        onChange={(v) => updateField("header_font_size", v)}
        options={HEADER_SIZE_OPTIONS}
      />
    </div>
    <div>
      <FieldLabel>Review text size</FieldLabel>
      <SelectField
        value={form.card_body_font_size || "13px"}
        onChange={(v) => updateField("card_body_font_size", v)}
        options={BODY_SIZE_OPTIONS}
      />
    </div>
  </FieldGroup>
);

const WidgetDisplayTab = ({ form, updateField }) => (
  <FieldGroup>
    <ToggleRow
      label="Show review date"
      enabled={form.show_review_date !== false}
      onChange={(v) => updateField("show_review_date", v)}
    />
    <ToggleRow
      label="Show verified badge"
      enabled={form.show_verified_badge !== false}
      onChange={(v) => updateField("show_verified_badge", v)}
    />
    <ToggleRow
      label="Show star rating"
      enabled={form.show_star_rating !== false}
      onChange={(v) => updateField("show_star_rating", v)}
    />
    <ToggleRow
      label="Show product name"
      enabled={form.show_product_name !== false}
      onChange={(v) => updateField("show_product_name", v)}
    />
  </FieldGroup>
);

const WidgetContentTab = ({ form, updateField }) => (
  <FieldGroup>
    <div>
      <FieldLabel>No reviews text</FieldLabel>
      <TextField
        value={form.widget_subtitle}
        onChange={(v) => updateField("widget_subtitle", v)}
        placeholder="Be the first to write a review."
      />
    </div>
    <div>
      <FieldLabel>Write review button text</FieldLabel>
      <TextField
        value={form.write_review_button_text}
        onChange={(v) => updateField("write_review_button_text", v)}
        placeholder="Write a review"
      />
    </div>
    <div>
      <FieldLabel>Reply author name</FieldLabel>
      <TextField
        value={form.reply_author_name}
        onChange={(v) => updateField("reply_author_name", v)}
        placeholder="Store Owner"
      />
    </div>
  </FieldGroup>
);

const WidgetSearchTab = ({ form, updateField }) => (
  <FieldGroup>
    <ToggleRow
      label="Show search bar"
      enabled={!!form.show_search_bar}
      onChange={(v) => updateField("show_search_bar", v)}
    />
    <ToggleRow
      label="Show rating filter pills"
      enabled={!!form.show_rating_filters}
      onChange={(v) => updateField("show_rating_filters", v)}
    />
  </FieldGroup>
);

const WidgetMediaTab = ({ form, updateField }) => (
  <FieldGroup>
    <ToggleRow
      label="Expanded media gallery"
      enabled={!!form.expanded_media_gallery}
      onChange={(v) => updateField("expanded_media_gallery", v)}
    />
    <div>
      <FieldLabel>Image style</FieldLabel>
      <Segmented
        value={form.image_style || "rounded"}
        onChange={(v) => updateField("image_style", v)}
        options={[
          { value: "square", label: "Square" },
          { value: "rounded", label: "Rounded" },
          { value: "circle", label: "Circle" },
        ]}
      />
    </div>
  </FieldGroup>
);

const WidgetPrivacyTab = ({ form, updateField }) => (
  <FieldGroup>
    <div>
      <FieldLabel>Reviewer name format</FieldLabel>
      <SelectField
        value={form.reviewer_name_format || "full"}
        onChange={(v) => updateField("reviewer_name_format", v)}
        options={NAME_FORMAT_OPTIONS}
      />
    </div>
    <ToggleRow
      label="Show reviewer location"
      enabled={!!form.show_reviewer_location}
      onChange={(v) => updateField("show_reviewer_location", v)}
    />
  </FieldGroup>
);

const WidgetAdvancedTab = ({ widgetId }) => {
  const [copied, setCopied] = useState(false);
  const shortcode = `[hyoka type="${widgetId || "product-review"}"]`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <FieldGroup>
      <div>
        <SectionLabel>Embed code</SectionLabel>
        <div className="mt-2">
          <TextField value={shortcode} onChange={() => {}} />
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-4 py-2 text-[12px] font-bold text-gray-900 hover:bg-[#E5A800] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy shortcode"}
          </button>
        </div>
      </div>
    </FieldGroup>
  );
};

const PlaceholderTab = ({ title }) => (
  <p className="text-[12px] text-gray-400 leading-relaxed py-2">{title} settings are available above.</p>
);

export {
  WidgetGeneralTab,
  WidgetColorsTab,
  WidgetTypographyTab,
  WidgetDisplayTab,
  WidgetContentTab,
  WidgetSearchTab,
  WidgetMediaTab,
  WidgetPrivacyTab,
  WidgetAdvancedTab,
  PlaceholderTab,
};
