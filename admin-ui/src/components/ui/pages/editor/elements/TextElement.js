import {
  getEditorBorderBase,
  getElementShellClassRounded,
} from "../elementSelectionStyles";
import ElementDragHandle from "../ElementDragHandle";

const TextElement = ({
  value,
  onChange,
  placeholder = "Type here...",
  isSelected,
  onSelect,
  selectionVariant = "default",
  textAlign = "left",
  fontSize = "14px",
  color = "#1D2939",
  fontWeight = "400",
  fontStyle = "normal",
  lineHeight = "1.6",
  letterSpacing = "normal",
  textTransform = "none",
  textDecoration = "none",
  backgroundColor = "transparent",
  paddingX = "0",
  paddingY = "0",
  reorderDragProps = {},
}) => {
  return (
    <div
      data-editor-typography
      onClick={(e) => {
        e.stopPropagation();
        if (e.target.tagName !== "TEXTAREA") {
          onSelect && onSelect();
        }
      }}
      className={`group relative transition-all rounded-lg ${getEditorBorderBase(
        selectionVariant
      )} ${getElementShellClassRounded(isSelected, selectionVariant)}`}
      style={{
        textAlign,
        backgroundColor,
      }}
    >
      <div className="flex items-start gap-1.5 w-full">
        <ElementDragHandle
          reorderDragProps={reorderDragProps}
          isSelected={isSelected}
          className="mt-0.5"
        />
        <textarea
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => onSelect && onSelect()}
          placeholder={placeholder}
          className="flex-1 min-w-0 w-full bg-transparent border-none focus:ring-0 placeholder:text-gray-300 resize-none overflow-hidden outline-none select-text cursor-text"
        style={{
          fontSize,
          lineHeight,
          color,
          fontWeight,
          fontStyle,
          textAlign,
          letterSpacing: letterSpacing === "normal" ? "normal" : `${letterSpacing}px`,
          textTransform,
          textDecoration,
          height: "auto",
          padding: `${paddingY}px ${paddingX}px`,
          backgroundColor: "inherit",
          fontFamily: "inherit",
        }}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        ref={(el) => {
          if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }
        }}
      />
      </div>
    </div>
  );
};

export default TextElement;

