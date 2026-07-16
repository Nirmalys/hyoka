export const parseHyokaDate = (dateStr) => {
  if (!dateStr) return null;
  const normalized = String(dateStr).includes("T")
    ? String(dateStr)
    : `${String(dateStr).replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Elapsed time for review drawers and table rows (e.g. "3 days ago"). */
export const formatElapsedTime = (dateStr, fallback = "") => {
  const date = parseHyokaDate(dateStr);
  if (!date) return fallback || String(dateStr || "");

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;

  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) return `${minutes} min ago`;

  return "Just now";
};

/** Compact elapsed time for dashboard activity (e.g. "5m ago", "Yesterday"). */
export const formatShortElapsedTime = (value) => {
  const date = parseHyokaDate(value);
  if (!date) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
};

/** Email flow sent-on label (Today, Yesterday, etc.). */
export const formatSentOn = (dateStr, fallback = "—") => {
  const date = parseHyokaDate(dateStr);
  if (!date) return fallback;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday - startOfDate) / 86400000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
