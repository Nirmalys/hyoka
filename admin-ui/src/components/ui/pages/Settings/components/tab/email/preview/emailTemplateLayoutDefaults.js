export const EMAIL_PREVIEW_SAMPLES = {
  customerName: "John",
  productName: "Example Product",
  productNameLong: "Cold Brew Iced Matcha 230mL",
  reviewTitle: "Example review title",
  reviewBody: "Example review body",
  replyContent: "Example reply content",
  question: "Example question?",
  answer: "Example answer.",
};

export const SHARED_LAYOUT_DEFAULTS = {
  greeting: "Hi {customer_name},",
  signOff: "Thanks! — The {site_name} team",
};

export const DEFAULT_EMAIL_LAYOUTS = {
  smart_email: {
    storeBrand: "{site_name}",
    intro:
      "We hope you are enjoying your {product_name} from {site_name}. If you have had a chance to use it, we would love to hear what you think. Your feedback helps other shoppers and helps us to improve. It only takes a minute.",
    productName: "Cold Brew Iced Matcha 230mL",
    productVariant: "Variant 1 / Variant 2",
    starsHint: "Click a star to leave a review",
    supportText: "If there were issues with your purchase, let us know; we're here to help.",
    supportLink: "Reach out to us.",
  },
  store_review_fallback: {
    storeBrand: "{site_name}",
    intro:
      "We'd love to hear about your {product_name}. Your review helps other shoppers make confident decisions.",
    productName: "{product_name}",
    productVariant: "Order #10421 · Delivered Jun 22",
    starsHint: "Tap a star to share your review",
    buttonText: "Write a Review",
    signOff: "Thanks in advance for the cooperation!",
  },
  reminder: {
    storeBrand: "{site_name}",
    intro:
      "It's been a week since your {product_name} was delivered - got a minute to share how it's working out? Even one line helps.",
    productName: "{product_name}",
    productVariant: "Order #10421 · Delivered Jun 22",
    starsHint: "Tap a star to rate this product",
    buttonText: "Leave your review - Just 60 seconds",
    signOff: "Thanks - The Team {site_name}",
  },
  review_confirmation: {
    storeBrand: "{site_name}",
    heading: "Thank you, {customer_name}!",
    intro:
      "Thanks for submitting your review for {product_name}. Your review is now live and helping other shoppers.",
    reviewBody:
      "Sound quality of this {product_name} blew me away. Bass is rich and crisp - worth every dollar.",
    reviewerName: "Sarah Arjun",
    reviewerLocation: "San Francisco, United States",
    ctaHint: "Please confirm that it was you who wrote it",
    buttonText: "Confirm My Review",
    signOff: "Thanks - The Team {site_name}",
  },
  reply_notification: {
    storeBrand: "{site_name}",
    heading: "The store replied to your review",
    intro:
      "Thanks for submitting your review for {product_name}. Your review is now live and helping other shoppers.",
    reviewBody:
      "Thank you so much for your reply! I had an issue with the charge port initially but it's sorted now.",
    reviewerName: "Sarah Arjun",
    replyStoreName: "Aurora Brands",
    replyBody:
      "Hi Sarah, thanks so much! We're really glad our team helped get the charge port sorted. That's exactly the experience we want for every Aurora customer.",
    signOff: "Thanks - The Team {site_name}",
  },
  media_reminder: {
    storeBrand: "{site_name}",
    heading: "Hi {customer_name}, Show It Off",
    intro:
      "Reviews with photos or videos get 3× more attention. Add one to your existing review and it can make a big difference for other shoppers.",
    reviewBody:
      "Sized down based on the chart and it's perfect. The fleece interior is heavy without being hot. Already ordered the bone color.",
    reviewerName: "Sarah Arjun",
    reviewerLocation: "San Francisco, United States",
    buttonText: "Add photos to my review",
    signOff: "Thanks - The Team {site_name}",
  },
};

export const getTemplateLayoutExtras = (form, templateId) => {
  const extras = form?.email_layouts?.[templateId]?._extras;
  return Array.isArray(extras) ? extras : [];
};

export const mergeTemplateLayoutContent = (form, templateId) => {
  const defaults = {
    ...SHARED_LAYOUT_DEFAULTS,
    ...(DEFAULT_EMAIL_LAYOUTS[templateId] || {}),
  };
  const saved = form?.email_layouts?.[templateId] || {};
  const { _extras: _ignored, ...savedContent } = saved;
  return { ...defaults, ...savedContent };
};

