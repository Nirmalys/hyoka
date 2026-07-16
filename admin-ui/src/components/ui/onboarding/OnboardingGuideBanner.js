import { Sparkles } from "lucide-react";
import { getOnboardingGuideText } from "./onboardingConfig";

const OnboardingGuideBanner = ({ stepId, stepNumber, totalSteps }) => {
  if (!stepId) return null;

  const guideText = getOnboardingGuideText(stepId);
  if (!guideText) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-wide text-orange-600">
            Setup step {stepNumber} of {totalSteps}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-gray-800">{guideText}</div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuideBanner;
