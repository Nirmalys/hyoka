import React from "react";

const RulePreviewBox = ({ label, children, unsaved = false }) => (
  <div
    className={`rounded-md border px-3 py-2 ${
      unsaved
        ? "border-amber-200 bg-amber-50/90"
        : "border-orange-100 bg-[#FFF8F3]"
    }`}
  >
    {label && (
      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80">
        {label}
      </span>
    )}
    <div className={label ? "mt-1.5" : ""}>{children}</div>
  </div>
);

export const RulePreviewChips = ({ terms, extra = 0, emptyText = "None configured" }) => {
  if (!terms?.length) {
    return <p className="text-[11px] font-medium text-gray-500">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {terms.map((term) => (
        <span
          key={term}
          title={term}
          className="max-w-[160px] truncate px-2 py-0.5 rounded-md bg-white border border-orange-100 text-[11px] font-semibold text-gray-800"
        >
          {term}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[11px] font-bold text-gray-500">+{extra} more</span>
      )}
    </div>
  );
};

export default RulePreviewBox;
