import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_STEP_ORDER,
  ONBOARDING_STEPS,
  getNextOnboardingStepId,
  getOnboardingPercent,
  getOnboardingStepUrl,
  isOnboardingComplete,
} from "./onboardingConfig";

const defaultState = {
  completed: {},
  dialogDismissed: false,
};

const OnboardingContext = createContext(null);

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      completed: parsed.completed || {},
      dialogDismissed: Boolean(parsed.dialogDismissed),
    };
  } catch {
    return defaultState;
  }
};

export const OnboardingProvider = ({ children }) => {
  const navigate = useNavigate();
  const [state, setState] = useState(readStoredState);
  const [dialogOpen, setDialogOpen] = useState(false);

  const persist = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const completed = state.completed || {};
  const dialogDismissed = Boolean(state.dialogDismissed);
  const percent = getOnboardingPercent(completed);
  const doneCount = ONBOARDING_STEP_ORDER.filter((id) => completed[id]).length;
  const allComplete = isOnboardingComplete(completed);

  const steps = useMemo(
    () =>
      ONBOARDING_STEPS.map((step) => ({
        ...step,
        done: Boolean(completed[step.id]),
        action: {
          label: step.actionLabel,
          to: getOnboardingStepUrl(step.id),
        },
      })),
    [completed]
  );

  useEffect(() => {
    if (allComplete) {
      setDialogOpen(false);
    }
  }, [allComplete]);

  const completeStep = useCallback(
    (stepId) => {
      if (!ONBOARDING_STEP_ORDER.includes(stepId)) return;
      persist((prev) => ({
        ...prev,
        completed: {
          ...(prev.completed || {}),
          [stepId]: true,
        },
      }));
    },
    [persist]
  );

  const goToStep = useCallback(
    (stepId) => {
      navigate(getOnboardingStepUrl(stepId));
    },
    [navigate]
  );

  const advanceFromStep = useCallback(
    (stepId) => {
      let nextStepId = null;
      persist((prev) => {
        const nextCompleted = {
          ...(prev.completed || {}),
          [stepId]: true,
        };
        nextStepId = getNextOnboardingStepId(stepId, nextCompleted);
        return {
          ...prev,
          completed: nextCompleted,
        };
      });

      if (nextStepId) {
        navigate(getOnboardingStepUrl(nextStepId));
      } else {
        navigate("/");
      }
      return nextStepId;
    },
    [navigate, persist]
  );

  const dismissDialog = useCallback(() => {
    setDialogOpen(false);
    persist((prev) => ({
      ...prev,
      dialogDismissed: true,
    }));
  }, [persist]);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      steps,
      completed,
      percent,
      doneCount,
      totalSteps: ONBOARDING_STEP_ORDER.length,
      allComplete,
      dialogDismissed,
      dialogOpen,
      openDialog,
      dismissDialog,
      completeStep,
      goToStep,
      advanceFromStep,
      getStepUrl: getOnboardingStepUrl,
    }),
    [
      steps,
      completed,
      percent,
      doneCount,
      allComplete,
      dialogDismissed,
      dialogOpen,
      openDialog,
      dismissDialog,
      completeStep,
      goToStep,
      advanceFromStep,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};
