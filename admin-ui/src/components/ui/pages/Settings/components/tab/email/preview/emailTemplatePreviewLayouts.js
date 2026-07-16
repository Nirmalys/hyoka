import { Check } from "lucide-react";
import {
  PreviewButton,
  PreviewContentBox,
  PreviewEditable,
  PreviewHeading,
  PreviewProductImage,
  PreviewProductName,
  PreviewProductVariant,
  PreviewStars,
  PreviewStoreBrand,
  PreviewText,
} from "./EmailPreviewParts";
import { layoutBlockSelectionId } from "./emailTemplateLayoutDefaults";
import { blockStyleToCss } from "./emailTemplateBlockStyles";

const blockCss = (getStyle, key) => (getStyle ? blockStyleToCss(getStyle(key)) : {});
const btnCss = (getStyle, key, primaryColor) => {
  if (!getStyle) return { backgroundColor: primaryColor, color: "#ffffff" };
  const st = getStyle(key);
  return {
    backgroundColor: st.bgColor || primaryColor,
    color: st.color || "#ffffff",
    fontSize: st.fontSize,
    fontWeight: st.fontWeight,
  };
};

export const buildTokensFromForm = (siteName) => ({
  "{customer_name}": "John",
  "{product_name}": "Example Product",
  "{site_name}": siteName,
});

const applyTokens = (text, tokens) => {
  let result = String(text ?? "");
  Object.entries(tokens).forEach(([key, value]) => {
    result = result.split(key).join(value);
  });
  return result;
};

export const getPreviewSubject = (form, meta, tokens) => {
  if (meta.previewSubject && !meta.subjectKey) return meta.previewSubject;
  if (meta.subjectKey && form[meta.subjectKey]) {
    return applyTokens(form[meta.subjectKey], tokens);
  }
  if (meta.previewSubject) return meta.previewSubject;
  return meta.defaultSubject || "";
};

export const getPreviewHeading = (form, meta, tokens, content) => {
  if (content?.heading) return content.heading;
  if (meta.previewHeading) return meta.previewHeading;
  const key = meta.headingKey || "email_heading";
  const raw = form[key];
  if (raw) return applyTokens(raw, tokens);
  return meta.defaultHeading || "Email preview";
};

/** Insertion gap for custom blocks (editor only). */
const gap = (renderElementSlot, anchorId) => renderElementSlot?.(anchorId) ?? null;

const editProps = (templateId, editable, selectedBlockId, onSelectBlock, blockKey) => ({
  editable,
  selectedBlockId,
  onSelectBlock: () => onSelectBlock?.(blockKey),
  blockId: layoutBlockSelectionId(templateId, blockKey),
});

const EditableGreeting = ({ templateId, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock }) => (
  <PreviewEditable
    {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "greeting")}
    className="mb-4"
  >
    <PreviewText
      align="left"
      style={blockCss(getStyle, "greeting")}
      contentEditable={editable}
      onUpdate={(val) => onUpdateBlock?.("greeting", val)}
    >
      {content.greeting}
    </PreviewText>
  </PreviewEditable>
);

const EditableSignOff = ({ templateId, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock }) => (
  <PreviewEditable
    {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "signOff")}
    className="mt-6"
  >
    <PreviewText
      align="left"
      className="font-semibold text-gray-800"
      style={blockCss(getStyle, "signOff")}
      contentEditable={editable}
      onUpdate={(val) => onUpdateBlock?.("signOff", val)}
    >
      {content.signOff}
    </PreviewText>
  </PreviewEditable>
);

const EditableQuoteBox = ({
  templateId,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  onUpdateBlock,
}) => (
  <div className="bg-[#f3f4f6] py-8 px-5 sm:px-8 my-5 text-center">
    <span
      className="text-[52px] leading-none text-gray-400 font-serif block mb-3 select-none"
      aria-hidden
    >
      &ldquo;
    </span>
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "reviewTitle")}>
      <PreviewHeading
        className="text-[15px] mb-2"
        style={blockCss(getStyle, "reviewTitle")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("reviewTitle", val)}
      >
        {content.reviewTitle}
      </PreviewHeading>
    </PreviewEditable>
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "reviewBody")}>
      <PreviewText
        style={blockCss(getStyle, "reviewBody")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("reviewBody", val)}
      >
        {content.reviewBody}
      </PreviewText>
    </PreviewEditable>
  </div>
);

