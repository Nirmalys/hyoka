import React from "react";
import { FileSpreadsheet, ArrowRight, Lock } from "lucide-react";
import {
  DEFAULT_IMPORT_PROVIDERS,
  getProviderImageUrl,
} from "../hooks/importProvidersConfig";

const PROVIDER_GRADIENT = {
  judgeme: "from-teal-400 via-teal-500 to-emerald-500",
  yotpo: "from-violet-500 via-violet-600 to-indigo-600",
  csv: "from-emerald-500 via-emerald-600 to-green-600",
};

const ImportProviderPicker = ({ providers, selectedId, onSelect }) => {
  const list = providers?.length ? providers : DEFAULT_IMPORT_PROVIDERS;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((provider) => {
        const isActive = provider.status === "active";
        const isSelected = selectedId === provider.id;
        const gradient = PROVIDER_GRADIENT[provider.id] || PROVIDER_GRADIENT.csv;
        const src = getProviderImageUrl(provider.id);

        return (
          <button
            key={provider.id}
            type="button"
            disabled={!isActive}
            onClick={() => isActive && onSelect(provider.id)}
            className={`group relative flex items-stretch gap-3 min-h-[176px] overflow-hidden rounded-2xl p-4 text-left text-white transition-all ${
              isActive
                ? `bg-linear-to-br ${gradient} hover:-translate-y-0.5 hover:shadow-lg`
                : "cursor-not-allowed bg-linear-to-br from-gray-300 to-gray-400 opacity-70"
            } ${isSelected ? "ring-2 ring-gray-900/40 ring-offset-2" : ""}`}
          >
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2">
                <h4 className="text-[18px] font-bold">{provider.label}</h4>
                {provider.status === "coming_soon" && (
                  <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    Soon
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-relaxed text-white/85">
                {provider.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-lg bg-black/25 px-3.5 py-2 text-[12px] font-semibold backdrop-blur-sm transition-colors group-hover:bg-black/35">
                {isActive ? (
                  <>
                    Choose to import
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Not available yet
                  </>
                )}
              </span>
            </div>

            <div className="flex w-[42%] shrink-0 items-center justify-center rounded-xl bg-black/10">
              {src ? (
                <img
                  src={src}
                  alt={provider.label}
                  className="h-24 w-24 object-contain"
                  loading="lazy"
                />
              ) : (
                <FileSpreadsheet className="h-16 w-16 text-white" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ImportProviderPicker;
