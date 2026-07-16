import React, { useState } from "react";
import { logApiError } from "../../../../../utils/apiError";
import { Star, Send, Loader2 } from "lucide-react";
import axiosClient from "../../../../axiosClient";

const FeedbackItem = ({ review, onReplySaved }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAwaitingReply = !review.reply && review.store_review;

  const handleSaveReply = async () => {
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
        setShowReplyInput(false);
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4 transition-all hover:shadow-md">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
          {review.product?.image ? (
            <img 
              src={review.product.image} 
              alt={review.product.name} 
              className="w-full h-full object-cover"
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="text-[20px]">📦</span>
             </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 text-[15px]">
                {review.reviewer?.name || "Anonymous"}
              </span>
              <span className="text-gray-400 text-[15px]">on</span>
              <span className="font-bold text-gray-900 text-[15px]">
                {review.product?.name}
              </span>
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {review.date}
            </span>
          </div>

          {/* Rating */}
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < review.rating ? "text-orange-400 fill-orange-400" : "text-gray-200 fill-gray-200"}`} 
              />
            ))}
          </div>

          {/* Review Content */}
          <p className="text-gray-600 text-[14px] leading-relaxed mb-4">
            {review.review?.content}
          </p>

          {/* Store Feedback Box */}
          {review.store_review && (
            <div className="bg-[#FFF9F5] border border-[#FFE8D1]/30 rounded-2xl p-4 relative">
               <div className="text-[9px] font-black text-orange-500/60 uppercase tracking-[0.15em] mb-1.5">
                  Customer Store Feedback
               </div>
               <p className="text-gray-700 text-[14px] italic font-medium">
                "{review.store_review}"
               </p>

               {isAwaitingReply && !showReplyInput && (
                  <div className="absolute top-4 right-4">
                     <span className="bg-[#FFF0E6] text-[#F59E0B] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-[#F59E0B]/10">
                        Awaiting Reply
                     </span>
                  </div>
               )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyInput ? (
            <div className="mt-4 flex flex-col gap-3">
               <textarea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-300 transition-all min-h-[100px]"
                  autoFocus
               />
               <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setShowReplyInput(false)}
                    className="text-gray-500 text-sm font-bold px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveReply}
                    disabled={isSubmitting || !replyText.trim()}
                    className="bg-[#F59E0B] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reply"}
                  </button>
               </div>
            </div>
          ) : isAwaitingReply && (
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setShowReplyInput(true)}
                className="bg-[#F59E0B] hover:bg-[#F59E0B] text-white px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                Reply
              </button>
            </div>
          )}

          {/* Current Reply if any */}
          {!isAwaitingReply && review.reply && (
             <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                   <span className="text-[10px] font-bold text-orange-600">You</span>
                </div>
                <div className="flex-1">
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Reply</div>
                   <p className="text-gray-600 text-[13px] italic font-medium">
                      {review.reply}
                   </p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackItem;
