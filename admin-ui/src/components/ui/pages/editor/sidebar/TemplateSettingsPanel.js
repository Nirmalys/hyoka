import React from "react";
import {
  Settings,
  FileText,
  Type,
  Palette,
  Image as ImageIcon,
  ListChecks,
} from "lucide-react";
import RuleSelectField from "../../Settings/components/tab/email/RuleSelectField";
import {
  getTemplateLayoutSections,
  mergeTemplateLayoutContent,
} from "../../Settings/components/tab/email/preview/emailTemplateLayoutDefaults";
import {
  HEADER_SIZE_OPTIONS,
  TEXT_SIZE_OPTIONS,
  getGlobalSetting,
} from "../../Settings/components/tab/email/preview/emailGlobalSettings";

const CATEGORY_META = {
  general: { label: "Inbox content", icon: Settings },
  content: { label: "Email contents", icon: FileText },
  typography: { label: "Typography", icon: Type },
  colors: { label: "Colors", icon: Palette },
  media: { label: "Media", icon: ImageIcon },
  display: { label: "Display", icon: ListChecks },
};

const FieldLabel = ({ children }) => (
  <label className="block text-[13px] font-semibold text-gray-900 mb-1.5">{children}</label>
);

const FieldHint = ({ children }) => (
  <p className="mt-1.5 text-[12px] text-gray-400">{children}</p>
);

const TextField = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3 text-[14px] font-medium text-gray-900 outline-none transition-colors focus:border-orange-300 focus:bg-white"
  />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3 text-[14px] font-medium leading-relaxed text-gray-900 outline-none transition-colors focus:border-orange-300 focus:bg-white"
  />
);

const ToggleRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
    <span className="text-[14px] font-semibold text-gray-800">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#F59E0B]" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  </div>
);

const ColorRow = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
    <span className="text-[14px] font-semibold text-gray-800">{label}</span>
    <div className="flex items-center gap-2">
      <div
        className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-gray-200 shadow-sm"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <span className="text-[12px] font-semibold uppercase text-gray-500">{value}</span>
    </div>
  </div>
);

