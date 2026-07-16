import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle2 } from "lucide-react";

const MODAL_CLOSE_MS = 250;

const WidgetPublishSuccessModal = ({
  isOpen,
  onClose,
  onBackToWidgets,
  onboardingStep = null,
  onContinueSetup,
}) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inOnboarding = onboardingStep === "widget" || onboardingStep === "editor";

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
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Widget published"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pb-8 pt-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>

          <h2 className="text-[20px] font-bold text-gray-900">Widget published successfully!</h2>

          <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
            Your widget styles are now live on your storefront.
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-gray-600">
            {inOnboarding
              ? "Continue setup to configure your email sender and remaining steps."
              : "Visitors will see your updated design and reviews right away."}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {inOnboarding ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof onContinueSetup === "function") {
                    onContinueSetup();
                  }
                }}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-gray-800"
              >
                Continue setup
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/");
                }}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-gray-800"
              >
                Go to dashboard
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (typeof onBackToWidgets === "function") {
                  onBackToWidgets();
                }
              }}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Back to widgets
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WidgetPublishSuccessModal;
