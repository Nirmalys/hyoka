import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import {
  FONT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  getBlockStylePresetKey,
} from "./emailTemplateBlockStyles";

const LayoutBlockStyleControls = ({
  blockKey,
  style,
  onChange,
  showStarColor = false,
  showButtonColors = false,
  showImageControls = false,
}) => {
  const presetKey = getBlockStylePresetKey(blockKey);

  const set = (key, value) => onChange(key, value);

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-60">
        Styling
      </h5>

      {!showImageControls && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Size
              </label>
              <select
                value={style.fontSize || "14px"}
                onChange={(e) => set("fontSize", e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
              >
                {FONT_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Weight
              </label>
              <select
                value={style.fontWeight || "400"}
                onChange={(e) => set("fontWeight", e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
              >
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Text color
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden shrink-0"
                style={{ backgroundColor: style.color || "#4b5563" }}
              >
                <input
                  type="color"
                  value={style.color || "#4b5563"}
                  onChange={(e) => set("color", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <span className="text-[11px] font-black font-mono text-gray-400 uppercase">
                {(style.color || "#4b5563").replace("#", "")}
              </span>
            </div>
          </div>
        </>
      )}

      {showImageControls && (
        <>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Image size
            </label>
            <select
              value={style.maxWidth || "160px"}
              onChange={(e) => set("maxWidth", e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
            >
              <option value="120px">Small (120px)</option>
              <option value="160px">Medium (160px)</option>
              <option value="200px">Large (200px)</option>
              <option value="240px">Extra large (240px)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Corner radius
            </label>
            <select
              value={style.borderRadius || "16px"}
              onChange={(e) => set("borderRadius", e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border border-gray-100 bg-white text-xs font-bold text-gray-900"
            >
              <option value="0px">Square</option>
              <option value="8px">Soft (8px)</option>
              <option value="16px">Rounded (16px)</option>
              <option value="24px">Pill (24px)</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Alignment
        </label>
        <div className="flex rounded-md border border-gray-100 overflow-hidden">
          {[
            { id: "left", icon: AlignLeft },
            { id: "center", icon: AlignCenter },
            { id: "right", icon: AlignRight },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => set("textAlign", btn.id)}
              className={`flex-1 p-2 flex justify-center transition-colors outline-none ${
                (style.textAlign || "center") === btn.id
                  ? "bg-orange-50 text-orange-700"
                  : "bg-white text-gray-300 hover:text-gray-900"
              }`}
            >
              <btn.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {showStarColor && (
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Star color
          </label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden shrink-0"
              style={{ backgroundColor: style.starColor || "#F59E0B" }}
            >
              <input
                type="color"
                value={style.starColor || "#F59E0B"}
                onChange={(e) => set("starColor", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-[11px] font-medium text-gray-400">
              Outline color for star icons
            </span>
          </div>
        </div>
      )}

      {showButtonColors && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Button bg
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200 relative overflow-hidden"
                style={{ backgroundColor: style.bgColor || "#F59E0B" }}
              >
                <input
                  type="color"
                  value={style.bgColor || "#F59E0B"}
                  onChange={(e) => set("bgColor", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Button text
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200 relative overflow-hidden"
                style={{ backgroundColor: style.color || "#ffffff" }}
              >
                <input
                  type="color"
                  value={style.color || "#ffffff"}
                  onChange={(e) => set("color", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}


      {presetKey === "storeBrand" && (
        <p className="text-[11px] text-gray-400 font-medium">
          Store name uses your primary color by default until you pick a text color above.
        </p>
      )}
    </div>
  );
};

export default LayoutBlockStyleControls;
