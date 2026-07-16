import React from "react";
import { Check } from "lucide-react";

const DISPLAY_STEPS = [
  { label: "Select Source", sublabel: "Choose import source" },
  { label: "Map columns", sublabel: "Match review fields" },
  { label: "Product identifier", sublabel: "Choose matching method" },
  { label: "Preview", sublabel: "Review import summary" },
  { label: "Import Reviews", sublabel: "Complete the import" },
];

// Map the internal wizard step (0=choose app, 1=upload, 2=map, 3=product, 4=preview)
// onto the 5 display steps shown in the sidebar.
const toDisplayIndex = (step, completed) => {
  if (completed) return 4;
  if (step <= 1) return 0;
  return step - 1;
};

const ImportStepper = ({ currentStep, completed }) => {
  const activeIndex = toDisplayIndex(currentStep, completed);

  return (
    <>
      <div className="mt-6 border-t border-gray-100" />
      <div className="mt-4">
        {DISPLAY_STEPS.map((s, index) => {
          const done = activeIndex > index;
          const active = activeIndex === index;
          const isLast = index === DISPLAY_STEPS.length - 1;
          return (
            <div key={s.label}>
              <div
                className={`flex items-start gap-3 rounded-lg px-2 py-2 transition-colors ${
                  active ? "bg-orange-50" : ""
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[13px] font-bold ${
                    active || done ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div>
                  <div
                    className={`text-[15px] font-semibold leading-tight ${
                      active || done ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-[13px] leading-tight text-gray-400">
                    {s.sublabel}
                  </div>
                </div>
              </div>
              {!isLast && (
                <div
                  className={`ml-[21px] h-3.5 border-l-2 border-dotted ${
                    done ? "border-orange-300" : "border-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ImportStepper;
