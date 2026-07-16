import { useState, useEffect, useLayoutEffect } from "react";
import { logApiError } from "../../../../../utils/apiError";
import {
  X,
  Star,
  Check,
  X as XIcon,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Trash2,
  Send,
  CornerDownRight,
} from "lucide-react";
import axiosClient from "../../../../axiosClient";
import { formatElapsedTime } from "../../../../../utils/formatDate";
import {
  DRAWER_CLOSE_MS,
  getReviewStatusBanner,
  SectionTitle,
  DrawerStatusBadge,
} from "../../../shared/reviewDrawerShared";

const VisitorReplyDrawer = ({
  onClose,
  review,
  onStatusUpdate,
  onReplySuccess,
  onUserReplyStatusUpdate,
  onDelete,
  onNavigate,
  hasPrev = false,
  hasNext = false,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [visible, setVisible] = useState(false);
  const [updatingReplyId, setUpdatingReplyId] = useState(null);

  const displayReview = activeReview || review;

  useLayoutEffect(() => {
    if (!review) {
      setVisible(false);
      return;
    }

    setActiveReview(review);
    setReplyText(review.reply || "");
    setVisible(false);

    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2 !== undefined) cancelAnimationFrame(raf2);
    };
  }, [review]);

  useEffect(() => {
    if (review) return undefined;
    const timer = setTimeout(() => setActiveReview(null), DRAWER_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [review]);

  if (!displayReview) return null;

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_save_reply",
        review_id: displayReview.id,
        reply: replyText,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });

      if (response.data.success) {
        setActiveReview((prev) => (prev ? { ...prev, reply: replyText } : prev));
        onReplySuccess?.(displayReview.id, replyText);
      } else {
        alert(response.data.data?.message || "Failed to save reply.");
      }
    } catch (error) {
      logApiError(error, "Failed to save reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisitorReplyStatus = async (replyId, newStatus) => {
    if (!displayReview?.id || !replyId) return;
    setUpdatingReplyId(replyId);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_update_user_reply_status",
        review_id: displayReview.id,
        reply_id: replyId,
        status: newStatus,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });
      if (response.data?.success) {
        const updatedReplies = (displayReview.user_replies || []).map((item) =>
          item.id === replyId ? { ...item, status: newStatus } : item
        );
        setActiveReview((prev) => (prev ? { ...prev, user_replies: updatedReplies } : prev));
        onUserReplyStatusUpdate?.(displayReview.id, updatedReplies);
      } else {
        alert(response.data?.data?.message || "Failed to update reply.");
      }
    } catch (error) {
      logApiError(error, "Failed to update visitor reply");
    } finally {
      setUpdatingReplyId(null);
    }
  };

  const currentStatus = displayReview.status.toLowerCase();
  const statusBanner = getReviewStatusBanner(displayReview.status, "store");
  const timeAgo = formatElapsedTime(displayReview.created_at) || displayReview.date;
  const visitorReplies = (displayReview.user_replies || []).filter(
    (reply) => String(reply.content || "").trim() !== ""
  );
  const hasExistingReply = Boolean(displayReview.reply?.trim());
  const replyUnchanged = replyText.trim() === (displayReview.reply || "").trim();

  return (
    <div
      className={`fixed inset-0 z-100 flex justify-end overflow-hidden transition-all duration-500 ${
        visible ? "visible" : "invisible delay-500"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-[520px] bg-[#F5F5F5] h-full shadow-2xl flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-6 pt-8 pb-5 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
          <div>
            <div className="text-[22px] font-bold text-[#1D2939] leading-tight">Review details</div>
            <div className="text-[13px] text-gray-400 font-medium leading-tight mt-1">
              #{displayReview.id} · {timeAgo}
            </div>
          </div>
          <div className="flex items-center gap-1 pt-1.5">
            <button
              type="button"
              onClick={() => onNavigate?.("prev")}
              disabled={!hasPrev}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("next")}
              disabled={!hasNext}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
          <div
            className={`px-6 py-2.5 border-b flex items-center justify-between gap-4 ${statusBanner.container}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full ${statusBanner.iconWrap} flex items-center justify-center shrink-0`}
                >
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
                <div className="text-[14px] font-bold text-[#212121] leading-tight">
                  {statusBanner.title}
                </div>
              </div>
              <div className="text-[12px] text-[#757575] font-medium leading-tight pl-[38px] mt-0.5">
                {statusBanner.subtitle}
              </div>
            </div>
            <DrawerStatusBadge status={displayReview.status} banner={statusBanner} />
          </div>

          <div className="px-6 pt-2.5 pb-4 border-b border-gray-200">
            <SectionTitle>Customer</SectionTitle>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#FFF4E0] text-[#B8860B] flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                {displayReview.reviewer?.initials || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#1D2939] truncate">
                  {displayReview.reviewer?.name || "Anonymous"}
                </p>
                <p className="text-[13px] text-[#757575] font-medium truncate">
                  {displayReview.reviewer?.email || "No email provided"}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <SectionTitle>Customer review</SectionTitle>

            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < displayReview.rating
                          ? "fill-[#F5B800] text-[#F5B800]"
                          : "text-gray-200 fill-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[15px] font-bold text-[#1D2939]">
                  {Number(displayReview.rating).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo}
              </div>
            </div>

            {displayReview.review?.title && (
              <div className="text-[18px] font-bold text-[#1D2939] leading-snug mb-2">
                {displayReview.review.title}
              </div>
            )}
            <p className="text-[14px] text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
              {displayReview.review?.content || "—"}
            </p>

            {visitorReplies.map((reply) => {
              const replyStatus = String(reply.status || "pending").toLowerCase();
              const isPending = replyStatus === "pending";

              return (
                <div key={reply.id} className="mt-4 flex gap-2">
                  <CornerDownRight className="w-4 h-4 text-gray-300 shrink-0 mt-3" strokeWidth={2} />
                  <div className="flex-1 min-w-0 rounded-2xl border border-gray-100 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="text-[13px] font-bold text-[#1D2939]">
                        {reply.author || "Visitor"}
                      </span>
                      {reply.date && (
                        <span className="text-[11px] text-gray-400 font-medium shrink-0">
                          {reply.date}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-gray-600 leading-relaxed font-medium">
                      {reply.content}
                    </p>
                    {isPending && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleVisitorReplyStatus(reply.id, "approved")}
                          disabled={updatingReplyId === reply.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-[12px] font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVisitorReplyStatus(reply.id, "rejected")}
                          disabled={updatingReplyId === reply.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-[12px] font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4">
            <SectionTitle>Reply publicly</SectionTitle>
            <div className="relative">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply to this review..."
                rows={5}
                className="w-full p-4 pr-36 pb-14 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 leading-relaxed focus:ring-4 focus:ring-[#F5B800]/10 focus:border-[#F5B800]/40 outline-none transition-all resize-none placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={handlePostReply}
                disabled={isSubmitting || !replyText.trim() || replyUnchanged}
                className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-[#1D2939] text-white rounded-xl text-[13px] font-bold hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 transition-all"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmitting ? "animate-pulse" : ""}`} />
                {isSubmitting ? "Saving…" : hasExistingReply ? "Edit reply" : "Send reply"}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#FAFAFA] border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onStatusUpdate(displayReview.id, "approved")}
            disabled={currentStatus === "approved"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-2xl text-[14px] font-bold hover:bg-emerald-600 transition-all disabled:opacity-100 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            {currentStatus === "approved" ? "Approved" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => onStatusUpdate(displayReview.id, "rejected")}
            disabled={currentStatus === "rejected"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-2xl text-[14px] font-bold hover:bg-red-600 transition-all disabled:opacity-100 disabled:cursor-not-allowed"
          >
            <XIcon className="w-4 h-4" />
            {currentStatus === "rejected" ? "Rejected" : "Reject"}
          </button>
          <button
            type="button"
            onClick={() => onStatusUpdate(displayReview.id, "spam")}
            disabled={currentStatus === "spam"}
            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-50"
            aria-label="Mark as spam"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(displayReview.id)}
            className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
            aria-label="Delete review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorReplyDrawer;
