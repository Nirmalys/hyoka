import { Check } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Email sent" },
  { value: "pending", label: "Not sent yet" },
];

const RepliesEmailFilters = ({ emailSentFilter, setEmailSentFilter, onSelect }) => {
  return (
    <div className="w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
        Email status
      </p>
      <div className="flex flex-col gap-0.5">
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = emailSentFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setEmailSentFilter(opt.value);
                onSelect?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                isSelected
                  ? "bg-orange-50 text-orange-600 font-bold"
                  : "text-gray-600 hover:bg-gray-50 font-medium"
              }`}
            >
              {opt.label}
              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-orange-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RepliesEmailFilters;
