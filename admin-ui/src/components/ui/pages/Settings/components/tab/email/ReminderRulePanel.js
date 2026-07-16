import SettingsToggle from "../../SettingsToggle";
import { parseDaysAfter } from "../../../utils";

const ReminderRulePanel = ({ form, updateField, baseDays }) => {
  const reminderDays = parseDaysAfter(form.reminder_days_after, 3);
  const reminderLabel = `${reminderDays} day${reminderDays === 1 ? "" : "s"}`;
  const baseLabel = `${baseDays} day${baseDays === 1 ? "" : "s"}`;

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div>
          <p className="text-[15px] font-bold text-gray-900">Send one follow-up reminder</p>
          <p className="text-[13px] text-gray-500 font-medium mt-0.5">
            Only when automation is on. Skipped if the customer already left a review.
          </p>
        </div>
        <SettingsToggle
          checked={!!form.reminder_enabled}
          onChange={(val) => updateField("reminder_enabled", val)}
          ariaLabel="Single follow-up reminder"
        />
      </div>

      <div
        className={`space-y-4 ${
          !form.reminder_enabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="space-y-3">
          <label className="block text-[15px] font-bold text-gray-900">
            Days after review-request email:{" "}
            <span className="text-orange-600">{reminderLabel}</span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {[3, 7, 14, 30].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => updateField("reminder_days_after", val)}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold border transition-all ${
                  reminderDays === val
                    ? "border-orange-600 bg-orange-600 text-white"
                    : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
                }`}
              >
                {`${val}d`}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={90}
              value={form.reminder_days_after ?? reminderDays}
              onChange={(e) => updateField("reminder_days_after", e.target.value)}
              className="w-16 px-3 py-2 rounded-lg border border-gray-100 bg-white text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              aria-label="Custom reminder delay in days"
            />
          </div>
          <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
            Example: review request at {baseLabel} after order completed, then one reminder{" "}
            {reminderLabel} later if no review.
            Save rules for cron to use your chosen delay.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Reminder email subject
          </label>
          <input
            type="text"
            value={form.reminder_subject || ""}
            onChange={(e) => updateField("reminder_subject", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[15px] font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Reminder email heading
          </label>
          <input
            type="text"
            value={form.reminder_email_heading || ""}
            onChange={(e) => updateField("reminder_email_heading", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[15px] font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
};

export default ReminderRulePanel;

