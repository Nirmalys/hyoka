import axiosClient from "../../../../axiosClient";

const EXPORT_PAGE_SIZE = 200;

const viewLookup = {
  Questions: "questions",
  StoreReviews: "store_reviews",
  StoreReplies: "replies",
};

/**
 * Escape a value for CSV (RFC-style quoting).
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCsvCell(value) {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * @param {object} row Admin review row from API
 * @returns {string[]}
 */
export function reviewRowToCsvCells(row) {
  return [
    row.id,
    row.reviewer?.name ?? "",
    row.reviewer?.email ?? "",
    row.product?.name ?? "",
    row.product?.sku ?? "",
    row.rating ?? "",
    row.status ?? "",
    row.date ?? "",
    row.review?.title ?? "",
    row.review?.content ?? "",
    row.reply ?? "",
    row.store_review ?? "",
    row.reviewer?.verified ? "yes" : "no",
  ];
}

export const REVIEW_CSV_HEADERS = [
  "ID",
  "Reviewer",
  "Email",
  "Product",
  "SKU",
  "Rating",
  "Status",
  "Date",
  "Title",
  "Review",
  "Reply",
  "Store feedback",
  "Verified",
];

/**
 * @param {object[]} rows
 * @returns {string}
 */
export function buildReviewsCsv(rows) {
  const lines = [
    REVIEW_CSV_HEADERS.map(escapeCsvCell).join(","),
    ...rows.map((row) => reviewRowToCsvCells(row).map(escapeCsvCell).join(",")),
  ];
  return lines.join("\r\n");
}

/**
 * Trigger browser download of a CSV string.
 * @param {string} filename
 * @param {string} csvContent
 */
export function downloadCsvFile(filename, csvContent) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * @param {object} filters
 * @param {number} page
 * @param {number} perPage
 * @returns {Promise<{ reviews: object[], total: number }>}
 */
export async function fetchReviewsPage(filters, page, perPage = EXPORT_PAGE_SIZE) {
  const view = viewLookup[filters.activeTab] || "";
  const status = viewLookup[filters.activeTab] ? "All" : filters.activeTab;

  const response = await axiosClient.post("", {
    action: "hyoka_fetch_reviews",
    status,
    view,
    page,
    per_page: perPage,
    search: filters.searchQuery || "",
    rating: filters.ratingFilter || 0,
    orderby: filters.orderBy || "created_at",
    order: filters.order || "DESC",
    _ajax_nonce: window.hyokaData?.nonce || "",
  });

  const result = response.data;
  if (!result?.success || !result?.data) {
    throw new Error(result?.data?.message || "Could not load reviews for export.");
  }

  return {
    reviews: result.data.reviews || [],
    total: Number(result.data.total) || 0,
  };
}

/**
 * Fetch all reviews matching current list filters (paginated server requests).
 * @param {object} filters
 * @returns {Promise<object[]>}
 */
export async function fetchAllReviewsForExport(filters) {
  const all = [];
  let page = 1;
  let total = 0;

  do {
    const batch = await fetchReviewsPage(filters, page, EXPORT_PAGE_SIZE);
    total = batch.total;
    all.push(...batch.reviews);
    if (batch.reviews.length === 0) {
      break;
    }
    page += 1;
  } while (all.length < total);

  return all;
}

/**
 * Build a safe filename segment from tab label.
 * @param {string} activeTab
 */
function exportFilenameSegment(activeTab) {
  const safe = String(activeTab || "reviews")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return safe || "reviews";
}

/**
 * Export reviews to CSV and download.
 *
 * @param {object} options
 * @param {string} options.activeTab
 * @param {string} [options.searchQuery]
 * @param {number} [options.ratingFilter]
 * @param {string} [options.orderBy]
 * @param {string} [options.order]
 * @param {number[]} [options.selectedIds] If set, only these review IDs are exported (from fetched set).
 * @returns {Promise<{ count: number, filename: string }>}
 */
export async function exportReviewsToCsv(options) {
  const {
    activeTab,
    searchQuery = "",
    ratingFilter = 0,
    orderBy = "created_at",
    order = "DESC",
    selectedIds = null,
  } = options;

  const filters = { activeTab, searchQuery, ratingFilter, orderBy, order };
  let rows = await fetchAllReviewsForExport(filters);

  if (Array.isArray(selectedIds) && selectedIds.length > 0) {
    const idSet = new Set(selectedIds.map((id) => Number(id)));
    rows = rows.filter((row) => idSet.has(Number(row.id)));
  }

  if (rows.length === 0) {
    throw new Error(
      selectedIds?.length
        ? "No selected reviews to export."
        : "No reviews match the current filters."
    );
  }

  const csv = buildReviewsCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `hyoka-${exportFilenameSegment(activeTab)}-${stamp}.csv`;
  downloadCsvFile(filename, csv);

  return { count: rows.length, filename };
}
