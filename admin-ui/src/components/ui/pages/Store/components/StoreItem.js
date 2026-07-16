import { useState } from "react";
import { logApiError } from "../../../../../utils/apiError";
import { Star, Send } from "lucide-react";
import axiosClient from "../../../../axiosClient";

const StoreItem = ({ review, onReplySaved }) => {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_save_reply",
        review_id: review.id,
        reply: replyText,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });

      if (response.data.success) {
        onReplySaved(review.id, replyText);
        setReplyText("");
      } else {
        alert(response.data.data?.message || "Failed to save reply.");
      }
    } catch (error) {
      logApiError(error, "Failed to save reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 p-6 hover:shadow-md">
      <div className="flex items-start gap-5">
        {/* Product Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
          {review.product.image ? (
            <img src={review.product.image} alt={review.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <span className="text-xl">📦</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-gray-900 truncate">
                <span className="hover:text-orange-600 transition-colors cursor-default">{review.reviewer.name}</span>
                <span className="text-gray-400 font-medium px-1.5 leading-none">on</span>
                <span className="text-gray-500 font-semibold">{review.product.name}</span>
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3.5 h-3.5 ${i < review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"}`} 
                    strokeWidth={i < review.rating ? 0 : 2}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs font-semibold text-gray-400 tabular-nums whitespace-nowrap pt-1 uppercase tracking-tight">
              {review.date}
            </div>
          </div>

          {/* Main Review Content */}
          <div className="text-gray-600 text-[15px] leading-relaxed mb-4 font-medium mt-3">
            {review.review.content}
          </div>

          {/* Store Review Section (Customer Feedback about Store) */}
          {review.store_review && (
            <div className="mb-4 p-4 bg-amber-50/40 rounded-xl border border-amber-100/50">
               <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Customer Store Feedback</div>
               <div className="text-stone-600 text-sm italic font-medium leading-relaxed">
                 "{review.store_review}"
               </div>
            </div>
          )}

          {/* Merchant Reply Section */}
          {review.reply ? (
            <div className="mt-4 flex gap-4">
              <div className="w-0.5 h-auto bg-rose-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 py-1">
                <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2 font-black">Your Reply</div>
                <div className="text-gray-700 text-[15px] font-medium leading-relaxed">
                  {review.reply}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="Write a public reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-5 py-3 text-[14px] font-medium focus:ring-0 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-gray-400 group-focus-within:shadow-sm"
                />
              </div>
              <button
                onClick={handleReply}
                disabled={isSubmitting || !replyText.trim()}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
                Reply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreItem;
