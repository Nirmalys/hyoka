import { Star, ThumbsUp } from "lucide-react";
import { getWidgetPreviewStyles, starAlignStyle } from "../utils/widgetPreviewStyles";
import { deviceClass } from "../utils/widgetDeviceUtils";
import { editorZoneClass, handleEditorSelect } from "../utils/editorSelectable";

const RATING_BARS = [
  { stars: 5, count: 1181, pct: 92 },
  { stars: 4, count: 77, pct: 6 },
  { stars: 3, count: 13, pct: 1 },
  { stars: 2, count: 6, pct: 0.5 },
  { stars: 1, count: 6, pct: 0.5 },
];

const FILTERS = [
  { label: "All stars", active: true },
  { label: "5", star: true },
  { label: "4", star: true },
  { label: "3", star: true },
  { label: "2", star: true },
  { label: "1", star: true },
  { label: "With photos" },
  { label: "Most helpful" },
  { label: "Newest" },
];

const PREVIEW_REVIEWS = [
  {
    id: "r1",
    name: "Mohan Kumar",
    location: "Chennai",
    initials: "MK",
    avatarBg: "#6366F1",
    rating: 5,
    date: "2 days ago",
    helpful: 42,
    title: "Genuinely the softest hoodie I own",
    content:
      "The fabric quality is outstanding — thick but breathable. Washes well without shrinking. Colour matches the photos exactly. Would absolutely buy again.",
    images: [],
  },
  {
    id: "r2",
    name: "Aisha Khan",
    location: "Bengaluru",
    initials: "AK",
    avatarBg: "#EC4899",
    rating: 5,
    date: "1 week ago",
    helpful: 31,
    title: "Fits true to size, colour is exactly as shown",
    content:
      "Ordered a Medium and it fits perfectly. The stitching is neat and the inside is fleece-lined. Arrived two days early. Very happy with this purchase.",
    images: [1, 2, 3],
  },
];

const StarRow = ({ count = 5, size = "16px", color = "#F5B800" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        style={{
          width: size,
          height: size,
          fill: i <= count ? color : "#E5E7EB",
          color: i <= count ? color : "#E5E7EB",
        }}
      />
    ))}
  </div>
);

