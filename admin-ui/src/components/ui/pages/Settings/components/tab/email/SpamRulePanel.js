import { useState } from "react";
import SettingsToggle from "../../SettingsToggle";
import RuleSelectField from "./RuleSelectField";

const ACTION_OPTIONS = [
  { value: "pending", label: "Move to Pending" },
  { value: "spam", label: "Mark as Spam" },
  { value: "reject", label: "Reject submission" },
  { value: "flag", label: "Flag for review" },
];

const RATE_LIMIT_OPTIONS = [
  { value: "1", label: "1 review per day" },
  { value: "3", label: "3 reviews per day" },
  { value: "5", label: "5 reviews per day" },
  { value: "10", label: "10 reviews per day" },
  { value: "none", label: "No limit" },
];

const FieldLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold text-gray-900 mb-2">
    {children}
  </label>
);

const FieldHint = ({ children }) => (
  <p className="mt-1.5 text-[12px] text-gray-400 leading-relaxed">{children}</p>
);

const ToggleRow = ({ label, checked, onChange, ariaLabel }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3.5">
    <p className="text-[14px] font-bold text-gray-900">{label}</p>
    <SettingsToggle checked={checked} onChange={onChange} ariaLabel={ariaLabel} />
  </div>
);

const SpamRulePanel = ({ form, updateField }) => {
  const [sensitivity, setSensitivity] = useState(4);
  const [actionOnDetection, setActionOnDetection] = useState("pending");
  const [rateLimit, setRateLimit] = useState("3");
  const [flagRedundant, setFlagRedundant] = useState(true);
  const [flagLinksContacts, setFlagLinksContacts] = useState(true);

  const sliderProgress = `${((sensitivity - 1) / 4) * 100}%`;

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel htmlFor="spam-sensitivity">Spam Sensitivity</FieldLabel>
        <input
          id="spam-sensitivity"
          type="range"
          min={1}
          max={5}
          step={1}
          value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
          style={{ "--spam-slider-progress": sliderProgress }}
          className="spam-sensitivity-slider w-full cursor-pointer appearance-none rounded-full"
        />
        <FieldHint>Higher sensitivity flags more reviews but risks false positives.</FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="spam-filter-keywords">Custom spam words</FieldLabel>
        <textarea
          id="spam-filter-keywords"
          value={form.spam_filter_keywords || ""}
          onChange={(e) => updateField("spam_filter_keywords", e.target.value)}
          placeholder="http://, free money, lottery,"
          className="w-full min-h-[104px] resize-none rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 py-2.5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
        />
        <FieldHint>Comma-separated. Case-insensitive.</FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="spam-action-on-detection">Action on detection</FieldLabel>
        <RuleSelectField
          id="spam-action-on-detection"
          value={actionOnDetection}
          onChange={setActionOnDetection}
          options={ACTION_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel htmlFor="spam-rate-limit">Rate-limit</FieldLabel>
        <RuleSelectField
          id="spam-rate-limit"
          value={rateLimit}
          onChange={setRateLimit}
          options={RATE_LIMIT_OPTIONS}
        />
      </div>

      <div className="space-y-3">
        <ToggleRow
          label="Flag redundant reviews"
          checked={flagRedundant}
          onChange={setFlagRedundant}
          ariaLabel="Flag redundant reviews"
        />
        <ToggleRow
          label="Flag reviews with links & Contacts"
          checked={flagLinksContacts}
          onChange={setFlagLinksContacts}
          ariaLabel="Flag reviews with links and contacts"
        />
      </div>
    </div>
  );
};

export default SpamRulePanel;
