export const EMAIL_GLOBAL_DEFAULTS = {
  email_header_size: "24px",
  email_text_size: "14px",
  primary_color: "#F59E0B",
  secondary_color: "#E3E3E4",
  star_color: "#F59E0B",
  button_color: "#F59E0B",
  button_text_color: "#131720",
  text_color: "#111827",
  show_reviewer_location: true,
  show_reviewer_avatar: true,
  show_media_gallery: true,
  show_product_variant: false,
  display_store_name: "",
  media_images_only: false,
  media_style: "rounded",
  media_count: 3,
  brand_logo_url: "",
  bg_image_url: "",
  email_preheader: "",
};

export const HEADER_SIZE_OPTIONS = [
  { value: "18px", label: "Small (18px)" },
  { value: "24px", label: "Medium (24px)" },
  { value: "30px", label: "Large (30px)" },
];

export const TEXT_SIZE_OPTIONS = [
  { value: "12px", label: "12px" },
  { value: "13px", label: "13px" },
  { value: "14px", label: "14px" },
  { value: "15px", label: "15px" },
  { value: "16px", label: "16px" },
];

export const getGlobalSetting = (form, key) => {
  const val = form?.[key];
  if (val === undefined || val === null || val === "") {
    return EMAIL_GLOBAL_DEFAULTS[key];
  }
  return val;
};

export const getEmailDisplayContext = (form) => ({
  showReviewerLocation: form?.show_reviewer_location !== false,
  showReviewerAvatar: form?.show_reviewer_avatar !== false,
  showMediaGallery: form?.show_media_gallery !== false,
  showProductVariant: form?.show_product_variant === true,
  storeNameOverride: String(form?.display_store_name || "").trim(),
});

export const getEmailMediaContext = (form) => ({
  brandLogoUrl: String(form?.brand_logo_url || "").trim(),
  bgImageUrl: String(form?.bg_image_url || "").trim(),
  mediaStyle: form?.media_style || EMAIL_GLOBAL_DEFAULTS.media_style,
});
