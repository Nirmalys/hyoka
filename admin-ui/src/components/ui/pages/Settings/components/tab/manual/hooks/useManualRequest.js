import { useState, useCallback, useEffect } from "react";
import axiosClient from "../../../../../../../axiosClient";
import { logApiError, reportCaughtError } from "../../../../../../../../utils/apiError";

export const useManualRequest = (setError) => {
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSelected, setManualSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [manualSavedNote, setManualSavedNote] = useState("");
  const [recentManualRequests, setRecentManualRequests] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const fetchRecentManualRequests = useCallback(async () => {
    setRecentLoading(true);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_fetch_email_customers",
        page: 1,
        per_page: 50,
        send_source: "manual",
        require_sent: 1,
      });
      if (response.data?.success && response.data.data) {
        setRecentManualRequests(response.data.data.customers || []);
      } else {
        setRecentManualRequests([]);
      }
    } catch (err) {
      logApiError(err, "Failed to load manual requests");
      setRecentManualRequests([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentManualRequests();
  }, [fetchRecentManualRequests]);

  const searchManualOrders = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setManualResults([]);
      return;
    }
    setManualLoading(true);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_fetch_email_customers",
        search: query,
      });
      if (response.data?.success && response.data.data) {
        const orders = response.data.data.customers || [];
        setManualResults(orders);
        if (orders.length === 1) {
          setManualSelected(orders[0]);
        }
      } else {
        setManualResults([]);
      }
    } catch (err) {
      logApiError(err, "Search failed");
    } finally {
      setManualLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (manualQuery) searchManualOrders(manualQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [manualQuery, searchManualOrders]);

  const handleSendManualDirect = async (customerId) => {
    setSending(true);
    setError("");
    setManualSavedNote("");
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_send_followup_manual",
        customer_row_id: customerId,
      });
      if (response.data?.success) {
        setManualSavedNote("Follow-up email sent.");
        if (manualSelected && manualSelected.id === customerId) {
          setManualSelected((prev) => ({ ...prev, email_sent: true }));
        }
        fetchRecentManualRequests();
      } else {
        setError(response.data?.data?.message || "Send failed.");
      }
    } catch (err) {
      reportCaughtError(err, "Send failed.", setError);
    } finally {
      setSending(false);
    }
  };

  return {
    manualQuery,
    setManualQuery,
    manualResults,
    manualLoading,
    manualSelected,
    setManualSelected,
    sending,
    handleSendManualDirect,
    manualSavedNote,
    recentManualRequests,
    recentLoading,
  };
};
