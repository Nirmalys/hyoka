import { useState, useEffect, useMemo } from "react";
import axiosClient from "../../../../axiosClient";
import { logApiError, resolveApiError } from "../../../../../utils/apiError";

const DEFAULT_SKIP_FETCH_ON_TABS = Object.freeze([]);

export const useReviews = (initialView = "", options = {}) => {
  const { enabled = true, skipFetchOnTabs = DEFAULT_SKIP_FETCH_ON_TABS } = options;
  const skipFetchOnTabsKey = skipFetchOnTabs.join("\0");
  const skipFetchOnTabsSet = useMemo(
    () => new Set(skipFetchOnTabs),
    [skipFetchOnTabsKey]
  );
  const [activeTab, setActiveTab] = useState(initialView === "questions" ? "Questions" : "All");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadErrorIsNetwork, setLoadErrorIsNetwork] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderBy, setOrderBy] = useState("created_at");
  const [order, setOrder] = useState("DESC");
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState({ All: 0, Pending: 0, Approved: 0, Rejected: 0, Spam: 0, CustomerReplies: 0, Questions: 0, StoreReviews: 0, StoreReplies: 0, EmailDetails: 0 });
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedReviews([]);
  }, [activeTab, searchQuery, ratingFilter, statusFilter, orderBy, order]);

  const toggleSelection = (id) => {
    setSelectedReviews(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelections = () => {
    if (selectedReviews.length === reviews.length && reviews.length > 0) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(r => r.id));
    }
  };

  const clearSelections = () => setSelectedReviews([]);

  const tabs = initialView === "questions" ? [
    { name: "Questions", label: "Customer Questions", count: counts.Questions?.toString() || "0" },
    { name: "StoreReviews", label: "Store Reviews", count: counts.StoreReviews?.toString() || "0" },
    { name: "StoreReplies", label: "Store Replies", count: counts.StoreReplies?.toString() || "0" },
  ] : [
    { name: "All", label: "All", count: counts.All?.toString() || "0" },
    { name: "Pending", label: "Pending", count: counts.Pending?.toString() || "0" },
    { name: "CustomerReplies", label: "Visitor Replies", count: counts.CustomerReplies?.toString() || "0" },
    { name: "Approved", label: "Approved", count: counts.Approved?.toString() || "0" },
    { name: "Rejected", label: "Rejected", count: counts.Rejected?.toString() || "0" },
    { name: "Spam", label: "Spam", count: counts.Spam?.toString() || "0" },
  ];

  const fetchReviews = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError("");
    setLoadErrorIsNetwork(false);
    try {
      const viewLookup = {
        'Questions': 'questions',
        'StoreReviews': 'store_reviews',
        'StoreReplies': 'replies',
        'CustomerReplies': 'customer_replies',
      };
      const view = viewLookup[activeTab] || "";
      const response = await axiosClient.post("", {
        action: 'hyoka_fetch_reviews',
        status: viewLookup[activeTab] ? statusFilter : activeTab,
        view: view,
        page: currentPage,
        search: searchQuery,
        rating: ratingFilter,
        orderby: orderBy,
        order: order,
        per_page: itemsPerPage,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });
      
      const result = response.data;
      if (result.success && result.data.reviews) {
        setReviews(result.data.reviews);
        if (result.data.total !== undefined) setTotalItems(result.data.total);
        if (result.data.counts) setCounts(result.data.counts);
      }
    } catch (error) {
      logApiError(error, "Failed to fetch reviews");
      const resolved = resolveApiError(error, "Failed to load reviews.");
      setLoadError(resolved.message);
      setLoadErrorIsNetwork(resolved.isNetwork);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || skipFetchOnTabsSet.has(activeTab)) {
      setLoading(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      fetchReviews(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [enabled, skipFetchOnTabsKey, activeTab, currentPage, searchQuery, ratingFilter, statusFilter, orderBy, order]);

  const updateStatus = async (reviewId, newStatus) => {
    // Optimistic Update
    const previousReviews = [...reviews];
    const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    
    setReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, status: formattedStatus } : r
    ));

    try {
      const response = await axiosClient.post("", {
        action: 'hyoka_update_review_status',
        review_id: reviewId,
        status: newStatus,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });

      if (!response.data.success) {
        // Rollback
        setReviews(previousReviews);
        alert(response.data.data?.message || "Failed to update review status.");
      }
    } catch (error) {
      setReviews(previousReviews);
      logApiError(error, "Failed to update status");
    }
  };

  const requestDeleteReviews = (reviewIds) => {
    const ids = Array.isArray(reviewIds) ? reviewIds.filter(Boolean) : [];
    if (ids.length === 0) return;
    setDeleteDialog({ step: "confirm", ids });
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) return;
    setDeleteDialog(null);
  };

  const confirmDeleteReviews = async () => {
    const ids = deleteDialog?.ids;
    if (!ids?.length) return;

    setDeleteLoading(true);
    try {
      const response = await axiosClient.post("", {
        action:
          ids.length === 1
            ? "hyoka_delete_review"
            : "hyoka_bulk_delete_reviews",
        ...(ids.length === 1
          ? { review_id: ids[0] }
          : { review_ids: ids }),
        _ajax_nonce: window.hyokaData?.nonce || "",
      });

      if (response.data?.success) {
        const msg =
          response.data?.data?.message ||
          (ids.length === 1
            ? "Review deleted successfully."
            : `${ids.length} reviews deleted successfully.`);
        setDeleteDialog({ step: "success", ids, message: msg });
        setSelectedReviews((prev) => prev.filter((id) => !ids.includes(id)));
        fetchReviews(false);
      } else {
        setDeleteDialog({
          step: "error",
          ids,
          message:
            response.data?.data?.message || "Failed to delete review(s).",
        });
      }
    } catch (error) {
      logApiError(error, "Failed to delete review");
      const resolved = resolveApiError(error, "Failed to delete review(s). Please try again.");
      setDeleteDialog({
        step: "error",
        ids,
        message: resolved.message,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteReview = (reviewId) => requestDeleteReviews([reviewId]);

  const bulkUpdateStatus = async (reviewIds, newStatus) => {
    try {
      const response = await axiosClient.post("", {
        action: 'hyoka_bulk_update_status',
        review_ids: reviewIds,
        status: newStatus,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });

      if (response.data.success) {
        fetchReviews();
        setSelectedReviews([]);
      } else {
        alert(response.data.data?.message || "Failed to update reviews.");
      }
    } catch (error) {
      logApiError(error, "Bulk update failed");
    }
  };

  const bulkDeleteReviews = (reviewIds) => requestDeleteReviews(reviewIds);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Approved": return "bg-green-50 text-green-700 border-green-100";
      case "Pending": return "bg-orange-50 text-orange-700 border-orange-100";
      case "Rejected": return "bg-red-50 text-red-700 border-red-100";
      case "Spam": return "bg-gray-50 text-gray-700 border-gray-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const itemsPerPage =
    Number(window.hyokaData?.reviewsPerPage) > 0
      ? Number(window.hyokaData.reviewsPerPage)
      : 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const updateUserReplies = (reviewId, userReplies) => {
    setReviews((prev) => {
      const previous = prev.find((review) => review.id === reviewId);
      const countPending = (replies) =>
        (replies || []).filter(
          (reply) => String(reply.status || "pending").toLowerCase() === "pending"
        ).length;
      const delta = countPending(userReplies) - countPending(previous?.user_replies);

      if (delta !== 0) {
        setCounts((counts) => ({
          ...counts,
          CustomerReplies: Math.max(0, (counts.CustomerReplies || 0) + delta),
        }));
      }

      return prev.map((review) =>
        review.id === reviewId ? { ...review, user_replies: userReplies } : review
      );
    });
  };

  return {
    activeTab,
    setActiveTab,
    tabs,
    reviews,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    loading,
    loadError,
    loadErrorIsNetwork,
    getStatusStyle,
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
    statusFilter,
    setStatusFilter,
    orderBy,
    setOrderBy,
    order,
    setOrder,
    fetchReviews,
    counts,
    updateUserReplies,
  };
};
