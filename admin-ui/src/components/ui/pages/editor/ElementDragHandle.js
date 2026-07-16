import { GripVertical } from "lucide-react";

const ElementDragHandle = ({
  reorderDragProps = {},
  isSelected = false,
  className = "",
}) => {
  if (!reorderDragProps.draggable) {
    return null;
  }

  return (
    <div
      {...reorderDragProps}
      data-editor-drag-handle
      role="button"
      tabIndex={-1}
      aria-label="Drag to reorder"
      title="Drag to move"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none transition-opacity ${
        isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-100"
      } ${className}`}
    >
      <GripVertical className="w-4 h-4" strokeWidth={2.5} />
    </div>
  );
};

export default ElementDragHandle;
