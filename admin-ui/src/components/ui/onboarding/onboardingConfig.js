import { Code2, Store, Palette, Mail, Sparkles, Upload } from "lucide-react";

export const ONBOARDING_STORAGE_KEY = "HYOKA_onboarding_v1";

export const ONBOARDING_STEP_ORDER = [
  "widget",
  "store",
  "editor",
  "template",
  "import",
  "automation",
];

export const ONBOARDING_STEPS = [
  {
    id: "widget",
    icon: Code2,
    title: "Install the review widget on your store",
    actionLabel: "Install widget",
  },
  {
    id: "store",
    icon: Store,
    title: "Add your store & sender details",
    actionLabel: "Add details",
  },
  {
    id: "editor",
    icon: Palette,
    title: "Customize the widget in the editor",
    actionLabel: "Open editor",
  },
  {
    id: "template",
    icon: Mail,
    title: "Customize & send a sample email template",
    actionLabel: "Edit template",
  },
  {
    id: "import",
    icon: Upload,
    title: "Import your existing reviews",
    actionLabel: "Import reviews",
  },
  {
    id: "automation",
    icon: Sparkles,
    title: "Set automation rules for email templates",
    actionLabel: "Configure rules",
  },
];

export const getOnboardingStepMeta = (stepId) =>
  ONBOARDING_STEPS.find((step) => step.id === stepId) || null;

export const getOnboardingStepUrl = (stepId) => {
  switch (stepId) {
    case "widget":
      return "/widgets?onboarding=widget";
    case "store":
      return "/settings?tab=automation&highlight=sender&onboarding=store";
    case "editor":
      return "/widgets?edit=true&onboarding=editor";
    case "template":
      return "/settings?tab=email_template&onboarding=template";
    case "import":
      return "/settings?tab=csv&onboarding=import";
    case "automation":
      return "/settings?tab=automation&highlight=trigger&onboarding=automation";
    default:
      return "/";
  }
};

export const getNextOnboardingStepId = (stepId, completed = {}) => {
  const index = ONBOARDING_STEP_ORDER.indexOf(stepId);
  if (index < 0) {
    return ONBOARDING_STEP_ORDER.find((id) => !completed[id]) || null;
  }

  for (let i = index + 1; i < ONBOARDING_STEP_ORDER.length; i += 1) {
    const nextId = ONBOARDING_STEP_ORDER[i];
    if (!completed[nextId]) {
      return nextId;
    }
  }

  return null;
};

export const getOnboardingPercent = (completed = {}) => {
  const done = ONBOARDING_STEP_ORDER.filter((id) => completed[id]).length;
  return Math.round((done / ONBOARDING_STEP_ORDER.length) * 100);
};

export const isOnboardingComplete = (completed = {}) =>
  ONBOARDING_STEP_ORDER.every((id) => completed[id]);

export const getOnboardingGuideText = (stepId) => {
  switch (stepId) {
    case "widget":
      return "Click Activate to turn on your first review widget on the storefront.";
    case "store":
      return "Open Email Sender, add your store name and sender email, then save.";
    case "editor":
      return "Customize colors and layout, then click Publish to apply your widget design.";
    case "template":
      return "Pick a template, customize it, and save your email design.";
    case "import":
      return "Import reviews from CSV or a provider to populate your store.";
    case "automation":
      return "Turn on review request automation and save your rules.";
    default:
      return "";
  }
};