const EditableQuoteBodyOnly = ({
  templateId,
  blockKey,
  text,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  onUpdateBlock,
}) => (
  <div className="bg-[#f3f4f6] py-8 px-5 sm:px-8 my-5 text-center">
    <span
      className="text-[52px] leading-none text-gray-400 font-serif block mb-3 select-none"
      aria-hidden
    >
      &ldquo;
    </span>
    <PreviewEditable
      {...editProps(templateId, editable, selectedBlockId, onSelectBlock, blockKey)}
    >
      <PreviewText
        style={blockCss(getStyle, blockKey)}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.(blockKey, val)}
      >
        {text}
      </PreviewText>
    </PreviewEditable>
  </div>
);

const EditableStarsBlock = ({
  templateId,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  onUpdateBlock,
}) => (
  <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "starsHint")}>
    <PreviewStars primaryColor={getStyle?.("starsHint")?.starColor || primaryColor} />
    <PreviewText
      className="text-[13px] mt-1"
      style={blockCss(getStyle, "starsHint")}
      contentEditable={editable}
      onUpdate={(val) => onUpdateBlock?.("starsHint", val)}
    >
      {content.starsHint}
    </PreviewText>
  </PreviewEditable>
);

const renderReviewRequest = ({
  templateId,
  heading,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  renderElementSlot,
  onUpdateBlock,
  display = {},
  media = {},
}) => (
  <>
    {gap(renderElementSlot, "start")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "storeBrand")}>
      <PreviewStoreBrand
        name={content.storeBrand}
        color={getStyle?.("storeBrand")?.color || primaryColor}
        style={blockCss(getStyle, "storeBrand")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("storeBrand", val)}
      />
    </PreviewEditable>
    {gap(renderElementSlot, "after_storeBrand")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "heading")}>
      <PreviewHeading
        style={blockCss(getStyle, "heading")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("heading", val)}
      >
        {heading}
      </PreviewHeading>
    </PreviewEditable>
    {gap(renderElementSlot, "after_heading")}
    <EditableGreeting {...{ templateId, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock }} />
    {gap(renderElementSlot, "after_greeting")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "intro")}>
      <PreviewText
        style={blockCss(getStyle, "intro")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("intro", val)}
      >
        {content.intro}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_intro")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "productName")}>
      <PreviewProductName
        name={content.productName}
        style={blockCss(getStyle, "productName")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("productName", val)}
      />
    </PreviewEditable>
    {gap(renderElementSlot, "after_productName")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "productVariant")}>
      <PreviewProductVariant
        text={content.productVariant}
        style={blockCss(getStyle, "productVariant")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("productVariant", val)}
      />
    </PreviewEditable>
    {gap(renderElementSlot, "after_productVariant")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "productImage")}>
      <PreviewProductImage style={getStyle?.("productImage") || {}} />
    </PreviewEditable>
    {gap(renderElementSlot, "after_productImage")}
    <EditableStarsBlock
      {...{ templateId, primaryColor, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock }}
    />
    {gap(renderElementSlot, "after_stars")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "supportText")}>
      <PreviewText
        className="mt-6 text-[13px]"
        style={blockCss(getStyle, "supportText")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("supportText", val)}
      >
        {content.supportText}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_supportText")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "supportLink")}>
      <PreviewText
        className="mt-1 underline underline-offset-2"
        style={{ ...blockCss(getStyle, "supportLink"), fontSize: "13px" }}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("supportLink", val)}
      >
        {content.supportLink}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_supportLink")}
    {gap(renderElementSlot, "before_signoff")}
    <EditableSignOff {...{ templateId, content, editable, selectedBlockId, onSelectBlock, getStyle }} />
    {gap(renderElementSlot, "end")}
  </>
);

const PreviewVerifiedBadge = ({ primaryColor }) => (
  <div className="mb-5 flex justify-center">
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span
        className="absolute inset-0 rounded-[38%]"
        style={{ backgroundColor: primaryColor }}
      />
      <span
        className="absolute inset-0 rounded-[38%] rotate-45"
        style={{ backgroundColor: primaryColor }}
      />
      <Check className="relative h-7 w-7 text-white" strokeWidth={3} />
    </div>
  </div>
);

