import {
  ArrowLeft,
  ChevronLeft,
  Save,
  RotateCcw,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Upload,
} from "lucide-react";
import { WIDGET_DISPLAY_NAMES } from "./widgetEditorConfig";

const DEVICE_OPTIONS = [
  { id: "desktop", icon: Monitor, label: "Desktop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
];

const EditorHeader = ({
  title,
  onBack,
  onSave,
  onPublish,
  onPreview,
  saving,
  publishing,
  widgetPublished = false,
  device,
  setDevice,
  mode,
  widgetId,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  showSaveButton = true,
}) => {
  const widgetLabel =
    WIDGET_DISPLAY_NAMES[widgetId] || title || "Untitled Widget";

  if (mode === "widget") {
    return (
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Widgets
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-[14px] font-bold text-gray-900 truncate">{widgetLabel}</span>
          <span
            className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
              widgetPublished
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-[#FFF9E5] text-[#B8860B] border-[#F5B800]/30"
            }`}
          >
            {widgetPublished ? "Live" : "Draft"}
          </span>
        </div>

        <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl">
          {DEVICE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDevice && setDevice(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all outline-none ${
                device === item.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5 mr-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg ${canUndo ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg ${canRedo ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#F5B800] text-gray-900 text-[12px] font-bold hover:bg-[#E5AB00] disabled:opacity-50 shadow-sm"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </header>
    );
  }

  if (mode === "email") {
    return (
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Email Templates
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-[14px] font-bold text-gray-900 truncate">
            {title || "Email Template"}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Active
          </span>
        </div>

        <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl">
          {DEVICE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDevice && setDevice(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all outline-none ${
                device === item.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5 mr-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg ${canUndo ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg ${canRedo ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={onPublish || onSave}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#F59E0B] text-white text-[12px] font-bold hover:bg-[#E08E09] disabled:opacity-50 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="text-gray-400">{mode === "widget" ? "Widgets" : "Settings"}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">
            {title || (mode === "email" ? "Email Template" : mode === "form" ? "Submission Form" : "Untitled Widget")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 border-r border-gray-100 pr-3 mr-3">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-all ${canUndo ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50" : "text-gray-200 cursor-not-allowed"}`}
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-all ${canRedo ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50" : "text-gray-200 cursor-not-allowed"}`}
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-[13px] font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {showSaveButton && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F59E0B] text-white text-[13px] font-bold hover:bg-[#F59E0B] shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>
    </header>
  );
};

export default EditorHeader;
