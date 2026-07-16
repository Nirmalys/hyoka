import React from "react";
import { MousePointer2 } from "lucide-react";
import { getDeviceLayout, getPreviewFrameStyle } from "../../Widgets/utils/widgetDeviceUtils";

const CanvasWorkspace = ({
  mode,
  usesLayoutPreview,
  usesCenteredCanvas,
  previewDevice,
  canvasFont,
  canvas,
  elements,
  draggedType,
  onClearSelection,
}) => {
  const isWidget = mode === "widget";
  const isEmail = mode === "email";
  const showGrid = isWidget || isEmail || !usesLayoutPreview;
  const { isMobile, isTablet } = getDeviceLayout(previewDevice);
  const frameStyle = isWidget ? getPreviewFrameStyle(previewDevice) : undefined;

  return (
    <div
      className={`flex-1 min-h-0 min-w-0 relative overflow-y-auto flex flex-col items-center pt-6 pb-16 px-4 sm:px-6 widget-canvas-resize ${
        isEmail ? "bg-[#F4F4F2]" : "bg-[#ECECEC]"
      }`}
      style={
        showGrid
          ? {
              backgroundImage: `radial-gradient(${isEmail ? "#dcdcd7" : "#d1d5db"} 1px, transparent 1px)`,
              backgroundSize: isEmail ? "22px 22px" : "20px 20px",
            }
          : undefined
      }
      onDragOver={(e) => {
        if (draggedType) e.preventDefault();
      }}
      onClick={onClearSelection}
    >
      {usesCenteredCanvas ? (
        <div
          className={`py-2 mx-auto transition-all duration-420 ease-[cubic-bezier(0.32,0.72,0,1)] w-full ${
            isWidget
              ? ""
              : isEmail && isMobile
                ? "max-w-[380px]"
                : isEmail && isTablet
                  ? "max-w-[520px]"
                  : "max-w-[640px]"
          }`}
          style={frameStyle}
          data-preview-device={isWidget ? previewDevice : undefined}
        >
          {isWidget && (isMobile || isTablet) && (
            <div className="widget-device-frame-label">
              {isMobile ? "Mobile" : "Tablet"} preview
            </div>
          )}
          <div
            className={isWidget && (isMobile || isTablet) ? "widget-device-frame-inner" : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {canvas}
          </div>
        </div>
      ) : (
        <div
          className={`transition-all duration-700 ease-in-out bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100/50 overflow-hidden relative ${
            previewDevice === "mobile"
              ? "w-[375px]"
              : previewDevice === "tablet"
                ? "w-[768px]"
                : "w-full max-w-[1000px]"
          }`}
          style={{
            fontFamily: canvasFont,
            minHeight: "600px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-10 bg-white border-b border-gray-50 flex items-center px-4 gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="mx-auto text-[10px] text-gray-300 font-medium font-mono truncate max-w-[200px]">
              yourstore.com/products/pulse-tracker
            </div>
          </div>

          <div className="p-8">
            {canvas}

            {elements.length === 0 && !usesLayoutPreview && mode === "form" && (
              <div className="text-center py-32">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <MousePointer2 className="w-6 h-6 text-gray-200" />
                </div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Canvas is empty
                </p>
                <p className="text-[12px] text-gray-300 mt-2">
                  Start building by dragging an element from the left
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!usesLayoutPreview && mode !== "widget" && (
        <div className="mt-8 flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Zoom</div>
          <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-orange-500" />
          </div>
          <div className="text-[11px] font-black text-gray-900">100%</div>
        </div>
      )}
    </div>
  );
};

export default CanvasWorkspace;
