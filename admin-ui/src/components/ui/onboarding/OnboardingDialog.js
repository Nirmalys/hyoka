import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ProgressRing, SetupChecklist } from "./SetupChecklist";

const MODAL_CLOSE_MS = 250;

const OnboardingDialog = ({
  isOpen,
  onClose,
  steps,
  doneCount,
  totalSteps,
  percent,
  onStepAction,
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
        className={`relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Finish setting up Hyoka"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <ProgressRing percent={percent} />
            <div>
              <div className="text-[20px] font-bold text-gray-900">Finish setting up Hyoka</div>
              <div className="mt-1 text-[13px] text-gray-500">
                {doneCount} of {totalSteps} steps complete
              </div>
            </div>
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

        <div className="overflow-y-auto px-6 py-5">
          <SetupChecklist
            compact
            steps={steps}
            doneCount={doneCount}
            totalSteps={totalSteps}
            percent={percent}
            onStepAction={onStepAction}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OnboardingDialog;
