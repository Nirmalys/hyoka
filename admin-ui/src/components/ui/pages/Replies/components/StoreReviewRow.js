import { Star, Send, MoreVertical, Check } from "lucide-react";
import { formatElapsedTime } from "../../../../../utils/formatDate";

const SNIPPET_MAX = 80;

const getFullReviewText = (review) => {
  const storeReview = review.store_review?.trim();
  if (storeReview) return storeReview;

  const title = review.review?.title?.trim();
  const content = review.review?.content?.trim();
  if (title && content) return `${title}\n${content}`;
  return title || content || "";
};

const getReviewSnippet = (review) => {
  const full = getFullReviewText(review);
  if (!full) return "—";
  const firstLine = full.split("\n")[0].trim();
  if (!firstLine) return "—";
  if (firstLine.length > SNIPPET_MAX) {
    return `${firstLine.slice(0, SNIPPET_MAX)}…`;
  }
  return firstLine;
};

const StoreStatusBadge = ({ status }) => {
  const styles = {
    Approved: {
      wrap: "bg-[#E8F5E9] text-[#2E7D32]",
      dot: "bg-[#00C853]",
    },
    Pending: {
      wrap: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },
    Rejected: {
      wrap: "bg-red-50 text-red-600",
      dot: "bg-red-500",
    },
    Spam: {
      wrap: "bg-orange-50 text-orange-700",
      dot: "bg-orange-500",
    },
  };

  const config = styles[status] || styles.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${config.wrap}`}
    >
      <span className={`w-4 h-4 rounded-full ${config.dot} flex items-center justify-center shrink-0`}>
        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
      </span>
      {status}
    </span>
  );
};

const ReviewCell = ({ text, showView, onView }) => (
  <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden">
    <span
      className="text-[13px] text-gray-500 font-normal min-w-0 flex-1 truncate"
      title={text}
    >
      {text}
    </span>
    {showView ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onView();
        }}
        className="shrink-0 text-[12px] font-bold text-[#B8860B] hover:text-[#9A7209] hover:underline whitespace-nowrap"
      >
        View
      </button>
    ) : null}
  </div>
);

const StoreReviewRow = ({
  review,
  isSelected,
  onToggle,
  onOpenDrawer,
}) => {
  const fullReviewText = getFullReviewText(review);
  const reviewText = getReviewSnippet(review);
  const showReviewView =
    fullReviewText.trim().length > 5 || (reviewText !== "—" && reviewText.trim().length > 5);
  const replyText = review.reply?.trim() || "";
  const timeAgo = formatElapsedTime(review.created_at, review.date);
  const openDrawer = () => onOpenDrawer?.(review);

  return (
    <tr className="group">
      <td colSpan={8} className="p-0 pb-2">
        <div
          className={`flex items-center w-full min-w-0 overflow-hidden bg-white rounded-2xl border transition-all duration-200 ${
            isSelected
              ? "border-[#F5B800]/40 ring-1 ring-[#F5B800]/20"
              : "border-gray-100 hover:border-gray-200"
          }`}
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="pl-4 pr-2 py-3.5 shrink-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(review.id)}
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

          <button
            type="button"
            onClick={openDrawer}
            className="w-[13%] min-w-[110px] max-w-[13%] shrink-0 px-2 py-3.5 text-left overflow-hidden"
          >
            <span className="text-[13px] font-bold text-[#1D2939] truncate block">
              {review.reviewer?.name || "Anonymous"}
            </span>
          </button>

          <div className="flex-1 min-w-0 overflow-hidden px-2 py-3.5">
            <ReviewCell text={reviewText} showView={showReviewView} onView={openDrawer} />
          </div>

          <button
            type="button"
            onClick={openDrawer}
            className="w-[8%] min-w-[72px] shrink-0 px-2 py-3.5 flex justify-center"
          >
            <div className="flex items-center gap-px">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? "fill-[#F5B800] text-[#F5B800]"
                      : "text-gray-200 fill-gray-200"
                  }`}
                />
              ))}
            </div>
          </button>

          <button
            type="button"
            onClick={openDrawer}
            className="w-[9%] min-w-[84px] shrink-0 px-2 py-3.5 text-left overflow-hidden"
          >
            <span className="text-[12px] text-gray-500 font-normal whitespace-nowrap block truncate">
              {timeAgo}
            </span>
          </button>

          <div className="w-[16%] min-w-[130px] max-w-[16%] shrink-0 px-2 py-3.5 overflow-hidden">
            {replyText ? (
              <p className="text-[13px] text-gray-500 truncate font-normal" title={replyText}>
                {replyText}
              </p>
            ) : (
              <span className="text-[13px] text-gray-300 font-normal">—</span>
            )}
          </div>

          <div className="w-[11%] min-w-[108px] shrink-0 px-2 py-3.5 flex justify-center">
            <StoreStatusBadge status={review.status} />
          </div>

          <div className="w-[14%] min-w-[120px] shrink-0 pr-4 py-3.5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={openDrawer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFF4E0] text-[#B8860B] rounded-full text-[12px] font-bold hover:bg-[#FFEFCC] transition-all focus:outline-none whitespace-nowrap"
            >
              Reply
              <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={openDrawer}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-all focus:outline-none"
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default StoreReviewRow;
