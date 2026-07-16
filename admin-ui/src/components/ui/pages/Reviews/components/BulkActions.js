import { Check, X, Flag, Trash2 } from "lucide-react";

const BulkActions = ({ selectedCount, onApprove, onReject, onSpam, onDelete, onClear }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-orange-900">
          {selectedCount} selected
        </span>
        <button 
          onClick={onClear}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 underline underline-offset-2 focus:outline-none"
        >
          Clear selection
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-all shadow-sm shadow-orange-100 focus:outline-none focus:ring-0"
        >
          <Check className="w-3.5 h-3.5" />
          Approve
        </button>
        <button 
          onClick={onReject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-0"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </button>
        <button 
          onClick={onSpam}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-0"
        >
          <Flag className="w-3.5 h-3.5" />
          Spam
        </button>
        <button 
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all shadow-sm focus:outline-none focus:ring-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default BulkActions;
