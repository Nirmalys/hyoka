import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

const CreateTemplateMenu = ({ onCreateSmart, onCreateCustom }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-200 bg-white text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Create
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[220px] bg-white border border-gray-200 rounded-md shadow-lg py-1 overflow-hidden">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-[14px] font-semibold text-gray-800 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => {
              onCreateSmart();
              setOpen(false);
            }}
          >
            Create smart template
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-[14px] font-semibold text-gray-800 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => {
              onCreateCustom();
              setOpen(false);
            }}
          >
            Create custom template
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateTemplateMenu;
