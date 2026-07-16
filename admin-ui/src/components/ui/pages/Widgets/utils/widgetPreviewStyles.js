export function getWidgetPreviewStyles(form = {}, previewFontStack = "inherit") {
  const primary = form.primary_color || "#F59E0B";
  const radius = `${form.card_radius ?? 12}px`;
  const gap = `${form.card_gap ?? 24}px`;
  const imageStyle = form.image_style || "rounded";
  const imageRadius =
    imageStyle === "circle" ? "9999px" : imageStyle === "square" ? "0px" : `${Math.max(8, Number(form.card_radius) || 12)}px`;

  return {
    primary,
    accent: form.accent_color || "#FDB022",
    starColor: form.star_color || primary,
    buttonColor: form.button_color || primary,
    buttonTextColor: form.button_text_color || "#131720",
    radius,
    gap,
    imageRadius,
    fontFamily: previewFontStack,
    backgroundColor: form.background_color || "#FFFFFF",
    textColor: form.text_color || "#1D2939",
    borderColor: form.border_color || "#EAECF0",
    showStars: form.show_star_rating !== false,
    showWidgetTitle: form.show_widget_title !== false,
    showReviewDate: form.show_review_date !== false,
    showVerifiedBadge: form.show_verified_badge !== false,
    showProductName: form.show_product_name !== false,
    showSearchBar: !!form.show_search_bar,
    showRatingFilters: !!form.show_rating_filters,
    expandedMediaGallery: !!form.expanded_media_gallery,
    showReviewerLocation: !!form.show_reviewer_location,
    reviewerNameFormat: form.reviewer_name_format || "full",
    widgetTheme: form.widget_theme || "standard",
    widgetTitle: form.show_widget_title === false ? "" : form.widget_title || "",
    widgetSubtitle: form.widget_subtitle || "",
    writeReviewButtonText: form.write_review_button_text || "Write a review",
    replyAuthorName: form.reply_author_name || "Store Owner",
    header: {
      fontSize: form.header_font_size || "24px",
      fontWeight: form.header_font_weight || "700",
      color: form.header_text_color || "#1D2939",
      textAlign: form.header_text_align || "center",
    },
    cardTitle: {
      fontSize: form.card_title_font_size || "15px",
      fontWeight: form.card_title_font_weight || "700",
      color: form.card_title_text_color || "#1D2939",
    },
    cardBody: {
      fontSize: form.card_body_font_size || "13px",
      fontWeight: form.card_body_font_weight || "400",
      color: form.card_body_text_color || "#667085",
    },
    mockRatingAvg: form.mock_rating_avg || "4.9",
    mockRatingCount: Number(form.mock_rating_count) || 12481,
    widgetLayout: ["grid", "list"].includes(form.widget_layout) ? form.widget_layout : "carousel",
    layoutColumns: Number(form.layout_columns) || 3,
    starSize: form.star_size || "16px",
    starAlign: form.star_align || "left",
  };
}

export function starAlignStyle(align = "left") {
  if (align === "center") return { justifyContent: "center" };
  if (align === "right") return { justifyContent: "flex-end" };
  return { justifyContent: "flex-start" };
}
