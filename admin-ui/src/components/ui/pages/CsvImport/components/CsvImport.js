import React, { useRef, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  X,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Database,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Layers,
  XCircle,
  Check,
} from "lucide-react";
import ApiErrorDisplay from "../../../ApiErrorDisplay";
import ImportStepper from "./ImportStepper";
import ConfirmFieldsModal from "./ConfirmFieldsModal";
import ImportValidationModal from "./ImportValidationModal";
import ProductSearchSelect from "./ProductSearchSelect";
import { useCsvImport } from "../hooks/useCsvImport";
import { REVIEW_FIELDS, PRODUCT_MATCH_TYPES, downloadCsvTemplate } from "../hooks/csvImportConfig";
import ImportProviderPicker from "./ImportProviderPicker";
import { getProviderImageUrl } from "../hooks/importProvidersConfig";
import OnboardingGuideBanner from "../../../onboarding/OnboardingGuideBanner";
import { ONBOARDING_STEP_ORDER } from "../../../onboarding/onboardingConfig";
import { useOnboarding } from "../../../onboarding/OnboardingContext";
import { ShimmerTableSkeleton } from "../../../Shimmer";

const STEP_HEADERS = [
  { title: "Select Source", desc: "Choose where your reviews are coming from" },
  { title: "Upload files", desc: "Select and upload the files of your choice" },
  { title: "Map your columns", desc: "We auto-mapped what we could — adjust anything that looks off." },
  { title: "Product Identifier", desc: "How should we match reviews to products?" },
  { title: "Preview before importing", desc: "A final check across your file. Modify if any changes." },
];

const PreviewCheckbox = ({ checked, onChange }) => (
  <label className="relative inline-flex cursor-pointer select-none items-center">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="peer absolute h-0 w-0 opacity-0"
    />
    <span
      className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-all ${
        checked
          ? "border-[#F5B800] bg-[#FFF8E1]"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      {checked && <Check className="h-3 w-3 stroke-3 text-black" />}
    </span>
  </label>
);

const PreviewStars = ({ rating }) => {
  const value = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
  return (
    <div className="flex items-center gap-0.5 text-[14px] leading-none">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? "text-orange-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </div>
  );
};

const PreviewStatusBadge = ({ status }) => {
  if (status === "matched") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Matched
      </span>
    );
  }
  if (status === "duplicate") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        Duplicate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
      <XCircle className="h-3.5 w-3.5" />
      Missing
    </span>
  );
};

