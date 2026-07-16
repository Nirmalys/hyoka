import React from "react";
import { WIDGET_EDITOR_CATEGORIES } from "../widgetEditorConfig";

export const ELEMENTS_WIDTH = 240;

const WidgetElementsSidebar = ({ activeCategory, onSelectCategory, hideHeader = false }) => (
  <div
    className={`${hideHeader ? "flex-1 flex flex-col min-h-0" : "bg-white border-r border-gray-200 flex flex-col shrink-0"}`}
    style={hideHeader ? undefined : { width: ELEMENTS_WIDTH }}
  >
    {!hideHeader && (
      <div className="px-3 pt-4 pb-2 border-b border-gray-100">
        <div className="text-[13px] font-black text-gray-900 uppercase tracking-wide leading-none">Elements</div>
        <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">Drag onto canvas or click to edit.</div>
      </div>
    )}

    <div className="px-2 pt-2 pb-2 grid grid-cols-2 gap-2 overflow-y-auto flex-1 content-start">
      {WIDGET_EDITOR_CATEGORIES.map(({ id, label, icon: Icon }) => {
        const isActive = activeCategory === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectCategory(id)}
            className={`flex flex-col items-center justify-center gap-2 aspect-square w-full p-2 rounded-2xl border transition-all outline-none focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(245,184,0,0.4)] ${
              isActive
                ? "bg-[#FFF9E5] border-[#F5B800]/50"
                : "bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50/30"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                isActive ? "bg-[#F59E0B]" : "bg-orange-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-white" : "text-[#F59E0B]"}`}
                strokeWidth={2.2}
              />
            </span>
            <span
              className={`text-[11px] font-bold leading-tight text-center line-clamp-2 ${
                isActive ? "text-gray-900" : "text-gray-600"
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

export default WidgetElementsSidebar;
