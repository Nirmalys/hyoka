export const PreviewHeading = ({ children, className = "", style = {}, contentEditable, onUpdate }) => (
  <h3
    data-editor-typography
    className={`font-bold leading-snug mb-5 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1 ${className}`}
    style={{
      fontSize: "24px",
      fontWeight: 700,
      color: "#111827",
      textAlign: "center",
      lineHeight: "1.3",
      ...style,
    }}
    contentEditable={contentEditable}
    onBlur={onUpdate ? (e) => onUpdate(e.target.innerText) : undefined}
    suppressContentEditableWarning
  >
    {children}
  </h3>
);

export const PreviewEditable = ({
  blockId,
  selectedBlockId,
  onSelectBlock,
  editable = false,
  children,
  className = "",
}) => {
  if (!editable || !blockId || !onSelectBlock) {
    return <div className={className}>{children}</div>;
  }

  const selected = selectedBlockId === blockId;

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelectBlock();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect(e);
        }
      }}
      className={`rounded-lg transition-all cursor-pointer outline-none ${
        selected
          ? "ring-2 ring-orange-500 ring-offset-2 bg-orange-50/40"
          : "hover:ring-2 hover:ring-orange-200 hover:ring-offset-1"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const PreviewStoreBrand = ({ name, color, style = {}, contentEditable, onUpdate }) => (
  <p
    className="text-[16px] font-bold mb-4 tracking-tight outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
    style={{ color, ...style }}
    contentEditable={contentEditable}
    onBlur={onUpdate ? (e) => onUpdate(e.target.innerText) : undefined}
    suppressContentEditableWarning
  >
    {name}
  </p>
);

export const PreviewText = ({ children, className = "", align = "center", style = {}, contentEditable, onUpdate }) => (
  <p
    data-editor-typography
    className={`leading-relaxed outline-none focus:bg-orange-50/50 rounded px-1 -mx-1 ${className}`}
    style={{
      fontSize: "14px",
      fontWeight: 400,
      color: "#4b5563",
      textAlign: align === "left" ? "left" : "center",
      lineHeight: "1.5",
      ...style,
    }}
    contentEditable={contentEditable}
    onBlur={onUpdate ? (e) => onUpdate(e.target.innerText) : undefined}
    suppressContentEditableWarning
  >
    {children}
  </p>
);

export const PreviewQuoteBox = ({ title, body }) => (
  <div className="bg-[#f3f4f6] py-8 px-5 sm:px-8 my-5 text-center">
    <span
      className="text-[52px] leading-none text-gray-400 font-serif block mb-3 select-none"
      aria-hidden
    >
      &ldquo;
    </span>
    {title && <p className="text-[15px] font-bold text-gray-900 mb-2">{title}</p>}
    {body && <p className="text-[14px] text-gray-600 leading-relaxed">{body}</p>}
  </div>
);

export const PreviewContentBox = ({ children }) => (
  <div className="bg-[#f3f4f6] py-8 px-5 sm:px-8 my-4 text-center">
    <p className="text-[14px] text-gray-700 leading-relaxed">{children}</p>
  </div>
);

export const PreviewButton = ({ children, primaryColor, style = {} }) => (
  <span
    className="inline-block px-8 py-3.5 rounded-sm text-[15px] font-bold text-white mt-2 mb-4"
    style={{
      backgroundColor: style.backgroundColor || primaryColor,
      color: style.color || "#ffffff",
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      ...style,
    }}
  >
    {children}
  </span>
);

export const PreviewStars = ({ primaryColor }) => (
  <div className="flex justify-center gap-1.5 my-3 pointer-events-none">
    {[...Array(5)].map((_, i) => (
      <svg
        key={i}
        className="w-9 h-9 sm:w-10 sm:h-10"
        viewBox="0 0 24 24"
        fill="none"
        stroke={primaryColor}
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

export const PreviewProductImage = ({ style = {} }) => {
  const maxWidth = style.maxWidth || "160px";
  const borderRadius = style.borderRadius || "16px";
  const align = style.textAlign || "center";
  const alignClass =
    align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";

  return (
    <div
      className={`my-5 overflow-hidden bg-gradient-to-br from-pink-200 via-rose-100 to-emerald-100 flex items-center justify-center aspect-square ${alignClass}`}
      style={{
        width: maxWidth,
        maxWidth: "100%",
        borderRadius,
      }}
    >
      <div className="w-[35%] aspect-[4/5] rounded-lg bg-emerald-500/30 border-2 border-white/60 shadow-sm" />
    </div>
  );
};

export const PreviewSignOff = ({ siteName }) => (
  <p className="text-[14px] font-semibold text-gray-800 mt-6">Thanks! — The {siteName} team</p>
);

export const PreviewSectionLabel = ({ children, style = {} }) => (
  <p
    data-editor-typography
    className="text-center mb-2 mt-4"
    style={{
      fontSize: "14px",
      fontWeight: 400,
      color: "#4b5563",
      textAlign: "center",
      ...style,
    }}
  >
    {children}
  </p>
);

export const PreviewProductName = ({ name, style = {} }) => (
  <p
    data-editor-typography
    className="font-bold mt-5 mb-1"
    style={{
      fontSize: "15px",
      fontWeight: 700,
      color: "#111827",
      textAlign: "center",
      ...style,
    }}
  >
    {name}
  </p>
);

export const PreviewProductVariant = ({ text = "Variant 1 / Variant 2", style = {} }) => (
  <p
    data-editor-typography
    className="mb-1"
    style={{
      fontSize: "13px",
      fontWeight: 400,
      color: "#9ca3af",
      textAlign: "center",
      ...style,
    }}
  >
    {text}
  </p>
);
