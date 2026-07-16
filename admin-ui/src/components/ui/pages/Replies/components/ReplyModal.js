import React, { useState } from "react";
import { logApiError } from "../../../../../utils/apiError";
import { X, Star, Send, Loader2 } from "lucide-react";
import axiosClient from "../../../../axiosClient";

const ReplyModal = ({ isOpen, onClose, review, onSuccess, onReplySaved }) => {
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!reply.trim()) return;
    setLoading(true);
    try {
      const response = await axiosClient.post("", {
        action: 'hyoka_save_reply',
        review_id: review.id,
        reply: reply,
        _ajax_nonce: window.hyokaData?.nonce || ""
      });
      if (response.data.success) {
        onReplySaved?.(review.id, reply);
        onSuccess?.();
        onClose();
      } else {
        alert(response.data.data?.message || "Failed to save reply.");
      }
    } catch (error) {
      logApiError(error, "Failed to save reply");
      alert("Failed to save reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-[560px] rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-[#F59E0B] transition-colors focus:outline-none focus:ring-0"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-[24px] font-bold text-[#1D2939] mb-1">
            Reply to {review.reviewer?.name || "Anonymous"}
          </h2>
          <p className="text-[#667085] text-[16px]">
            Your response will be visible publicly under this review.
          </p>
        </div>

        <div className="px-8 pb-10 space-y-6">
          {/* Review Summary Card */}
          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex gap-0.5 mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < review.rating ? "text-[#FDB022] fill-[#FDB022]" : "text-[#EAECF0] fill-[#EAECF0]"}`} 
                  />
                ))}
              </div>
              <span className="text-[14px] font-semibold text-[#475467]">{review.product?.name}</span>
            </div>
            <p className="text-[#344054] text-[15px] italic leading-relaxed">
              "{review.review?.content || review.comment || (review.question ? review.question : "Great picture quality, love the colors!")}"
            </p>
          </div>

          {/* Textarea Section */}
          <div className="relative">
            <textarea
              className="w-full bg-white border border-[#EAECF0] rounded-2xl p-6 text-[16px] text-[#1D2939] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 transition-all min-h-[160px] resize-none"
              placeholder="Write a thoughtful reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <div className="mt-3 flex justify-between items-center text-[13px] font-medium text-[#667085]">
              <span>{reply.length}/500 characters</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#667085] font-bold text-[15px] flex items-center gap-2 hover:bg-gray-100 hover:text-gray-900 transition-all focus:outline-none focus:ring-0"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B] text-white font-bold text-[15px] flex items-center gap-2.5 transition-colors shadow-lg shadow-orange-500/20 focus:outline-none focus:ring-0 disabled:opacity-50"
              disabled={!reply.trim() || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReplyModal;
