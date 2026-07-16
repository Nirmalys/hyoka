import { getEditorBorderBase, getElementShellClass } from "../elementSelectionStyles";

const SpacerElement = ({ height = "24px", isSelected, onSelect, selectionVariant = "default" }) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
      onSelect?.();
    }}
    className={`rounded-lg transition-all flex items-center justify-center ${getEditorBorderBase(
      selectionVariant
    )} ${
      selectionVariant === "email"
        ? "cursor-grab active:cursor-grabbing"
        : "cursor-pointer"
    } ${
      selectionVariant === "email"
        ? getElementShellClass(isSelected, "email")
        : isSelected
          ? "border-[#F59E0B] bg-[#FFF9E5]/60 ring-4 ring-[#F5B800]/15"
          : "border-dashed border-transparent hover:border-gray-200"
    }`}
    style={{ minHeight: height }}
  >
    {isSelected && selectionVariant !== "email" && (
      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Spacer</span>
    )}
  </div>
);

export default SpacerElement;

