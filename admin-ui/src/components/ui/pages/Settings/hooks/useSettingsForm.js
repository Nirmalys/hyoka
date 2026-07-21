import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import axiosClient from "../../../../axiosClient";
import { reportCaughtError } from "../../../../../utils/apiError";
import { useApiErrorState } from "../../../../../hooks/useApiErrorState";
import {
  parseAutomationBool,
  parseDaysAfter,
  normalizeHexInput,
  hexForColorPicker,
  isFullHex,
  PREVIEW_SAMPLE,
  setAutomationOnly,
  automationRulesSnapshot,
  automationRulesEqual,
  parseReviewsPerPage,
  DEFAULT_SPAM_KEYWORDS,
  DEFAULT_PROFANITY_KEYWORDS,
  withDefaultKeywords,
  submissionFormSnapshot,
  submissionFormEqual,
  buildAutomationAjaxPayload,
  buildTemplateAjaxPayload,
  buildSubmissionFormAjaxPayload,
} from "../utils";
import {
  emailTemplatesSnapshot,
  emailTemplatesEqual,
} from "../components/tab/email/emailTemplatesConfig";
import { previewFontStack as resolvePreviewFontStack, sanitizeFontKey } from "../../editor/editorConfig";

let cachedSettingsPayload = null;
let settingsLoadPromise = null;

const parseEmailLayouts = (raw) => {
  let layouts = {};
  if (!raw) return layouts;
  if (typeof raw === "object" && !Array.isArray(raw)) layouts = raw;
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed && !Array.isArray(parsed)) layouts = parsed;
    } catch {
      return {};
    }
  }

  Object.keys(layouts).forEach((templateId) => {
    const extras = layouts[templateId]?._extras;
    if (extras == null) return;
    if (Array.isArray(extras)) return;
    if (typeof extras === "string" && extras !== "Array") {
      try {
        const parsed = JSON.parse(extras);
        layouts[templateId]._extras = Array.isArray(parsed) ? parsed : [];
      } catch {
        layouts[templateId]._extras = [];
      }
      return;
    }
    layouts[templateId]._extras = [];
  });

  return layouts;
};

