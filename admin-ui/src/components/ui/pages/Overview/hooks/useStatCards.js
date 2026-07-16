import { useMemo } from "react";
import {
  Star,
  TrendingUp,
  Clock,
  Send,
  Image as ImageIcon,
  Mail,
} from "lucide-react";
import { formatStatNumber } from "./useDashboardStats";

export const useStatCards = (stats) =>
  useMemo(() => {
    const deltas = stats.deltas || {};
    return [
      {
        label: "Total Reviews",
        value: formatStatNumber(stats.total_reviews),
        delta: deltas.total_reviews?.label || "0%",
        up: deltas.total_reviews?.up ?? true,
        highlight: true,
        icon: Mail,
      },
      {
        label: "Average Rating",
        value: String(stats.average_rating ?? 0),
        star: true,
        delta: deltas.average_rating?.label || "0",
        up: deltas.average_rating?.up ?? true,
        icon: Star,
      },
      {
        label: "Conversion Rate",
        value: `${stats.conversion_rate ?? 0}%`,
        delta: deltas.conversion_rate?.label || "0%",
        up: deltas.conversion_rate?.up ?? true,
        icon: TrendingUp,
      },
      {
        label: "Pending Reviews",
        value: formatStatNumber(stats.pending_reviews),
        delta: deltas.pending_reviews?.label || "0%",
        up: deltas.pending_reviews?.up ?? false,
        icon: Clock,
      },
      {
        label: "Requests Sent",
        value: formatStatNumber(stats.requests_sent),
        delta: deltas.requests_sent?.label || "0%",
        up: deltas.requests_sent?.up ?? true,
        icon: Send,
      },
      {
        label: "Photo & Video Reviews",
        value: formatStatNumber(stats.media_reviews),
        delta: deltas.media_reviews?.label || "0%",
        up: deltas.media_reviews?.up ?? true,
        icon: ImageIcon,
      },
    ];
  }, [stats]);