export const layoutBlockSelectionId = (templateId, blockKey) =>
  `layout:${templateId}:${blockKey}`;

export const parseLayoutBlockSelectionId = (selectionId) => {
  if (!selectionId?.startsWith("layout:")) return null;
  const rest = selectionId.slice("layout:".length);
  const splitAt = rest.indexOf(":");
  if (splitAt < 1) return null;
  return {
    templateId: rest.slice(0, splitAt),
    blockKey: rest.slice(splitAt + 1),
  };
};

export const LAYOUT_BLOCK_DEFS = {
  storeBrand: { label: "Store name", inputType: "text" },
  heading: { label: "Heading", inputType: "text" },
  greeting: { label: "Greeting", inputType: "text" },
  intro: { label: "Introduction", inputType: "textarea" },
  productName: { label: "Product name line", inputType: "text" },
  productVariant: { label: "Product variant line", inputType: "text" },
  productImage: { label: "Product image", inputType: "readonly" },
  starsHint: { label: "Star rating text", inputType: "text" },
  supportText: { label: "Support text", inputType: "textarea" },
  supportLink: { label: "Support link text", inputType: "text" },
  reviewTitle: { label: "Review title sample", inputType: "text" },
  reviewBody: { label: "Review body sample", inputType: "textarea" },
  reviewerName: { label: "Reviewer name", inputType: "text" },
  reviewerLocation: { label: "Reviewer location", inputType: "text" },
  ctaHint: { label: "Button hint", inputType: "text" },
  buttonText: { label: "Button text", inputType: "text" },
  replyIntro: { label: "Reply intro", inputType: "text" },
  replyStoreName: { label: "Reply store name", inputType: "text" },
  replyBody: { label: "Reply content sample", inputType: "textarea" },
  prompt: { label: "Prompt text", inputType: "textarea" },
  reviewLabel: { label: "Review label", inputType: "text" },
  questionLabel: { label: "Question label", inputType: "text" },
  questionText: { label: "Question sample", inputType: "text" },
  answerLabel: { label: "Answer label", inputType: "text" },
  answerText: { label: "Answer sample", inputType: "text" },
  signOff: { label: "Sign-off line", inputType: "text" },
};

export const getLayoutBlockDef = (blockKey) =>
  LAYOUT_BLOCK_DEFS[blockKey] || { label: blockKey, inputType: "textarea" };

/** Ordered editable sections per layout template (matches preview renderers). */
export const TEMPLATE_LAYOUT_SECTIONS = {
  smart_email: [
    "storeBrand",
    "heading",
    "greeting",
    "intro",
    "productName",
    "productVariant",
    "productImage",
    "starsHint",
    "supportText",
    "supportLink",
    "signOff",
  ],
  store_review_fallback: [
    "storeBrand",
    "heading",
    "intro",
    "productName",
    "productVariant",
    "productImage",
    "starsHint",
    "buttonText",
    "signOff",
  ],
  reminder: [
    "storeBrand",
    "heading",
    "intro",
    "productName",
    "productVariant",
    "productImage",
    "starsHint",
    "buttonText",
    "signOff",
  ],
  review_confirmation: [
    "storeBrand",
    "heading",
    "intro",
    "reviewBody",
    "reviewerName",
    "reviewerLocation",
    "ctaHint",
    "buttonText",
    "signOff",
  ],
  reply_notification: [
    "storeBrand",
    "heading",
    "intro",
    "reviewBody",
    "reviewerName",
    "replyStoreName",
    "replyBody",
    "signOff",
  ],
  media_reminder: [
    "storeBrand",
    "heading",
    "intro",
    "reviewBody",
    "reviewerName",
    "reviewerLocation",
    "buttonText",
    "signOff",
  ],
};

export const getTemplateLayoutSections = (templateId) =>
  TEMPLATE_LAYOUT_SECTIONS[templateId] || TEMPLATE_LAYOUT_SECTIONS.store_review_fallback;

export const getLayoutBlockValue = (form, templateId, blockKey, formField) => {
  if (formField) return String(form?.[formField] ?? "");
  const merged = mergeTemplateLayoutContent(form, templateId);
  return String(merged[blockKey] ?? "");
};
