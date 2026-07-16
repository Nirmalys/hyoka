import React from "react";
import {
  Settings,
  FileText,
  Type,
  Palette,
  Image as ImageIcon,
  ListChecks,
} from "lucide-react";

export const EMAIL_SETTINGS_CATEGORIES = [
  { id: "general", label: "General", icon: Settings },
  { id: "content", label: "Content", icon: FileText },
  { id: "typography", label: "Typography", icon: Type },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "display", label: "Display", icon: ListChecks },
];

const EmailCategorySidebar = ({ activeCategory, onSelectCategory }) => (
  <div className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
    <div className="px-5 pt-5 pb-4">
      <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">
        Elements
      </h4>
      <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
        Drag onto canvas or click to edit
      </p>
    </div>

    <div className="px-5 pb-5 grid grid-cols-2 gap-2.5 overflow-y-auto flex-1 content-start">
      {EMAIL_SETTINGS_CATEGORIES.map(({ id, label, icon: Icon }) => {
        const active = activeCategory === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectCategory(id)}
            className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-2xl border transition-all select-none outline-none ${
              active
                ? "border-orange-200 bg-orange-50/70"
                : "border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/40"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                active ? "bg-[#F59E0B]" : "bg-orange-50"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-white" : "text-orange-500"}`} />
            </span>
            <span
              className={`text-[12px] font-semibold ${
                active ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default EmailCategorySidebar;