const ProductReviewWidgetPreview = ({
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
  const title = styles.widgetTitle || "Our Customer Reviews";

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
        className={`mb-6 min-h-[36px] ${deviceClass(previewDevice, {
          mobile: "flex flex-col items-stretch gap-3",
          desktop: "relative flex items-center justify-center",
        })}`}
      >
        <div
          className={`text-center px-2 py-1 ${editorZoneClass(selectedElementId, "widget-header", editorMode)}`}
          style={styles.header}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-header")}
          role={editorMode ? "button" : undefined}
          tabIndex={editorMode ? 0 : undefined}
        >
          {title}
        </div>
        <button
          type="button"
          className={`shrink-0 px-4 py-2 bg-black text-white text-[12px] font-bold rounded-full ${deviceClass(previewDevice, {
            mobile: "w-full",
            desktop: "absolute right-0 top-1/2 -translate-y-1/2",
          })}`}
        >
          Write a Review
        </button>
      </div>

      {styles.widgetSubtitle && (
        <p
          className={`text-center mb-4 px-2 py-1 ${editorZoneClass(selectedElementId, "widget-subtitle", editorMode)}`}
          style={styles.cardBody}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-subtitle")}
        >
          {styles.widgetSubtitle}
        </p>
      )}

      <div
        className={`border rounded-xl mb-5 ${deviceClass(previewDevice, {
          mobile: "p-4",
          desktop: "p-5 md:p-6",
        })}`}
        style={{ borderColor: styles.borderColor, borderRadius: styles.radius }}
      >
        <div
          className={`flex gap-6 ${deviceClass(previewDevice, {
            mobile: "flex-col",
            desktop: "flex-col md:flex-row md:gap-10",
          })}`}
        >
          <div
            className={deviceClass(previewDevice, {
              mobile: "w-full",
              desktop: "md:w-[42%] shrink-0",
            })}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: styles.cardBody.color }}
            >
              Overall Rating
            </div>
            <div
              className="text-[44px] font-bold leading-none mb-2"
              style={{ color: styles.textColor }}
            >
              {styles.mockRatingAvg}
            </div>
            {styles.showStars && (
              <div
                className={`flex mt-1 px-1 py-0.5 ${editorZoneClass(selectedElementId, "widget-stars", editorMode)}`}
                style={starAlignStyle(styles.starAlign)}
                onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-stars")}
                role={editorMode ? "button" : undefined}
                tabIndex={editorMode ? 0 : undefined}
              >
                <StarRow size={styles.starSize} color={styles.starColor || styles.primary} />
              </div>
            )}
            <p className="text-[12px] font-medium mt-2" style={{ color: styles.cardBody.color }}>
              (Based on {styles.mockRatingCount.toLocaleString()} verified reviews)
            </p>
          </div>

          <div className="flex-1 space-y-2.5">
            {RATING_BARS.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2.5">
                <span
                  className="text-[12px] font-semibold w-3 text-right"
                  style={{ color: styles.cardBody.color }}
                >
                  {stars}
                </span>
                <Star className="w-3.5 h-3.5 shrink-0" style={{ fill: styles.primary, color: styles.primary }} />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: styles.primary }}
                  />
                </div>
                <span
                  className="text-[12px] w-10 text-right tabular-nums"
                  style={{ color: styles.cardBody.color }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`flex gap-3 mb-5 ${deviceClass(previewDevice, {
          mobile: "flex-col",
          desktop: "flex-col lg:flex-row lg:items-center lg:justify-between",
        })}`}
      >
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ label, active, star }) => (
            <button
              key={label}
              type="button"
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white border-gray-200"
              }`}
              style={!active ? { color: styles.cardBody.color, borderColor: styles.borderColor } : undefined}
            >
              {star && <Star className="w-3 h-3" style={{ fill: styles.primary, color: styles.primary }} />}
              {label}
            </button>
          ))}
        </div>
        <span className="text-[12px] font-medium shrink-0" style={{ color: styles.cardBody.color }}>
          Sort: <span className="font-semibold" style={{ color: styles.textColor }}>Most helpful</span>
        </span>
      </div>

      <div className="space-y-4 mb-6">
        {PREVIEW_REVIEWS.map((review) => (
          <div
            key={review.id}
            className={`border p-5 bg-white ${editorZoneClass(selectedElementId, `review-${review.id}`, editorMode)}`}
            style={{
              borderColor: styles.borderColor,
              borderRadius: styles.radius,
              backgroundColor: styles.backgroundColor,
            }}
            onClick={(e) => handleEditorSelect(e, setSelectedElementId, `review-${review.id}`)}
            role={editorMode ? "button" : undefined}
            tabIndex={editorMode ? 0 : undefined}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ backgroundColor: review.avatarBg }}
                >
                  {review.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold leading-tight" style={{ color: styles.cardTitle.color }}>
                    {review.name}
                    <span className="font-normal" style={{ color: styles.cardBody.color }}>
                      {" "}
                      · {review.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0" style={{ color: styles.cardBody.color }}>
                <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="text-[12px] font-medium">{review.helpful}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {styles.showStars && (
                <div
                  className={`flex px-1 py-0.5 ${editorZoneClass(selectedElementId, "widget-stars", editorMode)}`}
                  style={starAlignStyle(styles.starAlign)}
                  onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-stars")}
                  role={editorMode ? "button" : undefined}
                  tabIndex={editorMode ? 0 : undefined}
                >
                  <StarRow count={review.rating} size={styles.starSize} color={styles.starColor || styles.primary} />
                </div>
              )}
              <span className="text-[11px]" style={{ color: styles.cardBody.color }}>
                {review.date}
              </span>
            </div>

            <h4 className="mb-2 leading-snug" style={styles.cardTitle}>
              {review.title}
            </h4>
            <p className="leading-relaxed" style={styles.cardBody}>
              {review.content}
            </p>

            {review.images.length > 0 && (
              <div className="flex gap-2 mt-4">
                {review.images.map((img) => (
                  <div
                    key={img}
                    className="w-16 h-16 rounded-lg bg-gray-100 border"
                    style={{ borderColor: styles.borderColor, borderRadius: styles.radius }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: styles.borderColor }}>
        <span className="text-[12px] font-medium" style={{ color: styles.cardBody.color }}>
          Showing 1–2 of 1,284
        </span>
        <button
          type="button"
          className="px-4 py-2 text-[12px] font-semibold border rounded-full bg-white hover:bg-gray-50 transition-colors"
          style={{ color: styles.textColor, borderColor: styles.borderColor }}
        >
          Load more reviews
        </button>
      </div>
    </div>
  );
};

export default ProductReviewWidgetPreview;
