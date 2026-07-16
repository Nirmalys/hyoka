import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import axiosClient from "../../../../axiosClient";
import { logApiError, resolveApiError } from "../../../../../utils/apiError";

export const useWidgets = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [widgets, setWidgets] = useState([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);
  const [widgetSaveError, setWidgetSaveError] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loadErrorIsNetwork, setLoadErrorIsNetwork] = useState(false);

  const selectedWidget = useMemo(() => {
    return searchParams.get('widget') || "product-review";
  }, [searchParams]);

  const setSelectedWidget = useCallback((id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("widget", id);
      return next;
    });
  }, [setSearchParams]);

  const fetchWidgets = useCallback(async () => {
    setWidgetsLoading(true);
    setLoadError("");
    setLoadErrorIsNetwork(false);
    try {
      const response = await axiosClient.post("", {
        action: 'hyoka_fetch_widgets',
      });
      if (response.data.success && response.data.data.widgets) {
        const list = response.data.data.widgets;
        setWidgets(list);
        setSearchParams((prev) => {
          const currentId = prev.get("widget");
          const hasCurrent = currentId && list.some((w) => w.id === currentId);
          if (!hasCurrent && list.length > 0) {
            const next = new URLSearchParams(prev);
            next.set("widget", list[0].id);
            return next;
          }
          return prev;
        });
      }
    } catch (error) {
      logApiError(error, "Failed to fetch widgets");
      const resolved = resolveApiError(error, "Could not load widgets.");
      setLoadError(resolved.message);
      setLoadErrorIsNetwork(resolved.isNetwork);
    } finally {
      setWidgetsLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const markWidgetShortcodePlacement = async (widgetId) => {
    const id = typeof widgetId === "string" ? widgetId.trim() : "";
    if (!id) return false;

    try {
      const response = await axiosClient.post("", {
        action: 'hyoka_update_widget_settings',
        widget_id: id,
        placement: 'shortcode',
      });
      if (response.data.success) {
        const status = response.data.data?.status || 'Active';
        const enabled = response.data.data?.enabled ?? false;
        const placement = response.data.data?.placement || 'shortcode';
        setWidgets(prev => prev.map(w =>
          w.id === id ? { ...w, status, enabled, placement } : w
        ));
        return true;
      }
    } catch (error) {
      logApiError(error, "Failed to mark shortcode placement");
    }
    return false;
  };

  const toggleWidgetStatus = async (widgetId, isLiveOnSite) => {
    setWidgetSaveError(null);
    const id = typeof widgetId === "string" ? widgetId.trim() : "";
    if (!id) {
      setWidgetSaveError("No widget ID to save. Select a widget in the list and try again.");
      return false;
    }
    const newEnabled = !isLiveOnSite;
    try {
      const response = await axiosClient.post("", {
        action: 'hyoka_update_widget_settings',
        widget_id: id,
        enabled: newEnabled ? 1 : 0,
      });
      if (response.data.success) {
        const status = response.data.data?.status || (newEnabled ? 'Active' : 'Inactive');
        const enabled = response.data.data?.enabled ?? newEnabled;
        const placement = response.data.data?.placement || '';
        
        setWidgets(prev => prev.map(w =>
          w.id === id ? { ...w, status, enabled, placement } : w
        ));
        return true;
      }
      const payload = response.data?.data || {};
      const msg = payload.message || "Could not update widget.";
      const code = payload.code ? ` (${payload.code})` : "";
      setWidgetSaveError(`${msg}${code}`);
    } catch (error) {
      logApiError(error, "Failed to update widget");
      const resolved = resolveApiError(error, "Network error while updating widget.");
      setWidgetSaveError(resolved.message);
    }
    return false;
  };

  return {
    widgets,
    widgetsLoading,
    loadError,
    loadErrorIsNetwork,
    widgetSaveError,
    selectedWidget,
    setSelectedWidget,
    toggleWidgetStatus,
    markWidgetShortcodePlacement,
    setWidgetSaveError,
    fetchWidgets
  };
};
