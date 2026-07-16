import { useState, useCallback, useEffect } from "react";
import axiosClient from "../../../../axiosClient";
import { reportCaughtError } from "../../../../../utils/apiError";
import { previewFontStack } from "../../editor/editorConfig";
import { EXTENDED_WIDGET_STYLE_DEFAULTS, pickExtendedStyles } from "../utils/widgetStyleFields";

const buildStylePayload = (form, widgetId) => ({
  action: "hyoka_save_widget_styles",
  widget_id: widgetId,
  widget_title: form.widget_title,
  widget_subtitle: form.widget_subtitle,
  primary_color: form.primary_color,
  accent_color: form.accent_color,
  font_family: form.font_family,
  card_radius: form.card_radius,
  card_gap: form.card_gap,
  border_color: form.border_color,
  show_star_rating: form.show_star_rating ? 1 : 0,
  widget_layout: form.widget_layout || "carousel",
  widget_elements: JSON.stringify(form.widget_elements),
  header_font_size: form.header_font_size,
  header_font_weight: form.header_font_weight,
  header_text_color: form.header_text_color,
  header_text_align: form.header_text_align,
  card_title_font_size: form.card_title_font_size,
  card_title_font_weight: form.card_title_font_weight,
  card_title_text_color: form.card_title_text_color,
  card_body_font_size: form.card_body_font_size,
  card_body_font_weight: form.card_body_font_weight,
  card_body_text_color: form.card_body_text_color,
  background_color: form.background_color,
  text_color: form.text_color,
  mock_rating_avg: form.mock_rating_avg,
  mock_rating_count: form.mock_rating_count,
  star_size: form.star_size,
  star_align: form.star_align,
  ...pickExtendedStyles(form),
  show_widget_title: form.show_widget_title !== false ? 1 : 0,
  show_review_date: form.show_review_date !== false ? 1 : 0,
  show_verified_badge: form.show_verified_badge !== false ? 1 : 0,
  show_product_name: form.show_product_name !== false ? 1 : 0,
  show_search_bar: form.show_search_bar ? 1 : 0,
  show_rating_filters: form.show_rating_filters ? 1 : 0,
  expanded_media_gallery: form.expanded_media_gallery ? 1 : 0,
  show_reviewer_location: form.show_reviewer_location ? 1 : 0,
});

export const useWidgetStyles = (widgetId) => {
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [errorIsNetwork, setErrorIsNetwork] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [form, setForm] = useState({
    widget_title: "",
    widget_subtitle: "",
    primary_color: "#F59E0B",
    accent_color: "#FDB022",
    font_family: "system",
    card_radius: 12,
    card_gap: 24,
    border_color: "#EAECF0",
    show_star_rating: true,
    widget_layout: "carousel",
    widget_elements: [],
    header_font_size: "24px",
    header_font_weight: "700",
    header_text_color: "#1D2939",
    header_text_align: "center",
    card_title_font_size: "15px",
    card_title_font_weight: "700",
    card_title_text_color: "#1D2939",
    card_body_font_size: "13px",
    card_body_font_weight: "400",
    card_body_text_color: "#667085",
    background_color: "#FFFFFF",
    text_color: "#1D2939",
    mock_rating_avg: "4.8",
    mock_rating_count: 120,
    star_size: "16px",
    star_align: "left",
    ...EXTENDED_WIDGET_STYLE_DEFAULTS,
  });

  const styleFromServer = useCallback((style) => {
    const elements = Array.isArray(style?.widget_elements) ? style.widget_elements : [];
    const widgetLayout = ["grid", "carousel", "list"].includes(style?.widget_layout)
      ? style.widget_layout
      : "carousel";
    return {
      widget_title: style?.widget_title || "",
      widget_subtitle: style?.widget_subtitle || "",
      primary_color: style?.primary_color || "#F59E0B",
      accent_color: style?.accent_color || "#FDB022",
      font_family: style?.font_family || "system",
      card_radius: Number(style?.card_radius) || 12,
      card_gap: Number(style?.card_gap) || 24,
      border_color: style?.border_color || "#EAECF0",
      show_star_rating: style?.show_star_rating !== false,
      widget_layout: widgetLayout,
      widget_elements: elements,
      header_font_size: style?.header_font_size || "24px",
      header_font_weight: style?.header_font_weight || "700",
      header_text_color: style?.header_text_color || "#1D2939",
      header_text_align: style?.header_text_align || "center",
      card_title_font_size: style?.card_title_font_size || "15px",
      card_title_font_weight: style?.card_title_font_weight || "700",
      card_title_text_color: style?.card_title_text_color || "#1D2939",
      card_body_font_size: style?.card_body_font_size || "13px",
      card_body_font_weight: style?.card_body_font_weight || "400",
      card_body_text_color: style?.card_body_text_color || "#667085",
      background_color: style?.background_color || "#FFFFFF",
      text_color: style?.text_color || "#1D2939",
      mock_rating_avg: style?.mock_rating_avg || "4.8",
      mock_rating_count: Number(style?.mock_rating_count) || 120,
      star_size: style?.star_size || "16px",
      star_align: style?.star_align || "left",
      ...pickExtendedStyles(style),
    };
  }, []);

  const loadStyles = useCallback(async () => {
    if (!widgetId) return;
    setLoading(true);
    setError("");
    setErrorIsNetwork(false);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_get_widget_styles",
        widget_id: widgetId,
      });
      if (response.data?.success && response.data?.data?.style) {
        setForm(styleFromServer(response.data.data.style));
        setIsPublished(Boolean(response.data.data.enabled));
      } else {
        setError(response.data?.data?.message || "Could not load widget styles.");
      }
    } catch (err) {
      reportCaughtError(err, "Could not load widget styles.", (message, isNetwork) => {
        setError(message);
        setErrorIsNetwork(isNetwork);
      });
    } finally {
      setLoading(false);
    }
  }, [widgetId, styleFromServer]);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value,
    }));
  };

  const saveStyles = async () => {
    const response = await axiosClient.post("", buildStylePayload(form, widgetId));
    if (!response.data?.success) {
      throw new Error(response.data?.data?.message || "Failed to save.");
    }
    if (response.data?.data?.style) {
      setForm(styleFromServer(response.data.data.style));
    }
    return response.data;
  };

  const handlePublish = async () => {
    if (!widgetId) return false;
    setPublishing(true);
    setError("");
    setErrorIsNetwork(false);
    try {
      await saveStyles();

      const activateResponse = await axiosClient.post("", {
        action: "hyoka_update_widget_settings",
        widget_id: widgetId,
        enabled: 1,
      });

      if (!activateResponse.data?.success) {
        throw new Error(activateResponse.data?.data?.message || "Styles saved but could not activate widget.");
      }

      setIsPublished(true);
      return true;
    } catch (err) {
      reportCaughtError(err, "Failed to publish widget.", (message, isNetwork) => {
        setError(message);
        setErrorIsNetwork(isNetwork);
      });
      return false;
    } finally {
      setPublishing(false);
    }
  };

  return {
    form,
    loading,
    publishing,
    error,
    errorIsNetwork,
    isPublished,
    updateField,
    handlePublish,
    previewFontStack: previewFontStack(form.font_family),
    reload: loadStyles,
  };
};
