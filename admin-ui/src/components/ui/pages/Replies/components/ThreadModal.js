import { useState } from "react";
import { logApiError } from "../../../../../utils/apiError";
import { X, Send, Edit3, Loader2 } from "lucide-react";
import axiosClient from "../../../../axiosClient";

const ThreadModal = ({ isOpen, onClose, review, onSuccess, onReplySaved }) => {
  const [reply, setReply] = useState(review.reply || "");
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
      logApiError(error, "Failed to update reply");
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
        <div className="px-6 pt-6 pb-3 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-[#F59E0B] focus:outline-none focus:ring-0"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-[20px] font-bold text-[#1D2939] mb-0.5">
            Conversation thread
          </h2>
          <p className="text-[#667085] text-[14px] flex items-center gap-1.5 font-medium">
            <span>{review.product?.name}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="uppercase text-[12px] tracking-wide">{review.date}</span>
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          
          {/* Question Section */}
          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl p-4">
            <div className="text-[10px] font-black text-[#F44B22] uppercase tracking-[0.1em] mb-1.5">
              {review.reviewer?.name || "CUSTOMER"} ASKED
            </div>
            <p className="text-[#344054] text-[15px] leading-relaxed">
              {review.question || review.content || review.review?.content || "high intresting feels"}
            </p>
          </div>

          {/* Reply Section */}
          <div className="bg-white border border-[#EAECF0] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Edit3 className="w-3.5 h-3.5 text-[#F44B22]" />
                <span className="text-[10px] font-black text-[#F44B22] uppercase tracking-[0.1em]">Your Reply</span>
            </div>
            <textarea
              className="w-full bg-white border border-[#EAECF0] rounded-xl p-4 text-[14px] text-[#344054] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#F59E0B]/40 focus:ring-4 focus:ring-[#F59E0B]/5 transition-all min-h-[100px] resize-none"
              placeholder="Write your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#667085] font-bold text-[15px] hover:bg-gray-100 hover:text-gray-900 transition-all focus:outline-none focus:ring-0"
            >
              Close
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B] text-white font-bold text-[15px] flex items-center gap-2.5 transition-colors shadow-lg shadow-orange-500/20 focus:outline-none focus:ring-0 disabled:opacity-50"
              disabled={!reply.trim() || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Updating..." : "Update reply"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ThreadModal;
