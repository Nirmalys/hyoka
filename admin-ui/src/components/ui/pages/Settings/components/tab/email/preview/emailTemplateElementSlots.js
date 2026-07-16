/** Ordered insertion anchors — one gap after each layout section (fine-grained placement). */
export const TEMPLATE_ELEMENT_ANCHORS = {
  smart_email: [
    "start",
    "after_storeBrand",
    "after_heading",
    "after_greeting",
    "after_intro",
    "after_productName",
    "after_productVariant",
    "after_productImage",
    "after_stars",
    "after_supportText",
    "after_supportLink",
    "before_signoff",
    "end",
  ],
  reminder: [
    "start",
    "after_storeBrand",
    "after_heading",
    "after_intro",
    "after_productImage",
    "after_stars",
    "after_buttonText",
    "before_signoff",
    "end",
  ],
  store_review_fallback: [
    "start",
    "after_storeBrand",
    "after_heading",
    "after_intro",
    "after_productImage",
    "after_stars",
    "after_buttonText",
    "before_signoff",
    "end",
  ],
  review_confirmation: [
    "start",
    "after_storeBrand",
    "after_heading",
    "after_intro",
    "after_quote",
    "after_ctaHint",
    "after_buttonText",
    "before_signoff",
    "end",
  ],
  reply_notification: [
    "start",
    "after_storeBrand",
    "after_heading",
    "after_intro",
    "after_quote",
    "before_signoff",
    "end",
  ],
  media_reminder: [
    "start",
    "after_storeBrand",
    "after_heading",
    "after_intro",
    "after_quote",
    "after_buttonText",
    "before_signoff",
    "end",
  ],
};

/** @deprecated use TEMPLATE_ELEMENT_ANCHORS */
export const TEMPLATE_ELEMENT_SLOT_ORDER = TEMPLATE_ELEMENT_ANCHORS;

const LEGACY_ANCHOR_MAP = {
  after_product: "after_productImage",
  after_quote: "after_quote",
};

export const getTemplateAnchors = (templateId) =>
  TEMPLATE_ELEMENT_ANCHORS[templateId] || ["start", "end"];

export const getTemplateSlotOrder = getTemplateAnchors;

export const normalizeInsertAnchor = (templateId, anchor) => {
  const anchors = getTemplateAnchors(templateId);
  const raw = anchor || "end";
  const mapped = LEGACY_ANCHOR_MAP[raw] || raw;
  if (anchors.includes(mapped)) return mapped;
  if (raw === "after_intro" && anchors.includes("after_intro")) return "after_intro";
  if (raw === "before_signoff" && anchors.includes("before_signoff")) return "before_signoff";
  if (raw === "end") return "end";
  return anchors[anchors.length - 1] || "end";
};

export const normalizeLayoutExtras = (elements, templateId) => {
  const list = Array.isArray(elements) ? elements : [];
  return list.map((el) => ({
    ...el,
    insertAfter: normalizeInsertAnchor(templateId, el.insertAfter),
  }));
};

export const mergeElementsBySlot = (elements, templateId) => {
  const order = getTemplateAnchors(templateId);
  const list = normalizeLayoutExtras(elements, templateId);
  const used = new Set();
  const merged = [];

  order.forEach((anchor) => {
    list.forEach((el) => {
      const key = el.insertAfter || "end";
      if (key === anchor) {
        merged.push(el);
        used.add(el.id);
      }
    });
  });

  list.forEach((el) => {
    if (!used.has(el.id)) {
      merged.push(el);
    }
  });

  return merged;
};

export const filterElementsForSlot = (elements, slotId, templateId = "store_review_fallback") =>
  filterElementsForAnchor(elements, templateId, slotId);

export const filterElementsForAnchor = (elements, templateId, anchorId) => {
  const normalized = normalizeLayoutExtras(elements, templateId);
  const key = normalizeInsertAnchor(templateId, anchorId);
  return normalized.filter((el) => (el.insertAfter || "end") === key);
};
