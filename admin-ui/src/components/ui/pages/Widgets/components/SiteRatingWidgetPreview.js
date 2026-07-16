import { Star, Heart } from "lucide-react";
import { getWidgetPreviewStyles, starAlignStyle } from "../utils/widgetPreviewStyles";
import { deviceClass } from "../utils/widgetDeviceUtils";
import { editorZoneClass, handleEditorSelect } from "../utils/editorSelectable";

const RATING_BARS = [
  { stars: 5, count: 11483, pct: 92 },
  { stars: 4, count: 77, pct: 6 },
  { stars: 3, count: 13, pct: 1 },
  { stars: 2, count: 6, pct: 0.5 },
  { stars: 1, count: 6, pct: 0.5 },
];

const ATTRIBUTES = [
  { label: "Quality", score: "4.9" },
  { label: "Shipping", score: "4.9" },
  { label: "Fit", score: "4.8" },
  { label: "Value", score: "4.7" },
];

const StarRow = ({ size = "20px", color = "#F5B800" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} style={{ width: size, height: size, fill: color, color }} />
    ))}
  </div>
);

const SiteRatingWidgetPreview = ({
  className = "",
  form = {},
  previewFontStack,
  styles: stylesProp,
  selectedElementId,
  setSelectedElementId,
  previewDevice = "desktop",
}) => {
  const styles = stylesProp || getWidgetPreviewStyles(form, previewFontStack);
  const editorMode = Boolean(setSelectedElementId);
  const reviewCount = styles.mockRatingCount.toLocaleString();

  return (
    <div
      className={`rounded-2xl border shadow-[0_2px_16px_rgba(0,0,0,0.05)] w-full max-w-full min-w-0 ${deviceClass(previewDevice, {
        mobile: "p-4",
        desktop: "p-6 md:p-8",
      })} ${className} ${editorZoneClass(selectedElementId, "site-rating", editorMode)}`}
      style={{
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderRadius: styles.radius,
        color: styles.textColor,
      }}
      onClick={(e) => handleEditorSelect(e, setSelectedElementId, "site-rating")}
      role={editorMode ? "button" : undefined}
      tabIndex={editorMode ? 0 : undefined}
    >
      {styles.widgetTitle && (
        <div
          className={`mb-4 px-2 py-1 ${editorZoneClass(selectedElementId, "widget-header", editorMode)}`}
          style={styles.header}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-header")}
        >
          {styles.widgetTitle}
        </div>
      )}

      <div
        className={`flex gap-8 ${deviceClass(previewDevice, {
          mobile: "flex-col",
          desktop: "flex-col lg:flex-row lg:items-center lg:gap-10",
        })}`}
      >
        <div
          className={deviceClass(previewDevice, {
            mobile: "w-full",
            desktop: "lg:w-[22%] shrink-0",
          })}
        >
          <div className="text-[48px] font-bold leading-none" style={{ color: styles.textColor }}>
            {styles.mockRatingAvg}
          </div>
          {styles.showStars && (
            <div
              className={`flex mt-2 px-1 py-0.5 ${editorZoneClass(selectedElementId, "widget-stars", editorMode)}`}
              style={starAlignStyle(styles.starAlign)}
              onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-stars")}
              role={editorMode ? "button" : undefined}
              tabIndex={editorMode ? 0 : undefined}
            >
              <StarRow size={styles.starSize} color={styles.starColor || styles.primary} />
            </div>
          )}
          <p className="text-[12px] mt-2.5" style={{ color: styles.cardBody.color }}>
            Based on <span className="font-bold" style={{ color: styles.textColor }}>{reviewCount}</span> reviews
          </p>
          <span
            className="inline-block mt-3 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${styles.borderColor}88`, color: styles.cardBody.color }}
          >
            Overall Rating
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {RATING_BARS.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2.5">
                <span
                  className="text-[12px] font-semibold w-3 text-right shrink-0"
                  style={{ color: styles.cardBody.color }}
                >
                  {stars}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${styles.borderColor}88` }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: styles.primary }}
                  />
                </div>
                <span
                  className="text-[11px] w-12 text-right shrink-0 tabular-nums"
                  style={{ color: styles.cardBody.color }}
                >
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`flex flex-wrap gap-2 mt-5 px-1 py-0.5 ${editorZoneClass(selectedElementId, "widget-attributes", editorMode)}`}
            onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-attributes")}
            role={editorMode ? "button" : undefined}
            tabIndex={editorMode ? 0 : undefined}
          >
            {ATTRIBUTES.map(({ label, score }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{
                  backgroundColor: `${styles.borderColor}88`,
                  color: styles.textColor,
                }}
              >
                <Heart className="w-3 h-3" style={{ fill: styles.primary, color: styles.primary }} strokeWidth={0} />
                {label} {score}
              </span>
            ))}
          </div>
        </div>

        <div
          className={deviceClass(previewDevice, {
            mobile: "w-full flex flex-col items-center",
            desktop: "lg:w-[20%] shrink-0 flex flex-col items-center lg:items-end justify-center",
          })}
        >
          <button
            type="button"
            className="px-6 py-3 text-[13px] font-bold rounded-full transition-colors whitespace-nowrap"
            style={{ backgroundColor: styles.primary, color: styles.textColor }}
          >
            Write a review
          </button>
          <p className="text-[11px] mt-2" style={{ color: styles.cardBody.color }}>
            Takes ~60 seconds
          </p>
        </div>
      </div>

      {styles.widgetSubtitle && (
        <p
          className={`mt-4 text-center px-2 py-1 ${editorZoneClass(selectedElementId, "widget-subtitle", editorMode)}`}
          style={styles.cardBody}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-subtitle")}
        >
          {styles.widgetSubtitle}
        </p>
      )}
    </div>
  );
};

export default SiteRatingWidgetPreview;
