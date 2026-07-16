export const DEFAULT_SMART_EMAIL_ELEMENTS = [
  { id: "e1", type: "text", content: "Hi {customer_name}," },
  { id: "e2", type: "image", url: "{product_image_url}" },
  {
    id: "e3",
    type: "text",
    content:
      "Thanks for buying {product_name_html}. We would love to hear your feedback.",
  },
  { id: "e4", type: "button", text: "Leave a Review" },
];

export const DEFAULT_CUSTOM_EMAIL_ELEMENTS = [
  { id: "e1", type: "text", content: "Hi {customer_name}," },
  { id: "e2", type: "button", text: "Leave a Review" },
];

export const EMAIL_TEMPLATE_SECTIONS = [
  {
    id: "review_request",
    title: "Review request and reminder emails",
    description: "These emails go out after a delivery to collect fresh reviews.",
    showCreate: true,
    items: [
      {
        id: "store_review_fallback",
        title: "Review Request",
        subtitle: "Initial email asking for a product review",
        enabledKey: "review_request_enabled",
        editorId: "store_review_fallback",
      },
      {
        id: "reminder",
        title: "Review Reminder",
        subtitle: "Gentle nudge if no review yet",
        enabledKey: "reminder_enabled",
        editorId: "reminder",
        requiresAutomation: true,
      },
      {
        id: "media_reminder",
        title: "Photo & Video Reminder",
        subtitle: "Encourages customers to add media",
        enabledKey: "media_reminder_enabled",
        editorId: "media_reminder",
        requiresAutomation: true,
      },
    ],
  },
  {
    id: "post_review",
    title: "Follow-up and notification emails",
    description: "Sent after a review is submitted.",
    showCreate: false,
    items: [
      {
        id: "review_confirmation",
        title: "Review Confirmation",
        subtitle: "Sent when a review is published",
        enabledKey: "review_confirmation_enabled",
        editorId: "review_confirmation",
        requiresAutomation: true,
      },
      {
        id: "reply_notification",
        title: "Reply Notification",
        subtitle: "Alerts the customer when you reply",
        enabledKey: "reply_notification_enabled",
        editorId: "reply_notification",
        requiresAutomation: true,
      },
    ],
  },
];

export const getTemplateEditorMeta = (templateId) => {
  const map = {
    store_review_fallback: {
      title: "Review request",
      subjectKey: "subject",
      headingKey: "email_heading",
      stylingOnly: false,
      layoutPreview: true,
      defaultHeading: "Hi {customer_name}, how was the product?",
      defaultSubject: "We'd love your feedback",
    },
    reminder: {
      title: "Follow-up reminder",
      subjectKey: "reminder_subject",
      headingKey: "reminder_email_heading",
      stylingOnly: false,
      layoutPreview: true,
      defaultHeading: "Still enjoying your order, {customer_name}?",
      defaultSubject: "Reminder: We would still love your review",
    },
    review_confirmation: {
      title: "Review confirmation",
      subjectKey: "subject",
      headingKey: "email_heading",
      stylingOnly: false,
      layoutPreview: true,
      previewHeading: "Thank you, {customer_name}!",
      previewSubject: "Please confirm your review",
    },
    reply_notification: {
      title: "Reply notification",
      subjectKey: "subject",
      headingKey: "email_heading",
      stylingOnly: false,
      layoutPreview: true,
      previewHeading: "The store replied to your review",
      previewSubject: "Your review got a reply!",
    },
    media_reminder: {
      title: "Media reminder",
      subjectKey: "subject",
      headingKey: "email_heading",
      stylingOnly: false,
      layoutPreview: true,
      previewHeading: "Hi {customer_name}, Show It Off",
      previewSubject: "Got a picture to add?",
    },
    styling: {
      title: "Template styling",
      stylingOnly: true,
    },
  };
  return map[templateId] || map.store_review_fallback;
};

export const isTemplateEnabled = (form, item) => {
  if (!form || !item?.enabledKey) return false;
  if (item.requiresAdminNotifications && !form.admin_notifications_enabled) {
    return false;
  }
  return !!form[item.enabledKey];
};

/** Snapshot of email-template list toggles + shared template content for dirty checking. */
export const emailTemplatesSnapshot = (form) => ({
  automation_enabled: !!form?.automation_enabled,
  review_request_enabled: !!form?.review_request_enabled,
  reminder_enabled: !!form?.reminder_enabled,
  media_reminder_enabled: !!form?.media_reminder_enabled,
  admin_notifications_enabled: !!form?.admin_notifications_enabled,
  reply_notification_enabled: !!form?.reply_notification_enabled,
  review_confirmation_enabled: !!form?.review_confirmation_enabled,
  admin_notify_new_question: !!form?.admin_notify_new_question,
  subject: String(form?.subject ?? ""),
  email_heading: String(form?.email_heading ?? ""),
  reminder_subject: String(form?.reminder_subject ?? ""),
  reminder_email_heading: String(form?.reminder_email_heading ?? ""),
  body: String(form?.body ?? ""),
  primary_color: String(form?.primary_color ?? ""),
  accent_color: String(form?.accent_color ?? ""),
  font_family: String(form?.font_family ?? "system"),
  email_preheader: String(form?.email_preheader ?? ""),
  email_header_size: String(form?.email_header_size ?? ""),
  email_text_size: String(form?.email_text_size ?? ""),
  secondary_color: String(form?.secondary_color ?? ""),
  star_color: String(form?.star_color ?? ""),
  button_color: String(form?.button_color ?? ""),
  button_text_color: String(form?.button_text_color ?? ""),
  text_color: String(form?.text_color ?? ""),
  show_reviewer_location: !!(form?.show_reviewer_location ?? true),
  show_reviewer_avatar: !!(form?.show_reviewer_avatar ?? true),
  show_media_gallery: !!(form?.show_media_gallery ?? true),
  show_product_variant: !!(form?.show_product_variant ?? false),
  display_store_name: String(form?.display_store_name ?? ""),
  media_images_only: !!form?.media_images_only,
  media_style: String(form?.media_style ?? ""),
  media_count: Number(form?.media_count ?? 3),
  brand_logo_url: String(form?.brand_logo_url ?? ""),
  bg_image_url: String(form?.bg_image_url ?? ""),
  email_elements: JSON.stringify(form?.email_elements ?? []),
  email_layouts: JSON.stringify(form?.email_layouts ?? {}),
  email_layout_block_styles: JSON.stringify(form?.email_layout_block_styles ?? {}),
});

export const emailTemplatesEqual = (a, b) => {
  if (!a || !b) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
};

export const getTemplateTogglePatch = (item, nextEnabled) => {
  const patch = { [item.enabledKey]: nextEnabled };
  if (item.id === "reminder") {
    patch.reminder_enabled = nextEnabled;
  }
  if (item.id === "media_reminder") {
    patch.media_reminder_enabled = nextEnabled;
  }
  if (item.id === "review_confirmation") {
    patch.review_confirmation_enabled = nextEnabled;
  }
  if (item.id === "reply_notification") {
    patch.reply_notification_enabled = nextEnabled;
  }
  if (item.id === "store_review_fallback") {
    patch.review_request_enabled = nextEnabled;
  }
  return patch;
};
