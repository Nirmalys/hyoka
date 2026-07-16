import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bell,
  ShieldCheck,
  FileText,
  List,
  AtSign,
  Flag,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  UserRound,
} from "lucide-react";
import EmailRuleNavCard from "../../EmailRuleNavCard";
import EmailRuleDrawer from "./EmailRuleDrawer";
import { parseDaysAfter } from "../../../utils";
import TriggerRulePanel from "./TriggerRulePanel";
import ReminderRulePanel from "./ReminderRulePanel";
import PaginationRulePanel from "./PaginationRulePanel";
import SenderRulePanel from "./SenderRulePanel";
import SpamRulePanel from "./SpamRulePanel";
import ProfanityRulePanel from "./ProfanityRulePanel";
import AutoApproveRulePanel from "./AutoApproveRulePanel";
import AdminNotificationsRulePanel from "./AdminNotificationsRulePanel";
import VerifiedBadgeRulePanel from "./VerifiedBadgeRulePanel";
import AuditLogDetailsRulePanel from "./AuditLogDetailsRulePanel";

const RULE_IDS = {
  trigger: "trigger",
  reminder: "reminder",
  adminNotifications: "adminNotifications",
  verifiedBadge: "verifiedBadge",
  auditLogDetails: "auditLogDetails",
  pagination: "pagination",
  sender: "sender",
  spam: "spam",
  profanity: "profanity",
  autoApprove: "autoApprove",
};

