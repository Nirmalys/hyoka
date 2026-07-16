import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil } from "lucide-react";
import EmailTemplatePreviewReadOnly from "./EmailTemplatePreviewReadOnly";

const MODAL_CLOSE_MS = 250;

const EmailTemplatePreviewModal = ({
  isOpen,
  onClose,
  onEdit,
  title,
  description,
  form,
  templateId,
  previewFontStack,
  previewPrimaryHex,
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

  if (!mounted || !show) return null;

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
        className={`relative z-10 flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="relative flex-1 overflow-y-auto bg-[#F5F6F7] p-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <EmailTemplatePreviewReadOnly
            form={form}
            templateId={templateId}
            previewFontStack={previewFontStack}
            previewPrimaryHex={previewPrimaryHex}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 text-[14px] font-semibold text-gray-900 transition-opacity hover:opacity-90"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmailTemplatePreviewModal;
