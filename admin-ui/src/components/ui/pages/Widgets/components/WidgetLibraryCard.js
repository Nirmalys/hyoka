import WidgetThumbnail from "./WidgetThumbnail";

const WidgetLibraryCard = ({ widget, isActive, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(widget.id)}
      className={`widget-library-card widget-${widget.id} flex flex-col h-full min-w-0 text-left rounded-xl border border-white transition-[box-shadow,transform] duration-300 ease-in-out focus:outline-none overflow-hidden bg-white ${
        isActive
          ? "is-active shadow-[0_2px_10px_rgba(245,184,0,0.14)]"
          : ""
      }`}
    >
      <div className="widget-preview flex-1 w-full min-h-[118px] overflow-hidden bg-[#F5F5F5] transition-colors duration-300 ease-in-out">
        <WidgetThumbnail widgetId={widget.id} />
      </div>
      <div className="px-3 py-2 shrink-0 border-t border-white bg-white transition-colors duration-300 ease-in-out">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full bg-[#F5B800] shrink-0 transition-all duration-300 ease-in-out ${
              isActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
            aria-hidden="true"
          />
          <span
            className={`text-[14px] font-bold leading-tight truncate ${
              isActive ? "text-black" : "text-gray-800"
            }`}
          >
            {widget.title}
          </span>
        </div>
        <div className="text-[11px] text-gray-400 leading-snug line-clamp-2">{widget.description}</div>
      </div>
    </button>
  );
};

export default WidgetLibraryCard;
