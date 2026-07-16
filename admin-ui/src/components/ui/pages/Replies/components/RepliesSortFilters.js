import { Check } from "lucide-react";

const SORT_OPTIONS = [
  { value: "created_at|DESC", label: "Most Recent" },
  { value: "rating|DESC", label: "Highest Rated" },
  { value: "rating|ASC", label: "Lowest Rated" },
  { value: "likes|DESC", label: "Most Helpful" },
];

const RepliesSortFilters = ({ orderBy, setOrderBy, order, setOrder, onSelect }) => {
  const currentValue = `${orderBy}|${order}`;

  return (
    <div className="w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
        Sort by
      </p>
      <div className="flex flex-col gap-0.5">
        {SORT_OPTIONS.map((option) => {
          const isSelected = option.value === currentValue;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                const [newOrderBy, newOrder] = option.value.split("|");
                setOrderBy(newOrderBy);
                setOrder(newOrder);
                onSelect?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                isSelected
                  ? "bg-orange-50 text-orange-600 font-bold"
                  : "text-gray-600 hover:bg-gray-50 font-medium"
              }`}
            >
              {option.label}
              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-orange-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RepliesSortFilters;
