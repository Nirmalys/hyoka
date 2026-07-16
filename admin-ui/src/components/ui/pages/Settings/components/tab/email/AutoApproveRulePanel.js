import { useState } from "react";
import SettingsToggle from "../../SettingsToggle";
import RuleSelectField from "./RuleSelectField";

const RATING_OPTIONS = [
  { value: 5, label: "5 Stars and above" },
  { value: 4, label: "4 Stars and above" },
  { value: 3, label: "3 Stars and above" },
  { value: 2, label: "2 Stars and above" },
  { value: 1, label: "1 Star and above" },
];

const MIN_LENGTH_OPTIONS = [
  { value: 0, label: "No minimum" },
  { value: 10, label: "10 and above" },
  { value: 20, label: "20 and above" },
  { value: 50, label: "50 and above" },
  { value: 100, label: "100 and above" },
];

const FieldLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold text-gray-900 mb-2">
    {children}
  </label>
);

const AutoApproveRulePanel = ({ form, updateField }) => {
  const minStars = Math.max(1, Math.min(5, Number(form.auto_approve_min_rating) || 4));
  const [minLength, setMinLength] = useState("20");
  const [autoApproveReplies, setAutoApproveReplies] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel htmlFor="auto-approve-min-rating">Minimum rating to auto-approve</FieldLabel>
        <RuleSelectField
          id="auto-approve-min-rating"
          value={minStars}
          onChange={(val) => updateField("auto_approve_min_rating", Number(val))}
          options={RATING_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel htmlFor="auto-approve-min-length">Minimum review length (characters)</FieldLabel>
        <RuleSelectField
          id="auto-approve-min-length"
          value={minLength}
          onChange={setMinLength}
          options={MIN_LENGTH_OPTIONS}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3.5">
        <p className="text-[14px] font-bold text-gray-900">Auto-approve replies to store</p>
        <SettingsToggle
          checked={autoApproveReplies}
          onChange={setAutoApproveReplies}
          ariaLabel="Auto-approve replies to store"
        />
      </div>
    </div>
  );
};

export default AutoApproveRulePanel;
