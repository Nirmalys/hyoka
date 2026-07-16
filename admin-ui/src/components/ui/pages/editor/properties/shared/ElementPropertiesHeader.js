import React from "react";
import { ChevronUp, ChevronDown, Copy, Trash2 } from "lucide-react";
import { ELEMENT_TYPE_LABELS } from "../../editorConstants";

const ElementPropertiesHeader = ({
  selectedElement,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}) => {
  const showActions =
    selectedElement.type !== "layoutBlock" &&
    !String(selectedElement.id).startsWith("__") &&
    !String(selectedElement.id).startsWith("layout:") &&
    !["review-card", "widget-header", "widget-subtitle", "site-rating", "widget-stars", "widget-attributes"].includes(
      selectedElement.type
    );

  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
      <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-200 text-orange-500 font-black text-xs uppercase">
        {selectedElement.type.charAt(0)}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">
          Editing
        </p>
        <p className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
          {selectedElement.label ||
            ELEMENT_TYPE_LABELS[selectedElement.type] ||
            selectedElement.type}
        </p>
      </div>
      {showActions && (
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400"
            title="Move up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400"
            title="Move down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ElementPropertiesHeader;
