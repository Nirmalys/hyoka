import {
  Star,
  Play,
  Volume2,
  Pause,
  Maximize2,
  ShoppingBag,
} from "lucide-react";
import { getWidgetPreviewStyles, starAlignStyle } from "../utils/widgetPreviewStyles";
import { deviceClass, getDeviceLayout } from "../utils/widgetDeviceUtils";
import { editorZoneClass, handleEditorSelect } from "../utils/editorSelectable";

const ACTIVE_REVIEW = {
  name: "Ananya",
  location: "Hyderabad",
  rating: 5,
  excerpt: "Love the weight and color. Sleeves are a touch long on me...",
  product: "Shop the T-Shirt",
};

const StarRow = ({ size = "14px", color = "#F5B800" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} style={{ width: size, height: size, fill: color, color }} />
    ))}
  </div>
);

const SideVideoCard = ({ compact = false, radius = "18px" }) => (
  <div
    className={`${
      compact ? "w-[96px] h-[184px] opacity-80" : "w-[118px] h-[214px]"
    } bg-[#D9D9D9] shrink-0 relative overflow-hidden shadow-sm`}
    style={{ borderRadius: radius }}
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className={`${
          compact ? "w-9 h-9" : "w-11 h-11"
        } rounded-full bg-black/25 flex items-center justify-center backdrop-blur-[1px]`}
      >
        <Play className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-white fill-white ml-0.5`} />
      </div>
    </div>
  </div>
);

const VideoCarouselWidgetPreview = ({
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
  const title = styles.widgetTitle || "Customer video reviews";
  const { isMobile, isTablet } = getDeviceLayout(previewDevice);

  const activeCardClass = isMobile
    ? "w-[min(220px,72vw)] h-[320px]"
    : isTablet
      ? "w-[200px] h-[320px]"
      : "w-[236px] h-[366px]";

  const ActiveVideoCard = () => (
    <div
      className={`${activeCardClass} shrink-0 relative overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${editorZoneClass(selectedElementId, "review-r1", editorMode)}`}
      style={{ borderRadius: styles.radius }}
      onClick={(e) => handleEditorSelect(e, setSelectedElementId, "review-r1")}
      role={editorMode ? "button" : undefined}
      tabIndex={editorMode ? 0 : undefined}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #8B7D6B 0%, #6E6254 38%, #4F463C 100%)",
        }}
      />

      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        {[Volume2, Pause, Maximize2].map((Icon, idx) => (
          <div
            key={idx}
            className="w-8 h-8 rounded-full bg-black/35 flex items-center justify-center backdrop-blur-sm"
          >
            <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-4 bg-gradient-to-t from-black/75 via-black/45 to-transparent">
        {styles.showStars && (
          <div
            className={`flex px-1 py-0.5 ${editorZoneClass(selectedElementId, "widget-stars", editorMode)}`}
            style={starAlignStyle(styles.starAlign)}
            onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-stars")}
            role={editorMode ? "button" : undefined}
            tabIndex={editorMode ? 0 : undefined}
          >
            <StarRow size={styles.starSize} color={styles.starColor || styles.primary} />
          </div>
        )}
        <div className="text-[13px] font-bold text-white mt-2 leading-tight">
          {ACTIVE_REVIEW.name}
          <span className="font-normal text-white/85"> · {ACTIVE_REVIEW.location}</span>
        </div>
        <p className="text-[11px] text-white/90 leading-snug mt-1.5 line-clamp-2" style={styles.cardBody}>
          {ACTIVE_REVIEW.excerpt}
        </p>
        <button
          type="button"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white rounded-full text-[11px] font-bold"
          style={{ color: styles.textColor }}
        >
          <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2.2} />
          {ACTIVE_REVIEW.product}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`rounded-2xl border shadow-[0_2px_16px_rgba(0,0,0,0.05)] w-full max-w-full min-w-0 ${deviceClass(previewDevice, {
        mobile: "p-4",
        desktop: "p-6 md:p-8",
      })} ${className}`}
      style={{
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderRadius: styles.radius,
        color: styles.textColor,
      }}
    >
      <div
        className={`leading-none px-2 py-1 inline-block ${editorZoneClass(selectedElementId, "widget-header", editorMode)}`}
        style={styles.header}
        onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-header")}
        role={editorMode ? "button" : undefined}
        tabIndex={editorMode ? 0 : undefined}
      >
        {title}
      </div>

      {styles.widgetSubtitle && (
        <p
          className={`mt-2 px-2 py-1 ${editorZoneClass(selectedElementId, "widget-subtitle", editorMode)}`}
          style={styles.cardBody}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-subtitle")}
        >
          {styles.widgetSubtitle}
        </p>
      )}

      <div className="mt-6 md:mt-8 overflow-hidden">
        <div
          className={`flex items-end justify-center min-h-0 min-w-0 ${deviceClass(previewDevice, {
            mobile: "gap-0",
            tablet: "gap-3",
            desktop: "gap-4 md:gap-5",
          })}`}
        >
          {!isMobile && <SideVideoCard compact={isTablet} radius={styles.radius} />}
          {!isMobile && !isTablet && <SideVideoCard radius={styles.radius} />}
          <ActiveVideoCard />
          {!isMobile && !isTablet && <SideVideoCard radius={styles.radius} />}
          {!isMobile && <SideVideoCard compact={isTablet} radius={styles.radius} />}
        </div>
      </div>
    </div>
  );
};

export default VideoCarouselWidgetPreview;