const renderReviewConfirmation = ({
  templateId,
  heading,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  renderElementSlot,
  onUpdateBlock,
  display = {},
  media = {},
}) => (
  <>
    {gap(renderElementSlot, "start")}
    <PreviewBrandBanner
      {...{ templateId, name: content.storeBrand, primaryColor, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, media, display }}
    />
    {gap(renderElementSlot, "after_storeBrand")}
    <PreviewVerifiedBadge primaryColor={primaryColor} />
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "heading")}>
      <PreviewHeading
        className="mb-3"
        style={blockCss(getStyle, "heading")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("heading", val)}
      >
        {heading || content.heading}
      </PreviewHeading>
    </PreviewEditable>
    {gap(renderElementSlot, "after_heading")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "intro")}>
      <PreviewText
        style={blockCss(getStyle, "intro")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("intro", val)}
      >
        {content.intro}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_intro")}
    <PreviewReviewTestimonial
      {...{ templateId, primaryColor, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, display }}
    />
    {gap(renderElementSlot, "after_quote")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "ctaHint")}>
      <PreviewText
        className="text-[14px]"
        style={blockCss(getStyle, "ctaHint")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("ctaHint", val)}
      >
        {content.ctaHint}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_ctaHint")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "buttonText")}>
      <PreviewButton primaryColor={primaryColor} style={btnCss(getStyle, "buttonText", primaryColor)}>
        {content.buttonText}
      </PreviewButton>
    </PreviewEditable>
    {gap(renderElementSlot, "after_buttonText")}
    {gap(renderElementSlot, "before_signoff")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "signOff")}>
      <PreviewText
        className="mt-6 text-[14px] text-gray-700"
        style={blockCss(getStyle, "signOff")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("signOff", val)}
      >
        {content.signOff}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "end")}
  </>
);

const PreviewReplyThread = ({
  templateId,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  onUpdateBlock,
  display = {},
}) => {
  const replyStoreName = display.storeNameOverride || content.replyStoreName;
  const storeInitial = String(replyStoreName || content.storeBrand || "A").charAt(0).toUpperCase();
  return (
    <div className="my-6 rounded-2xl border border-gray-200 bg-white p-5 text-left">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-orange-200 via-rose-200 to-purple-200" />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-gray-50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "reviewerName")}>
                <div
                  data-editor-typography
                  className="text-[14px] font-bold text-gray-900 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
                  style={blockCss(getStyle, "reviewerName")}
                  contentEditable={editable}
                  onBlur={editable ? (e) => onUpdateBlock?.("reviewerName", e.target.innerText) : undefined}
                  suppressContentEditableWarning
                >
                  {content.reviewerName}
                </div>
              </PreviewEditable>
              <div className="flex shrink-0 items-center gap-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill={primaryColor} className="h-3 w-3" aria-hidden>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-gray-700">5.0</span>
              </div>
            </div>
            <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "reviewBody")}>
              <div
                data-editor-typography
                className="text-[14px] leading-relaxed text-gray-700 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
                style={blockCss(getStyle, "reviewBody")}
                contentEditable={editable}
                onBlur={editable ? (e) => onUpdateBlock?.("reviewBody", e.target.innerText) : undefined}
                suppressContentEditableWarning
              >
                {content.reviewBody}
              </div>
            </PreviewEditable>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-end gap-3">
        <div className="min-w-0 max-w-[85%]">
          <div className="rounded-2xl bg-[#FFF9E1] px-4 py-3">
            <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "replyStoreName")}>
              <div
                data-editor-typography
                className="mb-1.5 text-[14px] font-bold text-gray-900 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
                style={blockCss(getStyle, "replyStoreName")}
                contentEditable={editable}
                onBlur={editable ? (e) => onUpdateBlock?.("replyStoreName", e.target.innerText) : undefined}
                suppressContentEditableWarning
              >
                {replyStoreName}
              </div>
            </PreviewEditable>
            <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "replyBody")}>
              <div
                data-editor-typography
                className="text-[14px] leading-relaxed text-gray-700 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
                style={blockCss(getStyle, "replyBody")}
                contentEditable={editable}
                onBlur={editable ? (e) => onUpdateBlock?.("replyBody", e.target.innerText) : undefined}
                suppressContentEditableWarning
              >
                {content.replyBody}
              </div>
            </PreviewEditable>
          </div>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
          style={{
            background: `radial-gradient(circle at 22% 15%, #FCD34D 0%, ${primaryColor} 46%, #E67C0B 100%)`,
          }}
        >
          {storeInitial}
        </div>
      </div>
    </div>
  );
};

