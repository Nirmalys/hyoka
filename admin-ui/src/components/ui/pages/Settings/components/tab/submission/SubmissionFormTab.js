import { Palette, SlidersHorizontal, Camera, Video, Star } from "lucide-react";
import SettingsToggle from "../../SettingsToggle";

const SectionLabel = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} />}
    <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
      {children}
    </span>
  </div>
);

const ToggleRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl bg-[#F6F6F4] px-4 py-2.5">
    <span className="text-[13px] font-bold text-gray-900">{label}</span>
    <SettingsToggle checked={checked} onChange={onChange} ariaLabel={label} />
  </div>
);

const PreviewInput = ({ placeholder }) => (
  <div className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-[15px] text-gray-400">
    {placeholder}
  </div>
);

const SubmissionFormTab = ({ form, updateField, previewPrimaryHex }) => {
  const primaryHex = previewPrimaryHex || form.primary_color || "#F59E0B";
  const formTitle = form.form_title || "Write a Review";
  const submitLabel = form.submit_button_text || "Submit Review";

  const showName = form.form_show_name !== false;
  const showEmail = !!form.form_show_email;
  const showLocation = !!form.form_show_location;
  const showTitle = !!form.form_show_title;
  const showReview = form.form_show_review !== false;
  const showRating = form.form_show_rating !== false;
  const photos = form.allow_photos !== false;
  const videos = form.allow_videos !== false;

  return (
    <div className="w-full pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 pb-5 pt-4">
          <div className="pb-4 border-b border-gray-100">
            <div className="min-w-0">
              <div className="text-[13px] font-black uppercase tracking-wide text-gray-900">
                Form Settings
              </div>
              <div className="text-[11px] text-gray-400">
                All customizations · live preview
              </div>
            </div>
          </div>

          <div className="pt-5">
            <SectionLabel icon={Palette}>Colors</SectionLabel>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-[#F6F6F4] px-4 py-2.5">
              <span className="text-[13px] font-bold text-gray-900">Primary color</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[12px] font-semibold text-gray-500">
                  {String(primaryHex).toUpperCase()}
                </span>
                <span
                  className="relative w-6 h-6 rounded-full border border-black/10 shadow-sm overflow-hidden"
                  style={{ backgroundColor: primaryHex }}
                >
                  <input
                    type="color"
                    value={primaryHex}
                    onChange={(e) => updateField("primary_color", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Primary color"
                  />
                </span>
              </label>
            </div>
          </div>

          <div className="pt-6">
            <SectionLabel icon={SlidersHorizontal}>Fields</SectionLabel>
            <div className="space-y-2.5">
              <ToggleRow
                label="Name"
                checked={showName}
                onChange={(v) => updateField("form_show_name", v)}
              />
              <ToggleRow
                label="Email"
                checked={showEmail}
                onChange={(v) => updateField("form_show_email", v)}
              />
              <ToggleRow
                label="Location"
                checked={showLocation}
                onChange={(v) => updateField("form_show_location", v)}
              />
              <ToggleRow
                label="Title"
                checked={showTitle}
                onChange={(v) => updateField("form_show_title", v)}
              />
              <ToggleRow
                label="Review"
                checked={showReview}
                onChange={(v) => updateField("form_show_review", v)}
              />
              <ToggleRow
                label="Rating"
                checked={showRating}
                onChange={(v) => updateField("form_show_rating", v)}
              />
              <ToggleRow
                label="Photos"
                checked={photos}
                onChange={(v) => updateField("allow_photos", v)}
              />
              <ToggleRow
                label="Videos"
                checked={videos}
                onChange={(v) => updateField("allow_videos", v)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-[#F5F6F7] shadow-sm p-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-5">
            Live Preview
          </p>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="text-[20px] font-bold text-gray-900">{formTitle}</h3>
              {showRating && (
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className="w-6 h-6"
                      style={{ color: primaryHex, fill: primaryHex }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {showName && <PreviewInput placeholder="Your name" />}
              {showEmail && <PreviewInput placeholder="Your email" />}
              {showLocation && <PreviewInput placeholder="Your location" />}
              {showTitle && <PreviewInput placeholder="Title of your review" />}
              {showReview && (
                <div className="w-full min-h-[104px] rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-[15px] text-gray-400">
                  Tell us what you think...
                </div>
              )}

              {(photos || videos) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {photos && (
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-5 text-gray-500">
                      <Camera className="w-5 h-5" />
                      <span className="text-[14px] font-medium">Upload Image</span>
                    </div>
                  )}
                  {videos && (
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-5 text-gray-500">
                      <Video className="w-5 h-5" />
                      <span className="text-[14px] font-medium">Upload Video</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="w-full rounded-lg py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90 mt-1"
                style={{ backgroundColor: primaryHex }}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionFormTab;
