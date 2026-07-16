import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Download, Loader2 } from "lucide-react";
import TypewriterSearchInput from "../../../TypewriterSearchInput";
import { useReviews } from "../hooks/useReviews";
import { useReviewExport } from "../hooks/useReviewExport";
import ReviewHeader from "./ReviewHeader";
import ReviewTable from "./ReviewTable";
import BulkActions from "./BulkActions";
import ReviewDrawer from "./ReviewDrawer";
import VisitorReplyDrawer from "./VisitorReplyDrawer";
import ReviewConfirmModal from "./ReviewConfirmModal";
import ApiErrorDisplay from "../../../ApiErrorDisplay";
import FilterPill from "./FilterPill";
import {
  RATING_OPTIONS,
  STATUS_OPTIONS,
  SORT_OPTIONS,
  SORT_MAP,
} from "../constants/filterOptions";

const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "widget", label: "Widget" },
  { value: "email", label: "Email" },
  { value: "manual", label: "Manual" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "30", label: "Last 30 days" },
  { value: "7", label: "Last 7 days" },
  { value: "90", label: "Last 90 days" },
];

const VISITOR_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const Review = () => {
  const [searchParams] = useSearchParams();
  const isVisitorTab = searchParams.get("tab") === "visitor";

  const {
    activeTab,
    setActiveTab,
    reviews,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    updateStatus,
    deleteReview,
    bulkUpdateStatus,
    bulkDeleteReviews,
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
    orderBy,
    setOrderBy,
    order,
    setOrder,
    loading,
    loadError,
    loadErrorIsNetwork,
    fetchReviews,
    updateUserReplies,
  } = useReviews();

  const { isExporting, exportError, exportErrorIsNetwork, exportReviews, clearExportError } = useReviewExport();
  const [drawerTarget, setDrawerTarget] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [visitorReplyStatusFilter, setVisitorReplyStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("newest");

  useEffect(() => {
    if (isVisitorTab) {
      setActiveTab("CustomerReplies");
    } else {
      setActiveTab((prev) => (prev === "CustomerReplies" ? "All" : prev));
    }
  }, [isVisitorTab, setActiveTab]);

  useEffect(() => {
    if (!isVisitorTab) return;
    const sort = SORT_MAP[sortKey] || SORT_MAP.newest;
    setOrderBy(sort.orderBy);
    setOrder(sort.order);
  }, [isVisitorTab, sortKey, setOrderBy, setOrder]);

  useEffect(() => {
    if (
      deleteDialog?.step === "success" &&
      drawerTarget?.id &&
      deleteDialog.ids?.includes(drawerTarget.id)
    ) {
      setDrawerTarget(null);
    }
  }, [deleteDialog, drawerTarget]);

  const handleReviewEditSuccess = (reviewId, title, content) => {
    setDrawerTarget((prev) =>
      prev && prev.id === reviewId
        ? { ...prev, review: { ...prev.review, title, content } }
        : prev
    );
    fetchReviews(false);
  };

  const handleReplySuccess = (reviewId, replyText) => {
    setDrawerTarget((prev) =>
      prev && prev.id === reviewId ? { ...prev, reply: replyText } : prev
    );
    fetchReviews(false);
  };

  const handleUserReplyStatusUpdate = (reviewId, userReplies) => {
    updateUserReplies(reviewId, userReplies);
    setDrawerTarget((prev) =>
      prev && prev.id === reviewId ? { ...prev, user_replies: userReplies } : prev
    );
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
        activeTab,
        searchQuery,
        ratingFilter,
        orderBy,
        order,
        selectedIds: selectedReviews.length > 0 ? selectedReviews : null,
      });
    } catch {
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#F5F5F5]">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-start justify-between px-8 pt-5 pb-0">
          <ReviewHeader isVisitorTab={isVisitorTab} />
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

            {!isVisitorTab && (
              <>
                <FilterPill
                  label="All Ratings"
                  value={ratingFilter}
                  options={RATING_OPTIONS}
                  onChange={(v) => setRatingFilter(Number(v))}
                />
                <FilterPill
                  label="Status"
                  value={activeTab}
                  options={STATUS_OPTIONS}
                  onChange={setActiveTab}
                />
                <FilterPill
                  label="All Sources"
                  value={sourceFilter}
                  options={SOURCE_OPTIONS}
                  onChange={setSourceFilter}
                />
                <FilterPill
                  label="Last 30 days"
                  value={dateFilter}
                  options={DATE_OPTIONS}
                  onChange={setDateFilter}
                />
              </>
            )}

            {isVisitorTab && (
              <>
                <FilterPill
                  label="Status"
                  value={visitorReplyStatusFilter}
                  options={VISITOR_STATUS_OPTIONS}
                  onChange={setVisitorReplyStatusFilter}
                />
                <FilterPill
                  label="Newest"
                  value={sortKey}
                  options={SORT_OPTIONS}
                  onChange={setSortKey}
                />
              </>
            )}
          </div>

          <div className="mb-3">
            {!isVisitorTab && (
            <BulkActions
              selectedCount={selectedReviews.length}
              onClear={clearSelections}
              onApprove={() => bulkUpdateStatus(selectedReviews, "approved")}
              onReject={() => bulkUpdateStatus(selectedReviews, "rejected")}
              onSpam={() => bulkUpdateStatus(selectedReviews, "spam")}
              onDelete={() => bulkDeleteReviews(selectedReviews)}
            />
            )}
          </div>

          <ReviewTable
            reviews={reviews}
            loading={loading}
            selectedReviews={selectedReviews}
            toggleSelection={toggleSelection}
            toggleAllSelections={toggleAllSelections}
            onOpenDrawer={setDrawerTarget}
            onUserReplyStatusUpdate={handleUserReplyStatusUpdate}
            totalItems={totalItems}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            activeTab={activeTab}
            visitorReplyStatusFilter={visitorReplyStatusFilter}
          />
        </div>
      </div>

      <ReviewDrawer
        review={!isVisitorTab ? drawerTarget : null}
        onClose={() => setDrawerTarget(null)}
        onStatusUpdate={handleDrawerStatusUpdate}
        onReviewEditSuccess={handleReviewEditSuccess}
        onDelete={handleDrawerDelete}
        onNavigate={handleDrawerNavigate}
        hasPrev={drawerIndex > 0}
        hasNext={drawerIndex >= 0 && drawerIndex < reviews.length - 1}
      />

      <VisitorReplyDrawer
        review={isVisitorTab ? drawerTarget : null}
        onClose={() => setDrawerTarget(null)}
        onStatusUpdate={handleDrawerStatusUpdate}
        onReplySuccess={handleReplySuccess}
        onUserReplyStatusUpdate={handleUserReplyStatusUpdate}
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

export default Review;
