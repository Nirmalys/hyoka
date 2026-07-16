import { useState, useEffect } from "react";
import axiosClient from "../../axiosClient";

const defaultCounts = {
  productReviews: 0,
  storeReviews: 0,
  visitorReplies: 0,
};

const fetchNavCounts = async () => {
  const nonce = window.hyokaData?.nonce || "";
  const basePayload = {
    action: "hyoka_fetch_reviews",
    status: "All",
    page: 1,
    per_page: 1,
    _ajax_nonce: nonce,
  };

  const [productRes, storeRes, visitorRes] = await Promise.all([
    axiosClient.post("", { ...basePayload, view: "" }),
    axiosClient.post("", { ...basePayload, view: "store_reviews" }),
    axiosClient.post("", { ...basePayload, view: "customer_replies" }),
  ]);

  const productCounts = productRes.data?.data?.counts || {};
  const storeCounts = storeRes.data?.data?.counts || {};

  return {
    productReviews:
      Number(productCounts.ProductReviews ?? productCounts.All) || 0,
    storeReviews:
      Number(storeRes.data?.data?.total) ||
      Number(storeCounts.StoreReviews) ||
      Number(productCounts.StoreReviews) ||
      0,
    visitorReplies:
      Number(visitorRes.data?.data?.total) ||
      Number(productCounts.CustomerReplies) ||
      0,
  };
};

export const useNavCounts = () => {
  const [counts, setCounts] = useState(defaultCounts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchNavCounts();
        if (!cancelled) setCounts(next);
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { counts, loading, refreshCounts: async () => setCounts(await fetchNavCounts()) };
};

export { formatNumber as formatCount } from "../../../utils/formatNumber";
