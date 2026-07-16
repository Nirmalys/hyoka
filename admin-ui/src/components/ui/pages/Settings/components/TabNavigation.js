import React, { useMemo } from "react";
import { Mail, Send, Plus, FileText, Palette } from "lucide-react";

const TAB_LIST = [
  { id: "automation", label: "Email Settings", icon: Mail },
  { id: "email_template", label: "Email Template", icon: Palette },
  { id: "submission_form", label: "Submission Form", icon: FileText },
  { id: "manual", label: "Manual Request", icon: Send },
  { id: "csv", label: "Import reviews", icon: Plus },
];

const TabNavigation = ({ settingsTab, setSettingsTab }) => {
  const tabs = TAB_LIST;

  const indicatorStyle = useMemo(() => {
    const idx = Math.max(0, tabs.findIndex((t) => t.id === settingsTab));
    return {
      top: "4px",
      bottom: "4px",
      width: `calc(${100 / tabs.length}% - 8px)`,
      left: `calc(${(100 / tabs.length) * idx}% + 4px)`,
    };
  }, [tabs, settingsTab]);

  return (
    <div className={`flex bg-[#F3F0EC] p-1 rounded-md relative transition-all duration-300 ${
      tabs.length === 2 ? 'w-[400px]' : 
      tabs.length === 3 ? 'w-[550px]' : 
      tabs.length === 4 ? 'w-[750px]' : 
      'w-[920px]'
    }`}>
      <div
        className="absolute bg-white shadow-sm rounded-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={indicatorStyle}
      />
      {tabs.map((tab) => {
        const isActive = settingsTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id)}
            className={`relative z-20 flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-0 ${
              isActive ? "text-[#101828]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon
              className={`w-3.5 h-3.5 ${isActive ? "text-gray-900" : "text-gray-400"}`}
            />
            <span className="whitespace-nowrap font-black text-[12px]">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
