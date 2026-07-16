import React, { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import ReplyModal from "./ReplyModal";
import ThreadModal from "./ThreadModal";

const QuestionItem = ({ review, type, onSuccess, onReplySaved }) => {
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  return (
    <div className="bg-white rounded-md border border-gray-100 shadow-sm mb-3 transition-all hover:shadow-md relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
      <div className="px-6 py-4 flex items-center gap-8 text-left">
        {/* Reviewer / Product Image Section */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 shadow-sm">
            {review.product?.image ? (
              <img 
                src={review.product.image} 
                alt={review.product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                 <span className="text-xs font-bold uppercase tracking-tighter">no img</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#101828] text-[16px] truncate leading-tight">
              {review.reviewer?.name || "Anonymous"}
            </div>
            <div className="text-[#667085] text-[12px] font-medium uppercase tracking-wide mt-1">Reviewer</div>
          </div>
        </div>

        {/* Stars Section (Rating) */}
        <div className="flex items-center justify-center flex-1">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${
                  i < review.rating 
                    ? "text-[#FDB022] fill-[#FDB022]" 
                    : "text-gray-200 fill-gray-200"
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Date Section */}
        <div className="flex items-center justify-center flex-1">
          <span className="text-[14px] text-gray-500 font-semibold whitespace-nowrap">
            {review.date}
          </span>
        </div>

        {/* Status Section */}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          {review.reply ? (
            <div className="flex items-center gap-1.5"> 
              <span className="text-[#F04438] text-[15px] font-bold">↳</span>
              <p className="font-bold text-[#344054] text-[14px] truncate">
                {review.reply}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[#F59E0B]/50 text-[15px]">↳</span>
              <p className="text-[#F59E0B] text-[13px] italic font-black uppercase tracking-tight truncate">
                Pending reply...
              </p>
            </div>
          )}
        </div>

        {/* Action Button Section */}
        <div className="flex-shrink-0">
          <button 
            onClick={() => type === "Questions" ? setShowReplyModal(true) : setShowThreadModal(true)}
            className="h-[40px] bg-[#F59E0B] rounded-xl px-5 flex items-center gap-2 hover:bg-[#F59E0B] transition-all text-white font-black text-[14px] shadow-sm shadow-orange-100 active:scale-95 border-0 focus:outline-none focus:ring-0"
          >
            <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span>{type === "Questions" ? "Reply" : "Thread"}</span>
          </button>
        </div>

    {/* Modals */}
    <ReplyModal 
      isOpen={showReplyModal} 
      onClose={() => setShowReplyModal(false)} 
      review={review} 
      onSuccess={onSuccess}
      onReplySaved={onReplySaved}
    />
    <ThreadModal 
      isOpen={showThreadModal} 
      onClose={() => setShowThreadModal(false)} 
      review={review} 
      onSuccess={onSuccess}
      onReplySaved={onReplySaved}
    />

  </div>
</div>
  );
};

export default QuestionItem;
