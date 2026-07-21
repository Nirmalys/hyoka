
export const EDITOR_BUILDING_BLOCKS = [
  "text",
  "image",
  "video",
  "button",
  "stars",
  "divider",
  "spacer",
  "link",
];

const SHARED_CANVAS_HINT = "";

export const EDITOR_MODES = {
  email: {
    elementsKey: "email_elements",
    tools: EDITOR_BUILDING_BLOCKS,
    saveLabel: "Save email template",
    canvasHint: SHARED_CANVAS_HINT,
    maxWidth: "520px",
  },
  form: {
    elementsKey: "form_elements",
    tools: EDITOR_BUILDING_BLOCKS,
    saveLabel: "Save form layout",
    canvasHint: SHARED_CANVAS_HINT,
    maxWidth: "520px",
  },
  widget: {
    elementsKey: "widget_elements",
    tools: EDITOR_BUILDING_BLOCKS,
    saveLabel: "Save widget styles",
    canvasHint: SHARED_CANVAS_HINT,
    maxWidth: "1200px",
  },
};

export const getEditorTools = (mode) =>
  EDITOR_MODES[mode]?.tools || EDITOR_BUILDING_BLOCKS;

export const FONT_STACKS = {
  system:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  arial: "Arial, Helvetica, sans-serif",
  georgia: "Georgia, Times New Roman, Times, serif",
  verdana: "Verdana, Geneva, sans-serif",
  trebuchet: "Trebuchet MS, Helvetica, sans-serif",
  times: "Times New Roman, Times, serif",
};

/**
 * Allow-listed font stack only — unknown keys fall back to system.
 */
export const previewFontStack = (fontFamily) =>
  Object.prototype.hasOwnProperty.call(FONT_STACKS, fontFamily)
    ? FONT_STACKS[fontFamily]
    : FONT_STACKS.system;
