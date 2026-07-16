import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import WidgetStylePreview from "./WidgetStylePreview";
import { WIDGET_DISPLAY_NAMES } from "../../editor/widgetEditorConfig";

const MODAL_CLOSE_MS = 250;

const WidgetPreviewModal = ({
  isOpen,
  onClose,
  widgetId,
  form,
  previewFontStack,
}) => {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timer = setTimeout(() => setShow(false), MODAL_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [show, onClose]);

  if (!mounted || !show || !widgetId) return null;

  const title = WIDGET_DISPLAY_NAMES[widgetId] || "Widget preview";

  return createPortal(
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <div className="text-[16px] font-bold text-gray-900">{title}</div>
            <div className="text-[12px] text-gray-500">Preview how this widget looks on your store</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F5F6F7] p-6">
          <div className="mx-auto w-full max-w-3xl">
            <WidgetStylePreview
              widgetId={widgetId}
              form={form}
              previewFontStack={previewFontStack}
              elements={form?.widget_elements || []}
              previewDevice="desktop"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WidgetPreviewModal;
