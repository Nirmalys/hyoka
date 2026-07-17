import React, { useMemo } from "react";
import { ShoppingBag, Star } from "lucide-react";
import ElementDropList from "../../editor/ElementDropList";
import CanvasElementRenderer from "../../editor/CanvasElementRenderer";
import { sanitizePreviewHtml } from "../../../../../utils/sanitizePreviewHtml";

const EmailPreviewCard = ({
  previewFontStack,
  previewHeading,
  previewInnerHtml,
  form,
  elements = [],
  removeElement,
  updateElement,
  selectedElementId,
  setSelectedElementId,
  handleDrop,
  handleDragStart,
  draggedType,
  dropInsertIndex,
  setDropInsertIndex,
}) => {
  const safePreviewHtml = useMemo(
    () => sanitizePreviewHtml(previewInnerHtml || ""),
    [previewInnerHtml]
  );

  const renderElement = (el) => (
    <CanvasElementRenderer
      el={el}
      form={form}
      selectedElementId={selectedElementId}
      setSelectedElementId={setSelectedElementId}
      updateElement={updateElement}
      removeElement={removeElement}
    />
  );

  return (
    <div className="bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden ring-4 ring-gray-50/50">
      <div
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElementId("__heading");
        }}
        className={`p-8 text-center space-y-2 cursor-pointer transition-all ${selectedElementId === "__heading" ? "ring-4 ring-white/30 bg-opacity-90" : "hover:bg-opacity-95"}`}
        style={{ backgroundColor: form.primary_color || "#F59E0B" }}
      >
        <span className="text-[9px] font-black opacity-60 text-white uppercase tracking-[0.2em]">
          Sample Store
        </span>
        <h4
          className="text-xl font-black text-white tracking-tight leading-tight"
          style={{ fontFamily: previewFontStack }}
        >
          {previewHeading}
        </h4>
      </div>
      <div
        className="p-6 pb-8 bg-white transition-all min-h-[400px]"
        style={{ fontFamily: previewFontStack }}
        onClick={() => setSelectedElementId(null)}
      >
        <ElementDropList
          elements={elements}
          dropInsertIndex={dropInsertIndex}
          setDropInsertIndex={setDropInsertIndex}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          isDragging={!!draggedType}
          renderElement={renderElement}
          emptyState={
            !elements.length ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId("__greeting");
                }}
                className={`p-2 mb-4 transition-all rounded-lg cursor-pointer ${selectedElementId === "__greeting" ? "ring-2 ring-blue-500 bg-blue-50/10" : "hover:bg-gray-50"}`}
              >
                <div
                  className="text-[13px] text-gray-400 italic font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
                />
                {draggedType && (
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest text-center mt-4">
                    Drop here to add element
                  </p>
                )}
              </div>
            ) : null
          }
        />

        <div className="bg-gray-50/80 rounded-md p-4 border border-gray-100 flex items-center gap-4 mt-6">
          <div className="w-12 h-12 rounded-md bg-white p-1.5 border border-blue-50/50 flex items-center justify-center shadow-sm">
            <ShoppingBag
              className="w-6 h-6"
              style={{ color: form.primary_color || "#F59E0B" }}
            />
          </div>
          <div className="flex-1">
            <h5 className="text-[13px] font-black text-gray-900 leading-tight mb-1">
              Aurora Wireless Headphones
            </h5>
            <div
              className="flex gap-1"
              style={{ color: form.primary_color || "#F59E0B" }}
            >
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50/50 py-3 text-center border-t border-gray-50">
        <span className="text-[9px] font-bold text-gray-400">
          Sent {form.days_after} days after your order was completed.
        </span>
      </div>
    </div>
  );
};

export default EmailPreviewCard;