const renderReplyNotification = ({
  templateId,
  heading,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  renderElementSlot,
  onUpdateBlock,
  display = {},
  media = {},
}) => (
  <>
    {gap(renderElementSlot, "start")}
    <PreviewBrandBanner
      {...{ templateId, name: content.storeBrand, primaryColor, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, media, display }}
    />
    {gap(renderElementSlot, "after_storeBrand")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "heading")}>
      <PreviewHeading
        className="mb-3"
        style={blockCss(getStyle, "heading")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("heading", val)}
      >
        {heading || content.heading}
      </PreviewHeading>
    </PreviewEditable>
    {gap(renderElementSlot, "after_heading")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "intro")}>
      <PreviewText
        style={blockCss(getStyle, "intro")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("intro", val)}
      >
        {content.intro}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_intro")}
    <PreviewReplyThread
      {...{ templateId, primaryColor, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, display }}
    />
    {gap(renderElementSlot, "after_quote")}
    {gap(renderElementSlot, "before_signoff")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "signOff")}>
      <PreviewText
        className="mt-6 text-[14px] text-gray-700"
        style={blockCss(getStyle, "signOff")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("signOff", val)}
      >
        {content.signOff}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "end")}
  </>
);

const PreviewReviewTestimonial = ({
  templateId,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  onUpdateBlock,
  display = {},
}) => (
  <div className="my-6 rounded-2xl border border-gray-200 bg-white px-6 py-6 text-center">
    <div className="mb-3 flex justify-center" style={{ color: primaryColor }}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
        <path d="M7 7h4v6c0 2.21-1.79 4-4 4v-2c1.1 0 2-.9 2-2H7V7zm8 0h4v6c0 2.21-1.79 4-4 4v-2c1.1 0 2-.9 2-2h-2V7z" />
      </svg>
    </div>
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "reviewBody")}>
      <PreviewText
        className="text-[14px]"
        style={blockCss(getStyle, "reviewBody")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("reviewBody", val)}
      >
        {content.reviewBody}
      </PreviewText>
    </PreviewEditable>
    <div className="my-3 flex justify-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill={getStyle?.("starsHint")?.starColor || primaryColor} className="h-3.5 w-3.5" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
    <div className="mt-3 flex items-center justify-center gap-2.5">
      {display.showReviewerAvatar && (
        <div className="h-8 w-8 shrink-0 rounded-full bg-linear-to-br from-orange-200 via-rose-200 to-purple-200" />
      )}
      <div className="text-left">
        <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "reviewerName")}>
          <div
            data-editor-typography
            className="text-[13px] font-bold text-gray-900 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
            style={blockCss(getStyle, "reviewerName")}
            contentEditable={editable}
            onBlur={editable ? (e) => onUpdateBlock?.("reviewerName", e.target.innerText) : undefined}
            suppressContentEditableWarning
          >
            {content.reviewerName}
          </div>
        </PreviewEditable>
        {display.showReviewerLocation && (
          <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "reviewerLocation")}>
            <div
              data-editor-typography
              className="text-[12px] text-gray-400 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
              style={blockCss(getStyle, "reviewerLocation")}
              contentEditable={editable}
              onBlur={editable ? (e) => onUpdateBlock?.("reviewerLocation", e.target.innerText) : undefined}
              suppressContentEditableWarning
            >
              {content.reviewerLocation}
            </div>
          </PreviewEditable>
        )}
      </div>
    </div>
  </div>
);

