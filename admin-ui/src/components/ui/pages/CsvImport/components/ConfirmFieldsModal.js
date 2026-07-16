import { X } from "lucide-react";

const ConfirmFieldsModal = ({ warnings, onCancel, onConfirm }) => {
  if (!warnings?.length) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-black text-gray-900 mb-4 pr-8">These fields need your attention</h3>
        <ul className="space-y-2 mb-6 text-[13px] text-gray-600 font-medium list-disc pl-5">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p className="text-[13px] font-bold text-gray-800 mb-6">Are you sure you want to proceed?</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-200 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-gray-900 text-white text-[13px] font-bold hover:bg-gray-800"
          >
            Confirm import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmFieldsModal;
