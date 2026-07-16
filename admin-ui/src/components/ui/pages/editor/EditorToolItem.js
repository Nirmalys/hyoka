import React from "react";

const EditorToolItem = ({ icon: Icon, label, type, onDragStart, onDragEnd }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, type)}
    onDragEnd={onDragEnd}
    title="Drag into the preview to place this block"
    className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/60 cursor-grab active:cursor-grabbing transition-all group select-none"
  >
    {Icon && (
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-100 group-hover:border-orange-200 transition-colors">
        <Icon className="w-4 h-4 text-gray-500 group-hover:text-orange-600 transition-colors" />
      </span>
    )}
    <span className="text-[11px] font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
      {label}
    </span>
  </div>
);

export default EditorToolItem;
