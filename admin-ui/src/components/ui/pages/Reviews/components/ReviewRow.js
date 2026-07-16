import { Star, MoreHorizontal, Check, Camera, Video } from "lucide-react";
import ReviewStatus from "./ReviewStatus";

const getMediaCounts = (media = []) => {
  let photos = 0;
  let videos = 0;
  media.forEach((item) => {
    if (String(item.type || "").toLowerCase() === "video") videos += 1;
    else photos += 1;
  });
  return { photos, videos };
};

const getSourceLabel = (row) => row?.source || "Widget";

const ReviewRow = ({ row, isSelected, onToggle, onOpenDrawer, threadParent = false, hideSource = false }) => {
  const { photos, videos } = getMediaCounts(row.media);
  const productImage = row.product?.image;
  const productName = row.product?.name || "Unknown Product";

  return (
    <tr className="group">
      <td colSpan={9} className="p-0 pb-1.5">
        <div
          className={`flex items-center border transition-all duration-200 ${
            threadParent ? "rounded-2xl" : "rounded-xl"
          } ${
            threadParent
              ? "bg-[#FFFDF5] border-[#F5E6B8]/50"
              : isSelected
                ? "bg-white border-[#F5B800]/40 ring-1 ring-[#F5B800]/20"
                : "bg-white border-gray-100 hover:border-gray-200"
          }`}
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {/* Checkbox */}
          <div className="pl-4 pr-2 py-3.5 flex-shrink-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(row.id)}
                className="peer absolute opacity-0 w-0 h-0"
              />
              <div
                className={`w-[18px] h-[18px] rounded border-2 transition-all flex items-center justify-center ${
                  isSelected
                    ? "border-[#F5B800] bg-[#FFF8E1]"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div
                  className={`transition-transform duration-200 ${
                    isSelected ? "scale-100" : "scale-0"
                  }`}
                >
                  <Check className="w-3 h-3 text-black stroke-[3]" />
                </div>
              </div>
            </label>
          </div>

          {/* Product — thumbnail + name like reference image */}
          <div
            className="flex items-center gap-3 w-[19%] min-w-[160px] px-2 py-3.5 cursor-pointer"
            onClick={() => onOpenDrawer(row)}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 text-[10px] font-bold">
                  N/A
                </div>
              )}
            </div>
            <span className="text-[13px] font-medium text-gray-500 truncate leading-snug">
              {productName}
            </span>
          </div>

          {/* Name */}
          <div
            className="w-[11%] min-w-0 px-2 py-3.5 cursor-pointer"
            onClick={() => onOpenDrawer(row)}
          >
            <span className="text-[13px] font-bold text-black truncate block">
              {row.reviewer.name}
            </span>
          </div>

          {/* Review */}
          <div className="flex-1 min-w-0 px-2 py-3.5">
            <div className="flex items-center gap-2 min-w-0">
              <p
                className="text-[13px] text-gray-500 truncate font-normal flex-1 min-w-0 cursor-pointer"
                onClick={() => onOpenDrawer(row)}
              >
                {row.review.content}
              </p>
              {(row.review.content || "").trim().length > 5 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDrawer(row);
                  }}
                  className="shrink-0 text-[12px] font-bold text-[#B8860B] hover:text-[#9A7209] hover:underline"
                >
                  View
                </button>
              )}
            </div>
          </div>

          {/* Rating */}
          <div
            className="w-[8%] px-2 py-3.5 cursor-pointer flex justify-center"
            onClick={() => onOpenDrawer(row)}
          >
            <div className="flex items-center gap-px">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < row.rating
                      ? "fill-[#F5B800] text-[#F5B800]"
                      : "text-gray-200 fill-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Media */}
          <div
            className="w-[8%] px-2 py-3.5 cursor-pointer"
            onClick={() => onOpenDrawer(row)}
          >
            <div className="flex items-center justify-center gap-2 text-gray-400">
              {photos > 0 && (
                <span className="flex items-center gap-0.5 text-[12px] font-medium text-gray-500">
                  <Camera className="w-3.5 h-3.5" />
                  {photos}
                </span>
              )}
              {videos > 0 && (
                <span className="flex items-center gap-0.5 text-[12px] font-medium text-gray-500">
                  <Video className="w-3.5 h-3.5" />
                  {videos}
                </span>
              )}
              {photos === 0 && videos === 0 && (
                <span className="text-[12px] text-gray-300">—</span>
              )}
            </div>
          </div>

          {/* Source */}
          {!hideSource && (
          <div
            className="w-[8%] px-2 py-3.5 cursor-pointer flex justify-center"
            onClick={() => onOpenDrawer(row)}
          >
            <span className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
              {getSourceLabel(row)}
            </span>
          </div>
          )}

          {/* Date */}
          <div
            className="w-[10%] px-2 py-3.5 cursor-pointer"
            onClick={() => onOpenDrawer(row)}
          >
            <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
              {row.date}
            </span>
          </div>

          {/* Status */}
          <div
            className="w-[11%] px-2 py-3.5 cursor-pointer flex justify-center"
            onClick={() => onOpenDrawer(row)}
          >
            <ReviewStatus status={row.status} />
          </div>

          {/* Actions */}
          <div className="w-[4%] pr-3 py-3.5 flex justify-center">
            <button
              type="button"
              onClick={() => onOpenDrawer(row)}
              className="p-1 text-gray-300 hover:text-gray-600 rounded-lg transition-all focus:outline-none"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ReviewRow;
