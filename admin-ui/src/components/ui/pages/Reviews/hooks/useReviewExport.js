import { useState, useCallback } from "react";
import { exportReviewsToCsv } from "../utils/exportReviews";
import { logApiError, resolveApiError } from "../../../../../utils/apiError";

/**
 * Hook for review list CSV export (logic lives in utils/exportReviews.js).
 */
export function useReviewExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportErrorIsNetwork, setExportErrorIsNetwork] = useState(false);

  const exportReviews = useCallback(async (filters) => {
    setIsExporting(true);
    setExportError("");
    setExportErrorIsNetwork(false);
    try {
      const result = await exportReviewsToCsv(filters);
      return result;
    } catch (err) {
      logApiError(err, "Export failed");
      const resolved = resolveApiError(err, "Export failed.");
      setExportError(resolved.message);
      setExportErrorIsNetwork(resolved.isNetwork);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const clearExportError = useCallback(() => {
    setExportError("");
    setExportErrorIsNetwork(false);
  }, []);

  return {
    isExporting,
    exportError,
    exportErrorIsNetwork,
    exportReviews,
    clearExportError,
  };
}
