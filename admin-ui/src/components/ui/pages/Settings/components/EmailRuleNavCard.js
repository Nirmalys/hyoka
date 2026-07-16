import { Pencil } from "lucide-react";

const EmailRuleNavCard = ({
  icon: Icon,
  title,
  subtitle,
  enabled,
  statusText = "—",
  toggleable = true,
  highlighted = false,
  onToggle,
  onEdit,
}) => {
  const handleToggle = (e) => {
    e.stopPropagation();
    if (toggleable && onToggle) {
      onToggle(!enabled);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all ${
        highlighted ? "border-orange-400 ring-2 ring-orange-200" : "border-gray-200"
      }`}
    >
      <div className="px-4 pt-4 pb-3.5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-gray-600" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="text-[15px] font-bold text-gray-900 leading-snug">{title}</div>
          {subtitle && (
            <p className="text-[14px] text-gray-500 mt-1 leading-snug">{subtitle}</p>
          )}
        </div>

        {toggleable ? (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none mt-0.5 ${
              enabled ? "bg-[#F5B800]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        ) : (
          <span className="shrink-0 mt-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase">
            Always on
          </span>
        )}
      </div>

      <div className="border-t border-gray-100" />

      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${
            enabled
              ? "bg-[#FFF4E5] text-[#C2410C]"
              : "bg-[#EEF2F6] text-gray-500"
          }`}
        >
          {enabled ? `Active · ${statusText}` : "Disabled · —"}
        </span>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
        >
          <Pencil className="w-3.5 h-3.5 text-gray-500" strokeWidth={2} />
          Edit
        </button>
      </div>
    </div>
  );
};

export default EmailRuleNavCard;