const renderMediaReminder = ({
  templateId,
  heading,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  renderElementSlot,
  onUpdateBlock,
  display = {},
  media = {},
}) => (
  <>
    {gap(renderElementSlot, "start")}
    <PreviewBrandBanner
      {...{ templateId, name: content.storeBrand, primaryColor, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, media, display }}
    />
    {gap(renderElementSlot, "after_storeBrand")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "heading")}>
      <PreviewHeading
        className="mb-3"
        style={blockCss(getStyle, "heading")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("heading", val)}
      >
        {heading || content.heading}
      </PreviewHeading>
    </PreviewEditable>
    {gap(renderElementSlot, "after_heading")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "intro")}>
      <PreviewText
        style={blockCss(getStyle, "intro")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("intro", val)}
      >
        {content.intro}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_intro")}
    <PreviewReviewTestimonial
      {...{ templateId, primaryColor, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, display }}
    />
    {gap(renderElementSlot, "after_quote")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "buttonText")}>
      <PreviewButton primaryColor={primaryColor} style={btnCss(getStyle, "buttonText", primaryColor)}>
        {content.buttonText}
      </PreviewButton>
    </PreviewEditable>
    {gap(renderElementSlot, "after_buttonText")}
    {gap(renderElementSlot, "before_signoff")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "signOff")}>
      <PreviewText
        className="mt-6 text-[14px] text-gray-700"
        style={blockCss(getStyle, "signOff")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("signOff", val)}
      >
        {content.signOff}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "end")}
  </>
);

const renderReminder = ({
  templateId,
  heading,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  renderElementSlot,
  onUpdateBlock,
  display = {},
  media = {},
}) => (
  <>
    {gap(renderElementSlot, "start")}
    <PreviewBrandBanner
      {...{ templateId, name: content.storeBrand, primaryColor, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, media, display }}
    />
    {gap(renderElementSlot, "after_storeBrand")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "heading")}>
      <PreviewHeading
        className="mb-3"
        style={blockCss(getStyle, "heading")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("heading", val)}
      >
        {heading}
      </PreviewHeading>
    </PreviewEditable>
    {gap(renderElementSlot, "after_heading")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "intro")}>
      <PreviewText
        style={blockCss(getStyle, "intro")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("intro", val)}
      >
        {content.intro}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_intro")}
    <PreviewOrderCard
      {...{ templateId, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, media, display }}
    />
    {gap(renderElementSlot, "after_productImage")}
    <EditableStarsBlock
      {...{ templateId, primaryColor, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock }}
    />
    {gap(renderElementSlot, "after_stars")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "buttonText")}>
      <PreviewButton primaryColor={primaryColor} style={btnCss(getStyle, "buttonText", primaryColor)}>
        {content.buttonText || "Leave your review"}
      </PreviewButton>
    </PreviewEditable>
    {gap(renderElementSlot, "after_buttonText")}
    {gap(renderElementSlot, "before_signoff")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "signOff")}>
      <PreviewText
        className="mt-6 text-[14px] text-gray-700"
        style={blockCss(getStyle, "signOff")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("signOff", val)}
      >
        {content.signOff}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "end")}
  </>
);

const PreviewBrandBanner = ({
  templateId,
  name,
  primaryColor,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  onUpdateBlock,
  media = {},
  display = {},
}) => {
  const st = getStyle?.("storeBrand") || {};
  const gradient = `radial-gradient(circle at 22% 15%, #FCD34D 0%, ${primaryColor} 46%, #E67C0B 100%)`;
  const bg = media.bgImageUrl
    ? `${gradient}, url(${media.bgImageUrl})`
    : st.bgColor || gradient;
  const displayName = display.storeNameOverride || name;
  return (
    <PreviewEditable
      {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "storeBrand")}
      className="-mx-6 sm:-mx-10 -mt-8 sm:-mt-10 mb-8"
    >
      <div
        className="flex h-[104px] items-center justify-center px-6"
        style={{ background: bg, backgroundSize: "cover", backgroundPosition: "center", backgroundBlendMode: media.bgImageUrl ? "multiply" : undefined }}
      >
        {media.brandLogoUrl ? (
          <img
            src={media.brandLogoUrl}
            alt={displayName}
            className="max-h-14 max-w-[70%] object-contain"
          />
        ) : (
          <span
            className="outline-none"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: st.fontSize || "30px",
              fontWeight: st.fontWeight || 600,
              letterSpacing: "0.14em",
              color: st.color || "#ffffff",
              textShadow: "0 1px 6px rgba(0,0,0,0.12)",
            }}
            contentEditable={editable}
            onBlur={editable ? (e) => onUpdateBlock?.("storeBrand", e.target.innerText) : undefined}
            suppressContentEditableWarning
          >
            {displayName}
          </span>
        )}
      </div>
    </PreviewEditable>
  );
};

