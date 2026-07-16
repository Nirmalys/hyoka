import { X, AlertCircle } from "lucide-react";

const ImportValidationModal = ({ errors, message, onClose }) => {
  const entries = Object.entries(errors || {}).slice(0, 15);
  const hasMore = Object.keys(errors || {}).length > 15;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="mb-4 pr-8">
          <div className="inline-flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <h3 className="text-lg font-black leading-none text-gray-900">Validation failed</h3>
          </div>
          <p className="mt-2 pl-7 text-[13px] font-medium text-gray-500">{message}</p>
        </div>
        <div className="overflow-y-auto flex-1 space-y-3 text-[12px]">
          {entries.map(([rowIndex, rowErrors]) => (
            <div key={rowIndex} className="border border-red-100 bg-red-50/50 rounded-md p-3">
              <p className="font-black text-red-800 mb-1">Row {Number(rowIndex) + 1}</p>
              <ul className="list-disc pl-4 text-red-700 font-medium space-y-0.5">
                {(Array.isArray(rowErrors) ? rowErrors : [rowErrors]).map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          ))}
          {hasMore && (
            <p className="text-gray-400 font-bold text-center">Additional rows have errors…</p>
          )}
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-900 text-white text-[13px] font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportValidationModal;
