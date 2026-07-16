import { getTemplateEditorMeta } from "../emailTemplatesConfig";
import {
  getLayoutBlockValue,
  mergeTemplateLayoutContent,
} from "./emailTemplateLayoutDefaults";

const applyTokens = (text, tokens) => {
  let result = String(text ?? "");
  Object.entries(tokens).forEach(([key, value]) => {
    result = result.split(key).join(value);
  });
  return result;
};

export const getBlockFormField = (templateId, blockKey) => {
  const meta = getTemplateEditorMeta(templateId);
  if (blockKey === "heading" && meta?.headingKey) return meta.headingKey;
  if (blockKey === "subject" && meta?.subjectKey) return meta.subjectKey;
  return null;
};

/** Raw editable value for sidebar inputs (includes saved defaults). */
export const getLayoutBlockEditValue = (form, templateId, blockKey, formField) => {
  if (formField) {
    const saved = String(form?.[formField] ?? "").trim();
    if (saved) return saved;
    const meta = getTemplateEditorMeta(templateId);
    if (blockKey === "heading") {
      return String(
        mergeTemplateLayoutContent(form, templateId).heading ||
          meta.defaultHeading ||
          meta.previewHeading ||
          ""
      );
    }
    if (blockKey === "subject") {
      return String(meta.defaultSubject || meta.previewSubject || "");
    }
    return "";
  }
  return getLayoutBlockValue(form, templateId, blockKey, null);
};

export const resolveTemplateContent = (form, templateId, tokens) => {
  const meta = getTemplateEditorMeta(templateId);
  const layout = mergeTemplateLayoutContent(form, templateId);

  const headingFromForm = meta.headingKey
    ? applyTokens(getLayoutBlockEditValue(form, templateId, "heading", meta.headingKey), tokens)
    : "";

  const heading =
    headingFromForm ||
    applyTokens(layout.heading || meta.previewHeading || meta.defaultHeading || "", tokens);

  const tokenize = (key) => applyTokens(layout[key] || "", tokens);

  return {
    heading,
    storeBrand: tokenize("storeBrand"),
    greeting: tokenize("greeting"),
    intro: tokenize("intro"),
    productName: tokenize("productName"),
    productVariant: tokenize("productVariant"),
    starsHint: tokenize("starsHint"),
    supportText: tokenize("supportText"),
    supportLink: tokenize("supportLink"),
    reviewTitle: tokenize("reviewTitle"),
    reviewBody: tokenize("reviewBody"),
    ctaHint: tokenize("ctaHint"),
    buttonText: tokenize("buttonText"),
    replyIntro: tokenize("replyIntro"),
    replyBody: tokenize("replyBody"),
    prompt: tokenize("prompt"),
    reviewLabel: tokenize("reviewLabel"),
    reviewerName: tokenize("reviewerName"),
    reviewerLocation: tokenize("reviewerLocation"),
    replyStoreName: tokenize("replyStoreName"),
    questionLabel: tokenize("questionLabel"),
    questionText: tokenize("questionText"),
    answerLabel: tokenize("answerLabel"),
    answerText: tokenize("answerText"),
    signOff: tokenize("signOff"),
  };
};