const EmailSettingsTab = ({
  form,
  updateField,
  rulesDirty,
  handleSaveAutomation,
  savingContext,
  onOnboardingSenderSaved,
  onOnboardingAutomationSaved,
}) => {
  const [searchParams] = useSearchParams();
  const highlightRule = searchParams.get("highlight");
  const onboardingStep = searchParams.get("onboarding");
  const [activeRule, setActiveRule] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const days = parseDaysAfter(form.days_after, 7);
  const minStars = Math.max(1, Math.min(5, Number(form.auto_approve_min_rating) || 4));

  const navRules = useMemo(
    () => [
      {
        id: RULE_IDS.trigger,
        icon: MessageSquare,
        title: "Review Request",
        subtitle: "Automatically send a review request after delivery",
        enabled: !!form.review_request_schedule_enabled,
        toggleField: "review_request_schedule_enabled",
        toggleable: true,
        statusText: "—",
        panelTitle: "Review Request",
        panelDescription: "Automatically email customers for a review after purchase.",
      },
      {
        id: RULE_IDS.reminder,
        icon: Bell,
        title: "Reminder",
        subtitle: "Send a follow-up if no review is received",
        enabled: !!form.reminder_enabled,
        toggleField: "reminder_enabled",
        toggleable: true,
        statusText: "—",
        panelTitle: "Reminder",
        panelDescription:
          "After the review-request email, send one reminder if the customer still has not reviewed.",
      },
      {
        id: RULE_IDS.adminNotifications,
        icon: UserRound,
        title: "Admin Notification",
        subtitle: "Notify admins when a review is submitted",
        enabled: !!form.admin_notifications_enabled,
        toggleField: "admin_notifications_enabled",
        toggleable: true,
        statusText: "—",
        panelTitle: "Admin Notification",
        panelDescription:
          "Choose who gets notified about new reviews and whether admins receive a copy of outgoing emails.",
      },
      {
        id: RULE_IDS.profanity,
        icon: Flag,
        title: "Profanity Filter",
        subtitle: "Block reviews containing flagged words",
        enabled: !!form.profanity_filter_enabled,
        toggleField: "profanity_filter_enabled",
        toggleable: true,
        statusText: "—",
        panelTitle: "Profanity Filter",
        panelDescription: "Automatically flag or mask reviews containing offensive words.",
      },
      {
        id: RULE_IDS.spam,
        icon: AlertCircle,
        title: "Spam Filter",
        subtitle: "Automatically detect and flag spam reviews",
        enabled: !!form.spam_filter_enabled,
        toggleField: "spam_filter_enabled",
        toggleable: true,
        statusText: "—",
        panelTitle: "Spam Detection",
        panelDescription: "Detect and quarantine suspicious reviews automatically.",
      },
      {
        id: RULE_IDS.autoApprove,
        icon: CheckCircle2,
        title: "Auto Approval",
        subtitle: "Automatically publish high-rated reviews",
        enabled: !!form.auto_approve_enabled,
        toggleField: "auto_approve_enabled",
        toggleable: true,
        statusText: `${minStars}★`,
        panelTitle: "Auto Approval",
        panelDescription: "Publish qualifying reviews without manual moderation.",
      },
      {
        id: RULE_IDS.verifiedBadge,
        icon: ShieldCheck,
        title: "Verified Purchase Badge",
        subtitle: "Show verified badge on eligible reviews",
        enabled: !!form.show_verified_purchase_badge,
        toggleField: "show_verified_purchase_badge",
        toggleable: true,
        statusText: "—",
        panelTitle: "Verified Purchase Badge",
        panelDescription:
          "When enabled, the Verified Purchase badge will display on reviews where verification is available.",
      },
      {
        id: RULE_IDS.auditLogDetails,
        icon: FileText,
        title: "Audit Log Details",
        subtitle: "Show edited badge and edit tools in admin",
        enabled: !!form.show_audit_log_details,
        toggleField: "show_audit_log_details",
        toggleable: true,
        statusText: "—",
        panelTitle: "Audit Log Details",
        panelDescription:
          "When enabled, show edit-related indicators and allow review content editing in admin.",
      },
      {
        id: RULE_IDS.pagination,
        icon: List,
        title: "Reviews Pagination",
        subtitle: "Reviews per page in the admin list",
        enabled: true,
        toggleField: null,
        toggleable: false,
        statusText: "—",
        panelTitle: "Reviews Pagination",
        panelDescription: "How many reviews appear on each page in the Reviews admin list.",
      },
      {
        id: RULE_IDS.sender,
        icon: AtSign,
        title: "Email Sender",
        subtitle: "From name and address for outgoing emails",
        enabled: true,
        toggleField: null,
        toggleable: false,
        statusText: "—",
        panelTitle: "Email Sender",
        panelDescription: "From name and address used for review-request and follow-up emails.",
      },
    ],
    [
      form.review_request_schedule_enabled,
      form.reminder_enabled,
      form.admin_notifications_enabled,
      form.show_verified_purchase_badge,
      form.show_audit_log_details,
      form.spam_filter_enabled,
      form.profanity_filter_enabled,
      form.auto_approve_enabled,
      minStars,
    ]
  );

  const activeMeta = navRules.find((r) => r.id === activeRule) || null;

  const openRule = (ruleId) => {
    setActiveRule(ruleId);
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (!highlightRule) return;
    if (highlightRule === RULE_IDS.sender && onboardingStep === "store") {
      openRule(RULE_IDS.sender);
    }
    if (highlightRule === RULE_IDS.trigger && onboardingStep === "automation") {
      openRule(RULE_IDS.trigger);
    }
  }, [highlightRule, onboardingStep]);

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const isFormDrawer =
    activeRule === RULE_IDS.profanity ||
    activeRule === RULE_IDS.spam ||
    activeRule === RULE_IDS.trigger ||
    activeRule === RULE_IDS.autoApprove;

  const handleFormDrawerSave = async () => {
    if (handleSaveAutomation) {
      await handleSaveAutomation();
    }
    closeDrawer();
  };

  const handleSenderDrawerSave = async () => {
    if (!handleSaveAutomation) return;
    const ok = await handleSaveAutomation();
    if (ok) {
      if (onboardingStep === "store" && typeof onOnboardingSenderSaved === "function") {
        onOnboardingSenderSaved();
      }
      closeDrawer();
    }
  };

  const panelBody = () => {
    switch (activeRule) {
      case RULE_IDS.trigger:
        return <TriggerRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.reminder:
        return <ReminderRulePanel form={form} updateField={updateField} baseDays={days} />;
      case RULE_IDS.pagination:
        return <PaginationRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.sender:
        return <SenderRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.adminNotifications:
        return <AdminNotificationsRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.verifiedBadge:
        return <VerifiedBadgeRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.auditLogDetails:
        return <AuditLogDetailsRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.spam:
        return <SpamRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.profanity:
        return <ProfanityRulePanel form={form} updateField={updateField} />;
      case RULE_IDS.autoApprove:
        return <AutoApproveRulePanel form={form} updateField={updateField} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-w-0 pb-8">
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-start"
        aria-label="Automation rules"
      >
        {navRules.map((rule) => (
          <EmailRuleNavCard
            key={rule.id}
            icon={rule.icon}
            title={rule.title}
            subtitle={rule.subtitle}
            enabled={rule.enabled}
            statusText={rule.statusText}
            toggleable={rule.toggleable}
            highlighted={highlightRule === rule.id}
            onToggle={
              rule.toggleField
                ? (next) => updateField(rule.toggleField, next)
                : undefined
            }
            onEdit={() => openRule(rule.id)}
          />
        ))}
      </div>

      {activeMeta && (
        <EmailRuleDrawer
          isOpen={drawerOpen}
          onClose={closeDrawer}
          title={activeMeta.panelTitle}
          description={activeMeta.panelDescription}
          icon={isFormDrawer ? null : activeMeta.icon}
          rulesDirty={isFormDrawer ? false : rulesDirty}
          variant={isFormDrawer ? "form" : "default"}
          wrapContent={!isFormDrawer}
          footerActions={
            isFormDrawer
              ? {
                  onCancel: closeDrawer,
                  onSave: handleFormDrawerSave,
                  saving: savingContext === "automation",
                  saveDisabled: savingContext === "automation",
                }
              : activeRule === RULE_IDS.sender && onboardingStep === "store"
                ? {
                    onCancel: closeDrawer,
                    onSave: handleSenderDrawerSave,
                    saving: savingContext === "automation",
                    saveDisabled: savingContext === "automation",
                  }
                : activeRule === RULE_IDS.trigger && onboardingStep === "automation"
                  ? {
                      onCancel: closeDrawer,
                      onSave: async () => {
                        const ok = await handleSaveAutomation?.();
                        if (ok && typeof onOnboardingAutomationSaved === "function") {
                          onOnboardingAutomationSaved();
                        }
                        if (ok) closeDrawer();
                      },
                      saving: savingContext === "automation",
                      saveDisabled: savingContext === "automation",
                    }
                  : null
          }
        >
          {panelBody()}
        </EmailRuleDrawer>
      )}
    </div>
  );
};

export default EmailSettingsTab;
