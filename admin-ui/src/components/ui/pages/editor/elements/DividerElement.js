import { getEditorBorderBase, getElementShellClass } from "../elementSelectionStyles";

const DividerElement = ({ color = "#EAECF0", isSelected, onSelect, selectionVariant = "default" }) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
      onSelect?.();
    }}
    className={`transition-all ${
      selectionVariant === "email"
        ? "py-0 cursor-grab active:cursor-grabbing"
        : "py-0 rounded-lg cursor-pointer"
    } ${getEditorBorderBase(selectionVariant)} ${getElementShellClass(
      isSelected,
      selectionVariant
    )}`}
  >
    <hr style={{ borderColor: color, borderTopWidth: 2 }} className="border-0 border-t-2 w-full" />
  </div>
);

export default DividerElement;

