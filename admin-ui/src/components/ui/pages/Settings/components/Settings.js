import { lazy, Suspense, useEffect, useRef, useMemo, useCallback } from "react";
import { Save, Loader2, CheckCircle2, Power } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import EmailDetailsTab from "./emailFlow/EmailDetailsTab";
import EmailSettingsTab from "./tab/email/EmailSettingsTab";
import EmailTemplatesList from "./tab/email/EmailTemplatesList";
import { getTemplateTogglePatch } from "./tab/email/emailTemplatesConfig";
import ManualRequestTab from "./tab/manual/ManualRequestTab";
import SubmissionFormTab from "./tab/submission/SubmissionFormTab";
import { useSettingsForm } from "../hooks/useSettingsForm";
import OnboardingGuideBanner from "../../../onboarding/OnboardingGuideBanner";
import { ONBOARDING_STEP_ORDER } from "../../../onboarding/onboardingConfig";
import { useOnboarding } from "../../../onboarding/OnboardingContext";
import { ShimmerSettingsSkeleton, ShimmerPageSkeleton } from "../../../Shimmer";
import ApiErrorDisplay from "../../../ApiErrorDisplay";

const CommonEditor = lazy(() =>
  import(/* webpackChunkName: "editor" */ "../../editor/CommonEditor")
);
const CsvImport = lazy(() =>
  import(/* webpackChunkName: "csv-import" */ "../../CsvImport/components/CsvImport")
);
import { useManualRequest } from "./tab/manual/hooks/useManualRequest";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onboardingStep = searchParams.get("onboarding");
  const { advanceFromStep } = useOnboarding();
  const tabParam = searchParams.get("tab");
  const emailParam = searchParams.get("email");
  const isManualDeepLink = tabParam === "manual";

  const settingsTab = useMemo(() => {
    return searchParams.get("tab") || "email_details";
  }, [searchParams]);

  const isEmailFlowTab = settingsTab !== "csv";

  const emailEditorId = searchParams.get("email_editor");
  const isEmailTemplateEditor =
    settingsTab === "email_template" && Boolean(emailEditorId);
  const isEditorTab = isEmailTemplateEditor;

  const setSettingsTab = useCallback((tab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    newParams.delete("email_editor");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const openEmailEditor = useCallback(
    (templateId) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "email_template");
      newParams.set("email_editor", templateId);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const closeEmailEditor = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", "email_template");
    newParams.delete("email_editor");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const settingsLoadedRef = useRef(false);

  const {
    form,
    loading,
    error,
    errorIsNetwork,
    setError,
    savedNote,
    setSavedNote,
    savingContext,
    loadSettings,
    updateField,
    updateEmailLayoutBlock,
    updateEmailLayoutBlockStyle,
    updateEmailTemplateExtras,
    setAutomationEnabled,
    handleSaveAutomation,
    rulesDirty,
    emailTemplatesDirty,
    submissionFormDirty,
    applyEmailTemplatePatch,
    handleSaveEmailTemplates,
    handleSaveSubmissionForm,
    handleSaveTemplate,
    previewFontStack,
    previewPrimaryHex,
  } = useSettingsForm();

  const {
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
  } = useManualRequest(setError);

  const onboardingStepNumber = onboardingStep
    ? ONBOARDING_STEP_ORDER.indexOf(onboardingStep) + 1
    : 0;

  const saveAutomationForOnboarding = useCallback(
    async (overrides = {}) => {
      const ok = await handleSaveAutomation(overrides);
      if (!ok) return false;
      if (onboardingStep === "automation") {
        advanceFromStep("automation");
      }
      return true;
    },
    [advanceFromStep, handleSaveAutomation, onboardingStep]
  );

  const saveEmailTemplatesForOnboarding = useCallback(async () => {
    const ok = await handleSaveEmailTemplates();
    if (ok && onboardingStep === "template") {
      advanceFromStep("template");
    }
    return ok;
  }, [advanceFromStep, handleSaveEmailTemplates, onboardingStep]);

  const saveTemplateForOnboarding = useCallback(
    async (templateId) => {
      const ok = await handleSaveTemplate(templateId);
      if (ok && onboardingStep === "template") {
        advanceFromStep("template");
      }
      return ok;
    },
    [advanceFromStep, handleSaveTemplate, onboardingStep]
  );

  useEffect(() => {
    if (settingsLoadedRef.current) {
      return;
    }
    settingsLoadedRef.current = true;

    loadSettings().then((lastContext) => {
      const currentTab = searchParams.get("tab");
      if (currentTab) {
        return;
      }
      if (!isManualDeepLink && lastContext === "template" && !emailEditorId) {
        setSettingsTab("email_template");
      }
    });
  }, [isManualDeepLink, loadSettings, emailEditorId, setSettingsTab, searchParams]);

  useEffect(() => {
    if (isManualDeepLink) {
      setSettingsTab("manual");
    }
  }, [isManualDeepLink, setSettingsTab]);

  useEffect(() => {
    if (isManualDeepLink && emailParam) {
      setManualQuery(emailParam);
    }
  }, [emailParam, isManualDeepLink, setManualQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        setSettingsTab("manual");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSettingsTab]);


  if (loading && !isManualDeepLink) {
    return (
      <div className={`flex flex-col h-full min-h-0 ${settingsTab === "email_details" || settingsTab === "automation" ? "bg-[#FAFAFA]" : "bg-[#fdfdfd]"}`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ShimmerSettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full min-h-0 ${settingsTab === "email_details" || settingsTab === "automation" || settingsTab === "submission_form" || settingsTab === "manual" || settingsTab === "email_template" ? "bg-[#FAFAFA]" : "bg-[#fdfdfd]"}`}>
      <div className={`flex-1 min-h-0 ${isEditorTab ? "overflow-hidden" : settingsTab === "csv" ? "overflow-y-auto" : `overflow-y-auto px-8 pb-8 ${settingsTab === "submission_form" || settingsTab === "email_details" || settingsTab === "automation" || settingsTab === "manual" || settingsTab === "email_template" ? "pt-6" : "pt-8"}`}`}>
        {onboardingStep && !isEditorTab && settingsTab !== "csv" && (
          <OnboardingGuideBanner
            stepId={onboardingStep}
            stepNumber={onboardingStepNumber}
            totalSteps={ONBOARDING_STEP_ORDER.length}
          />
        )}
        {error && errorIsNetwork && !isEditorTab ? (
          <ApiErrorDisplay
            message={error}
            isNetwork={errorIsNetwork}
            onRetry={() => {
              setError("");
              void loadSettings();
            }}
            className={settingsTab === "csv" ? "mb-6" : "mb-6"}
          />
        ) : null}
        <div
          className={
            isEditorTab
              ? "h-full min-h-0 flex flex-col"
              : settingsTab === "csv"
                ? "w-full"
                : isEmailFlowTab
                  ? "w-full"
                  : "max-w-7xl mx-auto space-y-8"
          }
        >
          {!isEditorTab && isEmailFlowTab && settingsTab !== "email_details" && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {settingsTab === "automation" && (
              <div>
                <div className="text-[26px] font-bold text-gray-900 leading-tight">Automation Rules</div>
                <div className="text-[13px] text-gray-500 mt-1">
                  Set up automated email workflows triggered by customer actions.
                </div>
              </div>
            )}
            {settingsTab === "email_template" && !isEmailTemplateEditor && (
              <div>
                <div className="text-[26px] font-bold text-gray-900 leading-tight">Email Templates</div>
                <div className="text-[13px] text-gray-500">
                  Browse and customize email templates for review request, reminder or follow-ups
                </div>
              </div>
            )}
            {settingsTab === "manual" && (
              <div>
                <div className="text-[26px] font-bold text-gray-900 leading-tight">Manual Requests</div>
                <div className="text-[13px] text-gray-500">
                  Send review requests &amp; reminders manually to the customers
                </div>
              </div>
            )}
            {settingsTab === "submission_form" && (
              <div className="flex items-start justify-between gap-4 w-full">
                <div>
                  <div className="text-[26px] font-bold text-gray-900 leading-tight">Submission Form</div>
                  <div className="text-[13px] text-gray-500">
                    Design the review form customers see when they click Write a Review
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {savedNote && !submissionFormDirty && (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {savedNote}
                    </span>
                  )}
                  {error && settingsTab === "submission_form" && (
                    <span className="text-red-600 text-sm font-semibold">{error}</span>
                  )}
                  {submissionFormDirty && (
                    <button
                      type="button"
                      onClick={() => handleSaveSubmissionForm()}
                      disabled={savingContext === "submission_form"}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-black border transition-all ${
                        savingContext === "submission_form"
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-100 hover:bg-orange-700"
                      }`}
                    >
                      {savingContext === "submission_form" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save submission form
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
            {settingsTab === "automation" && (
                  <div className="flex items-center gap-3 shrink-0">
                    {savedNote && !rulesDirty && (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {savedNote}
                      </span>
                    )}
                    {error && (
                      <span className="text-red-600 text-sm font-semibold">{error}</span>
                    )}
                    {rulesDirty && (
                      <button
                        type="button"
                        onClick={() => void saveAutomationForOnboarding()}
                        disabled={savingContext === "automation"}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-black border transition-all ${
                          savingContext === "automation"
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-100 hover:bg-orange-700"
                        }`}
                      >
                        {savingContext === "automation" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save & apply rules
                          </>
                        )}
                      </button>
                    )}
                  </div>
            )}
            {settingsTab === "manual" && (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveAutomation({ automation_enabled: !form.automation_enabled })}
                      disabled={savingContext === "automation"}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold shadow-sm transition-all ${
                        form.automation_enabled
                          ? "bg-[#F5B800] text-gray-900 hover:bg-[#E5AB00]"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {savingContext === "automation" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                      Automation {form.automation_enabled ? "On" : "Off"}
                    </button>
                  </div>
            )}
            {settingsTab === "email_template" && !isEmailTemplateEditor && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {savedNote && !emailTemplatesDirty && (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {savedNote}
                      </span>
                    )}
                    {error && settingsTab === "email_template" && (
                      <span className="text-red-600 text-sm font-semibold">{error}</span>
                    )}
                    {emailTemplatesDirty && (
                      <button
                        type="button"
                        onClick={() => void saveEmailTemplatesForOnboarding()}
                        disabled={savingContext === "email_templates"}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-black border transition-all ${
                          savingContext === "email_templates"
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-100 hover:bg-orange-700"
                        }`}
                      >
                        {savingContext === "email_templates" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save templates
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveAutomation({ automation_enabled: !form.automation_enabled })}
                      disabled={savingContext === "automation"}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold shadow-sm transition-all ${
                        form.automation_enabled
                          ? "bg-[#F5B800] text-gray-900 hover:bg-[#E5AB00]"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {savingContext === "automation" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                      Automation {form.automation_enabled ? "On" : "Off"}
                    </button>
                  </div>
            )}
          </div>
          )}

          <div className={`relative ${isEditorTab ? "h-full min-h-0 flex-1 flex flex-col" : settingsTab === "email_details" ? "" : "min-h-[600px]"}`}>
            <div
              className={`transition-all duration-500 ease-in-out ${
                settingsTab === "email_details"
                  ? "opacity-100 translate-y-0 relative z-10"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {settingsTab === "email_details" && (
                <EmailDetailsTab
                  form={form}
                  handleSaveAutomation={handleSaveAutomation}
                  savingContext={savingContext}
                  isActive
                />
              )}
            </div>

            <div
              className={`transition-all duration-500 ease-in-out ${
                settingsTab === "automation"
                  ? "opacity-100 translate-y-0 relative z-10"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {settingsTab === "automation" && (
                <EmailSettingsTab
                  form={form}
                  updateField={updateField}
                  rulesDirty={rulesDirty}
                  handleSaveAutomation={handleSaveAutomation}
                  savingContext={savingContext}
                  onOnboardingSenderSaved={() => advanceFromStep("store")}
                  onOnboardingAutomationSaved={() => advanceFromStep("automation")}
                />
              )}
            </div>

            <div
              className={`transition-all duration-500 ease-in-out ${
                settingsTab === "manual"
                  ? "opacity-100 translate-y-0 relative z-10"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {settingsTab === "manual" && (
                <ManualRequestTab
                  manualQuery={manualQuery}
                  setManualQuery={setManualQuery}
                  manualResults={manualResults}
                  manualLoading={manualLoading}
                  manualSelected={manualSelected}
                  setManualSelected={setManualSelected}
                  sending={sending}
                  handleSendManualDirect={handleSendManualDirect}
                  manualSavedNote={manualSavedNote}
                  error={error}
                  recentManualRequests={recentManualRequests}
                  recentLoading={recentLoading}
                />
              )}
            </div>

            <div
              className={`transition-all duration-500 ease-in-out ${
                settingsTab === "email_template" && !isEmailTemplateEditor
                  ? "opacity-100 translate-y-0 relative z-10"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {settingsTab === "email_template" && !isEmailTemplateEditor && (
                <EmailTemplatesList
                  form={form}
                  onEditTemplate={openEmailEditor}
                  onToggleTemplate={(item, next) =>
                    applyEmailTemplatePatch(getTemplateTogglePatch(item, next))
                  }
                  previewFontStack={previewFontStack}
                  previewPrimaryHex={previewPrimaryHex}
                  emailTemplatesDirty={emailTemplatesDirty}
                />
              )}
            </div>

            <div
              className={`transition-all duration-500 ease-in-out ${
                isEmailTemplateEditor
                  ? "opacity-100 translate-y-0 relative z-10 h-full min-h-0 flex flex-col flex-1"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {isEmailTemplateEditor && (
                <Suspense fallback={<ShimmerPageSkeleton />}>
                  <CommonEditor
                    mode="email"
                    emailTemplateId={emailEditorId}
                    onBack={closeEmailEditor}
                    form={form}
                    updateField={updateField}
                    updateEmailLayoutBlock={updateEmailLayoutBlock}
                    updateEmailLayoutBlockStyle={updateEmailLayoutBlockStyle}
                    updateEmailTemplateExtras={updateEmailTemplateExtras}
                    handleSaveTemplate={saveTemplateForOnboarding}
                    savingContext={savingContext}
                    hideSaveButton={true}
                    previewFontStack={previewFontStack}
                    previewPrimaryHex={previewPrimaryHex}
                  />
                </Suspense>
              )}
            </div>

            <div
              className={`transition-all duration-500 ease-in-out ${
                settingsTab === "submission_form"
                  ? "opacity-100 translate-y-0 relative z-10"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {settingsTab === "submission_form" && (
                <SubmissionFormTab
                  form={form}
                  updateField={updateField}
                  previewPrimaryHex={previewPrimaryHex}
                />
              )}
            </div>

            <div
              className={`transition-all duration-500 ease-in-out ${
                settingsTab === "csv"
                  ? "opacity-100 translate-y-0 relative z-10"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              {settingsTab === "csv" && (
                <Suspense fallback={<ShimmerPageSkeleton />}>
                  <CsvImport />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
