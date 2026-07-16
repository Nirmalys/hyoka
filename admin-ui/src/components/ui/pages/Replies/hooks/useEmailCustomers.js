import { useState, useEffect, useCallback, useRef } from "react";
import axiosClient from "../../../../axiosClient";
import { logApiError, resolveApiError } from "../../../../../utils/apiError";

const ITEMS_PER_PAGE = 10;

export const useEmailCustomers = (isActive) => {
  const [emailCustomers, setEmailCustomers] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailPage, setEmailPage] = useState(1);
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [emailSearchInput, setEmailSearchInput] = useState("");
  const [emailSearchQuery, setEmailSearchQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadErrorIsNetwork, setLoadErrorIsNetwork] = useState(false);

  const hasLoadedEmailTab = useRef(false);

  const fetchEmailCustomers = useCallback(async (page, search, options = {}) => {
    const { showLoading = false, updateList = true } = options;
    if (showLoading) setEmailLoading(true);
    if (updateList) {
      setLoadError("");
      setLoadErrorIsNetwork(false);
    }
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_fetch_email_customers",
        page,
        per_page: ITEMS_PER_PAGE,
        search,
      });
      if (response.data?.success && response.data.data) {
        const total = Number(response.data.data.total) || 0;
        if (updateList) {
          setEmailCustomers(response.data.data.customers || []);
        }
        setEmailTotal(total);
        setEmailCount(total);
        if (response.data.data.settings) {
          setAutomationEnabled(!!response.data.data.settings.automation_enabled);
        }
      } else if (updateList) {
        setEmailCustomers([]);
        setEmailTotal(0);
        setEmailCount(0);
      }
    } catch (err) {
      logApiError(err, "Failed to load purchased customers");
      if (updateList) {
        const resolved = resolveApiError(err, "Could not load email customers.");
        setLoadError(resolved.message);
        setLoadErrorIsNetwork(resolved.isNetwork);
        setEmailCustomers([]);
        setEmailTotal(0);
        setEmailCount(0);
      }
    } finally {
      if (showLoading) setEmailLoading(false);
    }
  }, []);

  // Load badge count as soon as Replies mounts (before the tab is opened).
  useEffect(() => {
    fetchEmailCustomers(1, "", { showLoading: false, updateList: false });
  }, [fetchEmailCustomers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setEmailSearchQuery(emailSearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [emailSearchInput]);

  // Reset page on search change
  useEffect(() => {
    if (isActive && emailPage !== 1) {
      setEmailPage(1);
    }
  }, [emailSearchQuery, isActive]);

  // Main fetch effect
  useEffect(() => {
    if (!isActive) {
      hasLoadedEmailTab.current = false;
      return;
    }
    const showLoading = !hasLoadedEmailTab.current;
    fetchEmailCustomers(emailPage, emailSearchQuery, {
      showLoading,
      updateList: true,
    });
    hasLoadedEmailTab.current = true;
  }, [isActive, emailPage, emailSearchQuery, fetchEmailCustomers]);

  return {
    emailCustomers,
    emailLoading,
    emailPage,
    setEmailPage,
    emailTotal,
    emailCount,
    emailSearchInput,
    setEmailSearchInput,
    emailSearchQuery,
    automationEnabled,
    loadError,
    loadErrorIsNetwork,
    fetchEmailCustomers,
    itemsPerPage: ITEMS_PER_PAGE
  };
};
