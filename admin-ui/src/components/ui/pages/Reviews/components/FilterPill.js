import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const FilterPill = ({ label, value, options, onChange, className = "" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[13px] font-medium text-gray-700 hover:border-gray-300 transition-all focus:outline-none whitespace-nowrap"
      >
        <span>{selected?.label || label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                option.value === value
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPill;
