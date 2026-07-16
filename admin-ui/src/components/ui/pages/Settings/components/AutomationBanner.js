import { Zap, Loader2 } from "lucide-react";

const AutomationBanner = ({ form, handleSaveAutomation, savingContext }) => {
  const saving = savingContext === "automation";

  const toggleAutomation = () => {
    if (saving) return;
    handleSaveAutomation({ automation_enabled: !form.automation_enabled });
  };

  return (
    <div className="relative">
      <div className="bg-[rgba(245, 158, 11, 0.12)] border border-[#F59E0B]/10 rounded-md px-5 py-3 flex items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#F59E0B] flex items-center justify-center text-white shadow-lg shadow-orange-100 shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="text-[16px] font-black text-[#101828]">Automation</div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  form.automation_enabled ? "bg-[#F59E0B] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {form.automation_enabled ? "On" : "Off"}
              </span>
            </div>
            <p className="text-sm text-orange-900/60 font-medium">
              {form.automation_enabled
                ? "Automated emails and review checks run from saved rules below. Use Manual Request to send a one-off review email anytime."
                : "Automation is off — scheduled emails are paused. Use Manual Request to send a review email immediately."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={toggleAutomation}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ring-offset-2 ring-orange-500/20 focus:ring-2 ${
              form.automation_enabled ? "bg-[#F59E0B]" : "bg-gray-300"
            } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {saving ? (
              <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-white animate-spin" />
            ) : (
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  form.automation_enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationBanner;
