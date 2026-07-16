import { X, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const ReviewConfirmModal = ({
  open,
  step,
  count = 0,
  message = "",
  loading = false,
  onCancel,
  onConfirm,
  onDismiss,
}) => {
  if (!open) return null;

  const isConfirm = step === "confirm";
  const isSuccess = step === "success";
  const isError = step === "error";

  const title = isConfirm
    ? count === 1
      ? "Delete this review?"
      : `Delete ${count} reviews?`
    : isSuccess
      ? "Deleted"
      : "Could not delete";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={loading ? undefined : isConfirm ? onCancel : onDismiss}
        aria-hidden
      />
      <div
        className="relative bg-white w-full max-w-[380px] rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-delete-modal-title"
      >
        <button
          type="button"
          onClick={isConfirm ? onCancel : onDismiss}
          disabled={loading}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-5 text-center">
          <div
            className={`mx-auto mb-4 w-11 h-11 rounded-full flex items-center justify-center ${
              isConfirm
                ? "bg-red-50 text-red-600"
                : isSuccess
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isConfirm ? (
              <Trash2 className="w-5 h-5" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <h3
            id="review-delete-modal-title"
            className="text-[15px] font-black text-gray-900 mb-2"
          >
            {title}
          </h3>

          <p className="text-[13px] font-medium text-gray-500 leading-relaxed">
            {isConfirm
              ? "This cannot be undone. The review will be removed permanently."
              : message}
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          {isConfirm ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-[13px] font-bold hover:bg-gray-800 transition-colors"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewConfirmModal;
