import React from "react";
import { Star } from "lucide-react";
import ElementDropList from "./ElementDropList";
import CanvasElementRenderer from "./CanvasElementRenderer";

const SubmissionFormPreview = ({
  form,
  elements = [],
  removeElement,
  updateElement,
  selectedElementId,
  setSelectedElementId,
  handleDrop,
  handleDragStart,
  draggedType,
  draggedElementId,
  dropInsertIndex,
  setDropInsertIndex,
}) => {
  const renderElement = (el, _index, dragProps) => (
    <CanvasElementRenderer
      el={el}
      form={form}
      selectedElementId={selectedElementId}
      setSelectedElementId={setSelectedElementId}
      updateElement={updateElement}
      removeElement={removeElement}
      editorVariant="form"
      onReorderDragStart={dragProps?.onReorderDragStart}
    />
  );

  return (
    <div className="bg-white rounded-t-3xl shadow-xl overflow-hidden ring-1 ring-gray-100 min-h-[500px]">
      <div className="p-8 pb-2 space-y-2" onClick={() => setSelectedElementId(null)}>
        <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-6" />
      </div>

      <div className="px-8 pb-8 text-center">
        <ElementDropList
          elements={elements}
          dropInsertIndex={dropInsertIndex}
          setDropInsertIndex={setDropInsertIndex}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          isDragging={!!draggedType}
          draggingElementId={draggedElementId}
          renderElement={renderElement}
          emptyState={
            !elements.length ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Star className="w-5 h-5 text-gray-200" />
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {draggedType ? "Drop here to add element" : "Drag form elements here"}
                </p>
              </div>
            ) : null
          }
        />
      </div>

      <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">
          Powered by Hyoka
        </p>
      </div>
    </div>
  );
};

export default SubmissionFormPreview;

