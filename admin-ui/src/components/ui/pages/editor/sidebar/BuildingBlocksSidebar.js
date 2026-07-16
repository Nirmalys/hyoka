import React from "react";
import { getEditorTools } from "../editorConfig";
import { TOOL_DEFS } from "../editorConstants";
import EditorToolItem from "../EditorToolItem";

const BuildingBlocksSidebar = ({ mode, config, onDragStart, onDragEnd }) => (
  <div className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
    <div className="px-5 pt-5 pb-4">
      <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">
        Elements
      </h4>
      <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
        Drop onto canvas or click to edit
      </p>
    </div>

    <div className="px-5 pb-5 grid grid-cols-2 gap-2.5 overflow-y-auto flex-1">
      {getEditorTools(mode).map((toolType) => {
        const def = TOOL_DEFS[toolType];
        if (!def) return null;
        return (
          <EditorToolItem
            key={toolType}
            icon={def.icon}
            label={def.label}
            type={toolType}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        );
      })}
    </div>
    {config.canvasHint && (
      <p className="px-5 pb-5 text-[10px] text-gray-400 leading-relaxed border-t border-gray-50 pt-4">
        {config.canvasHint}
      </p>
    )}
  </div>
);

export default BuildingBlocksSidebar;
