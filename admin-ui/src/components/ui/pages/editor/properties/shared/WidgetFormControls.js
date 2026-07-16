import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import EditorToggle from "../../EditorToggle";

export const FieldLabel = ({ children }) => (
  <div className="text-[12px] font-bold text-gray-900 mb-1.5">{children}</div>
);

export const FieldGroup = ({ children, className = "" }) => (
  <div className={`space-y-3 ${className}`}>{children}</div>
);

export const TextField = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    type={type}
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="widget-editor-field w-full"
  />
);

export const TextAreaField = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="widget-editor-field w-full resize-none !rounded-2xl !py-3"
  />
);

export const SelectField = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 10000,
    });
  };

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();

    const onDocClick = (e) => {
      const target = e.target;
      if (
        wrapRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onScrollOrResize = () => updateMenuPosition();

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  const selected = options.find((opt) => String(opt.value) === String(value));

  const menu =
    open &&
    createPortal(
      <ul
        ref={menuRef}
        role="listbox"
        style={menuStyle}
        className="max-h-56 overflow-auto rounded-2xl border border-gray-100 bg-white py-1 shadow-lg"
      >
        {options.map((opt) => {
          const isSelected = String(opt.value) === String(value);
          return (
            <li key={String(opt.value)}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  isSelected
                    ? "bg-[#F59E0B] text-white"
                    : "text-gray-800 hover:bg-[#FFF9E5] hover:text-[#B8860B]"
                }`}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body
    );

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="widget-editor-field w-full flex items-center justify-between gap-2 text-left !rounded-2xl"
      >
        <span className="truncate">{selected?.label || "Select…"}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {menu}
    </div>
  );
};

export const ToggleRow = ({ label, enabled, onChange }) => (
  <div className="widget-editor-row flex items-center justify-between gap-3">
    <span className="text-[13px] font-semibold text-gray-800">{label}</span>
    <EditorToggle enabled={enabled} onChange={onChange} />
  </div>
);

export const ColorRow = ({ label, value, fallback = "#F59E0B", onChange }) => {
  const color = value || fallback;
  return (
    <div className="widget-editor-row flex items-center justify-between gap-3">
      <span className="text-[13px] font-semibold text-gray-800">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="relative h-7 w-7 overflow-hidden rounded-full border border-gray-200 shadow-sm shrink-0"
          style={{ backgroundColor: color }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="widget-editor-field !w-[88px] !px-2 !py-1 font-mono text-[11px] uppercase"
        />
      </div>
    </div>
  );
};

export const Segmented = ({ options, value, onChange }) => (
  <div className="widget-editor-segmented flex items-center gap-0 p-1">
    {options.map((opt) => {
      const active = String(opt.value) === String(value);
      return (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-xl py-2 text-[12px] font-bold transition-all outline-none focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(245,184,0,0.35)] ${
            active ? "bg-[#F59E0B] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export const SectionLabel = ({ children }) => (
  <div className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{children}</div>
);
