import { useState } from "react";
import { HelpCircle, Bell, Moon, ThumbsUp } from "lucide-react";

const TopBar = () => {
  const userName = window.hyokaData?.currentUserName || "Admin";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    const root = document.querySelector(".HYOKA-root");
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      root?.classList.add("dark");
      localStorage.setItem("HYOKA-theme", "dark");
    } else {
      root?.classList.remove("dark");
      localStorage.setItem("HYOKA-theme", "light");
    }
  };

  return (
    <header className="flex-shrink-0 h-[80px] bg-white flex items-center justify-between px-6 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.06)] relative rounded-bl-md">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#F5B800] rounded-lg flex items-center justify-center">
          <ThumbsUp className="w-[18px] h-[18px] text-black fill-black" strokeWidth={2} />
        </div>
        <span className="text-[16px] font-bold text-black tracking-tight">
          Hyoka
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="p-2.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
          title="Help"
        >
          <HelpCircle className="w-[22px] h-[22px]" strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="p-2.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors relative focus:outline-none"
          title="Notifications"
        >
          <Bell className="w-[22px] h-[22px]" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-[#F5B800] rounded-full text-[10px] font-bold text-black flex items-center justify-center leading-none">
            2
          </span>
        </button>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
          title="Toggle dark mode"
        >
          <Moon className="w-[22px] h-[22px]" strokeWidth={1.5} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        <span className="text-[14px] font-semibold text-black mr-2 hidden sm:block">
          {userName}
        </span>

        <div className="w-9 h-9 rounded-full bg-[#F5B800] flex items-center justify-center text-black text-[12px] font-bold overflow-hidden">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
