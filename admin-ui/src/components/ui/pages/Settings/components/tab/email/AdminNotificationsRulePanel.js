import SettingsToggle from "../../SettingsToggle";

const StarSelect = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[14px] font-bold text-gray-900 focus:border-orange-500 focus:outline-none disabled:opacity-60 disabled:bg-gray-50"
  >
    <option value="0">No review is negative</option>
    {[1, 2, 3, 4, 5].map((n) => (
      <option key={n} value={String(n)}>
        {n} star{n === 1 ? "" : "s"} or below
      </option>
    ))}
  </select>
);

const AdminNotificationsRulePanel = ({ form, updateField }) => {
  const enabled = !!form.admin_notifications_enabled;

  const emails = String(form.admin_notification_emails || "");
  const notifyNewReview = !!form.admin_notify_new_review;
  const notifyNewQuestion = !!form.admin_notify_new_question;
  const sendEmailCopy = !!form.admin_send_email_copy;

  const negativeThreshold = String(form.negative_review_threshold ?? "0");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div>
          <p className="text-[15px] font-bold text-gray-900">
            Enable admin notifications
          </p>
          <p className="text-[13px] text-gray-500 font-medium mt-0.5">
            Show admin notification settings and send alerts when enabled.
          </p>
        </div>
        <SettingsToggle
          checked={enabled}
          onChange={(val) => updateField("admin_notifications_enabled", val)}
          ariaLabel="Enable admin notifications"
        />
      </div>

      {enabled && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-black text-gray-900">
                Admin notifications
              </h4>
              <button
                type="button"
                onClick={() => {
                  updateField("admin_notification_emails", "");
                  updateField("admin_notify_new_review", true);
                  updateField("admin_notify_new_question", true);
                  updateField("admin_send_email_copy", false);
                }}
                className="text-[12px] font-bold text-gray-500 hover:text-gray-700"
              >
                Reset to default
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Admin notification emails
              </label>
              <textarea
                rows={4}
                value={emails}
                onChange={(e) =>
                  updateField("admin_notification_emails", e.target.value)
                }
                placeholder="admin@example.com, support@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[14px] font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
              />
              <p className="mt-1.5 text-[12px] text-gray-400 font-medium">
                Separate email addresses with a comma (,). You can add up to 3
                emails.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyNewReview}
                  onChange={(e) =>
                    updateField("admin_notify_new_review", e.target.checked)
                  }
                  className="mt-1"
                />
                <span className="text-[13px] font-bold text-gray-700">
                  Notify me when a new review is created
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyNewQuestion}
                  onChange={(e) =>
                    updateField("admin_notify_new_question", e.target.checked)
                  }
                  className="mt-1"
                />
                <span className="text-[13px] font-bold text-gray-700">
                  Notify me when a new question is posted
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendEmailCopy}
                  onChange={(e) =>
                    updateField("admin_send_email_copy", e.target.checked)
                  }
                  className="mt-1"
                />
                <span>
                  <span className="text-[13px] font-bold text-gray-700 block">
                    Send me a copy of each email sent to customers
                  </span>
                  <span className="text-[12px] text-gray-400 font-medium block mt-0.5">
                    Includes coupons, private replies and review edits done by
                    admin.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-black text-gray-900">
                Negative review notifications
              </h4>
              <button
                type="button"
                onClick={() => {
                  updateField("negative_review_threshold", "0");
                  updateField("negative_notification_alt_enabled", false);
                  updateField("negative_notification_alt_emails", "");
                }}
                className="text-[12px] font-bold text-gray-500 hover:text-gray-700"
              >
                Reset to default
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Negative review star rating
              </label>
              <StarSelect
                value={negativeThreshold}
                onChange={(v) => updateField("negative_review_threshold", v)}
                disabled={false}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!form.negative_notification_alt_enabled}
                onChange={(e) =>
                  updateField(
                    "negative_notification_alt_enabled",
                    e.target.checked
                  )
                }
                className="mt-1"
              />
              <span className="text-[13px] font-bold text-gray-700">
                Receive negative review notifications at a different email
              </span>
            </label>

            {!!form.negative_notification_alt_enabled && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Negative notification emails
                </label>
                <input
                  type="text"
                  value={String(form.negative_notification_alt_emails || "")}
                  onChange={(e) =>
                    updateField(
                      "negative_notification_alt_emails",
                      e.target.value
                    )
                  }
                  placeholder="support@example.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[14px] font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
                />
                <p className="mt-1.5 text-[12px] text-gray-400 font-medium">
                  You can use an alternative address, such as your customer
                  support email.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminNotificationsRulePanel;

