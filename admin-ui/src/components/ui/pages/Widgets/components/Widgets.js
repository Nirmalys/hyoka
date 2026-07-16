import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, Loader2, ArrowRight, Info, Power, PowerOff } from "lucide-react";
import WidgetLibraryCard from "./WidgetLibraryCard";
import WidgetPreview from "./WidgetPreview";
import { useWidgets } from "../hooks/useWidgets";
import WidgetStyleEditor from "./WidgetStyleEditor";
import OnboardingGuideBanner from "../../../onboarding/OnboardingGuideBanner";
import { useOnboarding } from "../../../onboarding/OnboardingContext";
import { ONBOARDING_STEP_ORDER } from "../../../onboarding/onboardingConfig";
import { ShimmerWidgetsSkeleton } from "../../../Shimmer";
import ApiErrorDisplay from "../../../ApiErrorDisplay";

const Widgets = () => {
  const {
    widgets,
    widgetsLoading,
    loadError,
    loadErrorIsNetwork,
    widgetSaveError,
    selectedWidget,
    setSelectedWidget,
    setWidgetSaveError,
    toggleWidgetStatus,
    fetchWidgets,
  } = useWidgets();

  const [searchParams, setSearchParams] = useSearchParams();
  const { advanceFromStep } = useOnboarding();
  const onboardingStep = searchParams.get("onboarding");
  const [copied, setCopied] = useState(false);
  const [togglingWidget, setTogglingWidget] = useState(false);
  const styleEditorOpen = searchParams.get("edit") === "true";
  const mainScrollRef = useRef(null);
  const previewSectionRef = useRef(null);
  const scrollToPreviewRef = useRef(false);

  const handleSelectWidget = useCallback(
    (id) => {
      if (id !== selectedWidget) {
        scrollToPreviewRef.current = true;
      }
      setSelectedWidget(id);
    },
    [selectedWidget, setSelectedWidget]
  );

  useEffect(() => {
    if (!scrollToPreviewRef.current) return;
    scrollToPreviewRef.current = false;

    const frame = requestAnimationFrame(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedWidget]);

  const shortcodeText = `[hyoka type="${selectedWidget}"]`;
  const selectedWidgetData = widgets.find((w) => w.id === selectedWidget);
  const isWidgetLive = Boolean(selectedWidgetData?.enabled);

  const copyShortcode = async () => {
    await navigator.clipboard.writeText(shortcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openStyleEditor = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("edit", "true");
    if (onboardingStep) {
      newParams.set("onboarding", onboardingStep);
    }
    setSearchParams(newParams);
  };

  const onboardingStepNumber = onboardingStep
    ? ONBOARDING_STEP_ORDER.indexOf(onboardingStep) + 1
    : 0;

  const handleToggleWidget = async () => {
    if (!selectedWidget || togglingWidget) return;
    const activating = !isWidgetLive;
    setTogglingWidget(true);
    try {
      const ok = await toggleWidgetStatus(selectedWidget, isWidgetLive);
      if (ok && activating && onboardingStep === "widget") {
        advanceFromStep("widget");
      }
    } finally {
      setTogglingWidget(false);
    }
  };

  if (styleEditorOpen && selectedWidget) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]">
        <WidgetStyleEditor
          widgetId={selectedWidget}
          onboardingStep={onboardingStep}
          onClose={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("edit");
            setSearchParams(newParams);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#F5F5F5]">
      {/* Full-height embed snippet sidebar */}
      <aside className="w-[260px] shrink-0 h-full flex flex-col bg-white border-r border-gray-200">
        <div className="px-6 pt-6 pb-5">
          <div className="text-[17px] font-bold text-gray-900 leading-none">Embed snippet</div>
          <div className="text-[12px] text-gray-400 font-medium leading-none mt-1.5 truncate">
            {selectedWidgetData?.title || "Product Review Widget"}
          </div>
        </div>

        <div className="mx-6 mt-1 border-t border-gray-200" />

        <div className="flex flex-col flex-1 px-6 pt-2 pb-5 overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
            Embed code
          </p>

          <div className="mt-2.5 bg-[#F3F4F6] rounded-lg px-3 py-3 font-mono text-[11px] text-gray-700 break-all leading-relaxed">
            {shortcodeText}
          </div>

          <button
            type="button"
            onClick={() => void copyShortcode()}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full font-bold text-[13px] transition-all ${
              copied
                ? "bg-green-500 text-white"
                : "bg-[#F5B800] text-black hover:bg-[#E5A800]"
            }`}
          >
            <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />
            {copied ? "Copied!" : "Copy shortcode"}
          </button>

          <div className="mt-4 bg-[#F9FAFB] border border-dashed border-gray-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Info className="w-4 h-4 text-gray-600 shrink-0" strokeWidth={2} />
              <span className="text-[13px] font-bold text-gray-800">Tip</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Active widgets also appear on WooCommerce product pages automatically.
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-2">
              Paste this shortcode on any other page, post, or Shortcode block.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        ref={mainScrollRef}
        className="flex-1 flex flex-col overflow-y-auto min-w-0 min-h-0 px-6 pt-7 pb-6 gap-5 scroll-smooth"
      >
        {onboardingStep && (
          <OnboardingGuideBanner
            stepId={onboardingStep}
            stepNumber={onboardingStepNumber}
            totalSteps={ONBOARDING_STEP_ORDER.length}
          />
        )}

        {loadError && !widgetsLoading ? (
          <ApiErrorDisplay
            message={loadError}
            isNetwork={loadErrorIsNetwork}
            onRetry={loadErrorIsNetwork ? fetchWidgets : undefined}
            className="shrink-0"
          />
        ) : null}

        {/* Widget Library — header + cards in one white box */}
        <section className="shrink-0 bg-white border border-gray-200 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 pt-4 pb-3.5">
            <div className="text-[20px] font-bold text-black leading-none">Widget Library</div>
            <div className="text-[14px] text-gray-400 font-medium leading-none mt-1.5">
              Browse widget templates, view live previews, and customize your favourite.
            </div>
          </div>

          <div className="bg-[#F5F5F5] px-3 pt-4 pb-3">
            {widgetsLoading && widgets.length === 0 ? (
              <ShimmerWidgetsSkeleton />
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {widgets.map((widget) => (
                  <WidgetLibraryCard
                    key={widget.id}
                    widget={widget}
                    isActive={selectedWidget === widget.id}
                    onSelect={handleSelectWidget}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Preview section */}
        <section
          ref={previewSectionRef}
          className="shrink-0 bg-white border border-gray-200 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] scroll-mt-3"
        >
          <div className="sticky top-0 z-20 bg-white px-5 pt-4 pb-3.5 border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[20px] font-bold text-black leading-none truncate min-w-0">
                {selectedWidgetData?.title || "Product Review Widget"}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isWidgetLive && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border bg-green-50 text-green-700 border-green-200">
                    Active
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void handleToggleWidget()}
                  disabled={togglingWidget}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isWidgetLive
                      ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-semibold"
                      : `border-black bg-white text-[#F5B800] hover:bg-[#FFFBEB] ${
                          onboardingStep === "widget"
                            ? "ring-2 ring-orange-400 ring-offset-2 animate-pulse"
                            : ""
                        }`
                  }`}
                >
                  {togglingWidget ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {isWidgetLive ? "Deactivating…" : "Activating…"}
                    </>
                  ) : isWidgetLive ? (
                    <>
                      <PowerOff className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5 hyoka-activate-icon" strokeWidth={2.5} />
                      Activate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWidgetSaveError(null);
                    openStyleEditor();
                  }}
                  className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[#F5B800] text-black rounded-lg text-[13px] font-bold hover:bg-[#E5A800] transition-all"
                >
                  Use this template
                  <ArrowRight className="w-4 h-4 hyoka-use-template-arrow" strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="text-[14px] text-gray-400 font-medium leading-none mt-1.5 truncate whitespace-nowrap">
              {selectedWidgetData?.description ||
                "Collect customer reviews on product pages or embed the form on any page via shortcode."}
            </div>
            {widgetSaveError && (
              <div className="mt-2 text-[12px] text-red-600 font-medium" role="alert">
                {widgetSaveError}
              </div>
            )}
          </div>

          <div className="bg-[#F5F5F5] px-4 pt-6 pb-4">
            <div key={selectedWidget} className="widget-preview-panel">
              <WidgetPreview widgetId={selectedWidget} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Widgets;
