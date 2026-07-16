/** Editor chrome for canvas elements (not sent in emails). */
export const getEditorBorderBase = (selectionVariant = "default") =>
  selectionVariant === "email" ? "border-0" : "border-2";

export const getElementShellClass = (isSelected, variant = "default") => {
  if (variant === "email") {
    return isSelected
      ? "outline outline-2 outline-[#F59E0B] outline-offset-2 rounded-sm"
      : "outline-none border-0";
  }
  return isSelected
    ? "border-2 border-[#F59E0B] bg-[#FFF9E5]/60 ring-4 ring-[#F5B800]/15"
    : "border-transparent hover:border-gray-100";
};

export const getElementShellClassRounded = (isSelected, variant = "default") => {
  if (variant === "email") {
    return isSelected
      ? "outline outline-2 outline-[#F59E0B] outline-offset-2 rounded-lg"
      : "outline-none border-0 shadow-none";
  }
  return isSelected
    ? "border-2 border-[#F59E0B] shadow-sm ring-4 ring-[#F5B800]/15"
    : "border-transparent hover:border-gray-100";
};
