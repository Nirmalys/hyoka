import React, { useState } from "react";

export const DropZone = ({ index, onDrop, active }) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.stopPropagation();
        setIsOver(false);
        onDrop(e, index);
      }}
      className={`relative w-full transition-all duration-500 rounded-xl border-2 border-dashed ${
        active || isOver
          ? "h-16 opacity-100 py-2 bg-orange-50/50 border-orange-500"
          : "h-6 opacity-40 border-orange-200/50 hover:h-12 hover:opacity-100 hover:border-orange-300"
      }`}
    >
      <div
        className={`w-full h-full flex items-center justify-center transition-all ${
          isOver ? "scale-100" : "scale-98 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
            Insert Content Here
          </span>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
