import SettingsToggle from "../../SettingsToggle";

const AuditLogDetailsRulePanel = ({ form, updateField }) => {
  const enabled = !!form.show_audit_log_details;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div>
          <p className="text-[15px] font-bold text-gray-900">
            Enable audit log details
          </p>
          <p className="text-[13px] text-gray-500 font-medium mt-0.5">
            When enabled, admins can edit review content and will see the Edited
            indicator.
          </p>
        </div>
        <SettingsToggle
          checked={enabled}
          onChange={(val) => updateField("show_audit_log_details", val)}
          ariaLabel="Enable audit log details"
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
          Affects
        </p>
        <ul className="mt-2 text-[13px] text-gray-600 font-medium space-y-1">
          <li>- Edited badge visibility in the review drawer</li>
          <li>- Review content edit tools (edit pencil + save)</li>
        </ul>
      </div>
    </div>
  );
};

export default AuditLogDetailsRulePanel;

