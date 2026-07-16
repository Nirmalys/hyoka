import { useState, useCallback, useEffect } from "react";
import ElementDropList from "../../../../editor/ElementDropList";
import { filterElementsForAnchor } from "./preview/emailTemplateElementSlots";

const InlineElementSlot = ({
  templateId,
  slotId,
  elements = [],
  draggedType,
  draggedElementId,
  activeAnchor,
  onDropAtSlot,
  onDragStart,
  onSlotHover,
  onRegisterAnchor,
  onDropPlacement,
  renderElement,
}) => {
  const [dropInsertIndex, setDropInsertIndex] = useState(null);
  const [isOver, setIsOver] = useState(false);

  const slotElements = filterElementsForAnchor(elements, templateId, slotId);
  const isDragging = Boolean(draggedType);
  const hasElements = slotElements.length > 0;
  const isActive = activeAnchor === slotId || isOver;

  const setAnchorRef = useCallback(
    (node) => {
      onRegisterAnchor?.(slotId, node);
    },
    [onRegisterAnchor, slotId]
  );

  useEffect(() => {
    return () => onRegisterAnchor?.(slotId, null);
  }, [onRegisterAnchor, slotId]);

  const notifyHover = useCallback(() => {
    onSlotHover?.(slotId);
  }, [onSlotHover, slotId]);

  const reportPlacement = useCallback(
    (index) => {
      onDropPlacement?.(slotId, index);
    },
    [onDropPlacement, slotId]
  );

  const dropHandlers = {
    onDragEnter: (e) => {
      e.preventDefault();
      setIsOver(true);
      notifyHover();
      if (!hasElements) {
        reportPlacement(0);
      }
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      setIsOver(true);
      notifyHover();
    },
    onDragLeave: (e) => {
      const related = e.relatedTarget;
      if (related && e.currentTarget.contains(related)) return;
      setIsOver(false);
      setDropInsertIndex(null);
    },
    onDrop: (e) => {
      e.stopPropagation();
      setIsOver(false);
      setDropInsertIndex(null);
      if (!hasElements) {
        onDropAtSlot(e, slotId, 0);
      }
    },
  };

  const dropList = (
    <ElementDropList
      elements={slotElements}
      dropInsertIndex={dropInsertIndex}
      setDropInsertIndex={setDropInsertIndex}
      onDrop={(e, index) => onDropAtSlot(e, slotId, index)}
      onDragStart={onDragStart}
      onInsertIndexChange={reportPlacement}
      isDragging={isDragging}
      isActive={isActive}
      insertLineOnHoverOnly
      draggingElementId={draggedElementId}
      renderElement={renderElement}
      emptyState={null}
      compact={!hasElements}
    />
  );

  if (!hasElements) {
    return (
      <div
        ref={setAnchorRef}
        className="relative w-full h-0 overflow-visible"
        data-email-anchor={slotId}
        aria-hidden
      >
        {isDragging && (
          <div
            className={`absolute left-0 right-0 top-0 z-30 -translate-y-1/2 w-full min-h-[12px] h-12 pointer-events-auto transition-all border-2 border-dashed ${
              isOver ? "bg-orange-50/50 border-orange-500" : "border-orange-200/50"
            }`}
            {...dropHandlers}
          >
            {dropList}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setAnchorRef}
      className="text-left relative w-full"
      data-email-anchor={slotId}
      {...dropHandlers}
    >
      {dropList}
    </div>
  );
};

export default InlineElementSlot;
