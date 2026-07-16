import { Image as ImageIcon } from "lucide-react";
import {
  getEditorBorderBase,
  getElementShellClassRounded,
} from "../elementSelectionStyles";

const ImageElement = ({
  url,
  onUpload,
  isSelected,
  onSelect,
  borderRadius = 8,
  maxWidth = "100%",
  alignment = "center",
  selectionVariant = "default",
}) => {
  const emailIdle =
    selectionVariant === "email"
      ? "border-0 bg-transparent"
      : "border-dashed border-gray-100 bg-gray-50/30 hover:bg-orange-50/50 hover:border-orange-200";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect();
      }}
      className={`group relative transition-all rounded-lg p-1 flex flex-col gap-3 ${
        selectionVariant === "email"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer"
      } ${getEditorBorderBase(
        selectionVariant
      )} ${
        isSelected
          ? getElementShellClassRounded(true, selectionVariant)
          : emailIdle
      } ${
        alignment === "left" ? "items-start" : alignment === "right" ? "items-end" : "items-center"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-orange-500" />
      </div>
      <div className={alignment === "left" ? "text-left" : alignment === "right" ? "text-right" : "text-center"}>
        <p className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-1">
          {url ? "Change Image" : "Add Image"}
        </p>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
          Drag & drop or Click to upload
        </p>
      </div>
      {url && (
        <img
          src={url}
          alt="Preview"
          className="mt-4 shadow-sm border border-gray-100"
          style={{
            borderRadius: `${borderRadius}px`,
            maxWidth: maxWidth === "100%" ? "100%" : `${maxWidth}px`,
          }}
        />
      )}
    </div>
  );
};

export default ImageElement;

