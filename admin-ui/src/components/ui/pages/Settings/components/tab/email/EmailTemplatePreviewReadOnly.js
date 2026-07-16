import { useMemo } from "react";
import { getTemplateEditorMeta } from "./emailTemplatesConfig";
import EmailPreviewShell from "./preview/EmailPreviewShell";
import {
  buildTokensFromForm,
  getPreviewHeading,
  renderEmailTemplatePreviewBody,
} from "./preview/emailTemplatePreviewLayouts";
import { resolveTemplateContent } from "./preview/emailTemplateLayoutContent";
import { getBlockStyle } from "./preview/emailTemplateBlockStyles";
import { getEmailDisplayContext, getEmailMediaContext } from "./preview/emailGlobalSettings";

const EmailTemplatePreviewReadOnly = ({
  form,
  templateId,
  previewFontStack,
  previewPrimaryHex,
}) => {
  const meta = getTemplateEditorMeta(templateId);

  const siteName = form?.email_from_name?.trim() || "Your store";
  const primaryColor = previewPrimaryHex || form.primary_color || "#F59E0B";

  const tokens = useMemo(() => buildTokensFromForm(siteName), [siteName]);

  const content = useMemo(
    () => resolveTemplateContent(form, templateId, tokens),
    [form, templateId, tokens]
  );

  const previewHeading = useMemo(
    () => getPreviewHeading(form, meta, tokens, content),
    [form, meta, tokens, content]
  );

  const getStyle = useMemo(
    () => (blockKey) => getBlockStyle(form, templateId, blockKey, primaryColor),
    [form, templateId, primaryColor]
  );

  const display = useMemo(() => getEmailDisplayContext(form), [form]);
  const media = useMemo(() => getEmailMediaContext(form), [form]);

  const body = useMemo(
    () =>
      renderEmailTemplatePreviewBody(templateId, {
        heading: previewHeading,
        siteName,
        primaryColor,
        productName: tokens["{product_name}"],
        content,
        editable: false,
        getStyle,
        display,
        media,
      }),
    [templateId, previewHeading, siteName, primaryColor, tokens, content, getStyle, display, media]
  );

  return (
    <EmailPreviewShell subject={null} fontFamily={previewFontStack}>
      {body}
    </EmailPreviewShell>
  );
};

export default EmailTemplatePreviewReadOnly;