const parseEmailLayoutBlockStyles = (raw) => {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const normalizeFormElements = (elements) =>
  (Array.isArray(elements) ? elements : []).map((el) => {
    if (el?.type === "rating") {
      return {
        ...el,
        type: "stars",
        hintText: el.hintText ?? "",
        starSize: el.starSize ?? "36px",
        hintFontSize: el.hintFontSize ?? "13px",
        hintColor: el.hintColor ?? "#64748b",
        textAlign: el.textAlign ?? "center",
      };
    }
    if (el?.type === "text" && !el.textAlign) {
      return { ...el, textAlign: "center" };
    }
    return el;
  });

export const useSettingsForm = () => {
  const [loading, setLoading] = useState(!cachedSettingsPayload);
  const [savingContext, setSavingContext] = useState(null);
  const [savedNote, setSavedNote] = useState("");
  const { error, errorIsNetwork, setError, clearError } = useApiErrorState();
  const [fontChoices, setFontChoices] = useState({});
  const [form, setForm] = useState({
    automation_enabled: true,
    review_request_enabled: true,
    review_request_schedule_enabled: true,
    days_after: 7,
    reminder_enabled: false,
    media_reminder_enabled: false,
    reminder_days_after: 3,
    reminder_subject: "Reminder: We would still love your review",
    reminder_email_heading: "Still have a moment to leave a review?",
    admin_notifications_enabled: false,
    reply_notification_enabled: true,
    review_confirmation_enabled: true,
    admin_notification_emails: "",
    admin_notify_new_review: true,
    admin_notify_new_question: true,
    admin_send_email_copy: false,
    negative_review_threshold: "0",
    negative_notification_alt_enabled: false,
    negative_notification_alt_emails: "",
    show_verified_purchase_badge: true,
    show_audit_log_details: true,
    spam_filter_enabled: false,
    spam_filter_keywords: DEFAULT_SPAM_KEYWORDS,
    profanity_filter_enabled: false,
    profanity_filter_keywords: DEFAULT_PROFANITY_KEYWORDS,
    auto_approve_enabled: false,
    auto_approve_min_rating: 4,
    reviews_per_page: 10,
    email_from_name: "",
    email_from_address: "",
    subject: "",
    email_heading: "",
    body: "",
    primary_color: "#F59E0B",
    accent_color: "#FDB022",
    font_family: "system",
    email_layouts: {},
    email_layout_block_styles: {},
    email_header_size: "24px",
    email_text_size: "14px",
    star_color: "#F59E0B",
    button_color: "#F59E0B",
    button_text_color: "#ffffff",
    text_color: "#111827",
    email_preheader: "",
    last_save_context: "",
    form_title: "Write a Review",
    form_subtitle: "",
    allow_photos: true,
    allow_videos: true,
    submit_button_text: "Submit Review",
    form_show_name: true,
    form_show_email: false,
    form_show_location: false,
    form_show_title: false,
    form_show_review: true,
    form_show_rating: true,
    email_elements: [],
    form_elements: [],
  });
  const settingsFetchStartedRef = useRef(false);
  const [savedRules, setSavedRules] = useState(() =>
    automationRulesSnapshot({ days_after: 7 })
  );
  const [savedEmailTemplates, setSavedEmailTemplates] = useState(() =>
    emailTemplatesSnapshot({})
  );
  const [savedSubmissionForm, setSavedSubmissionForm] = useState(() =>
    submissionFormSnapshot({})
  );

  useEffect(() => {
    if (savedNote) {
      const timer = setTimeout(() => setSavedNote(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [savedNote]);

  const formFromServer = useCallback((s) => {
    const parseElements = (val, defaults) => {
        if (typeof val === 'string' && val.trim() !== '') {
            try { return JSON.parse(val); } catch(e) { return defaults; }
        }
        return (Array.isArray(val) && val.length > 0) ? val : defaults;
    };

    return {
      automation_enabled: parseAutomationBool(s.automation_enabled),
      review_request_enabled: parseAutomationBool(s.review_request_enabled ?? true),
      review_request_schedule_enabled: parseAutomationBool(
        s.review_request_schedule_enabled !== undefined
          ? s.review_request_schedule_enabled
          : s.review_request_enabled ?? true
      ),
      days_after: parseDaysAfter(s.days_after, 7),
      reminder_enabled: parseAutomationBool(s.reminder_enabled),
      media_reminder_enabled: parseAutomationBool(s.media_reminder_enabled),
      reminder_days_after: parseDaysAfter(s.reminder_days_after, 3),
      reminder_subject: s.reminder_subject || "Reminder: We would still love your review",
      reminder_email_heading: s.reminder_email_heading || "Still have a moment to leave a review?",
      admin_notifications_enabled: parseAutomationBool(s.admin_notifications_enabled),
      reply_notification_enabled:
        s.reply_notification_enabled !== undefined
          ? parseAutomationBool(s.reply_notification_enabled)
          : true,
      review_confirmation_enabled:
        s.review_confirmation_enabled !== undefined
          ? parseAutomationBool(s.review_confirmation_enabled)
          : true,
      admin_notification_emails: s.admin_notification_emails || "",
      admin_notify_new_review:
        s.admin_notify_new_review !== undefined
          ? parseAutomationBool(s.admin_notify_new_review)
          : true,
      admin_notify_new_question:
        s.admin_notify_new_question !== undefined
          ? parseAutomationBool(s.admin_notify_new_question)
          : true,
      admin_send_email_copy: parseAutomationBool(s.admin_send_email_copy),
      negative_review_threshold: String(s.negative_review_threshold ?? "0"),
      negative_notification_alt_enabled: parseAutomationBool(s.negative_notification_alt_enabled),
      negative_notification_alt_emails: s.negative_notification_alt_emails || "",
      show_verified_purchase_badge:
        s.show_verified_purchase_badge !== undefined
          ? parseAutomationBool(s.show_verified_purchase_badge)
          : true,
      show_audit_log_details:
        s.show_audit_log_details !== undefined
          ? parseAutomationBool(s.show_audit_log_details)
          : true,
      spam_filter_enabled: parseAutomationBool(s.spam_filter_enabled),
      spam_filter_keywords: withDefaultKeywords(
        s.spam_filter_keywords,
        DEFAULT_SPAM_KEYWORDS
      ),
      profanity_filter_enabled: parseAutomationBool(s.profanity_filter_enabled),
      profanity_filter_keywords: withDefaultKeywords(
        s.profanity_filter_keywords,
        DEFAULT_PROFANITY_KEYWORDS
      ),
      auto_approve_enabled: parseAutomationBool(s.auto_approve_enabled),
      auto_approve_min_rating: Number(s.auto_approve_min_rating ?? 4) || 4,
      reviews_per_page: parseReviewsPerPage(s.reviews_per_page, 10),
      email_from_name: s.email_from_name || "",
      email_from_address: s.email_from_address || "",
      subject: s.subject || "",
      email_heading: s.email_heading || "",
      body: s.body || "",
      primary_color: normalizeHexInput(s.primary_color) || "#F59E0B",
      accent_color: normalizeHexInput(s.accent_color) || "#fdb022",
      font_family: sanitizeFontKey(s.font_family || "system"),
      email_layouts: parseEmailLayouts(s.email_layouts),
      email_layout_block_styles: parseEmailLayoutBlockStyles(s.email_layout_block_styles),
      email_header_size: s.email_header_size || "24px",
      email_text_size: s.email_text_size || "14px",
      star_color: normalizeHexInput(s.star_color) || "#F59E0B",
      button_color: normalizeHexInput(s.button_color) || "#F59E0B",
      button_text_color: normalizeHexInput(s.button_text_color) || "#ffffff",
      text_color: normalizeHexInput(s.text_color) || "#111827",
      email_preheader: s.email_preheader || "",
      last_save_context: s.last_save_context || "",
      form_title: s.form_title || "Write a Review",
      form_subtitle: s.form_subtitle || "",
      allow_photos: s.allow_photos !== undefined ? !!s.allow_photos : true,
      allow_videos: s.allow_videos !== undefined ? !!s.allow_videos : true,
      submit_button_text: s.submit_button_text || "Submit Review",
      form_show_name: s.form_show_name !== undefined ? !!s.form_show_name : true,
      form_show_email: !!s.form_show_email,
      form_show_location: !!s.form_show_location,
      form_show_title: !!s.form_show_title,
      form_show_review: s.form_show_review !== undefined ? !!s.form_show_review : true,
      form_show_rating: s.form_show_rating !== undefined ? !!s.form_show_rating : true,
      email_elements: parseElements(s.email_elements, []),
      form_elements: normalizeFormElements(parseElements(s.form_elements, [])),
    };
  }, []);

  const applyRuntimeFlags = useCallback((nextForm) => {
    if (typeof window === "undefined") return;
    if (!window.hyokaData) window.hyokaData = {};
    window.hyokaData.showVerifiedPurchaseBadge = !!nextForm?.show_verified_purchase_badge;
    window.hyokaData.showAuditLogDetails = !!nextForm?.show_audit_log_details;
    window.hyokaData.adminNotificationsEnabled = !!nextForm?.admin_notifications_enabled;
  }, []);

  const loadSettings = useCallback(async () => {
    const applyPayload = (payload) => {
      setForm(payload.form);
      applyRuntimeFlags(payload.form);
      setSavedRules(payload.savedRules);
      setSavedEmailTemplates(payload.savedEmailTemplates);
      setSavedSubmissionForm(payload.savedSubmissionForm);
      if (payload.fontChoices) {
        setFontChoices(payload.fontChoices);
      }
      return payload.lastContext;
    };

    if (cachedSettingsPayload) {
      applyPayload(cachedSettingsPayload);
      setLoading(false);
    }

    const isFirstFetch = !settingsFetchStartedRef.current;
    settingsFetchStartedRef.current = true;
    if (isFirstFetch && !cachedSettingsPayload) {
      setLoading(true);
    }
    setError("");

    const fetchSettings = async () => {
      try {
        const response = await axiosClient.post("", {
          action: "hyoka_get_followup_settings",
        });
        if (response.data?.success && response.data?.data?.settings) {
          const s = response.data.data.settings;
          const nextForm = formFromServer(s);
          cachedSettingsPayload = {
            form: nextForm,
            savedRules: automationRulesSnapshot(nextForm),
            savedEmailTemplates: emailTemplatesSnapshot(nextForm),
            savedSubmissionForm: submissionFormSnapshot(nextForm),
            fontChoices: response.data.data.font_choices || null,
            lastContext: s.last_save_context || null,
          };
          return cachedSettingsPayload;
        }
      } catch (err) {
        reportCaughtError(err, "Could not load settings.", setError);
      }
      return null;
    };

    try {
      if (!settingsLoadPromise) {
        settingsLoadPromise = fetchSettings().finally(() => {
          settingsLoadPromise = null;
        });
      }
      const payload = await settingsLoadPromise;
      if (payload) {
        return applyPayload(payload);
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [formFromServer, applyRuntimeFlags]);

  const updateField = (key, value) => {
    setForm((prev) => {
      const resolved =
        typeof value === "function" ? value(prev[key]) : value;
      let v = resolved;
      if (key === "primary_color" || key === "accent_color") {
        v = normalizeHexInput(resolved);
      }
      return { ...prev, [key]: v };
    });
    setSavedNote("");
  };

  const updateEmailLayoutBlock = useCallback((templateId, blockKey, value) => {
    setForm((prev) => ({
      ...prev,
      email_layouts: {
        ...(prev.email_layouts || {}),
        [templateId]: {
          ...((prev.email_layouts || {})[templateId] || {}),
          [blockKey]: value,
        },
      },
    }));
    setSavedNote("");
  }, []);

  const updateEmailLayoutBlockStyle = useCallback((templateId, blockKey, styleKey, value) => {
    setForm((prev) => ({
      ...prev,
      email_layout_block_styles: {
        ...(prev.email_layout_block_styles || {}),
        [templateId]: {
          ...((prev.email_layout_block_styles || {})[templateId] || {}),
          [blockKey]: {
            ...(((prev.email_layout_block_styles || {})[templateId] || {})[blockKey] || {}),
            [styleKey]: value,
          },
        },
      },
    }));
    setSavedNote("");
  }, []);

  const updateEmailTemplateExtras = useCallback((templateId, updater) => {
    setForm((prev) => {
      const current = prev.email_layouts?.[templateId]?._extras || [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        ...prev,
        email_layouts: {
          ...(prev.email_layouts || {}),
          [templateId]: {
            ...((prev.email_layouts || {})[templateId] || {}),
            _extras: Array.isArray(next) ? next : [],
          },
        },
      };
    });
    setSavedNote("");
  }, []);

  const rulesDirty = useMemo(
    () => !automationRulesEqual(form, savedRules),
    [form, savedRules]
  );

  const emailTemplatesDirty = useMemo(
    () => !emailTemplatesEqual(emailTemplatesSnapshot(form), savedEmailTemplates),
    [form, savedEmailTemplates]
  );

  const submissionFormDirty = useMemo(
    () => !submissionFormEqual(form, savedSubmissionForm),
    [form, savedSubmissionForm]
  );

  const applyEmailTemplatePatch = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSavedNote("");
  }, []);

  const setAutomationEnabled = useCallback((enabled) => {
    setForm((prev) => setAutomationOnly(prev, enabled));
    setSavedNote("");
  }, []);

  const buildAutomationSavePayload = useCallback((baseForm, overrides = {}) => {
    return { ...baseForm, ...overrides };
  }, []);

  const handleSaveAutomation = async (overrides = {}) => {
    const merged = buildAutomationSavePayload(form, overrides);
    const hadRuleEdits = !automationRulesEqual(merged, savedRules);
    setSavingContext("automation");
    setSavedNote("");
    setError("");
    try {
      const response = await axiosClient.post("", buildAutomationAjaxPayload(merged));
      if (response.data?.success) {
        if (response.data?.data?.settings) {
          const nextForm = formFromServer(response.data.data.settings);
          setForm(nextForm);
          applyRuntimeFlags(nextForm);
          setSavedRules(automationRulesSnapshot(nextForm));
          setSavedEmailTemplates(emailTemplatesSnapshot(nextForm));
          setSavedNote("");
        } else {
          applyRuntimeFlags(merged);
          setSavedNote("");
        }
        return true;
      }
      setError(response.data?.data?.message || "Failed to save automation.");
      return false;
    } catch (err) {
      reportCaughtError(err, "Failed to save automation.", setError);
      return false;
    } finally {
      setSavingContext(null);
    }
  };

  const handleSaveEmailTemplates = useCallback(async () => {
    const merged = buildAutomationSavePayload(form, {});
    setSavingContext("email_templates");
    setSavedNote("");
    setError("");
    try {
      const autoResponse = await axiosClient.post(
        "",
        buildAutomationAjaxPayload(merged, { includeReviewRequestEnabled: true })
      );

      if (!autoResponse.data?.success) {
        setError(autoResponse.data?.data?.message || "Failed to save template settings.");
        return false;
      }

      let workingForm = merged;
      if (autoResponse.data?.data?.settings) {
        workingForm = formFromServer(autoResponse.data.data.settings);
      }

      const tplResponse = await axiosClient.post("", buildTemplateAjaxPayload(workingForm));

      if (tplResponse.data?.success) {
        const nextForm = tplResponse.data?.data?.settings
          ? formFromServer(tplResponse.data.data.settings)
          : workingForm;
        setForm(nextForm);
        applyRuntimeFlags(nextForm);
        setSavedRules(automationRulesSnapshot(nextForm));
        setSavedEmailTemplates(emailTemplatesSnapshot(nextForm));
        setSavedNote("Email templates saved.");
        return true;
      }
      setError(tplResponse.data?.data?.message || "Failed to save template content.");
      return false;
    } catch (err) {
      reportCaughtError(err, "Failed to save email templates.", setError);
      return false;
    } finally {
      setSavingContext(null);
    }
  }, [form, formFromServer, applyRuntimeFlags, buildAutomationSavePayload]);

  const handleSaveTemplate = async (templateId = "store_review_fallback") => {
    setSavingContext("template");
    setSavedNote("");
    setError("");
    try {
      const response = await axiosClient.post("", buildTemplateAjaxPayload(form, templateId));
      if (response.data?.success) {
        setSavedNote("Email template saved.");
        if (response.data?.data?.settings) {
          const nextForm = formFromServer(response.data.data.settings);
          setForm(nextForm);
          applyRuntimeFlags(nextForm);
          setSavedEmailTemplates(emailTemplatesSnapshot(nextForm));
        }
        return true;
      }
      setError(response.data?.data?.message || "Failed to save template.");
      return false;
    } catch (err) {
      reportCaughtError(err, "Failed to save template.", setError);
      return false;
    } finally {
      setSavingContext(null);
    }
  };

  const handleSaveSubmissionForm = useCallback(async () => {
    setSavingContext("submission_form");
    setSavedNote("");
    setError("");
    try {
      const response = await axiosClient.post("", buildSubmissionFormAjaxPayload(form));
      if (response.data?.success) {
        const nextForm = response.data?.data?.settings
          ? formFromServer(response.data.data.settings)
          : form;
        setForm(nextForm);
        applyRuntimeFlags(nextForm);
        setSavedSubmissionForm(submissionFormSnapshot(nextForm));
        setSavedNote("Submission form saved.");
      } else {
        setError(response.data?.data?.message || "Failed to save submission form.");
      }
    } catch (err) {
      reportCaughtError(err, "Failed to save submission form.", setError);
    } finally {
      setSavingContext(null);
    }
  }, [form, formFromServer, applyRuntimeFlags]);

  // Preview Logic
  const previewPrimaryHex = useMemo(() => {
    const hex = hexForColorPicker(form.primary_color, "#F59E0B");
    // Only allow validated #rrggbb into preview HTML styles (mirrors sanitize_hex_color).
    return isFullHex(hex) ? hex : "#F59E0B";
  }, [form.primary_color]);

  const emailPreviewReplacements = useMemo(
    () => ({
      ...PREVIEW_SAMPLE,
      "{product_name_html}":
        '<a href="#" style="color:#111827;font-weight:700;text-decoration:underline;">Sample product</a>',
      "{review_button_html}": `<p style="text-align:center;margin:24px 0 0;"><a href="#" style="display:inline-block;padding:12px 24px;background-color:${previewPrimaryHex};color:#ffffff !important;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Submit review</a></p>`,
      "{product_image}": "",
      "{product_url}": "#",
      "{review_url}": "#",
      "{site_url}": "https://example.com",
    }),
    [previewPrimaryHex]
  );

  const previewHeading = useMemo(() => {
    let t = form.email_heading || "";
    Object.entries(emailPreviewReplacements).forEach(([k, v]) => {
      t = t.split(k).join(v);
    });
    return t;
  }, [form.email_heading, emailPreviewReplacements]);

  const previewInnerHtml = useMemo(() => {
    let t = form.body || "";
    Object.entries(emailPreviewReplacements).forEach(([k, v]) => {
      t = t.split(k).join(v);
    });
    return t;
  }, [form.body, emailPreviewReplacements]);

  const previewFontStack = useMemo(
    () => resolvePreviewFontStack(form.font_family),
    [form.font_family]
  );

  return {
    form,
    loading,
    error,
    errorIsNetwork,
    savedNote,
    savingContext,
    rulesDirty,
    emailTemplatesDirty,
    submissionFormDirty,
    fontChoices,
    loadSettings,
    updateField,
    updateEmailLayoutBlock,
    updateEmailLayoutBlockStyle,
    updateEmailTemplateExtras,
    applyEmailTemplatePatch,
    setAutomationEnabled,
    handleSaveAutomation,
    handleSaveEmailTemplates,
    handleSaveSubmissionForm,
    handleSaveTemplate,
    previewHeading,
    previewInnerHtml,
    previewFontStack,
    previewPrimaryHex,
    setSavedNote,
    setError
  };
};
