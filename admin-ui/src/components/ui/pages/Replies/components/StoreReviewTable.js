import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import StoreReviewRow from "./StoreReviewRow";
import { ShimmerTableSkeleton } from "../../../Shimmer";

const HEADER_COLUMNS = [
  { key: "check", width: "w-8 shrink-0", label: "", center: false, divider: false },
  { key: "name", width: "w-[13%] min-w-[110px]", label: "Name" },
  { key: "review", width: "flex-1", label: "Review" },
  { key: "rating", width: "w-[8%] min-w-[72px]", label: "Rating", center: true },
  { key: "date", width: "w-[9%] min-w-[84px]", label: "Date" },
  { key: "storeReply", width: "w-[16%] min-w-[130px]", label: "Store Reply" },
  { key: "status", width: "w-[11%] min-w-[108px]", label: "Status", center: true },
  { key: "actions", width: "w-[14%] min-w-[120px]", label: "Actions", center: true, divider: false },
];

const StoreReviewTable = ({
  reviews,
  loading,
  selectedReviews,
  toggleSelection,
  toggleAllSelections,
  onOpenDrawer,
  totalItems,
  currentPage,
  setCurrentPage,
  totalPages,
}) => {
  const { assetsUrl } = window.hyokaData || {};
  const isAllSelected =
    reviews.length > 0 && selectedReviews.length === reviews.length;
  const perPage =
    Number(window.hyokaData?.reviewsPerPage) > 0
      ? Number(window.hyokaData.reviewsPerPage)
      : 20;
  const startItem = reviews.length ? (currentPage - 1) * perPage + 1 : 0;
  const endItem = Math.min(currentPage * perPage, totalItems);

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

  return (
    <div className="flex flex-col min-h-[400px]">
      <div className="flex items-stretch px-4 border-t border-gray-300 bg-white/50 text-[11px] font-bold text-gray-700 uppercase tracking-widest overflow-hidden">
        {HEADER_COLUMNS.map((col, index) => {
          const showDivider =
            col.divider !== false && index < HEADER_COLUMNS.length - 1;

          return (
            <div
              key={col.key}
              className={`${col.width} px-2 py-3 flex items-center relative min-w-0 overflow-hidden ${
                col.center ? "justify-center" : ""
              } ${col.key === "review" ? "shrink" : "shrink-0"}`}
            >
              {col.key === "check" ? (
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

      {!loading && reviews.length > 0 && (
        <table className="w-full border-separate border-spacing-0 table-fixed">
          <tbody>
            {reviews.map((review) => (
              <StoreReviewRow
                key={review.id}
                review={review}
                isSelected={selectedReviews.includes(review.id)}
                onToggle={toggleSelection}
                onOpenDrawer={onOpenDrawer}
              />
            ))}
          </tbody>
        </table>
      )}

      {!loading && reviews.length === 0 && (
        <div className="py-24 text-center bg-white rounded-2xl border border-gray-100 mt-2">
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-5">
            <div className="w-60 h-60 shrink-0">
              <img
                src={`${assetsUrl}images/storereview.webp`}
                alt="No store reviews"
                className="w-full h-full object-contain select-none"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-xl font-bold text-[#1D2939]">No store reviews yet</h3>
              <p className="text-[#64748b] text-[14px] max-w-md mx-auto font-medium">
                Customer reviews about your store will appear here.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && reviews.length > 0 && (
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
                    ? "bg-white text-black shadow-sm border border-gray-200"
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
      )}
    </div>
  );
};

export default StoreReviewTable;
