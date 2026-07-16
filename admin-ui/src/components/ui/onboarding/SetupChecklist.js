import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ProgressRing = ({ percent, size = 72 }) => {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-gray-900">
        {percent}%
      </div>
    </div>
  );
};

const SetupChecklist = ({
  steps,
  doneCount,
  totalSteps,
  percent,
  onStepAction,
  compact = false,
}) => (
  <div className={compact ? "" : "rounded-3xl border border-amber-100 bg-linear-to-br from-amber-50/80 to-white p-5 shadow-sm"}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {!compact && <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-orange-500" />}
        <div>
          <div className="flex items-center gap-2">
            <div className={`${compact ? "text-[18px]" : "text-[16px]"} font-bold text-gray-900`}>
              Finish setting up Hyoka
            </div>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-600">
              {doneCount}/{totalSteps} done
            </span>
          </div>
          <div className="mt-1 text-[13px] text-gray-500">
            A few quick steps and your store starts collecting, showcasing and converting with reviews.
          </div>
        </div>
      </div>

      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[13px] font-bold text-gray-700">{percent}%</span>
      </div>
    </div>

    <div className={`${compact ? "mt-4" : "mt-5"} space-y-2`}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const action = (
          <button
            type="button"
            onClick={() => onStepAction?.(step)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-gray-800"
          >
            {step.action.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        );

        return (
          <div
            key={step.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                step.done
                  ? "bg-orange-500 text-white"
                  : "border border-gray-200 bg-white text-gray-400"
              }`}
            >
              {step.done ? <Check className="h-4 w-4 stroke-3" /> : index + 1}
            </div>

            <Icon className="h-4 w-4 shrink-0 text-orange-500" />

            <div className="min-w-0 flex-1 truncate text-[13px] font-bold text-gray-900">
              {step.title}
            </div>

            {!step.done &&
              (onStepAction ? (
                action
              ) : (
                <Link
                  to={step.action.to}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-gray-800"
                >
                  {step.action.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
          </div>
        );
      })}
    </div>
  </div>
);

export { ProgressRing, SetupChecklist };