const mediaRadiusClass = (mediaStyle) =>
  mediaStyle === "circle" ? "rounded-full" : mediaStyle === "square" ? "rounded-none" : "rounded-xl";

const PreviewOrderCard = ({
  templateId,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  onUpdateBlock,
  media = {},
  display = {},
}) => (
  <div className="my-6 flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-left">
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "productImage")}>
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-orange-400 via-orange-500 to-rose-600 ${mediaRadiusClass(media.mediaStyle)}`}
        style={getStyle?.("productImage") || {}}
      >
        <div className="h-6 w-6 rounded-md bg-white/25 border border-white/40" />
      </div>
    </PreviewEditable>
    <div className="min-w-0 flex-1">
      <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "productName")}>
        <div
          data-editor-typography
          className="text-[15px] font-bold text-gray-900 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
          style={blockCss(getStyle, "productName")}
          contentEditable={editable}
          onBlur={editable ? (e) => onUpdateBlock?.("productName", e.target.innerText) : undefined}
          suppressContentEditableWarning
        >
          {content.productName}
        </div>
      </PreviewEditable>
      {display.showProductVariant && (
        <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "productVariant")}>
          <div
            data-editor-typography
            className="mt-0.5 text-[13px] text-gray-500 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
            style={blockCss(getStyle, "productVariant")}
            contentEditable={editable}
            onBlur={editable ? (e) => onUpdateBlock?.("productVariant", e.target.innerText) : undefined}
            suppressContentEditableWarning
          >
            {content.productVariant}
          </div>
        </PreviewEditable>
      )}
    </div>
  </div>
);

const renderStoreReviewFallback = ({
  templateId,
  heading,
  primaryColor,
  content,
  editable,
  selectedBlockId,
  onSelectBlock,
  getStyle,
  renderElementSlot,
  onUpdateBlock,
  display = {},
  media = {},
}) => (
  <>
    {gap(renderElementSlot, "start")}
    <PreviewBrandBanner
      {...{ templateId, name: content.storeBrand, primaryColor, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, media, display }}
    />
    {gap(renderElementSlot, "after_storeBrand")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "heading")}>
      <PreviewHeading
        className="mb-3"
        style={blockCss(getStyle, "heading")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("heading", val)}
      >
        {heading}
      </PreviewHeading>
    </PreviewEditable>
    {gap(renderElementSlot, "after_heading")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "intro")}>
      <PreviewText
        style={blockCss(getStyle, "intro")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("intro", val)}
      >
        {content.intro}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "after_intro")}
    <PreviewOrderCard
      {...{ templateId, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock, media, display }}
    />
    {gap(renderElementSlot, "after_productImage")}
    <EditableStarsBlock
      {...{ templateId, primaryColor, content, editable, selectedBlockId, onSelectBlock, getStyle, onUpdateBlock }}
    />
    {gap(renderElementSlot, "after_stars")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "buttonText")}>
      <PreviewButton primaryColor={primaryColor} style={btnCss(getStyle, "buttonText", primaryColor)}>
        {content.buttonText || "Write a Review"}
      </PreviewButton>
    </PreviewEditable>
    {gap(renderElementSlot, "after_buttonText")}
    {gap(renderElementSlot, "before_signoff")}
    <PreviewEditable {...editProps(templateId, editable, selectedBlockId, onSelectBlock, "signOff")}>
      <PreviewText
        className="mt-6 text-[14px] text-gray-700"
        style={blockCss(getStyle, "signOff")}
        contentEditable={editable}
        onUpdate={(val) => onUpdateBlock?.("signOff", val)}
      >
        {content.signOff}
      </PreviewText>
    </PreviewEditable>
    {gap(renderElementSlot, "end")}
  </>
);

const LAYOUT_RENDERERS = {
  smart_email: renderReviewRequest,
  store_review_fallback: renderStoreReviewFallback,
  reminder: renderReminder,
  review_confirmation: renderReviewConfirmation,
  reply_notification: renderReplyNotification,
  media_reminder: renderMediaReminder,
};

export const renderEmailTemplatePreviewBody = (templateId, props) => {
  const renderer = LAYOUT_RENDERERS[templateId] || LAYOUT_RENDERERS.store_review_fallback;
  return renderer({ ...props, templateId });
};
