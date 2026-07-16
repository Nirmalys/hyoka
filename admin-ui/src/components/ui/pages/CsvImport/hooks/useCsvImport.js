import { useState, useCallback, useMemo, useEffect } from "react";
import axiosClient from "../../../../axiosClient";
import { reportCaughtError, logApiError } from "../../../../../utils/apiError";
import { useApiErrorState } from "../../../../../hooks/useApiErrorState";
import { parseCsv, getSampleCell } from "./csvParser";
import {
  guessColumnMapping,
  OPTIONAL_FIELD_WARNINGS,
  PRODUCT_MATCH_TYPES,
} from "./csvImportConfig";
import {
  DEFAULT_IMPORT_PROVIDERS,
  guessColumnMappingForProvider,
  guessProductColumnIndex,
  getProviderLabel,
  getDefaultProductMatch,
} from "./importProvidersConfig";

const SKIPPED = "__skipped__";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
}

export function useCsvImport() {
  const [step, setStep] = useState(0);
  const [importSource, setImportSource] = useState("csv");
  const [importProviders, setImportProviders] = useState(DEFAULT_IMPORT_PROVIDERS);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [mapErrors, setMapErrors] = useState({});
  const [confirmWarnings, setConfirmWarnings] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [productMatchType, setProductMatchType] = useState("product_id");
  const [productMatchColumn, setProductMatchColumn] = useState(null);
  const [productMatchError, setProductMatchError] = useState("");

  const [productGroups, setProductGroups] = useState([]);
  const [productMappings, setProductMappings] = useState({});
  const [matchingProducts, setMatchingProducts] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");
  const { error, errorIsNetwork: errorIsApi, setError } = useApiErrorState();

  const columnOptions = useMemo(
    () => [
      { value: SKIPPED, label: "Skipped" },
      ...headers.map((h, i) => ({ value: String(i), label: h || `Column ${i + 1}` })),
    ],
    [headers]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosClient.post("", { action: "hyoka_get_import_providers" });
        if (!cancelled && res.data?.success && Array.isArray(res.data.data?.providers)) {
          setImportProviders(res.data.data.providers);
        }
      } catch {
        /* use defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectImportProvider = useCallback(
    (providerId) => {
      setImportSource(providerId);
      setProductMatchType(getDefaultProductMatch(providerId, importProviders));
      setProductMatchColumn(null);
      setStep(1);
      setError("");
    },
    [importProviders]
  );

  const clearFile = useCallback(() => {
    setFileName("");
    setFileSize("");
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setMapErrors({});
    setError("");
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setImportSource("csv");
    setFileName("");
    setFileSize("");
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setMapErrors({});
    setConfirmWarnings([]);
    setShowConfirmModal(false);
    setProductMatchType("product_id");
    setProductMatchColumn(null);
    setProductMatchError("");
    setProductGroups([]);
    setProductMappings({});
    setImportResult(null);
    setImportProgress(null);
    setValidationErrors(null);
    setValidationMessage("");
    setError("");
  }, []);

  const buildPayload = useCallback(
    () => ({
      import_source: importSource,
      column_map: columnMap,
      product_match: {
        type: productMatchType,
        column: productMatchColumn,
      },
      product_mappings: productMappings,
      rows,
    }),
    [importSource, columnMap, productMatchType, productMatchColumn, productMappings, rows]
  );

  const pollImportJob = useCallback(async (jobId) => {
    const poll = async () => {
      const response = await axiosClient.post("", {
        action: "hyoka_csv_import_status",
        job_id: jobId,
      });
      if (!response.data?.success) {
        throw new Error(response.data?.data?.message || "Could not read import status.");
      }
      const status = response.data.data;
      setImportProgress(status);
      if (status.status === "completed") {
        setImportResult({
          message: status.message,
          imported: status.imported,
          failed: status.failed,
        });
        setImporting(false);
        return;
      }
      if (status.status === "failed") {
        setError(status.message || "Import failed. Please try again.", false);
        setImporting(false);
        return;
      }
      if (status.status === "processing") {
        window.setTimeout(poll, 1200);
      }
    };
    await poll();
  }, [setError]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setError("");
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result || "");
        const parsed = parseCsv(text);
        if (!parsed.headers.length) {
          setError("Could not read column headers from this file.");
          return;
        }
        if (!parsed.rows.length) {
          setError("The file has headers but no data rows.");
          return;
        }
        setFileName(file.name);
        setFileSize(formatBytes(file.size));
        setHeaders(parsed.headers);
        setRows(parsed.rows);
        const mapping = guessColumnMappingForProvider(
          parsed.headers,
          importSource,
          guessColumnMapping,
          importProviders
        );
        setColumnMap(mapping);
        const defaultMatch = getDefaultProductMatch(importSource, importProviders);
        setProductMatchType(defaultMatch);
        const productCol = guessProductColumnIndex(
          parsed.headers,
          defaultMatch,
          importSource,
          importProviders
        );
        setProductMatchColumn(productCol >= 0 ? productCol : null);
        setStep(2);
      } catch (err) {
        logApiError(err);
        setError("Failed to parse CSV file.", false);
      }
    };
    reader.readAsText(file);
  }, [importSource, importProviders]);

  const setFieldColumn = useCallback((fieldKey, value) => {
    setColumnMap((prev) => ({
      ...prev,
      [fieldKey]: value === SKIPPED || value === "" ? null : parseInt(value, 10),
    }));
    setMapErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const validateColumnMapping = useCallback(() => {
    const errors = {};
    if (columnMap.body === null || columnMap.body === undefined) {
      errors.body = "Body is required";
    }
    if (columnMap.rating === null || columnMap.rating === undefined) {
      errors.rating = "Rating is required";
    }
    setMapErrors(errors);
    return Object.keys(errors).length === 0;
  }, [columnMap]);

  const collectOptionalWarnings = useCallback(() => {
    const warnings = [];
    Object.entries(OPTIONAL_FIELD_WARNINGS).forEach(([key, message]) => {
      if (columnMap[key] === null || columnMap[key] === undefined) {
        warnings.push(message);
      }
    });
    return warnings;
  }, [columnMap]);

  const buildProductGroups = useCallback(
    (matches = {}) => {
      if (productMatchColumn === null || productMatchColumn < 0) {
        setProductGroups([
          {
            key: "__all__",
            label: "All reviews",
            count: rows.length,
            sample: getSampleCell(rows, columnMap.body),
            product: null,
          },
        ]);
        return;
      }

      const groups = {};
      rows.forEach((row) => {
        const key = String(row[productMatchColumn] ?? "").trim() || "(empty)";
        if (!groups[key]) {
          groups[key] = { count: 0, sample: "" };
        }
        groups[key].count += 1;
        if (!groups[key].sample) {
          const bodyCol = columnMap.body;
          if (bodyCol >= 0 && row[bodyCol]) {
            groups[key].sample = String(row[bodyCol]).trim().slice(0, 120);
          }
        }
      });

      const list = Object.entries(groups).map(([key, meta]) => ({
        key,
        label: key,
        count: meta.count,
        sample: meta.sample,
        product: matches[key] || null,
      }));

      list.sort((a, b) => b.count - a.count);
      setProductGroups(list);

      const initialMappings = {};
      list.forEach((g) => {
        if (g.product?.id) {
          initialMappings[g.key] = g.product.id;
        }
      });
      setProductMappings((prev) => ({ ...initialMappings, ...prev }));
    },
    [rows, productMatchColumn, columnMap.body]
  );

  const runProductMatch = useCallback(async () => {
    if (productMatchColumn === null || productMatchColumn < 0) {
      buildProductGroups({});
      return {};
    }

    const identifiers = [
      ...new Set(
        rows
          .map((r) => String(r[productMatchColumn] ?? "").trim())
          .filter(Boolean)
      ),
    ];

    setMatchingProducts(true);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_csv_match_products",
        match_type: productMatchType,
        identifiers: JSON.stringify(identifiers),
      });
      const matches = response.data?.success ? response.data.data?.matches || {} : {};
      buildProductGroups(matches);
      return matches;
    } catch (err) {
      reportCaughtError(err, "Could not match products. Please try again.", setError);
      buildProductGroups({});
      return {};
    } finally {
      setMatchingProducts(false);
    }
  }, [rows, productMatchColumn, productMatchType, buildProductGroups]);

  const goToStep2 = useCallback(() => {
    if (!headers.length) {
      setError("Upload a CSV file first.");
      return;
    }
    setStep(2);
    setError("");
  }, [headers.length]);

  const autoPickProductColumn = useCallback(
    (matchType) => {
      const index = guessProductColumnIndex(headers, matchType, importSource, importProviders);
      if (index >= 0) {
        setProductMatchColumn(index);
      }
    },
    [headers, importSource, importProviders]
  );

  const changeProductMatchType = useCallback(
    (type) => {
      setProductMatchType(type);
      autoPickProductColumn(type);
    },
    [autoPickProductColumn]
  );

  const goToProductIdentifierStep = useCallback(() => {
    setStep(3);
    autoPickProductColumn(productMatchType);
  }, [autoPickProductColumn, productMatchType]);

  const tryAdvanceFromMapping = useCallback(() => {
    if (!validateColumnMapping()) return;
    const warnings = collectOptionalWarnings();
    if (warnings.length > 0) {
      setConfirmWarnings(warnings);
      setShowConfirmModal(true);
      return;
    }
    goToProductIdentifierStep();
  }, [validateColumnMapping, collectOptionalWarnings, goToProductIdentifierStep]);

  const confirmMappingAndContinue = useCallback(() => {
    setShowConfirmModal(false);
    goToProductIdentifierStep();
  }, [goToProductIdentifierStep]);

  const tryAdvanceFromProductIdentifier = useCallback(async () => {
    if (productMatchColumn === null || productMatchColumn < 0) {
      setProductMatchError("Please select a column");
      return;
    }
    setProductMatchError("");
    setStep(4);
    setError("");
    await runProductMatch();
  }, [productMatchColumn, runProductMatch]);

  const setGroupProduct = useCallback((groupKey, product) => {
    setProductMappings((prev) => {
      const next = { ...prev };
      if (!product) {
        delete next[groupKey];
      } else {
        next[groupKey] = product.id;
      }
      return next;
    });
    setProductGroups((prev) =>
      prev.map((g) => (g.key === groupKey ? { ...g, product } : g))
    );
  }, []);

  const runImport = useCallback(async () => {
    setImporting(true);
    setError("");
    setImportResult(null);
    setImportProgress(null);
    setValidationErrors(null);

    const payload = buildPayload();

    try {
      const validateRes = await axiosClient.post("", {
        action: "hyoka_csv_import_validate",
        payload: JSON.stringify(payload),
      });

      if (!validateRes.data?.success) {
        const data = validateRes.data?.data || {};
        if (data.errors) {
          setValidationErrors(data.errors);
          setValidationMessage(data.message || "Fix validation errors before importing.");
        } else {
          setError(data.message || "Validation failed.", false);
        }
        setImporting(false);
        return;
      }

      const startRes = await axiosClient.post("", {
        action: "hyoka_csv_import_start",
        payload: JSON.stringify(payload),
      });

      if (!startRes.data?.success) {
        const data = startRes.data?.data || {};
        if (data.errors) {
          setValidationErrors(data.errors);
          setValidationMessage(data.message || "Fix validation errors before importing.");
        } else {
          setError(data.message || "Could not start import.", false);
        }
        setImporting(false);
        return;
      }

      const jobId = startRes.data.data?.job_id;
      if (!jobId) {
        setError("Import job could not be created.", false);
        setImporting(false);
        return;
      }

      setImportProgress({
        status: "processing",
        total: startRes.data.data?.total || rows.length,
        processed: 0,
        percent: 0,
        imported: 0,
        failed: 0,
      });

      await pollImportJob(jobId);
    } catch (err) {
      reportCaughtError(err, "Import request failed. Please try again.", setError);
      setImporting(false);
    }
  }, [buildPayload, rows.length, pollImportJob, setError]);

  const productMatchMeta = PRODUCT_MATCH_TYPES.find((t) => t.id === productMatchType);

  const importProviderLabel = getProviderLabel(importSource, importProviders);
  const activeProvider = importProviders.find((p) => p.id === importSource) || null;

  const previewRows = useMemo(() => {
    const colIndex = (key) => {
      const idx = columnMap[key];
      return idx !== null && idx !== undefined ? idx : -1;
    };
    const cell = (row, key) => {
      const idx = colIndex(key);
      return idx >= 0 ? String(row[idx] ?? "").trim() : "";
    };

    const groupByKey = Object.fromEntries(productGroups.map((g) => [g.key, g]));
    const seen = new Set();

    return rows.map((row, index) => {
      const identifier =
        productMatchColumn !== null && productMatchColumn >= 0
          ? String(row[productMatchColumn] ?? "").trim() || "(empty)"
          : `row-${index + 1}`;
      const groupKey =
        productMatchColumn !== null && productMatchColumn >= 0 ? identifier : "__all__";
      const group = groupByKey[groupKey] || groupByKey.__all__ || null;
      const product = group?.product || null;
      const body = cell(row, "body");
      const fingerprint = `${groupKey}::${body}`;
      const isDuplicate = body ? seen.has(fingerprint) : false;
      if (body && !seen.has(fingerprint)) {
        seen.add(fingerprint);
      }

      let status = "matched";
      if (!product) {
        status = "missing";
      } else if (isDuplicate) {
        status = "duplicate";
      }

      return {
        id: index,
        identifier,
        groupKey,
        product,
        name: cell(row, "reviewer_name") || "—",
        review: body || "—",
        rating: cell(row, "rating"),
        date: cell(row, "review_date") || "—",
        status,
      };
    });
  }, [rows, columnMap, productMatchColumn, productGroups]);

  const previewStats = useMemo(() => {
    const stats = { matched: 0, missing: 0, duplicates: 0 };
    previewRows.forEach((row) => {
      if (row.status === "matched") stats.matched += 1;
      else if (row.status === "missing") stats.missing += 1;
      else if (row.status === "duplicate") stats.duplicates += 1;
    });
    return stats;
  }, [previewRows]);

  return {
    activeProvider,
    step,
    setStep,
    importSource,
    importProviders,
    importProviderLabel,
    selectImportProvider,
    fileName,
    fileSize,
    clearFile,
    headers,
    rows,
    columnMap,
    mapErrors,
    columnOptions,
    SKIPPED,
    confirmWarnings,
    showConfirmModal,
    setShowConfirmModal,
    productMatchType,
    setProductMatchType: changeProductMatchType,
    productMatchColumn,
    setProductMatchColumn,
    setProductMatchError,
    productMatchError,
    productMatchMeta,
    productGroups,
    productMappings,
    previewRows,
    previewStats,
    matchingProducts,
    importing,
    importResult,
    importProgress,
    validationErrors,
    validationMessage,
    setValidationErrors,
    error,
    errorIsApi,
    setError,
    reset,
    handleFile,
    setFieldColumn,
    getSampleCell: (col) => getSampleCell(rows, col),
    goToStep2,
    tryAdvanceFromMapping,
    confirmMappingAndContinue,
    tryAdvanceFromProductIdentifier,
    setGroupProduct,
    runImport,
    rowCount: rows.length,
  };
}
