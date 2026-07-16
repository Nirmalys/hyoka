import { Star, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { getWidgetPreviewStyles, starAlignStyle } from "../utils/widgetPreviewStyles";
import { deviceClass, getDeviceLayout } from "../utils/widgetDeviceUtils";
import { editorZoneClass, handleEditorSelect } from "../utils/editorSelectable";

const CARDS = [
  {
    id: "c1",
    name: "Meghana Ranaut",
    location: "Kerala, India",
    initials: "MR",
    avatarBg: "#8B5E3C",
    rating: 5,
    title: "Genuinely the softest hoodie I own",
    body: "The fabric quality is outstanding — thick but breathable. Washes well without shrinking. Colour matches the photos exactly.",
    product: "Fleeced Hoodie",
    date: "2 days ago",
    media: "linear-gradient(145deg, #C4A882 0%, #8B7355 45%, #5C4A38 100%)",
    isVideo: false,
  },
  {
    id: "c2",
    name: "Aaliyah Patel",
    location: "Pune, India",
    initials: "AP",
    avatarBg: "#6366F1",
    rating: 5,
    title: "Worth every penny",
    body: "I've been using this for a few weeks now and it's hands down one of the best purchases I've made. Quality is top-notch.",
    product: "Fleeced Hoodie",
    date: "4 days ago",
    media: "linear-gradient(160deg, #9CA3AF 0%, #6B7280 50%, #374151 100%)",
    isVideo: true,
  },
  {
    id: "c3",
    name: "Aaliyah Patel",
    location: "Pune, India",
    initials: "AP",
    avatarBg: "#EC4899",
    rating: 5,
    title: "Fits true to size, colour is exactly as shown",
    body: "Ordered a Medium and it fits perfectly. The stitching is neat and the inside is fleece-lined. Arrived two days early.",
    product: "Fleeced Hoodie",
    date: "1 week ago",
    media: "linear-gradient(150deg, #A8B89A 0%, #6B7F5E 55%, #3D4F35 100%)",
    isVideo: false,
  },
  {
    id: "c4",
    name: "Ananya Sharma",
    location: "Bangalore, India",
    initials: "AS",
    avatarBg: "#0EA5E9",
    rating: 5,
    title: "Perfect for winter layering",
    body: "The quality of the fabric is exceptional. It's thick enough to keep me warm but breathable enough for all-day wear.",
    product: "Fleeced Hoodie",
    date: "3 days ago",
    media: "linear-gradient(155deg, #D4B896 0%, #A08060 50%, #6B5040 100%)",
    isVideo: false,
  },
  {
    id: "c5",
    name: "David Miller",
    location: "London, UK",
    initials: "DM",
    avatarBg: "#64748B",
    rating: 4,
    title: "Great color, slightly long sleeves",
    body: "I love the earthy tone of this hoodie. The fit is mostly great, though the sleeves are a bit longer than expected for a medium.",
    product: "Fleeced Hoodie",
    date: "5 days ago",
    media: "linear-gradient(145deg, #B8C4CE 0%, #7B8C9A 50%, #4A5568 100%)",
    isVideo: false,
  },
];

const StarRow = ({ count = 5, size = "14px", color = "#F5B800" }) => (
  <div className="flex gap-0.5 shrink-0">
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

const VideoProgressDots = () => (
  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={`block w-[3px] h-[3px] rounded-full ${
          i === 1 ? "bg-white h-[10px]" : "bg-white/50"
        }`}
      />
    ))}
  </div>
);

const CardCarouselWidgetPreview = ({
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
  const title = styles.widgetTitle || "Loved by 12,481 customers";
  const { isMobile } = getDeviceLayout(previewDevice);
  const cardWidth = isMobile ? "min(220px, 78vw)" : "250px";

  const ReviewCard = ({ card }) => (
    <div
      className={`shrink-0 border overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${editorZoneClass(selectedElementId, `review-${card.id}`, editorMode)}`}
      style={{
        width: cardWidth,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderRadius: styles.radius,
      }}
      onClick={(e) => handleEditorSelect(e, setSelectedElementId, `review-${card.id}`)}
      role={editorMode ? "button" : undefined}
      tabIndex={editorMode ? 0 : undefined}
    >
      <div className="relative h-[168px] overflow-hidden" style={{ background: card.media }}>
        {card.isVideo && <VideoProgressDots />}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: card.avatarBg }}
            >
              {card.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold leading-tight truncate" style={styles.cardTitle}>
                {card.name}
              </div>
              <div className="text-[10px] leading-tight truncate" style={{ color: styles.cardBody.color }}>
                {card.location}
              </div>
            </div>
          </div>
          {styles.showStars && (
            <div
              className={`flex px-0.5 py-0.5 ${editorZoneClass(selectedElementId, "widget-stars", editorMode)}`}
              style={starAlignStyle(styles.starAlign)}
              onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-stars")}
              role={editorMode ? "button" : undefined}
              tabIndex={editorMode ? 0 : undefined}
            >
              <StarRow count={card.rating} size={styles.starSize} color={styles.starColor || styles.primary} />
            </div>
          )}
        </div>

        <div className="leading-snug mb-1 line-clamp-2" style={styles.cardTitle}>
          {card.title}
        </div>
        <p className="leading-relaxed line-clamp-3" style={styles.cardBody}>
          {card.body}
        </p>

        <div
          className="flex items-center justify-between pt-3 mt-3 border-t"
          style={{ borderColor: styles.borderColor }}
        >
          <div
            className={`flex items-center gap-1 text-[10px] min-w-0 px-0.5 py-0.5 ${editorZoneClass(selectedElementId, "widget-attributes", editorMode)}`}
            style={{ color: styles.cardBody.color }}
            onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-attributes")}
            role={editorMode ? "button" : undefined}
            tabIndex={editorMode ? 0 : undefined}
          >
            <Tag className="w-3 h-3 shrink-0" strokeWidth={2} />
            <span className="truncate">{card.product}</span>
          </div>
          <span className="text-[10px] shrink-0 ml-2" style={{ color: styles.cardBody.color }}>
            {card.date}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`rounded-2xl border shadow-[0_2px_16px_rgba(0,0,0,0.05)] w-full max-w-full min-w-0 ${deviceClass(previewDevice, {
        mobile: "p-4",
        desktop: "p-6 md:p-7",
      })} ${className}`}
      style={{
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderRadius: styles.radius,
        color: styles.textColor,
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-5 min-w-0">
        <div
          className={`leading-tight px-2 py-1 min-w-0 flex-1 ${editorZoneClass(selectedElementId, "widget-header", editorMode)}`}
          style={styles.header}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-header")}
          role={editorMode ? "button" : undefined}
          tabIndex={editorMode ? 0 : undefined}
        >
          {title}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="w-8 h-8 rounded-full border bg-white flex items-center justify-center hover:bg-gray-50"
            style={{ borderColor: styles.borderColor, color: styles.cardBody.color }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full border bg-white flex items-center justify-center hover:bg-gray-50"
            style={{ borderColor: styles.borderColor, color: styles.cardBody.color }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {styles.widgetSubtitle && (
        <p
          className={`mb-4 px-2 py-1 ${editorZoneClass(selectedElementId, "widget-subtitle", editorMode)}`}
          style={styles.cardBody}
          onClick={(e) => handleEditorSelect(e, setSelectedElementId, "widget-subtitle")}
        >
          {styles.widgetSubtitle}
        </p>
      )}

      <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1">
        <div className="flex min-w-min" style={{ gap: styles.gap }}>
          {CARDS.map((card) => (
            <ReviewCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardCarouselWidgetPreview;
