import { Eye } from "lucide-react";
import SettingsToggle from "../../SettingsToggle";
import { isTemplateEnabled } from "./emailTemplatesConfig";

const EmailTemplateCard = ({
  item,
  form,
  banner,
  onOpenEditor,
  onPreview,
  onToggle,
  toggleDisabled = false,
  selected,
}) => {
  const enabled = isTemplateEnabled(form, item);

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all ${
        selected
          ? "border-orange-300 shadow-md"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpenEditor(item)}
          className="block w-full bg-[#F5F6F7] p-6 focus:outline-none"
          aria-label={`Edit ${item.title}`}
        >
          <div className="flex h-40 items-center justify-center">
            {banner && (
              <img
                src={banner}
                alt={item.title}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(item);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:text-orange-600"
          aria-label={`Preview ${item.title}`}
          title="View live preview"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-4">
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-gray-900 truncate">
            {item.title}
          </div>
          {(item.subtitle || item.description) && (
            <div className="text-[12px] text-gray-500 mt-0.5 truncate">
              {item.subtitle || item.description}
            </div>
          )}
        </div>
        <SettingsToggle
          checked={enabled}
          disabled={toggleDisabled}
          onChange={(next) => onToggle(item, next)}
          ariaLabel={`${item.title} ${enabled ? "on" : "off"}`}
        />
      </div>
    </div>
  );
};

export default EmailTemplateCard;
