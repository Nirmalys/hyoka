import {
  getEditorBorderBase,
  getElementShellClassRounded,
} from "../elementSelectionStyles";

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

const StarsElement = ({
  hintText = "Click a star to leave a review",
  starColor = "#F59E0B",
  starSize = "36px",
  hintFontSize = "13px",
  hintColor = "#4b5563",
  textAlign = "center",
  isSelected,
  onSelect,
  selectionVariant = "default",
}) => {
  const alignClass =
    textAlign === "left" ? "items-start" : textAlign === "right" ? "items-end" : "items-center";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect();
      }}
      className={`group relative transition-all rounded-lg py-0.5 px-1 mb-2 ${
        selectionVariant === "email"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer"
      } ${getEditorBorderBase(
        selectionVariant
      )} ${getElementShellClassRounded(isSelected, selectionVariant)} ${
        selectionVariant !== "email" ? "hover:bg-gray-50/50" : ""
      }`}
    >
      <div className={`flex flex-col ${alignClass}`}>
        <div
          className="flex gap-1.5"
          style={{ justifyContent: textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center" }}
        >
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              style={{ width: starSize, height: starSize }}
              viewBox="0 0 24 24"
              fill="none"
              stroke={starColor}
              strokeWidth="1.5"
              aria-hidden
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
        </div>
        {hintText ? (
          <p
            className="mt-2 font-medium leading-relaxed"
            style={{
              fontSize: hintFontSize,
              color: hintColor,
              textAlign,
            }}
          >
            {hintText}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default StarsElement;
