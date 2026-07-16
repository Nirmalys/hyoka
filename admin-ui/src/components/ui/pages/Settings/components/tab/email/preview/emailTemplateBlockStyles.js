const STYLE_PRESETS = {
  heading: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    lineHeight: "1.3",
  },
  storeBrand: {
    fontSize: "16px",
    fontWeight: "700",
    color: "",
    textAlign: "center",
    lineHeight: "1.3",
  },
  greeting: {
    fontSize: "14px",
    fontWeight: "400",
    color: "#4b5563",
    textAlign: "left",
    lineHeight: "1.5",
  },
  text: {
    fontSize: "14px",
    fontWeight: "400",
    color: "#4b5563",
    textAlign: "center",
    lineHeight: "1.5",
  },
  small: {
    fontSize: "13px",
    fontWeight: "400",
    color: "#4b5563",
    textAlign: "center",
    lineHeight: "1.5",
  },
  button: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    bgColor: "",
    lineHeight: "1.4",
  },
  stars: {
    fontSize: "13px",
    fontWeight: "400",
    color: "#4b5563",
    textAlign: "center",
    starColor: "",
    lineHeight: "1.5",
  },
  image: {
    borderRadius: "16px",
    maxWidth: "160px",
    textAlign: "center",
  },
};

const BLOCK_STYLE_PRESET_KEY = {
  heading: "heading",
  storeBrand: "storeBrand",
  greeting: "greeting",
  intro: "text",
  productName: "heading",
  productVariant: "small",
  productImage: "image",
  starsHint: "stars",
  supportText: "small",
  supportLink: "small",
  reviewTitle: "heading",
  reviewBody: "text",
  ctaHint: "text",
  buttonText: "button",
  replyIntro: "text",
  replyBody: "text",
  prompt: "text",
  reviewLabel: "text",
  questionLabel: "text",
  questionText: "text",
  answerLabel: "text",
  answerText: "text",
  signOff: "text",
};

export const getBlockStylePresetKey = (blockKey) =>
  BLOCK_STYLE_PRESET_KEY[blockKey] || "text";

const HEADER_SIZE_BLOCKS = new Set(["heading"]);
const BODY_TEXT_BLOCKS = new Set([
  "intro",
  "greeting",
  "starsHint",
  "supportText",
  "supportLink",
  "ctaHint",
  "replyIntro",
  "replyBody",
  "prompt",
  "reviewLabel",
  "reviewBody",
  "signOff",
]);

/** Global (form-level) style overrides that apply across every template. */
const getGlobalBlockOverrides = (form, blockKey, presetKey) => {
  if (!form) return {};
  const overrides = {};

  const headerSize = form.email_header_size;
  const textSize = form.email_text_size;
  const textColor = form.text_color;

  if (HEADER_SIZE_BLOCKS.has(blockKey)) {
    if (headerSize) overrides.fontSize = headerSize;
    if (textColor) overrides.color = textColor;
  } else if (BODY_TEXT_BLOCKS.has(blockKey)) {
    if (textSize) overrides.fontSize = textSize;
    if (textColor) overrides.color = textColor;
  }

  if (presetKey === "stars" && form.star_color) {
    overrides.starColor = form.star_color;
  }
  if (presetKey === "button") {
    if (form.button_color) overrides.bgColor = form.button_color;
    if (form.button_text_color) overrides.color = form.button_text_color;
  }

  return overrides;
};

export const getBlockStyle = (form, templateId, blockKey, fallbackPrimary = "#F59E0B") => {
  const presetKey = getBlockStylePresetKey(blockKey);
  const preset = { ...(STYLE_PRESETS[presetKey] || STYLE_PRESETS.text) };
  const globalOverrides = getGlobalBlockOverrides(form, blockKey, presetKey);
  const saved = form?.email_layout_block_styles?.[templateId]?.[blockKey] || {};

  const merged = { ...preset, ...globalOverrides, ...saved };

  if (!merged.color && presetKey === "storeBrand") {
    merged.color = fallbackPrimary;
  }
  if (!merged.starColor) {
    merged.starColor = form?.star_color || fallbackPrimary;
  }
  if (!merged.bgColor && presetKey === "button") {
    merged.bgColor = form?.button_color || fallbackPrimary;
  }

  return merged;
};

export const blockStyleToCss = (style) => ({
  fontSize: style.fontSize,
  fontWeight: style.fontWeight,
  color: style.color || undefined,
  textAlign: style.textAlign,
  lineHeight: style.lineHeight,
});

export const FONT_SIZE_OPTIONS = [
  "10px", "12px", "13px", "14px", "15px", "16px", "18px", "20px", "24px", "28px", "32px",
];

export const FONT_WEIGHT_OPTIONS = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
];

export const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];
