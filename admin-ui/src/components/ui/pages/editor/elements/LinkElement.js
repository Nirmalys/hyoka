import {
  getEditorBorderBase,
  getElementShellClassRounded,
} from "../elementSelectionStyles";
import ElementDragHandle from "../ElementDragHandle";

const LinkElement = ({
  text = "Learn more",
  url = "#",
  color = "#F59E0B",
  fontSize = "14px",
  isSelected,
  onSelect,
  onChange,
  selectionVariant = "default",
  reorderDragProps = {},
}) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
      onSelect?.();
    }}
    className={`py-2 px-2 rounded-lg transition-all ${getEditorBorderBase(
      selectionVariant
    )} ${getElementShellClassRounded(isSelected, selectionVariant)}`}
    style={{ textAlign: "center" }}
  >
    <div className="flex items-center gap-1.5 w-full">
      <ElementDragHandle reorderDragProps={reorderDragProps} isSelected={isSelected} />
      <input
        type="text"
        value={text || ""}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => onSelect?.()}
        className="flex-1 min-w-0 bg-transparent border-none outline-none font-bold underline text-center select-text cursor-text"
        style={{ color, fontSize }}
      />
    </div>
  </div>
);

export default LinkElement;

