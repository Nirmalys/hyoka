import { useState, useEffect, useLayoutEffect } from "react";
import { logApiError } from "../../../../../utils/apiError";
import {
  X,
  Star,
  Check,
  X as XIcon,
  AlertOctagon,
  Pencil,
  History,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import axiosClient from "../../../../axiosClient";
import { formatElapsedTime } from "../../../../../utils/formatDate";
import {
  DRAWER_CLOSE_MS,
  getReviewStatusBanner,
  SectionTitle,
  DrawerStatusBadge,
} from "../../../shared/reviewDrawerShared";

const getMediaCounts = (media = []) => {
  let photos = 0;
  let videos = 0;
  media.forEach((item) => {
    if (String(item.type || "").toLowerCase() === "video") videos += 1;
    else photos += 1;
  });
  return { photos, videos };
};

const ReviewDrawer = ({
  onClose,
  review,
  onStatusUpdate,
  onReviewEditSuccess,
  onDelete,
  onNavigate,
  hasPrev = false,
  hasNext = false,
}) => {
  const [activeReview, setActiveReview] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewEditError, setReviewEditError] = useState("");
  const [auditEntries, setAuditEntries] = useState([]);

  const displayReview = activeReview || review;

  const fetchAuditEntries = async (reviewId) => {
    try {
      const response = await axiosClient.get("", {
        params: {
          action: "hyoka_fetch_review_audit",
          review_id: reviewId,
          _ajax_nonce: window.hyokaData?.nonce || "",
        },
      });
      if (response.data.success) {
        setAuditEntries(response.data.data.entries || []);
      }
    } catch (error) {
      logApiError(error, "Failed to fetch audit entries");
    }
  };

  useLayoutEffect(() => {
    if (!review) {
      setVisible(false);
      return;
    }

    setActiveReview(review);
    setEditTitle(review.review?.title || "");
    setEditContent(review.review?.content || "");
    setIsEditingReview(false);
    setReviewEditError("");
    setAuditEntries([]);
    setVisible(false);

    if (review.edited) {
      fetchAuditEntries(review.id);
    }

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

  const startEditingReview = () => {
    setEditTitle(displayReview.review?.title || "");
    setEditContent(displayReview.review?.content || "");
    setReviewEditError("");
    setIsEditingReview(true);
  };

  const cancelEditingReview = () => {
    setEditTitle(displayReview.review?.title || "");
    setEditContent(displayReview.review?.content || "");
    setReviewEditError("");
    setIsEditingReview(false);
  };

  const handleSaveReviewEdit = async () => {
    const title = editTitle.trim();
    const content = editContent.trim();
    if (!content) {
      setReviewEditError("Review text cannot be empty.");
      return;
    }

    setIsSavingReview(true);
    setReviewEditError("");
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_edit_review",
        review_id: displayReview.id,
        content,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });

      if (response.data?.success) {
        const nowIso = new Date().toISOString();
        const updated = {
          ...displayReview,
          review: {
            ...displayReview.review,
            content,
          },
          edited: true,
          edited_at: nowIso,
          edit_count: (displayReview.edit_count || 0) + 1,
          edited_by_name: window.hyokaData?.currentUserName || displayReview.edited_by_name,
        };
        setActiveReview(updated);
        setIsEditingReview(false);
        onReviewEditSuccess?.(displayReview.id, title, content);
        fetchAuditEntries(displayReview.id);
      } else {
        setReviewEditError(response.data?.data?.message || "Failed to save review.");
      }
    } catch (error) {
      logApiError(error, "Failed to save review");
      setReviewEditError("Failed to save review.");
    } finally {
      setIsSavingReview(false);
    }
  };

  const reviewUnchanged =
    editTitle.trim() === (displayReview.review?.title || "").trim() &&
    editContent.trim() === (displayReview.review?.content || "").trim();

  const currentStatus = displayReview.status.toLowerCase();
  const statusBanner = getReviewStatusBanner(displayReview.status, "product");
  const { photos, videos } = getMediaCounts(displayReview.media);
  const timeAgo = formatElapsedTime(displayReview.created_at) || displayReview.date;
  const productIdLabel = displayReview.product?.id
    ? `ProductID#${displayReview.product.id}`
    : "";
  const avgRating = Number(displayReview.product?.avg_rating || 0).toFixed(1);
  const reviewCount = displayReview.product?.review_count || 0;

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
        {/* Header */}
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
          {/* Status banner */}
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

          {/* Product */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                {displayReview.product?.image ? (
                  <img
                    src={displayReview.product.image}
                    alt={displayReview.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300">
                    N/A
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-[#1D2939] truncate">
                  {displayReview.product?.name || "Unknown Product"}
                </div>
                {productIdLabel && (
                  <p className="text-[11px] text-[#757575] font-medium mt-0.5">{productIdLabel}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-gray-500 font-medium">
                  <Star className="w-3.5 h-3.5 fill-[#F5B800] text-[#F5B800]" />
                  <span>
                    {avgRating} avg · {reviewCount} review{reviewCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              {displayReview.product?.url && (
                <a
                  href={displayReview.product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-bold text-[#1D2939] hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                >
                  Open
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="px-6 pt-2.5 pb-4 border-b border-gray-200">
            <SectionTitle>Customer</SectionTitle>
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#FFF4E0] text-[#B8860B] flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                  {displayReview.reviewer.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-[#1D2939] truncate">
                    {displayReview.reviewer.name}
                  </p>
                  <p className="text-[13px] text-[#757575] font-medium truncate">
                    {displayReview.reviewer.email || "No email provided"}
                  </p>
                </div>
              </div>
          </div>

          {/* Customer review */}
          <div className="px-6 pt-2.5 pb-4">
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

              {isEditingReview ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Review title"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-[15px] font-bold text-[#1D2939] focus:border-[#F5B800]/50 focus:ring-4 focus:ring-[#F5B800]/10 outline-none"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    placeholder="Review text"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-medium text-gray-600 leading-relaxed focus:border-[#F5B800]/50 focus:ring-4 focus:ring-[#F5B800]/10 outline-none resize-y min-h-[140px]"
                  />
                  {reviewEditError && (
                    <p className="text-sm font-semibold text-red-600">{reviewEditError}</p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditingReview}
                      disabled={isSavingReview}
                      className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReviewEdit}
                      disabled={isSavingReview || !editContent.trim() || reviewUnchanged}
                      className="px-5 py-2 bg-[#F5B800] text-black rounded-xl text-sm font-bold hover:bg-[#E5A800] disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                    >
                      {isSavingReview ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayReview.review?.title && (
                    <div className="text-[18px] font-bold text-[#1D2939] leading-snug">
                      {displayReview.review.title}
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-[14px] text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                      {displayReview.review.content}
                    </p>
                    <button
                      type="button"
                      onClick={startEditingReview}
                      className="shrink-0 p-1.5 text-gray-400 rounded-lg hover:bg-gray-50 hover:text-gray-600 transition-colors"
                      aria-label="Edit review"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {displayReview.edited && (
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Edited {displayReview.edited_by_name ? `by ${displayReview.edited_by_name}` : ""}
                      </p>
                      {auditEntries.map((entry, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wide mb-1.5">
                            <History className="w-3 h-3" />
                            Original content
                          </div>
                          <p className="text-[12px] text-gray-500 italic leading-relaxed line-clamp-3">
                            &ldquo;{entry.before?.content}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

          </div>

          {displayReview.media?.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="space-y-3">
                <div className="text-[12px] text-gray-400 font-medium">
                  Media · {photos} photo{photos === 1 ? "" : "s"}
                  {videos > 0 ? ` · ${videos} video${videos === 1 ? "" : "s"}` : ""}
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayReview.media.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="w-[72px] h-[72px] rounded-xl bg-white overflow-hidden border border-gray-200"
                    >
                      {String(item.type || "").toLowerCase() === "video" ? (
                        <video
                          src={item.url}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={item.url}
                            alt="Review media"
                            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                          />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#FAFAFA] border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onStatusUpdate(displayReview.id, "approved")}
            disabled={currentStatus === "approved"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-2xl text-[14px] font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => onStatusUpdate(displayReview.id, "rejected")}
            disabled={currentStatus === "rejected"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-2xl text-[14px] font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XIcon className="w-4 h-4" />
            Reject
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

export default ReviewDrawer;
