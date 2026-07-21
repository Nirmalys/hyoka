import React from "react";
import { sanitizeFontKey } from "../editorConfig";

const GlobalStyleProperties = ({
  form,
  updateField,
  usesLayoutPreview,
  templateMeta,
  subjectFieldKey,
  headingFieldKey,
  mode,
}) => (
  <div className="space-y-6">
    {usesLayoutPreview && templateMeta?.subjectKey && (
      <div className="space-y-4">
        <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">Email Content</h5>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Subject line</label>
          <input
            type="text"
            value={form[subjectFieldKey] || ""}
            onChange={(e) => updateField(subjectFieldKey, e.target.value)}
            placeholder={templateMeta.defaultSubject || ""}
            className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300"
          />
        </div>
        {templateMeta?.headingKey && (
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email heading</label>
            <input
              type="text"
              value={form[headingFieldKey] || ""}
              onChange={(e) => updateField(headingFieldKey, e.target.value)}
              placeholder={templateMeta.defaultHeading || ""}
              className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300"
            />
          </div>
        )}
      </div>
    )}

    <div className="space-y-4">
      <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">Typography</h5>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Font</label>
        <select
          value={sanitizeFontKey(form.font_family)}
          onChange={(e) => updateField("font_family", sanitizeFontKey(e.target.value))}
          className="w-full px-3 py-2.5 rounded-md border border-gray-100 bg-gray-50 text-[13px] font-bold text-gray-900 focus:bg-white focus:border-gray-300 transition-all outline-none appearance-none cursor-pointer"
        >
          <option value="system">Standard Sans</option>
          <option value="arial">Arial</option>
          <option value="georgia">Georgia (Serif)</option>
          <option value="verdana">Verdana</option>
          <option value="trebuchet">Trebuchet MS</option>
          <option value="times">Times New Roman</option>
        </select>
      </div>
    </div>

    <div className="space-y-4 pt-4 border-t border-gray-50">
      <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">General Styles</h5>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Primary Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden shrink-0"
              style={{ backgroundColor: form.primary_color || "#F59E0B" }}
            >
              <input
                type="color"
                value={form.primary_color || "#F59E0B"}
                onChange={(e) => updateField("primary_color", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-[11px] font-black font-mono text-gray-400 uppercase">
              {(form.primary_color || "#F59E0B").substring(1)}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Accent Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden shrink-0"
              style={{ backgroundColor: form.accent_color || "rgba(245, 158, 11, 0.18)" }}
            >
              <input
                type="color"
                value={form.accent_color || "rgba(245, 158, 11, 0.18)"}
                onChange={(e) => updateField("accent_color", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-[11px] font-black font-mono text-gray-400 uppercase">
              {(form.accent_color || "rgba(245, 158, 11, 0.18)").substring(1)}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-4 pt-4 border-t border-gray-50">
      <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">Background</h5>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">BG Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden shrink-0"
              style={{ backgroundColor: form.background_color || "#FFFFFF" }}
            >
              <input
                type="color"
                value={form.background_color || "#FFFFFF"}
                onChange={(e) => updateField("background_color", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-[11px] font-black font-mono text-gray-400 uppercase">
              {(form.background_color || "#FFFFFF").substring(1)}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Text Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden shrink-0"
              style={{ backgroundColor: form.text_color || "#1D2939" }}
            >
              <input
                type="color"
                value={form.text_color || "#1D2939"}
                onChange={(e) => updateField("text_color", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-[11px] font-black font-mono text-gray-400 uppercase">
              {(form.text_color || "#1D2939").substring(1)}
            </span>
          </div>
        </div>
      </div>
    </div>

    {mode === "form" && (
      <div className="space-y-4 pt-4 border-t border-gray-50">
        <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">
          Media uploads
        </h5>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Show photo and video upload on step 2 of the review dialog.
        </p>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-[12px] font-bold text-gray-700">Allow photos</span>
          <input
            type="checkbox"
            checked={form.allow_photos !== false}
            onChange={(e) => updateField("allow_photos", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
        </label>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-[12px] font-bold text-gray-700">Allow videos</span>
          <input
            type="checkbox"
            checked={form.allow_videos !== false}
            onChange={(e) => updateField("allow_videos", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
        </label>
      </div>
    )}
  </div>
);

export default GlobalStyleProperties;
