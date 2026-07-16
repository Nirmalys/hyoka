import SettingsToggle from "../../SettingsToggle";

const VerifiedBadgeRulePanel = ({ form, updateField }) => {
  const enabled = !!form.show_verified_purchase_badge;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div>
          <p className="text-[15px] font-bold text-gray-900">
            Show Verified Purchase badge
          </p>
          <p className="text-[13px] text-gray-500 font-medium mt-0.5">
            When disabled, the badge is hidden even for verified reviews.
          </p>
        </div>
        <SettingsToggle
          checked={enabled}
          onChange={(val) => updateField("show_verified_purchase_badge", val)}
          ariaLabel="Show Verified Purchase badge"
        />
      </div>
    </div>
  );
};

export default VerifiedBadgeRulePanel;

