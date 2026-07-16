import React, { useRef, useCallback } from "react";

const BLOCK_DRAG_SELECTOR =
  'input, textarea, select, button, a, [data-editor-no-drag], [contenteditable="true"]';

const DRAG_HANDLE_SELECTOR = '[data-editor-drag-handle]';

const shouldStartElementDrag = (target) => {
  if (!target || typeof target.closest !== "function") {
    return true;
  }
  if (target.closest(DRAG_HANDLE_SELECTOR)) {
    return true;
  }
  return !target.closest(BLOCK_DRAG_SELECTOR);
};

const InsertIndicator = ({ tight = false }) => (
  <div
    className={`rounded-full bg-orange-500 shadow-sm shadow-orange-300/60 pointer-events-none ${
      tight ? "h-1 my-0" : "h-1.5 my-2"
    }`}
    aria-hidden
  />
);

const ElementDropList = ({
  elements = [],
  dropInsertIndex,
  setDropInsertIndex,
  onDrop,
  onDragStart,
  onInsertIndexChange,
  renderElement,
  emptyState = null,
  isDragging = false,
  isActive = false,
  slotLabel = "",
  compact = false,
  insertLineOnHoverOnly = false,
  draggingElementId = null,
}) => {
  const showInsertionUI = insertLineOnHoverOnly ? isActive : isActive || isDragging;
  const listRef = useRef(null);

  const resolveInsertIndex = useCallback(
    (clientY) => {
      if (!listRef.current) {
        return elements.length;
      }
      const nodes = listRef.current.querySelectorAll("[data-canvas-element]");
      if (!nodes.length) {
        return 0;
      }
      let index = elements.length;
      let nodeIndex = 0;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (draggingElementId && el.id === draggingElementId) {
          continue;
        }
        const node = nodes[nodeIndex];
        if (!node) break;
        nodeIndex += 1;
        const rect = node.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (clientY < midpoint) {
          index = i;
          break;
        }
      }
      return index;
    },
    [elements, draggingElementId]
  );

  const reportIndex = useCallback(
    (clientY) => {
      const index = resolveInsertIndex(clientY);
      setDropInsertIndex(index);
      onInsertIndexChange?.(index);
      return index;
    },
    [resolveInsertIndex, setDropInsertIndex, onInsertIndexChange]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    reportIndex(e.clientY);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const index = reportIndex(e.clientY);
    setDropInsertIndex(null);
    onDrop(e, index);
  };

  const handleDragLeave = (e) => {
    const related = e.relatedTarget;
    if (listRef.current && related && listRef.current.contains(related)) {
      return;
    }
    setDropInsertIndex(null);
  };

  const emailLayout = insertLineOnHoverOnly;
  const tightLine = insertLineOnHoverOnly;

  return (
    <div
      ref={listRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      className={`relative transition-all ${
        !insertLineOnHoverOnly && (isActive || isDragging) && !compact
          ? `min-h-[64px] rounded-xl border-2 border-dashed ${
              isActive
                ? "bg-orange-50/50 border-orange-500 shadow-sm"
                : "bg-orange-50/20 border-orange-200/50"
            }`
          : ""
      }`}
      aria-label={slotLabel || undefined}
    >
      {elements.length === 0 && emptyState}

      {elements.map((el, index) => {
        const isDraggingThis = draggingElementId === el.id;
        return (
          <React.Fragment key={el.id}>
            {showInsertionUI && dropInsertIndex === index && !isDraggingThis && (
              <InsertIndicator tight={tightLine} />
            )}
            <div
              data-canvas-element
              data-element-id={el.id}
              data-element-index={index}
              draggable
              onDragStart={(e) => {
                if (!shouldStartElementDrag(e.target)) {
                  e.preventDefault();
                  return;
                }
                e.stopPropagation();
                onDragStart?.(e, el.type, el.id);
              }}
              className={`relative group/canvas-el cursor-grab active:cursor-grabbing ${
                emailLayout ? "block w-full min-w-0" : "w-full min-w-0"
              } ${isDraggingThis ? "opacity-40" : ""}`}
              title="Drag to move"
            >
              {renderElement(el, index, {
                onReorderDragStart: (e) => {
                  if (!shouldStartElementDrag(e.target)) {
                    e.preventDefault();
                    return;
                  }
                  e.stopPropagation();
                  onDragStart?.(e, el.type, el.id);
                },
              })}
            </div>
          </React.Fragment>
        );
      })}

      {showInsertionUI && dropInsertIndex === elements.length && elements.length > 0 && (
        <InsertIndicator tight={tightLine} />
      )}
      {showInsertionUI && dropInsertIndex === 0 && elements.length === 0 && (
        <InsertIndicator tight={tightLine} />
      )}
    </div>
  );
};

export default ElementDropList;
