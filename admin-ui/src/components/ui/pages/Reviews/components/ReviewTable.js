import { useMemo } from "react";
import ReviewRow from "./ReviewRow";
import VisitorReplyRow from "./VisitorReplyRow";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ShimmerTableSkeleton } from "../../../Shimmer";

const getPendingVisitorReplies = (row) =>
  (row?.user_replies || []).filter(
    (r) => String(r.status || "").toLowerCase() === "pending"
  );

const getDisplayVisitorReplies = (row, statusFilter) => {
  const replies = (row?.user_replies || []).filter(
    (r) => String(r.status || "pending").toLowerCase() !== "approved"
  );
  return filterVisitorReplies(replies, statusFilter);
};

const filterVisitorReplies = (replies, statusFilter) => {
  if (!statusFilter || statusFilter === "all") return replies;
  return replies.filter(
    (r) => String(r.status || "pending").toLowerCase() === statusFilter.toLowerCase()
  );
};

const buildTableRows = (reviews, activeTab, visitorReplyStatusFilter = "all") => {
  if (activeTab === "CustomerReplies") {
    return reviews.flatMap((parent) => {
      const replies = getDisplayVisitorReplies(parent, visitorReplyStatusFilter);
      const rows = [
        {
          type: "review",
          key: `parent-${parent.id}`,
          row: parent,
          threadParent: true,
        },
      ];
      replies.forEach((reply) => {
        rows.push({
          type: "visitor_reply",
          key: `vr-${parent.id}-${reply.id}`,
          parent,
          reply,
        });
      });
      return rows;
    });
  }

  return reviews.map((parent) => ({
    type: "review",
    key: String(parent.id),
    row: parent,
  }));
};

const ReviewTable = ({
  reviews,
  loading,
  selectedReviews,
  toggleSelection,
  toggleAllSelections,
  onOpenDrawer,
  onUserReplyStatusUpdate,
  totalItems,
  currentPage,
  setCurrentPage,
  totalPages,
  activeTab,
  visitorReplyStatusFilter = "all",
}) => {
  const { assetsUrl } = window.hyokaData || {};
  const isVisitorRepliesTab = activeTab === "CustomerReplies";
  const tableRows = useMemo(
    () => buildTableRows(reviews, activeTab, visitorReplyStatusFilter),
    [reviews, activeTab, visitorReplyStatusFilter]
  );
  const reviewOnlyRows = reviews;
  const isAllSelected =
    reviewOnlyRows.length > 0 && selectedReviews.length === reviewOnlyRows.length;
  const perPage = 10;
  const startItem = tableRows.length ? (currentPage - 1) * perPage + 1 : 0;
  const endItem = Math.min(currentPage * perPage, totalItems);

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "Pending":
        return "No pending reviews found";
      case "Rejected":
        return "No rejected reviews found";
      case "Spam":
        return "No spam reviews found";
      case "Approved":
        return "No approved reviews found";
      case "CustomerReplies":
        return "No visitor replies waiting for approval";
      default:
        return "No reviews found";
    }
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const total = totalPages || 1;
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const headerColumns = [
    { key: "check", width: "w-8 flex-shrink-0", label: "", center: false, divider: false },
    { key: "product", width: "w-[19%] min-w-[160px]", label: "Product" },
    { key: "name", width: "w-[11%]", label: "Name" },
    { key: "review", width: "flex-1", label: "Review" },
    { key: "rating", width: "w-[8%]", label: "Rating", center: true },
    { key: "media", width: "w-[8%]", label: "Media", center: true },
    { key: "source", width: "w-[8%]", label: "Source", center: true, visitorHidden: true },
    { key: "date", width: "w-[10%]", label: "Date" },
    { key: "status", width: "w-[11%]", label: "Status", center: true },
    { key: "actions", width: "w-[4%]", label: "", divider: false },
  ];

  const visibleHeaderColumns = isVisitorRepliesTab
    ? headerColumns.filter((col) => !col.visitorHidden)
    : headerColumns;

  return (
    <div className="flex flex-col min-h-[400px]">
      {/* Column headers */}
      <div className="flex items-stretch px-4 border-t border-gray-300 bg-white/50 text-[11px] font-bold text-gray-700 uppercase tracking-widest">
        {visibleHeaderColumns.map((col, index) => {
          const showDivider =
            col.divider !== false && index < visibleHeaderColumns.length - 1;

          return (
            <div
              key={col.key}
              className={`${col.width} px-2 py-3 flex items-center relative ${
                col.center ? "justify-center" : ""
              }`}
            >
              {col.key === "check" && !isVisitorRepliesTab ? (
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAllSelections}
                    className="peer absolute opacity-0 w-0 h-0"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded border-2 transition-all flex items-center justify-center ${
                      isAllSelected
                        ? "border-[#F5B800] bg-[#FFF8E1]"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div
                      className={`transition-transform duration-200 ${
                        isAllSelected ? "scale-100" : "scale-0"
                      }`}
                    >
                      <Check className="w-3 h-3 text-black stroke-[3]" />
                    </div>
                  </div>
                </label>
              ) : (
                col.label
              )}
              {showDivider && (
                <span
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-[42%] w-px bg-gray-300"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {loading && <ShimmerTableSkeleton rows={8} className="py-4" />}

      {!loading && tableRows.length > 0 && (
        <table className="w-full border-separate border-spacing-0">
          <tbody>
            {tableRows.map((entry) =>
              entry.type === "visitor_reply" ? (
                <VisitorReplyRow
                  key={entry.key}
                  parent={entry.parent}
                  reply={entry.reply}
                  onOpenDrawer={onOpenDrawer}
                  onUserReplyStatusUpdate={onUserReplyStatusUpdate}
                />
              ) : (
                <ReviewRow
                  key={entry.key}
                  row={entry.row}
                  isSelected={selectedReviews.includes(entry.row.id)}
                  onToggle={toggleSelection}
                  onOpenDrawer={onOpenDrawer}
                  threadParent={entry.threadParent}
                  hideSource={isVisitorRepliesTab}
                />
              )
            )}
          </tbody>
        </table>
      )}

      {!loading && tableRows.length === 0 && (
        <div className="py-24 text-center bg-white rounded-2xl border border-gray-100">
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-5">
            <div className="w-60 h-60 shrink-0">
              <img
                src={`${assetsUrl}images/${isVisitorRepliesTab ? "visitorreplies.webp" : "productreview.webp"}`}
                alt={isVisitorRepliesTab ? "No visitor replies" : "No reviews"}
                className="w-full h-full object-contain select-none"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-xl font-bold text-[#1D2939]">{getEmptyMessage()}</h3>
              <p className="text-[#64748b] text-[14px] max-w-md mx-auto font-medium">
                {isVisitorRepliesTab
                  ? "Visitor replies will appear threaded under their parent review."
                  : "Reviews will show up here once customers submit them."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-6 pb-2">
        <div />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-full text-[13px] font-semibold transition-all ${
                page === currentPage
                  ? isVisitorRepliesTab
                    ? "bg-[#FFF9E5] text-black border border-[#F5E6B8]/60"
                    : "bg-[#F5B800] text-black"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-[13px] text-gray-500">
          <span className="font-medium text-gray-400">Rows</span>
          <span className="font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
            {perPage}
          </span>
          <span>
            {startItem}-{endItem} of {totalItems}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReviewTable;
