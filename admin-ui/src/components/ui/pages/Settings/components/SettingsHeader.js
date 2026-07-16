import { Bell, HelpCircle } from "lucide-react";

const SettingsHeader = () => {
  return (
    <div className="px-4 py-4 border-b-2 border-gray-200 flex justify-between items-center bg-white">
      <div className="flex items-center gap-3 p-0 mt-1">
        <div className="flex flex-col justify-center">
          <div className="text-[#101828] font-semibold text-[18px] leading-none">
            Settings
          </div>
          <div className="text-gray-400 text-[14px] font-medium leading-none mt-2 ml-[1px]">
            Configure your global plugin preferences and integrations
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* No Search Bar for Settings as requested */}
        
        <button className="p-2 text-gray-500 hover:text-orange-400 transition-colors rounded-full focus:outline-none focus:ring-0">
          <span className="sr-only">Help</span>
          <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <button className="p-2 text-gray-500 hover:text-orange-400 transition-colors relative rounded-full focus:outline-none focus:ring-0">
          <span className="sr-only">Notifications</span>
          <div className="w-5 h-5 flex items-center justify-center">
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
        </button>

        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">AD</div>
      </div>
    </div>
  );
};

export default SettingsHeader;
