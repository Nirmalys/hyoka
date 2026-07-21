/** Utility functions and constants for Settings screen */

import { sanitizeFontKey } from "../editor/editorConfig";

export const DEFAULT_SPAM_KEYWORDS =
  "free money, click here, viagra, casino, lottery, winner, http://, bit.ly, buy now, limited offer";

export const DEFAULT_PROFANITY_KEYWORDS =
  "damn, hell, crap, stupid, hate, sucks, idiot, worst, garbage, scam";

export const withDefaultKeywords = (value, fallback) => {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? fallback : String(value ?? "");
};

export const DAY_PRESETS = [3, 7, 14, 20];

/** Clamp delay days to 1–90; invalid values use fallback. */
export const parseDaysAfter = (val, fallback = 7) => {
  const n = Number(val);
  if (!Number.isFinite(n)) {
    return Math.max(1, fallback);
  }
  return Math.max(1, Math.min(90, Math.trunc(n)));
};

/** WP/JSON can send 0/1; avoid `!!` on strings like "0" (truthy in JS). */
export const parseAutomationBool = (v) => v === true || v === 1 || v === "1";

/** Change only the automation master toggle; leave all other rule toggles untouched. */
export const setAutomationOnly = (fields, automationEnabled) => ({
  ...fields,
  automation_enabled: !!automationEnabled,
});

