import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { getWidgetPreviewStyles, starAlignStyle } from "../utils/widgetPreviewStyles";
import { deviceClass } from "../utils/widgetDeviceUtils";
import { editorZoneClass, handleEditorSelect } from "../utils/editorSelectable";

const TESTIMONIALS = [
  {
    id: "t1",
    quote:
      "Sized down based on the chart and it's perfect. The fleece interior is heavy without being hot. Already ordered the bone color.",
    name: "Catherine Teressa",
    location: "San Francisco, United States",
    initials: "CT",
    avatarBg: "#D97706",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "The quality exceeded my expectations. Soft, warm, and the fit is exactly what I was looking for. Will definitely recommend to friends.",
    name: "James Okafor",
    location: "Lagos, Nigeria",
    initials: "JO",
    avatarBg: "#6366F1",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "Beautiful colour and great craftsmanship. Shipping was fast and the packaging felt premium. Already planning my next order.",
    name: "Priya Menon",
    location: "Kochi, India",
    initials: "PM",
    avatarBg: "#EC4899",
    rating: 5,
  },
];

const ACTIVE_INDEX = 0;

const StarRow = ({ size = "16px", color = "#F5B800" }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} style={{ width: size, height: size, fill: color, color }} />
    ))}
  </div>
);

const CarouselPagination = ({ total, active, textColor }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) =>
      i === active ? (
        <span key={i} className="block w-6 h-1.5 rounded-full" style={{ backgroundColor: textColor }} />
      ) : (
        <span key={i} className="block w-1.5 h-1.5 rounded-full bg-gray-300" />
      )
    )}
  </div>
);

const TestimonialsCarouselWidgetPreview = ({
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
  const active = TESTIMONIALS[ACTIVE_INDEX];
  const innerBg = styles.accent ? `${styles.accent}22` : "#F8F8F7";

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
      {styles.widgetTitle && (
        <div
          className={`mb-4 text-center px-2 py-1 ${editorZoneClass(selectedElementId, "widget-header", editorMode)}`}
          style={styles.header}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-header")}
        >
          {styles.widgetTitle}
        </div>
      )}

      <div
        className={`flex flex-col items-center text-center ${deviceClass(previewDevice, {
          mobile: "px-4 py-8",
          desktop: "px-8 py-10 md:px-12 md:py-12",
        })}`}
        style={{ backgroundColor: innerBg, borderRadius: styles.radius }}
      >
        <span
          className={`leading-none font-serif mb-5 select-none ${deviceClass(previewDevice, {
            mobile: "text-[40px]",
            desktop: "text-[52px]",
          })}`}
          style={{ color: styles.primary }}
          aria-hidden
        >
          &rdquo;
        </span>

        <p
          className={`leading-relaxed w-full max-w-full px-2 py-1 ${editorZoneClass(selectedElementId, `review-${active.id}`, editorMode)}`}
          style={styles.cardBody}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, `review-${active.id}`)}
          role={editorMode ? "button" : undefined}
          tabIndex={editorMode ? 0 : undefined}
        >
          &ldquo;{active.quote}&rdquo;
        </p>

        {styles.showStars && (
          <div
            className={`flex mt-5 px-1 py-0.5 ${editorZoneClass(selectedElementId, "widget-stars", editorMode)}`}
            style={starAlignStyle(styles.starAlign)}
            onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-stars")}
            role={editorMode ? "button" : undefined}
            tabIndex={editorMode ? 0 : undefined}
          >
            <StarRow size={styles.starSize} color={styles.starColor || styles.primary} />
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ backgroundColor: active.avatarBg }}
          >
            {active.initials}
          </div>
          <div className="text-left">
            <div className="leading-tight" style={styles.cardTitle}>
              {active.name}
            </div>
            <div className="text-[12px] leading-tight mt-0.5" style={{ color: styles.cardBody.color }}>
              {active.location}
            </div>
          </div>
        </div>

        {styles.widgetSubtitle && (
          <p
            className={`mt-4 px-2 py-1 ${editorZoneClass(selectedElementId, "widget-subtitle", editorMode)}`}
            style={styles.cardBody}
            onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-subtitle")}
          >
            {styles.widgetSubtitle}
          </p>
        )}

        <div className="flex items-center gap-5 mt-8">
          <button
            type="button"
            className="w-9 h-9 rounded-full border bg-white flex items-center justify-center hover:bg-gray-50"
            style={{ borderColor: styles.borderColor, color: styles.textColor }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <CarouselPagination
            total={TESTIMONIALS.length}
            active={ACTIVE_INDEX}
            textColor={styles.textColor}
          />

          <button
            type="button"
            className="w-9 h-9 rounded-full border bg-white flex items-center justify-center hover:bg-gray-50"
            style={{ borderColor: styles.borderColor, color: styles.textColor }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsCarouselWidgetPreview;
