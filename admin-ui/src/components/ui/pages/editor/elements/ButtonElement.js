import { Send } from "lucide-react";
import {
  getEditorBorderBase,
  getElementShellClassRounded,
} from "../elementSelectionStyles";
import ElementDragHandle from "../ElementDragHandle";

const ButtonElement = ({
  text,
  color,
  onChange,
  isSelected,
  onSelect,
  selectionVariant = "default",
  fontSize,
  backgroundColor,
  textColor = "#ffffff",
  textTransform = "none",
  fontWeight = "900",
  borderRadius = 8,
  padding = 12,
  fullWidth = false,
  centerAlign = false,
  reorderDragProps = {},
}) => {
  const buttonVisual = (
    <div
      data-editor-typography
      style={{
        backgroundColor: backgroundColor || color || "#F59E0B",
        fontSize: fontSize || "15px",
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        height: "auto",
        minHeight: "44px",
        width: fullWidth ? "100%" : "auto",
        display: "inline-flex",
        color: textColor,
        textTransform,
        fontWeight,
      }}
      className={`shadow-lg shadow-orange-100/50 transition-all group-hover:shadow-xl items-center justify-center overflow-hidden h-full ${
        fullWidth ? "flex w-full" : "inline-flex"
      }`}
    >
      <div className="flex items-center gap-2 max-w-full px-4">
        <Send className="w-4 h-4 shrink-0" style={{ color: "inherit" }} />
        <input
          type="text"
          value={text || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder="Button Text"
          style={{
            width: `${Math.max((text || "").length * 9, 80)}px`,
            color: "inherit",
            fontWeight: "inherit",
            fontSize: "inherit",
            fontFamily: "inherit",
            textTransform: "inherit",
          }}
          className="bg-transparent border-none focus:ring-0 placeholder:text-white/50 outline-none cursor-text"
        />
      </div>
    </div>
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect();
      }}
      className={`group relative py-0 mb-2 transition-all rounded-xl ${
        centerAlign ? "w-full" : ""
      } ${
        selectionVariant === "email"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer"
      } ${getEditorBorderBase(
        selectionVariant
      )} ${selectionVariant === "email" ? "" : "p-1"} ${getElementShellClassRounded(
        isSelected,
        selectionVariant
      )}`}
    >
      {centerAlign ? (
        <>
          <ElementDragHandle
            reorderDragProps={reorderDragProps}
            isSelected={isSelected}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
          />
          <div className="flex justify-center w-full">{buttonVisual}</div>
        </>
      ) : (
        <div className="flex items-center gap-1.5 w-full">
          <ElementDragHandle reorderDragProps={reorderDragProps} isSelected={isSelected} />
          {buttonVisual}
        </div>
      )}
    </div>
  );
};

export default ButtonElement;

