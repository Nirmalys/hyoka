export const RATING_OPTIONS = [
  { value: 0, label: "All Ratings" },
  { value: 5, label: "5 Stars" },
  { value: 4, label: "4 Stars" },
  { value: 3, label: "3 Stars" },
  { value: 2, label: "2 Stars" },
  { value: 1, label: "1 Star" },
];

export const STATUS_OPTIONS = [
  { value: "All", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Spam", label: "Spam" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "rating_high", label: "Highest Rating" },
  { value: "rating_low", label: "Lowest Rating" },
];

export const SORT_MAP = {
  newest: { orderBy: "created_at", order: "DESC" },
  oldest: { orderBy: "created_at", order: "ASC" },
  rating_high: { orderBy: "rating", order: "DESC" },
  rating_low: { orderBy: "rating", order: "ASC" },
};
