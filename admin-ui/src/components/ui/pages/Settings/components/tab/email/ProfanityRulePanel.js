import { useState } from "react";
import RuleSelectField from "./RuleSelectField";

const FILTER_MODE_OPTIONS = [
  { value: "mask", label: "Mask offensive words (****)" },
  { value: "flag", label: "Flag for moderation" },
  { value: "block", label: "Block submission" },
];

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const FieldLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold text-gray-900 mb-2">
    {children}
  </label>
);

const FieldHint = ({ children }) => (
  <p className="mt-1.5 text-[12px] text-gray-400 leading-relaxed">{children}</p>
);

const ProfanityRulePanel = ({ form, updateField }) => {
  const [filterMode, setFilterMode] = useState("mask");
  const [language, setLanguage] = useState("auto");
  const [allowlist, setAllowlist] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel htmlFor="profanity-filter-mode">Filter mode</FieldLabel>
        <RuleSelectField
          id="profanity-filter-mode"
          value={filterMode}
          onChange={setFilterMode}
          options={FILTER_MODE_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel htmlFor="profanity-filter-language">Language</FieldLabel>
        <RuleSelectField
          id="profanity-filter-language"
          value={language}
          onChange={setLanguage}
          options={LANGUAGE_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel htmlFor="profanity-filter-keywords">Custom blocked words</FieldLabel>
        <textarea
          id="profanity-filter-keywords"
          value={form.profanity_filter_keywords || ""}
          onChange={(e) => updateField("profanity_filter_keywords", e.target.value)}
          placeholder="scam, damn, fake, ..."
          className="w-full min-h-[104px] resize-none rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 py-2.5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
        />
        <FieldHint>Comma-separated. Case-insensitive.</FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="profanity-filter-allowlist">Allowlist</FieldLabel>
        <textarea
          id="profanity-filter-allowlist"
          value={allowlist}
          onChange={(e) => setAllowlist(e.target.value)}
          placeholder="brand names, product names"
          className="w-full min-h-[104px] resize-none rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 py-2.5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
        />
        <FieldHint>Words that should never be filtered.</FieldHint>
      </div>
    </div>
  );
};

export default ProfanityRulePanel;