const CsvImport = () => {
  const fileRef = useRef(null);
  const imp = useCsvImport();
  const [searchParams] = useSearchParams();
  const onboardingStep = searchParams.get("onboarding");
  const { advanceFromStep } = useOnboarding();
  const importOnboardingDone = useRef(false);
  const [selectedPreviewRows, setSelectedPreviewRows] = useState(() => new Set());
  const sourceLogoUrl =
    imp.step > 0 && imp.importSource ? getProviderImageUrl(imp.importSource) : null;
  const stepHeader = STEP_HEADERS[imp.step] || STEP_HEADERS[0];

  const mapSelectValue = (colIndex) =>
    colIndex === null || colIndex === undefined ? imp.SKIPPED : String(colIndex);

  const DISPLAY_STEP_LABELS = ["Source", "Mapping", "Product", "Preview", "Import"];
  const displayIndex =
    imp.importResult && !imp.importing ? 4 : imp.step <= 1 ? 0 : imp.step - 1;
  const stepIndicator = `Step ${displayIndex + 1} of 5 · ${DISPLAY_STEP_LABELS[displayIndex]}`;

  const completed = !!imp.importResult && !imp.importing;
  const importedCount = imp.importResult?.imported ?? imp.previewStats.matched ?? 0;
  const assetsUrl = window.hyokaData?.assetsUrl || "";
  const importSuccessUrl = assetsUrl ? `${assetsUrl}images/importsuccess.webp` : null;

  useEffect(() => {
    if (imp.step !== 4 || imp.matchingProducts) return;
    setSelectedPreviewRows(new Set(imp.previewRows.map((row) => row.id)));
  }, [imp.step, imp.matchingProducts, imp.previewRows.length]);

  useEffect(() => {
    if (!completed || onboardingStep !== "import" || importOnboardingDone.current) return;
    importOnboardingDone.current = true;
    advanceFromStep("import");
  }, [completed, onboardingStep, advanceFromStep]);

  const allPreviewSelected =
    imp.previewRows.length > 0 && selectedPreviewRows.size === imp.previewRows.length;

  const toggleAllPreviewRows = () => {
    if (allPreviewSelected) {
      setSelectedPreviewRows(new Set());
      return;
    }
    setSelectedPreviewRows(new Set(imp.previewRows.map((row) => row.id)));
  };

  const togglePreviewRow = (rowId) => {
    setSelectedPreviewRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      {onboardingStep === "import" && (
        <div className="px-6 pt-6">
          <OnboardingGuideBanner
            stepId="import"
            stepNumber={ONBOARDING_STEP_ORDER.indexOf("import") + 1}
            totalSteps={ONBOARDING_STEP_ORDER.length}
          />
        </div>
      )}
      <div className="flex flex-col md:flex-row overflow-hidden bg-white min-h-[560px]">
        <aside className="shrink-0 border-b md:border-b-0 md:border-r border-gray-100 px-6 pb-6 pt-6 md:w-72">
          <div className="text-[17px] font-bold text-gray-900 leading-none">Import Reviews</div>
          <div className="text-[12px] text-gray-400 font-medium leading-none mt-1.5">
            A guided flow to import reviews
          </div>
          <ImportStepper
            currentStep={imp.step}
            completed={!!imp.importResult && !imp.importing}
          />
        </aside>

        <div className="flex-1 min-w-0 px-6 pb-6 pt-6 md:px-8 md:pb-8">
        {completed ? (
          <div className="flex min-h-[480px] flex-col items-center justify-center px-4 py-8 text-center">
            {importSuccessUrl && (
              <div className="mb-6 h-60 w-60 shrink-0">
                <img
                  src={importSuccessUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <span className="inline-flex items-center rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Import Completed
            </span>
            <div className="mt-4 text-[28px] font-bold text-gray-900">
              {importedCount.toLocaleString()} reviews imported
            </div>
            <p className="mt-2 max-w-md text-[13px] text-gray-500">
              Your reviews have been imported successfully. Review and approve them in the Reviews
              module, or approve them all here.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                to="/review"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-bold text-gray-800 shadow-sm hover:bg-gray-50"
              >
                Go to Reviews
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/review?status=pending"
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-orange-600"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve all
              </Link>
            </div>
          </div>
        ) : (
          <>
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <div className="text-[26px] font-bold text-gray-900 leading-tight">{stepHeader.title}</div>
              <div className="text-[13px] text-gray-500 mt-1">{stepHeader.desc}</div>
            </div>
            {imp.step > 0 && imp.importProviderLabel && (
              <span className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-[12px] font-bold text-gray-600">
                {sourceLogoUrl && (
                  <img src={sourceLogoUrl} alt="" className="h-4 w-4 object-contain" />
                )}
                {imp.importProviderLabel}
              </span>
            )}
          </div>

        {imp.error ? (
          <ApiErrorDisplay
            message={imp.error}
            isNetwork={imp.errorIsApi}
            onRetry={imp.errorIsApi ? () => imp.setError("") : undefined}
            className="mb-6"
          />
        ) : null}

        {imp.importProgress && imp.importing && (
          <div className="mb-4 p-4 rounded-md border border-orange-100 bg-orange-50/40">
            <div className="flex justify-between text-[12px] font-bold text-gray-700 mb-2">
              <span>Importing in background…</span>
              <span>{imp.importProgress.percent ?? 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-white overflow-hidden border border-orange-100">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${imp.importProgress.percent ?? 0}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-2">
              {imp.importProgress.processed ?? 0} / {imp.importProgress.total ?? 0} rows ·{" "}
              {imp.importProgress.imported ?? 0} saved · {imp.importProgress.failed ?? 0} skipped
            </p>
          </div>
        )}

        {imp.step === 0 && (
          <ImportProviderPicker
            providers={imp.importProviders}
            selectedId={imp.importSource}
            onSelect={imp.selectImportProvider}
          />
        )}

        {imp.step === 1 && (
          <div className="space-y-4">
            <div
              className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-12 text-center transition-colors hover:border-orange-300 cursor-pointer bg-white"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) imp.handleFile(file);
              }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                <UploadCloud className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-[18px] font-bold text-gray-900">Drag your CSV here</p>
              <p className="mt-1 text-[13px] text-gray-500">or click to browse your computer</p>
              <p className="mt-3 text-[12px] text-gray-400">.csv .xlsx · UTF-8 · max 50 MB</p>
            </div>

            {imp.importSource === "csv" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-orange-600 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download template
                </button>
              </div>
            )}

            {imp.fileName && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-gray-900">{imp.fileName}</div>
                  <div className="text-[12px] text-gray-500">
                    {imp.fileSize ? `${imp.fileSize} · ` : ""}
                    {imp.rowCount.toLocaleString()} rows detected
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Uploaded
                </span>
                <button
                  type="button"
                  onClick={imp.clearFile}
                  className="text-gray-400 transition-colors hover:text-gray-700"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) imp.handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {imp.step === 2 && (
          <div>
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,0.7fr)] gap-4 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <div>Review field</div>
              <div>CSV column</div>
              <div>Sample content</div>
              <div>Status</div>
            </div>
            <div className="space-y-2">
              {REVIEW_FIELDS.map((field) => {
                const col = imp.columnMap[field.key];
                const hasError = !!imp.mapErrors[field.key];
                const mapped = col !== null && col !== undefined;
                return (
                  <div
                    key={field.key}
                    className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,0.7fr)] items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                        <Database className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 truncate text-[13px] font-bold text-gray-900">
                        {field.label}
                        {field.required && (
                          <span className="font-medium text-gray-400"> (Required)</span>
                        )}
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-300" />
                    </div>

                    <div className="min-w-0">
                      <select
                        value={mapSelectValue(col)}
                        onChange={(e) => imp.setFieldColumn(field.key, e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 text-[13px] font-medium focus:outline-none ${
                          hasError
                            ? "border-red-300 bg-red-50 text-red-900"
                            : "border-gray-200 bg-gray-50 text-gray-700 focus:border-orange-500 focus:bg-white"
                        }`}
                      >
                        {imp.columnOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {hasError && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          {imp.mapErrors[field.key]}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0 truncate text-[13px] text-gray-600">
                      {mapped ? imp.getSampleCell(col) || "—" : "—"}
                    </div>

                    <div>
                      {mapped ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                          Auto-mapped
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                          Unmapped
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {imp.step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {PRODUCT_MATCH_TYPES.map((type) => {
                const selected = imp.productMatchType === type.id;
                return (
                  <label
                    key={type.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                      selected
                        ? "border-amber-300 bg-amber-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="product_match_type"
                      checked={selected}
                      onChange={() => imp.setProductMatchType(type.id)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-orange-500" : "border-gray-300"
                      }`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-gray-900">{type.label}</span>
                      <span className="mt-0.5 block text-[12px] text-gray-500">
                        {type.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5">
              <label className="block text-[12px] font-bold text-gray-700 mb-2">
                {imp.productMatchMeta?.columnLabel || "Column in your file"}
              </label>
              <select
                value={
                  imp.productMatchColumn === null || imp.productMatchColumn === undefined
                    ? ""
                    : String(imp.productMatchColumn)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  imp.setProductMatchColumn(v === "" ? null : parseInt(v, 10));
                  imp.setProductMatchError("");
                }}
                className={`w-full max-w-md rounded-lg border px-3 py-2 text-[13px] font-medium focus:outline-none ${
                  imp.productMatchError
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white focus:border-orange-500"
                }`}
              >
                <option value="">Select column…</option>
                {imp.headers.map((h, i) => (
                  <option key={h + i} value={String(i)}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>
              {imp.productMatchError && (
                <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {imp.productMatchError}
                </p>
              )}
              {imp.productMatchColumn !== null && imp.productMatchColumn >= 0 && (
                <p className="text-[12px] text-gray-500 mt-2">
                  Sample content:{" "}
                  <span className="font-bold text-gray-700">
                    {imp.getSampleCell(imp.productMatchColumn) || "—"}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {imp.step === 4 && (
          <div className="space-y-5">
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-normal text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 translate-y-[2px] text-amber-600" />
              <span>
                <span className="font-bold">Note:</span> Only matched reviews will proceed. Missing
                products can be linked below, and duplicate rows can be deselected before import.
              </span>
            </div>

            {imp.matchingProducts ? (
              <ShimmerTableSkeleton rows={5} className="py-6" />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Matched
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-[28px] font-bold leading-none text-gray-900">
                      {imp.previewStats.matched.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Missing
                      </div>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="mt-2 text-[28px] font-bold leading-none text-gray-900">
                      {imp.previewStats.missing.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Duplicates
                      </div>
                      <Layers className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="mt-2 text-[28px] font-bold leading-none text-gray-900">
                      {imp.previewStats.duplicates.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 grid grid-cols-[28px_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center gap-3 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <div>
                      <PreviewCheckbox
                        checked={allPreviewSelected}
                        onChange={toggleAllPreviewRows}
                      />
                    </div>
                    <div>Identifier</div>
                    <div>Product</div>
                    <div>Name</div>
                    <div>Review</div>
                    <div>Rating</div>
                    <div>Date</div>
                    <div>Status</div>
                  </div>

                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {imp.previewRows.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[28px_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-sm"
                      >
                        <div>
                          <PreviewCheckbox
                            checked={selectedPreviewRows.has(row.id)}
                            onChange={() => togglePreviewRow(row.id)}
                          />
                        </div>
                        <div className="truncate text-[12px] font-bold text-gray-800">
                          {row.identifier}
                        </div>
                        <div className="min-w-0">
                          {row.product ? (
                            <div className="flex items-center gap-2 min-w-0">
                              {row.product.image ? (
                                <img
                                  src={row.product.image}
                                  alt=""
                                  className="h-8 w-8 shrink-0 rounded object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 shrink-0 rounded bg-gray-100" />
                              )}
                              <span className="truncate text-[12px] font-medium text-gray-800">
                                {row.product.name}
                              </span>
                            </div>
                          ) : (
                            <ProductSearchSelect
                              value={row.product}
                              onChange={(product) => imp.setGroupProduct(row.groupKey, product)}
                              placeholder="Search Product"
                            />
                          )}
                        </div>
                        <div className="truncate text-[12px] text-gray-700">{row.name}</div>
                        <div className="truncate text-[12px] text-gray-600">{row.review}</div>
                        <div>
                          <PreviewStars rating={row.rating} />
                        </div>
                        <div className="truncate text-[12px] text-gray-500">{row.date}</div>
                        <div>
                          <PreviewStatusBadge status={row.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex-1">
            {imp.step > 0 && (
              <button
                type="button"
                onClick={() => imp.setStep((s) => Math.max(0, s - 1))}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-4 py-2.5 text-[13px] font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={imp.importing}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          <div className="text-[12px] font-medium text-gray-400">{stepIndicator}</div>

          <div className="flex flex-1 justify-end">
            {imp.step === 1 && (
              <button
                type="button"
                onClick={imp.goToStep2}
                disabled={!imp.headers.length}
                className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {imp.step === 2 && (
              <button
                type="button"
                onClick={imp.tryAdvanceFromMapping}
                className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-orange-600"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {imp.step === 3 && (
              <button
                type="button"
                onClick={imp.tryAdvanceFromProductIdentifier}
                className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-orange-600"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {imp.step === 4 && (
              <button
                type="button"
                onClick={imp.runImport}
                disabled={imp.importing || imp.matchingProducts}
                className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400"
              >
                {imp.importing && <Loader2 className="h-4 w-4 animate-spin" />}
                {imp.importing ? "Importing…" : "Import"}
                {!imp.importing && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
          </>
        )}
        </div>
      </div>

      {imp.showConfirmModal && (
        <ConfirmFieldsModal
          warnings={imp.confirmWarnings}
          onCancel={() => imp.setShowConfirmModal(false)}
          onConfirm={imp.confirmMappingAndContinue}
        />
      )}

      {imp.validationErrors && (
        <ImportValidationModal
          errors={imp.validationErrors}
          message={imp.validationMessage}
          onClose={() => imp.setValidationErrors(null)}
        />
      )}
    </div>
  );
};

export default CsvImport;
