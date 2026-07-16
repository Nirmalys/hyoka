import { ChevronRight, ChevronDown } from "lucide-react";
import SettingsToggle from "./SettingsToggle";

const SettingsCollapsibleCard = ({
  title,
  icon: Icon,
  summary,
  previewBox,
  enabled,
  onToggle,
  expanded,
  onExpandedChange,
  children,
  toggleAriaLabel,
  hideEnableToggle = false,
}) => {
  const statusLabel = enabled ? "On" : "Off";

  return (
    <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
        >
          {Icon && (
            <div
              className="w-9 h-9 rounded-full bg-[#F59E0B] flex items-center justify-center text-white shadow-md shadow-orange-100 shrink-0"
              aria-hidden
            >
              <Icon className="w-4 h-4" strokeWidth={2.25} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-black text-gray-900">{title}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  enabled
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {statusLabel}
              </span>
            </div>
            {summary && (
              <p className="text-[12px] text-gray-500 font-medium mt-1.5 leading-relaxed pr-2">
                {summary}
              </p>
            )}
            {previewBox && <div className="mt-2.5 pr-2">{previewBox}</div>}
          </div>
          <span className="mt-0.5 text-gray-400 shrink-0">
            {expanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </span>
        </button>

        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t border-gray-100">
            {!hideEnableToggle && (
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                  Enable
                </span>
                <SettingsToggle
                  checked={!!enabled}
                  onChange={onToggle}
                  ariaLabel={toggleAriaLabel || title}
                />
              </div>
            )}
            {children}
          </div>
        )}
    </div>
  );
};

export default SettingsCollapsibleCard;
