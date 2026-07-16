import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../../../axiosClient";
import { logApiError, resolveApiError } from "../../../../../utils/apiError";

export const defaultDashboardStats = {
  total_reviews: 0,
  average_rating: 0,
  conversion_rate: 0,
  pending_reviews: 0,
  requests_sent: 0,
  media_reviews: 0,
  review_growth: {
    days: 30,
    reviews: [],
    requests: [],
    max_y: 4,
    grid: [0, 1, 2, 3, 4],
  },
  rating_distribution: {
    total: 0,
    average: 0,
    rows: [],
  },
  recent_activity: [],
  top_products: [],
  deltas: {},
};

const rangeToDays = (range) => {
  if (range === "7 Days") return 7;
  if (range === "90 Days") return 90;
  return 30;
};

export const useDashboardStats = (range) => {
  const [stats, setStats] = useState(defaultDashboardStats);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadErrorIsNetwork, setLoadErrorIsNetwork] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setLoadErrorIsNetwork(false);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_fetch_dashboard_stats",
        days: rangeToDays(range),
      });
      if (response.data?.success && response.data?.data?.stats) {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      logApiError(err, "Failed to load dashboard stats");
      const resolved = resolveApiError(err, "Could not load dashboard stats.");
      setLoadError(resolved.message);
      setLoadErrorIsNetwork(resolved.isNetwork);
      setStats(defaultDashboardStats);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, loadError, loadErrorIsNetwork, refresh: load };
};

export { formatNumber as formatStatNumber } from "../../../../../utils/formatNumber";
export { formatShortElapsedTime as formatTimeAgo } from "../../../../../utils/formatDate";
