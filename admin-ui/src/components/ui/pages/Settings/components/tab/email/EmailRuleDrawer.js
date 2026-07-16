import { useLayoutEffect, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2 } from "lucide-react";
import SettingsToggle from "../../SettingsToggle";

const DRAWER_CLOSE_MS = 500;

const EmailRuleDrawer = ({
  isOpen,
  onClose,
  onEdit,
  highlightEdit = false,
  enabled,
  onToggleChange,
  toggleDisabled = false,
  toggleAriaLabel,
  title,
  description,
  rulesDirty,
  rulesDirtyMessage = "You have unsaved changes — use Save & apply rules above.",
  icon: Icon,
  children,
  wrapContent = true,
  variant = "default",
  footerActions = null,
}) => {
  const isFormVariant = variant === "form";
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      setShow(true);
      setVisible(false);

      let raf2;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });

      return () => {
        cancelAnimationFrame(raf1);
        if (raf2 !== undefined) cancelAnimationFrame(raf2);
      };
    }

    setVisible(false);
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || visible) return undefined;
    if (!show) return undefined;

    const timer = setTimeout(() => setShow(false), DRAWER_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [isOpen, visible, show]);

  useEffect(() => {
    if (!show) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!mounted || !show) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex justify-end overflow-hidden transition-[visibility] duration-500 ${
        visible ? "visible" : "invisible delay-500"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-500 ease-in-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`relative w-full max-w-xl bg-white h-full min-h-0 shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-rule-drawer-title"
      >
        <div
          className={`px-6 ${isFormVariant ? "pt-7 pb-5" : "pt-8 pb-5"} border-b border-gray-100 flex items-start justify-between bg-white sticky top-0 z-10 shrink-0 transition-all duration-500 ease-out ${
            visible ? "opacity-100 translate-y-0 delay-75" : "opacity-0 -translate-y-3 delay-0"
          }`}
        >
          <div className={`flex min-w-0 pr-3 ${isFormVariant ? "items-start" : "items-center gap-4"}`}>
            {!isFormVariant && Icon && (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 border-2 border-white shadow-sm ring-4 ring-orange-50 shrink-0">
                <Icon className="w-5 h-5" strokeWidth={2.25} />
              </div>
            )}
            <div className="min-w-0">
              <h2
                id="email-rule-drawer-title"
                className={`font-bold text-gray-900 leading-snug ${isFormVariant ? "text-[22px]" : "text-lg"}`}
              >
                {title}
              </h2>
              {description && (
                <p
                  className={`mt-1 leading-relaxed ${
                    isFormVariant
                      ? "text-[14px] text-gray-500 font-normal"
                      : "text-sm text-gray-400 font-medium"
                  }`}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {!isFormVariant && onToggleChange != null && (
              <div className="flex items-center gap-2 pr-1 border-r border-gray-100 mr-1">
                <SettingsToggle
                  checked={!!enabled}
                  disabled={toggleDisabled}
                  onChange={onToggleChange}
                  ariaLabel={toggleAriaLabel || "Toggle template"}
                />
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                    enabled ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {enabled ? "On" : "Off"}
                </span>
              </div>
            )}
            {!isFormVariant && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className={`px-4 py-2 rounded-md text-[13px] font-black transition-all ${
                  highlightEdit
                    ? "border border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-100 hover:bg-orange-700"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`transition-all text-gray-400 ${
                isFormVariant
                  ? "p-1.5 hover:bg-gray-100 rounded-md"
                  : "p-2 hover:bg-gray-100 rounded-full hover:rotate-90 duration-300"
              }`}
              aria-label="Close"
            >
              <X className={isFormVariant ? "w-5 h-5" : "w-6 h-6"} />
            </button>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto ${isFormVariant ? "px-6 py-6" : "p-6"} space-y-6 transition-all duration-500 ease-out ${
            visible ? "opacity-100 translate-x-0 delay-100" : "opacity-0 translate-x-6 delay-0"
          }`}
        >
          {!isFormVariant && rulesDirty && (
            <p className="text-[13px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
              {rulesDirtyMessage}
            </p>
          )}
          {wrapContent ? (
            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-6 text-[15px]">
              {children}
            </div>
          ) : (
            children
          )}
        </div>

        {footerActions && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-white">
            <button
              type="button"
              onClick={footerActions.onCancel}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={footerActions.onSave}
              disabled={footerActions.saveDisabled}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-semibold border transition-all ${
                footerActions.saveDisabled
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-orange-500 bg-orange-500 text-gray-900 hover:bg-orange-400"
              }`}
            >
              {footerActions.saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EmailRuleDrawer;
