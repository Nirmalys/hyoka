import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const RuleSelectField = ({ id, value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-[14px] font-medium text-gray-900 focus:border-orange-300 focus:outline-none"
      >
        <span className="truncate">{selected ? selected.label : ""}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-1100 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <li key={String(option.value)}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                    isSelected
                      ? "bg-[#F59E0B] text-white"
                      : "text-gray-900 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RuleSelectField;
