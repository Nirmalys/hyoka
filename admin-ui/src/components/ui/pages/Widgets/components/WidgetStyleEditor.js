import { lazy, Suspense, useState, useCallback } from "react";
import { useWidgetStyles } from "../hooks/useWidgetStyles";
import { useOnboarding } from "../../../onboarding/OnboardingContext";
import WidgetPreviewModal from "./WidgetPreviewModal";
import WidgetPublishSuccessModal from "./WidgetPublishSuccessModal";
import { ShimmerPageSkeleton } from "../../../Shimmer";
import ApiErrorDisplay from "../../../ApiErrorDisplay";

const CommonEditor = lazy(() =>
  import(/* webpackChunkName: "editor" */ "../../editor/CommonEditor")
);

/** Widget styling uses the same CommonEditor as email templates and forms. */
const WidgetStyleEditor = ({ widgetId, onClose, onboardingStep = null }) => {
  const { advanceFromStep } = useOnboarding();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);

  const {
    form,
    loading,
    publishing,
    error,
    errorIsNetwork,
    isPublished,
    updateField,
    handlePublish,
    previewFontStack,
  } = useWidgetStyles(widgetId);

  const onPublish = useCallback(async () => {
    const published = await handlePublish();
    if (published) {
      setPublishSuccessOpen(true);
    }
  }, [handlePublish]);

  if (loading) {
    return <ShimmerPageSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-[#ECECEC]">
      {error ? (
        <ApiErrorDisplay message={error} isNetwork={errorIsNetwork} className="shrink-0 mx-6 mt-4" />
      ) : null}
      <Suspense fallback={<ShimmerPageSkeleton />}>
        <CommonEditor
          mode="widget"
          widgetId={widgetId}
          form={form}
          updateField={updateField}
          handlePublishTemplate={onPublish}
          savingContext={publishing ? "publish" : null}
          widgetPublished={isPublished}
          onBack={onClose}
          onPreview={() => setPreviewOpen(true)}
          hideSaveButton={true}
          previewFontStack={previewFontStack}
          previewPrimaryHex={form?.primary_color}
        />
      </Suspense>

      <WidgetPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        widgetId={widgetId}
        form={form}
        previewFontStack={previewFontStack}
      />

      <WidgetPublishSuccessModal
        isOpen={publishSuccessOpen}
        onClose={() => setPublishSuccessOpen(false)}
        onBackToWidgets={onClose}
        onboardingStep={onboardingStep}
        onContinueSetup={() => {
          setPublishSuccessOpen(false);
          if (onboardingStep === "widget" || onboardingStep === "editor") {
            advanceFromStep(onboardingStep);
            return;
          }
          onClose();
        }}
      />
    </div>
  );
};

export default WidgetStyleEditor;