/** Allow FFB022 or #ffb022; expand #rgb → #rrggbb for `<input type="color">`. */
export const normalizeHexInput = (raw) => {
  let s = String(raw ?? "").trim();
  if (!s) return s;
  if (!s.startsWith("#")) {
    const m = s.match(/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/i);
    if (m) s = `#${m[1]}`;
    else return s;
  }
  if (/^#([0-9a-fA-F]{3})$/i.test(s)) {
    const [, a, b, c] = s;
    s = `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  if (/^#([0-9a-fA-F]{6})$/i.test(s)) return s.toLowerCase();
  return s;
};

export const isFullHex = (s) => /^#([0-9a-fA-F]{6})$/i.test(String(s ?? "").trim());

export const hexForColorPicker = (s, fallback) => (isFullHex(s) ? normalizeHexInput(s) : fallback);

export const PLACEHOLDER_HINTS = [
  { token: "{customer_name}", desc: "Buyer's first + last name" },
  { token: "{product_name}", desc: "Purchased product title (plain text)" },
  { token: "{product_name_html}", desc: "Product title as link when a URL exists, else bold" },
  { token: "{product_image}", desc: "Product thumbnail HTML (or empty)" },
  { token: "{product_image_url}", desc: "Product thumbnail URL for image blocks" },
  { token: "{product_url}", desc: "Product page URL (escaped)" },
  { token: "{review_url}", desc: "Review invite or product URL (never empty)" },
  { token: "{review_button_html}", desc: "Centered Submit review button with inline styles" },
  { token: "{site_name}", desc: "Your store name" },
  { token: "{site_url}", desc: "Homepage URL" },
  { token: "{order_id}", desc: "WooCommerce order ID" },
];

export const PREVIEW_SAMPLE = {
  "{customer_name}": "Alex Customer",
  "{product_name}": "Sample product",
  "{site_name}": "Your store",
  "{order_id}": "12345",
};

/** Split comma/newline keyword lists for previews and matching. */
export const splitKeywordList = (raw) => {
  const text = String(raw ?? "").trim();
  if (!text) return [];
  return text
    .split(/[\r\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
};

/** First N keywords for display chips in automation cards. */
export const previewKeywordChips = (raw, maxShow = 4) => {
  const all = splitKeywordList(raw);
  const shown = all.slice(0, maxShow);
  const extra = Math.max(0, all.length - shown.length);
  return { shown, extra, total: all.length };
};

export const parseReviewsPerPage = (val, fallback = 10) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(100, Math.round(n)));
};

export const submissionFormSnapshot = (form = {}) => ({
  form_title: form.form_title || "Write a Review",
  submit_button_text: form.submit_button_text || "Submit Review",
  primary_color: normalizeHexInput(form.primary_color) || "#F59E0B",
  allow_photos: form.allow_photos !== false,
  allow_videos: form.allow_videos !== false,
  form_show_name: form.form_show_name !== false,
  form_show_email: !!form.form_show_email,
  form_show_location: !!form.form_show_location,
  form_show_title: !!form.form_show_title,
  form_show_review: form.form_show_review !== false,
  form_show_rating: form.form_show_rating !== false,
});

export const submissionFormEqual = (left, right) =>
  JSON.stringify(submissionFormSnapshot(left)) === JSON.stringify(submissionFormSnapshot(right));

/** Email Settings tab fields tracked for Save (automation toggle saves separately). */
export const automationRulesSnapshot = (form) => ({
  review_request_schedule_enabled: !!form?.review_request_schedule_enabled,
  days_after: parseDaysAfter(form?.days_after, 7),
  spam_filter_enabled: !!form?.spam_filter_enabled,
  profanity_filter_enabled: !!form?.profanity_filter_enabled,
  auto_approve_enabled: !!form?.auto_approve_enabled,
  reminder_enabled: !!form?.reminder_enabled,
  media_reminder_enabled: !!form?.media_reminder_enabled,
  reply_notification_enabled: !!form?.reply_notification_enabled,
  review_confirmation_enabled: !!form?.review_confirmation_enabled,
  reminder_days_after: parseDaysAfter(form?.reminder_days_after, 3),
  reminder_subject: String(form?.reminder_subject ?? "").trim(),
  reminder_email_heading: String(form?.reminder_email_heading ?? "").trim(),
  spam_filter_keywords: String(form?.spam_filter_keywords ?? "").trim(),
  profanity_filter_keywords: String(form?.profanity_filter_keywords ?? "").trim(),
  auto_approve_min_rating: Math.max(1, Math.min(5, Number(form?.auto_approve_min_rating) || 4)),
  reviews_per_page: parseReviewsPerPage(form?.reviews_per_page, 10),
  email_from_name: String(form?.email_from_name ?? "").trim(),
  email_from_address: String(form?.email_from_address ?? "").trim(),
  admin_notifications_enabled: !!form?.admin_notifications_enabled,
  admin_notification_emails: String(form?.admin_notification_emails ?? "").trim(),
  admin_notify_new_review: !!form?.admin_notify_new_review,
  admin_notify_new_question: !!form?.admin_notify_new_question,
  admin_send_email_copy: !!form?.admin_send_email_copy,
  negative_review_threshold: String(form?.negative_review_threshold ?? "0").trim(),
  negative_notification_alt_enabled: !!form?.negative_notification_alt_enabled,
  negative_notification_alt_emails: String(form?.negative_notification_alt_emails ?? "").trim(),
  show_verified_purchase_badge: !!form?.show_verified_purchase_badge,
  show_audit_log_details: !!form?.show_audit_log_details,
});

export const automationRulesEqual = (a, b) => {
  const left = automationRulesSnapshot(a);
  const right = automationRulesSnapshot(b);
  return (
    left.review_request_schedule_enabled === right.review_request_schedule_enabled &&
    left.days_after === right.days_after &&
    left.spam_filter_enabled === right.spam_filter_enabled &&
    left.profanity_filter_enabled === right.profanity_filter_enabled &&
    left.auto_approve_enabled === right.auto_approve_enabled &&
    left.reminder_enabled === right.reminder_enabled &&
    left.media_reminder_enabled === right.media_reminder_enabled &&
    left.reply_notification_enabled === right.reply_notification_enabled &&
    left.review_confirmation_enabled === right.review_confirmation_enabled &&
    left.reminder_days_after === right.reminder_days_after &&
    left.reminder_subject === right.reminder_subject &&
    left.reminder_email_heading === right.reminder_email_heading &&
    left.spam_filter_keywords === right.spam_filter_keywords &&
    left.profanity_filter_keywords === right.profanity_filter_keywords &&
    left.auto_approve_min_rating === right.auto_approve_min_rating &&
    left.reviews_per_page === right.reviews_per_page &&
    left.email_from_name === right.email_from_name &&
    left.email_from_address === right.email_from_address &&
    left.admin_notifications_enabled === right.admin_notifications_enabled &&
    left.admin_notification_emails === right.admin_notification_emails &&
    left.admin_notify_new_review === right.admin_notify_new_review &&
    left.admin_notify_new_question === right.admin_notify_new_question &&
    left.admin_send_email_copy === right.admin_send_email_copy &&
    left.negative_review_threshold === right.negative_review_threshold &&
    left.negative_notification_alt_enabled === right.negative_notification_alt_enabled &&
    left.negative_notification_alt_emails === right.negative_notification_alt_emails &&
    left.show_verified_purchase_badge === right.show_verified_purchase_badge &&
    left.show_audit_log_details === right.show_audit_log_details
  );
};

const boolAjaxFlag = (value) => (value ? 1 : 0);

export const buildAutomationAjaxPayload = (form, { includeReviewRequestEnabled = false } = {}) => ({
  action: "hyoka_save_followup_settings",
  save_context: "automation",
  automation_enabled: boolAjaxFlag(form.automation_enabled),
  review_request_schedule_enabled: boolAjaxFlag(form.review_request_schedule_enabled),
  ...(includeReviewRequestEnabled ? { review_request_enabled: boolAjaxFlag(form.review_request_enabled) } : {}),
  days_after: Math.max(1, Number(form.days_after) || 7),
  admin_notifications_enabled: boolAjaxFlag(form.admin_notifications_enabled),
  reply_notification_enabled: boolAjaxFlag(form.reply_notification_enabled),
  review_confirmation_enabled: boolAjaxFlag(form.review_confirmation_enabled),
  admin_notification_emails: form.admin_notification_emails || "",
  admin_notify_new_review: boolAjaxFlag(form.admin_notify_new_review),
  admin_notify_new_question: boolAjaxFlag(form.admin_notify_new_question),
  admin_send_email_copy: boolAjaxFlag(form.admin_send_email_copy),
  negative_review_threshold: form.negative_review_threshold ?? "0",
  negative_notification_alt_enabled: boolAjaxFlag(form.negative_notification_alt_enabled),
  negative_notification_alt_emails: form.negative_notification_alt_emails || "",
  show_verified_purchase_badge: boolAjaxFlag(form.show_verified_purchase_badge),
  show_audit_log_details: boolAjaxFlag(form.show_audit_log_details),
  reminder_enabled: boolAjaxFlag(form.reminder_enabled),
  media_reminder_enabled: boolAjaxFlag(form.media_reminder_enabled),
  reminder_days_after: Math.max(1, parseDaysAfter(form.reminder_days_after, 3)),
  reminder_subject: form.reminder_subject || "",
  reminder_email_heading: form.reminder_email_heading || "",
  spam_filter_enabled: boolAjaxFlag(form.spam_filter_enabled),
  spam_filter_keywords: form.spam_filter_keywords || "",
  profanity_filter_enabled: boolAjaxFlag(form.profanity_filter_enabled),
  profanity_filter_keywords: form.profanity_filter_keywords || "",
  auto_approve_enabled: boolAjaxFlag(form.auto_approve_enabled),
  auto_approve_min_rating: Math.max(1, Math.min(5, Number(form.auto_approve_min_rating) || 4)),
  reviews_per_page: parseReviewsPerPage(form.reviews_per_page, 10),
  email_from_name: form.email_from_name || "",
  email_from_address: form.email_from_address || "",
});

export const buildTemplateAjaxPayload = (form, templateId = null) => {
  const payload = {
    action: "hyoka_save_followup_settings",
    save_context: "template",
    subject: form.subject,
    email_heading: form.email_heading || "",
    reminder_subject: form.reminder_subject || "",
    reminder_email_heading: form.reminder_email_heading || "",
    body: form.body || "",
    primary_color: form.primary_color,
    accent_color: form.accent_color,
    font_family: sanitizeFontKey(form.font_family),
    email_elements: JSON.stringify(form.email_elements),
    form_elements: JSON.stringify(form.form_elements),
    allow_photos: boolAjaxFlag(form.allow_photos),
    allow_videos: boolAjaxFlag(form.allow_videos),
    email_layouts: JSON.stringify(form.email_layouts || {}),
    email_layout_block_styles: JSON.stringify(form.email_layout_block_styles || {}),
    email_header_size: form.email_header_size || "24px",
    email_text_size: form.email_text_size || "14px",
    star_color: form.star_color || "",
    button_color: form.button_color || "",
    button_text_color: form.button_text_color || "",
    text_color: form.text_color || "",
    email_preheader: form.email_preheader || "",
  };

  if (templateId) {
    payload.email_template_id = templateId;
  }

  return payload;
};

export const buildSubmissionFormAjaxPayload = (form) => ({
  action: "hyoka_save_followup_settings",
  save_context: "submission_form",
  form_title: form.form_title || "Write a Review",
  submit_button_text: form.submit_button_text || "Submit Review",
  primary_color: form.primary_color,
  allow_photos: boolAjaxFlag(form.allow_photos),
  allow_videos: boolAjaxFlag(form.allow_videos),
  form_show_name: form.form_show_name !== false ? 1 : 0,
  form_show_email: form.form_show_email ? 1 : 0,
  form_show_location: form.form_show_location ? 1 : 0,
  form_show_title: form.form_show_title ? 1 : 0,
  form_show_review: form.form_show_review !== false ? 1 : 0,
  form_show_rating: form.form_show_rating !== false ? 1 : 0,
});
