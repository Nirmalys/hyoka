import { useState } from "react";
import SettingsToggle from "../../SettingsToggle";
import { parseDaysAfter } from "../../../utils";
import RuleSelectField from "./RuleSelectField";

const TRIGGER_EVENT_OPTIONS = [
  { value: "delivered", label: "Order delivered" },
  { value: "completed", label: "Order completed" },
  { value: "paid", label: "Order paid" },
  { value: "processing", label: "Order processing" },
];

const DELAY_OPTIONS = [
  { value: 1, label: "Immediately" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

const TIME_OPTIONS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const FieldLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold text-gray-900 mb-2">
    {children}
  </label>
);

const FieldHint = ({ children }) => (
  <p className="mt-1.5 text-[12px] text-gray-400 leading-relaxed">{children}</p>
);

const TriggerRulePanel = ({ form, updateField }) => {
  const days = parseDaysAfter(form.days_after, 7);
  const [triggerEvent, setTriggerEvent] = useState("delivered");
  const [sendFrom, setSendFrom] = useState("09:00 AM");
  const [sendTo, setSendTo] = useState("06:00 PM");
  const [includeImages, setIncludeImages] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel htmlFor="trigger-store-email">Store Email</FieldLabel>
        <input
          id="trigger-store-email"
          type="email"
          value={form.email_from_address || ""}
          onChange={(e) => updateField("email_from_address", e.target.value)}
          placeholder="store.example@gmail.com"
          className="w-full h-11 rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
        />
        <FieldHint>The requests are sent from this email</FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="trigger-store-name">Store name (sender)</FieldLabel>
        <input
          id="trigger-store-name"
          type="text"
          value={form.email_from_name || ""}
          onChange={(e) => updateField("email_from_name", e.target.value)}
          placeholder="Aurora Brands"
          className="w-full h-11 rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
        />
        <FieldHint>The name shown as the sender of the requests</FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="trigger-review-on">Request review on</FieldLabel>
        <RuleSelectField
          id="trigger-review-on"
          value={triggerEvent}
          onChange={setTriggerEvent}
          options={TRIGGER_EVENT_OPTIONS}
        />
        <FieldHint>Trigger event to request review for the order.</FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="trigger-delay">Delay (days)</FieldLabel>
        <RuleSelectField
          id="trigger-delay"
          value={days}
          onChange={(val) => updateField("days_after", Number(val))}
          options={DELAY_OPTIONS}
        />
        <FieldHint>Days to wait after the trigger event</FieldHint>
      </div>

      <div>
        <FieldLabel>Send window</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <RuleSelectField
            id="trigger-send-from"
            value={sendFrom}
            onChange={setSendFrom}
            options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))}
          />
          <RuleSelectField
            id="trigger-send-to"
            value={sendTo}
            onChange={setSendTo}
            options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3.5">
        <p className="text-[14px] font-bold text-gray-900">Include product images</p>
        <SettingsToggle
          checked={includeImages}
          onChange={setIncludeImages}
          ariaLabel="Include product images"
        />
      </div>
    </div>
  );
};

export default TriggerRulePanel;
