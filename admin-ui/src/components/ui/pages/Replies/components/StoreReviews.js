import { useState, useEffect } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import TypewriterSearchInput from "../../../TypewriterSearchInput";
import FilterPill from "../../Reviews/components/FilterPill";
import BulkActions from "../../Reviews/components/BulkActions";
import ReviewConfirmModal from "../../Reviews/components/ReviewConfirmModal";
import StoreReviewTable from "./StoreReviewTable";
import StoreReviewDrawer from "./StoreReviewDrawer";
import { useReviews } from "../../Reviews/hooks/useReviews";
import { useReviewExport } from "../../Reviews/hooks/useReviewExport";
import ApiErrorDisplay from "../../../ApiErrorDisplay";

import {
  RATING_OPTIONS,
  STATUS_OPTIONS,
  SORT_OPTIONS,
  SORT_MAP,
} from "../../Reviews/constants/filterOptions";

const StoreReviews = () => {
  const {
    setActiveTab,
    reviews,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    bulkUpdateStatus,
    bulkDeleteReviews,
    updateStatus,
    deleteReview,
    deleteDialog,
    deleteLoading,
    closeDeleteDialog,
    confirmDeleteReviews,
    selectedReviews,
    toggleSelection,
    toggleAllSelections,
    clearSelections,
    searchQuery,
    setSearchQuery,
    ratingFilter,
    setRatingFilter,
    statusFilter,
    setStatusFilter,
    orderBy,
    setOrderBy,
    order,
    setOrder,
    loading,
    loadError,
    loadErrorIsNetwork,
    fetchReviews,
  } = useReviews("questions");

  const { isExporting, exportError, exportErrorIsNetwork, exportReviews, clearExportError } = useReviewExport();
  const [sortKey, setSortKey] = useState("newest");
  const [drawerTarget, setDrawerTarget] = useState(null);

  useEffect(() => {
    setActiveTab("StoreReviews");
  }, [setActiveTab]);

  useEffect(() => {
    const sort = SORT_MAP[sortKey] || SORT_MAP.newest;
    setOrderBy(sort.orderBy);
    setOrder(sort.order);
  }, [sortKey, setOrderBy, setOrder]);

  useEffect(() => {
    if (
      deleteDialog?.step === "success" &&
      drawerTarget?.id &&
      deleteDialog.ids?.includes(drawerTarget.id)
    ) {
      setDrawerTarget(null);
    }
  }, [deleteDialog, drawerTarget]);

  const handleReplySuccess = (reviewId, replyText) => {
    setDrawerTarget((prev) => (prev ? { ...prev, reply: replyText } : null));
    fetchReviews(false);
  };

  const handleDrawerStatusUpdate = async (reviewId, newStatus) => {
    await updateStatus(reviewId, newStatus);
    const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    setDrawerTarget((prev) =>
      prev && prev.id === reviewId ? { ...prev, status: formattedStatus } : prev
    );
    fetchReviews(false);
  };

  const drawerIndex = drawerTarget
    ? reviews.findIndex((r) => r.id === drawerTarget.id)
    : -1;

  const handleDrawerNavigate = (direction) => {
    if (drawerIndex < 0) return;
    const nextIndex = direction === "prev" ? drawerIndex - 1 : drawerIndex + 1;
    if (nextIndex >= 0 && nextIndex < reviews.length) {
      setDrawerTarget(reviews[nextIndex]);
    }
  };

  const handleDrawerDelete = (reviewId) => {
    deleteReview(reviewId);
  };

  const handleExport = async () => {
    clearExportError();
    try {
      await exportReviews({
        activeTab: "StoreReviews",
        searchQuery,
        ratingFilter,
        orderBy,
        order,
        selectedIds: selectedReviews.length > 0 ? selectedReviews : null,
      });
    } catch {
      // exportError set in hook
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-start justify-between px-8 pt-5 pb-0">
          <div>
            <div className="text-[22px] font-bold text-black leading-none">Store Reviews</div>
            <div className="text-[13px] text-gray-400 font-medium leading-none mt-1.5">
              Monitor all customer reviews about the overall shopping experience.
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || loading}
              className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold text-black bg-[#F5B800] rounded-xl hover:bg-[#E5A800] transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>

        <div className="px-8 py-5">
          {(loadError || exportError) && !loading ? (
            <ApiErrorDisplay
              message={loadError || exportError}
              isNetwork={loadError ? loadErrorIsNetwork : exportErrorIsNetwork}
              onRetry={
                loadError && loadErrorIsNetwork
                  ? () => fetchReviews(true)
                  : exportError && exportErrorIsNetwork
                    ? clearExportError
                    : undefined
              }
              className="mb-5"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <TypewriterSearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />

            <FilterPill
              label="All Ratings"
              value={ratingFilter}
              options={RATING_OPTIONS}
              onChange={(v) => setRatingFilter(Number(v))}
            />
            <FilterPill
              label="Status"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
            <FilterPill
              label="Newest"
              value={sortKey}
              options={SORT_OPTIONS}
              onChange={setSortKey}
            />
          </div>

          <div className="mb-3">
            <BulkActions
              selectedCount={selectedReviews.length}
              onClear={clearSelections}
              onApprove={() => bulkUpdateStatus(selectedReviews, "approved")}
              onReject={() => bulkUpdateStatus(selectedReviews, "rejected")}
              onSpam={() => bulkUpdateStatus(selectedReviews, "spam")}
              onDelete={() => bulkDeleteReviews(selectedReviews)}
            />
          </div>

          <StoreReviewTable
            reviews={reviews}
            loading={loading}
            selectedReviews={selectedReviews}
            toggleSelection={toggleSelection}
            toggleAllSelections={toggleAllSelections}
            onOpenDrawer={setDrawerTarget}
            totalItems={totalItems}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          />
        </div>
      </div>

      <StoreReviewDrawer
        review={drawerTarget}
        onClose={() => setDrawerTarget(null)}
        onReplySuccess={handleReplySuccess}
        onStatusUpdate={handleDrawerStatusUpdate}
        onDelete={handleDrawerDelete}
        onNavigate={handleDrawerNavigate}
        hasPrev={drawerIndex > 0}
        hasNext={drawerIndex >= 0 && drawerIndex < reviews.length - 1}
      />

      <ReviewConfirmModal
        open={!!deleteDialog}
        step={deleteDialog?.step || "confirm"}
        count={deleteDialog?.ids?.length || 0}
        message={deleteDialog?.message || ""}
        loading={deleteLoading}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDeleteReviews}
        onDismiss={closeDeleteDialog}
      />
    </div>
  );
};

export default StoreReviews;