const Segmented = ({ options, value, onChange }) => (
  <div className="flex items-center gap-0 rounded-xl border border-gray-200 bg-gray-50/60 p-1">
    {options.map((opt) => {
      const active = String(opt.value) === String(value);
      return (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all ${
            active ? "bg-[#F59E0B] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const ImageUploadRow = ({ value, onChange, aspect = "aspect-[3/1]", placeholder }) => (
  <div>
    <div
      className={`flex ${aspect} w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-100 text-center`}
      style={
        value
          ? { backgroundImage: `url(${value})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {!value && <span className="text-[12px] font-medium text-gray-400">{placeholder}</span>}
    </div>
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste image URL"
      className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-orange-300 focus:bg-white"
    />
  </div>
);

const TemplateSettingsPanel = ({
  category,
  form,
  updateField,
  emailTemplateId,
  templateMeta,
  subjectFieldKey,
  headingFieldKey,
  updateEmailLayoutBlock,
}) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.general;
  const HeaderIcon = meta.icon;

  const layout = mergeTemplateLayoutContent(form, emailTemplateId);
  const sections = getTemplateLayoutSections(emailTemplateId);
  const has = (key) => sections.includes(key);

  const setBlock = (key, value) => updateEmailLayoutBlock?.(emailTemplateId, key, value);

  const wordCount = String(layout.intro || "").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-80 bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-2 border-b border-gray-50">
        <div>
          <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">
            Template Settings
          </h4>
          <p className="mt-1 text-[11px] text-gray-400">All customizations · live preview</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 pt-5">
        <HeaderIcon className="h-4 w-4 text-gray-500" />
        <span className="text-[13px] font-bold uppercase tracking-wide text-gray-900">
          {meta.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5 space-y-5">
        {category === "general" && (
          <>
            <div>
              <FieldLabel>Email subject</FieldLabel>
              <TextArea
                value={form[subjectFieldKey] || ""}
                onChange={(v) => updateField(subjectFieldKey, v)}
                placeholder={templateMeta?.defaultSubject || ""}
                rows={2}
              />
              <FieldHint>Shown in the inbox</FieldHint>
            </div>
            <div>
              <FieldLabel>Preheader</FieldLabel>
              <TextArea
                value={form.email_preheader || ""}
                onChange={(v) => updateField("email_preheader", v)}
                placeholder="Short summary shown after the subject"
                rows={2}
              />
              <FieldHint>Preview text after the subject</FieldHint>
            </div>
          </>
        )}

        {category === "content" && (
          <>
            {headingFieldKey && (
              <div>
                <FieldLabel>Email title</FieldLabel>
                <TextArea
                  value={form[headingFieldKey] || ""}
                  onChange={(v) => updateField(headingFieldKey, v)}
                  placeholder={templateMeta?.defaultHeading || ""}
                  rows={2}
                />
              </div>
            )}
            {has("intro") && (
              <div>
                <FieldLabel>Email content</FieldLabel>
                <TextArea
                  value={layout.intro || ""}
                  onChange={(v) => setBlock("intro", v)}
                  rows={4}
                />
                <FieldHint>{wordCount} words · Max 100</FieldHint>
              </div>
            )}
            {has("starsHint") && (
              <div>
                <FieldLabel>Star help text</FieldLabel>
                <TextField value={layout.starsHint || ""} onChange={(v) => setBlock("starsHint", v)} />
              </div>
            )}
            {has("signOff") && (
              <div>
                <FieldLabel>Thank you message</FieldLabel>
                <TextField value={layout.signOff || ""} onChange={(v) => setBlock("signOff", v)} />
              </div>
            )}
          </>
        )}

        {category === "typography" && (
          <>
            <div>
              <FieldLabel>Header size</FieldLabel>
              <RuleSelectField
                id="email-header-size"
                value={getGlobalSetting(form, "email_header_size")}
                onChange={(v) => updateField("email_header_size", v)}
                options={HEADER_SIZE_OPTIONS}
              />
            </div>
            <div>
              <FieldLabel>Other text size</FieldLabel>
              <RuleSelectField
                id="email-text-size"
                value={getGlobalSetting(form, "email_text_size")}
                onChange={(v) => updateField("email_text_size", v)}
                options={TEXT_SIZE_OPTIONS}
              />
            </div>
          </>
        )}

        {category === "colors" && (
          <div className="space-y-3">
            <ColorRow label="Primary color" value={getGlobalSetting(form, "primary_color")} onChange={(v) => updateField("primary_color", v)} />
            <ColorRow label="Secondary color" value={getGlobalSetting(form, "secondary_color")} onChange={(v) => updateField("secondary_color", v)} />
            <ColorRow label="Star color" value={getGlobalSetting(form, "star_color")} onChange={(v) => updateField("star_color", v)} />
            <ColorRow label="Button color" value={getGlobalSetting(form, "button_color")} onChange={(v) => updateField("button_color", v)} />
            <ColorRow label="Button text color" value={getGlobalSetting(form, "button_text_color")} onChange={(v) => updateField("button_text_color", v)} />
            <ColorRow label="Text color" value={getGlobalSetting(form, "text_color")} onChange={(v) => updateField("text_color", v)} />
          </div>
        )}

        {category === "media" && (
          <>
            <ToggleRow
              label="Images only"
              checked={form.media_images_only === true}
              onChange={(v) => updateField("media_images_only", v)}
            />
            <div>
              <FieldLabel>Media style</FieldLabel>
              <Segmented
                options={[
                  { value: "square", label: "Square" },
                  { value: "rounded", label: "Rounded" },
                  { value: "circle", label: "Circle" },
                ]}
                value={getGlobalSetting(form, "media_style")}
                onChange={(v) => updateField("media_style", v)}
              />
            </div>
            <div>
              <FieldLabel>Media placeholder count</FieldLabel>
              <Segmented
                options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
                value={getGlobalSetting(form, "media_count")}
                onChange={(v) => updateField("media_count", v)}
              />
            </div>
            <div>
              <FieldLabel>Brand Logo</FieldLabel>
              <ImageUploadRow
                value={form.brand_logo_url || ""}
                onChange={(v) => updateField("brand_logo_url", v)}
                placeholder="Upload brand logo"
              />
            </div>
            <div>
              <FieldLabel>Background Image</FieldLabel>
              <ImageUploadRow
                value={form.bg_image_url || ""}
                onChange={(v) => updateField("bg_image_url", v)}
                placeholder="Upload background image"
              />
            </div>
          </>
        )}

        {category === "display" && (
          <>
            <ToggleRow label="Show reviewer location" checked={form.show_reviewer_location !== false} onChange={(v) => updateField("show_reviewer_location", v)} />
            <ToggleRow label="Show reviewer avatar" checked={form.show_reviewer_avatar !== false} onChange={(v) => updateField("show_reviewer_avatar", v)} />
            <ToggleRow label="Show media gallery" checked={form.show_media_gallery !== false} onChange={(v) => updateField("show_media_gallery", v)} />
            <ToggleRow label="Show product variant" checked={form.show_product_variant === true} onChange={(v) => updateField("show_product_variant", v)} />
            <div>
              <FieldLabel>Show store name as</FieldLabel>
              <TextField
                value={form.display_store_name || ""}
                onChange={(v) => updateField("display_store_name", v)}
                placeholder="Store name"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateSettingsPanel;
