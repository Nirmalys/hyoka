import React from "react";
import { Star } from "lucide-react";
import ElementDropList from "../../editor/ElementDropList";
import CanvasElementRenderer from "../../editor/CanvasElementRenderer";
import TestimonialCard from "./TestimonialCard";
import ProductReviewWidgetPreview from "./ProductReviewWidgetPreview";
import VideoCarouselWidgetPreview from "./VideoCarouselWidgetPreview";
import CardCarouselWidgetPreview from "./CardCarouselWidgetPreview";
import TestimonialsCarouselWidgetPreview from "./TestimonialsCarouselWidgetPreview";
import SiteRatingWidgetPreview from "./SiteRatingWidgetPreview";
import { getWidgetPreviewStyles } from "../utils/widgetPreviewStyles";
import { mockReviews, mockSiteRating } from "../mockData";

const WidgetStylePreview = ({
  widgetId,
  form,
  previewFontStack,
  elements = [],
  selectedElementId,
  setSelectedElementId,
  handleDrop,
  handleDragStart,
  draggedType,
  draggedElementId,
  dropInsertIndex,
  setDropInsertIndex,
  updateElement,
  removeElement,
  previewDevice = "desktop",
}) => {
  const primary = form.primary_color || "#F59E0B";
  const radius = `${form.card_radius || 12}px`;
  const gap = `${form.card_gap || 24}px`;
  
  const titleStyle = {
    fontSize: form.card_title_font_size || "15px",
    fontWeight: form.card_title_font_weight || "700",
    color: form.card_title_text_color || "#1D2939",
  };
  
  const contentStyle = {
    fontSize: form.card_body_font_size || "13px",
    fontWeight: form.card_body_font_weight || "400",
    color: form.card_body_text_color || "#667085",
  };
  
  const cardStyle = {
    radius,
    borderColor: form.border_color || '#EAECF0',
  };

  const widgetLayout = form.widget_layout === "grid" ? "grid" : "carousel";
  const headerAlign = form.header_text_align || "center";
  const usesBuiltInHeader = widgetId === "product-review" || widgetId === "site-rating";

  const renderElement = (el, _index, dragProps) => (
    <CanvasElementRenderer
      el={el}
      form={form}
      selectedElementId={selectedElementId}
      setSelectedElementId={setSelectedElementId}
      updateElement={updateElement}
      removeElement={removeElement}
      showRating={form.show_star_rating}
      editorVariant="email"
      onReorderDragStart={dragProps?.onReorderDragStart}
    />
  );

  const [liveReviews, setLiveReviews] = React.useState(mockReviews);
  const [liveSiteRating, setLiveSiteRating] = React.useState(mockSiteRating);

  const updateReview = (id, newReview) => {
    setLiveReviews(prev => prev.map(r => r.id === id ? { ...r, review: newReview } : r));
  };

  const sample = liveReviews[0];

  const styles = getWidgetPreviewStyles(form, previewFontStack);
  const editorPreviewProps = {
    form,
    previewFontStack,
    styles,
    selectedElementId,
    setSelectedElementId,
    previewDevice,
  };

  if (widgetId === "product-review") {
    return (
      <div className="w-full min-w-0">
        <ProductReviewWidgetPreview className="w-full max-w-full" {...editorPreviewProps} />
      </div>
    );
  }

  if (widgetId === "video-carousel") {
    return (
      <div className="w-full min-w-0">
        <VideoCarouselWidgetPreview className="w-full max-w-full" {...editorPreviewProps} />
      </div>
    );
  }

  if (widgetId === "card-carousel") {
    return (
      <div className="w-full min-w-0">
        <CardCarouselWidgetPreview className="w-full max-w-full" {...editorPreviewProps} />
      </div>
    );
  }

  if (widgetId === "testimonials-carousel") {
    return (
      <div className="w-full min-w-0">
        <TestimonialsCarouselWidgetPreview className="w-full max-w-full" {...editorPreviewProps} />
      </div>
    );
  }

  if (widgetId === "site-rating") {
    return (
      <div className="w-full min-w-0">
        <SiteRatingWidgetPreview className="w-full max-w-full" {...editorPreviewProps} />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border shadow-lg w-full"
      style={{
        fontFamily: previewFontStack,
        borderColor: form.border_color || "#EAECF0",
      }}
    >
      <div
        className="px-6 pt-6 pb-4 border-b"
        style={{ borderColor: form.border_color || "#EAECF0" }}
      >
        {!usesBuiltInHeader && (
          <ElementDropList
            elements={elements}
            dropInsertIndex={dropInsertIndex}
            setDropInsertIndex={setDropInsertIndex}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            isDragging={!!draggedType}
            draggingElementId={draggedElementId}
            renderElement={renderElement}
            emptyState={null}
          />
        )}

        <div className="w-full mb-6 space-y-3">
          <div
            className={`cursor-pointer hover:bg-orange-50/50 p-3 rounded-lg transition-all border-2 border-transparent hover:border-dashed hover:border-orange-200 w-full ${
              selectedElementId === "widget-header"
                ? "bg-orange-50 border-orange-500 border-dashed"
                : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElementId("widget-header");
            }}
          >
            <h3
              className="w-full mb-0"
              style={{
                fontFamily: previewFontStack,
                fontSize: form.header_font_size || "24px",
                fontWeight: form.header_font_weight || "700",
                color: form.header_text_color || "#1D2939",
                textAlign: headerAlign,
              }}
            >
              {form.widget_title || "Customers are saying"}
            </h3>
          </div>

          {(form.widget_subtitle || usesBuiltInHeader) && (
            <div
              className={`cursor-pointer hover:bg-orange-50/50 p-3 rounded-lg transition-all border-2 border-transparent hover:border-dashed hover:border-orange-200 w-full ${
                selectedElementId === "widget-subtitle"
                  ? "bg-orange-50 border-orange-500 border-dashed"
                  : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElementId("widget-subtitle");
              }}
            >
              <p
                className="w-full mb-0"
                style={{
                  fontFamily: previewFontStack,
                  fontSize: form.card_body_font_size || "13px",
                  fontWeight: form.card_body_font_weight || "400",
                  color: form.card_body_text_color || "#667085",
                  textAlign: headerAlign,
                }}
              >
                {form.widget_subtitle || "Real feedback from verified buyers"}
              </p>
            </div>
          )}

          {form.show_star_rating && !usesBuiltInHeader && (
            <div className="flex justify-center gap-1" style={{ color: primary }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-current" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="p-4 bg-[#FFF9F6]"
        style={{ borderColor: form.border_color || "#FEDDC7" }}
      >
        <p className="text-[9px] font-black text-[#F44B22] uppercase tracking-widest mb-3 text-center">
          Live card preview
        </p>
        <div className={widgetId === "product-review" ? "max-w-[700px] mx-auto" : undefined}>
          {widgetId === "site-rating" ? (
            <div 
              className={`flex flex-col items-center p-8 bg-white border rounded-2xl shadow-lg min-w-[300px] transition-all cursor-pointer ${selectedElementId === 'site-rating' ? 'border-orange-500 border-dashed bg-orange-50' : 'border-[#EAECF0]'}`}
              style={{ borderRadius: radius }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElementId('site-rating');
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-6 h-6 fill-[#F59E0B] text-[#F59E0B]" style={{ color: primary, fill: primary }} />
                  ))}
                  <div className="relative">
                    <Star className="w-6 h-6 text-[#EAECF0]" />
                    <div className="absolute inset-0 overflow-hidden w-[80%]">
                      <Star className="w-6 h-6 fill-[#F59E0B] text-[#F59E0B]" style={{ color: primary, fill: primary }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-0.5 font-bold text-[#1D2939]">
                  <span 
                    className="text-2xl outline-none"
                    contentEditable
                    onBlur={(e) => setLiveSiteRating({ ...liveSiteRating, average: e.target.innerText })}
                    suppressContentEditableWarning
                  >
                    {liveSiteRating.average}
                  </span>
                  <span className="text-sm text-[#667085]">/ 5.0</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-sm font-medium text-[#667085]">
                  Based on {liveSiteRating.count} reviews
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF3] text-[#027A48] rounded-full text-[11px] font-bold uppercase tracking-wider">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#027A48] flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  Verified Store
                </div>
              </div>
            </div>
          ) : (
            <>
              {widgetId === "testimonials-carousel" ? (
                <div
                  className={`HYOKA-testimonials-widget HYOKA-review-widget ${widgetLayout === "grid" ? "is-grid" : ""}`}
                  data-widget-id="testimonials-carousel"
                  data-widget-type="AdminPreview"
                  data-layout={widgetLayout}
                  style={{ padding: "2rem 0" }}
                >
                  <div className="HYOKA-carousel-header">
                    <h2 
                      className="HYOKA-carousel-main-title"
                      style={{
                        fontSize: form.header_font_size || "24px",
                        fontWeight: form.header_font_weight || "700",
                        color: form.header_text_color || "#1D2939",
                      }}
                    >
                      {form.widget_title || "Customers are saying"}
                    </h2>
                    <div className="HYOKA-rating-summary">
                      <div className="HYOKA-summary-stars" style={{ color: primary }}>
                        {"★★★★★"}
                      </div>
                      <span className="HYOKA-rating-text">4.9 ★ ({liveReviews.length})</span>
                      <div className="HYOKA-verified-badge-top">
                        Verified
                      </div>
                    </div>
                  </div>

                  {widgetLayout === "grid" ? (
                    <div className="HYOKA-testimonials-grid" style={{ gap }}>
                      {liveReviews.map((r) => (
                        <div key={r.id} className="HYOKA-testimonials-grid-item">
                          <TestimonialCard 
                            rating={r.rating}
                            review={r.review}
                            reviewer={r.reviewer}
                            product={r.product}
                            date={r.date}
                            onSelect={() => setSelectedElementId(`review-${r.id}`)}
                            isSelected={selectedElementId === `review-${r.id}`}
                            onUpdateContent={(updated) => updateReview(r.id, updated)}
                            titleStyle={titleStyle}
                            contentStyle={contentStyle}
                            cardStyle={cardStyle}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="HYOKA-carousel-wrapper">
                      <div className="HYOKA-carousel-container">
                        <div className="HYOKA-carousel-track">
                          {liveReviews.slice(0, 6).map((r) => (
                            <div key={r.id} className="HYOKA-carousel-item">
                              <TestimonialCard 
                                rating={r.rating}
                                review={r.review}
                                reviewer={r.reviewer}
                                product={r.product}
                                date={r.date}
                                onSelect={() => setSelectedElementId(`review-${r.id}`)}
                                isSelected={selectedElementId === `review-${r.id}`}
                                onUpdateContent={(updated) => updateReview(r.id, updated)}
                                titleStyle={titleStyle}
                                contentStyle={contentStyle}
                                cardStyle={cardStyle}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : widgetId === "product-review" || widgetId === "video-carousel" ? (
                <div className={`w-full relative ${
                  widgetId === "product-review" 
                    ? "grid grid-cols-1 max-w-[700px] mx-auto max-h-[500px] overflow-y-auto pr-2 no-scrollbar" 
                    : "flex gap-6 overflow-x-auto no-scrollbar pb-6"
                }`}>
                  {liveReviews.map((review, idx) => (
                    <div key={`${review.id}-${idx}`} className={`${widgetId !== "product-review" ? "w-[320px] shrink-0" : "w-full"}`}>
                      <TestimonialCard 
                        rating={review.rating}
                        review={review.review}
                        reviewer={review.reviewer}
                        product={review.product}
                        date={review.date}
                        isVideo={widgetId === 'video-carousel'}
                        onSelect={() => setSelectedElementId(`review-${review.id}`)}
                        isSelected={selectedElementId === `review-${review.id}`}
                        onUpdateContent={(updated) => updateReview(review.id, updated)}
                        titleStyle={titleStyle}
                        contentStyle={contentStyle}
                        cardStyle={cardStyle}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: radius,
                    width: "100%",
                  }}
                >
                  <TestimonialCard
                    rating={sample.rating}
                    review={sample.review}
                    reviewer={sample.reviewer}
                    product={sample.product}
                    date={sample.date}
                    isVideo={widgetId === "video-carousel"}
                    onSelect={() => setSelectedElementId(`review-${sample.id}`)}
                    isSelected={selectedElementId === `review-${sample.id}`}
                    onUpdateContent={(updated) => updateReview(sample.id, updated)}
                    titleStyle={titleStyle}
                    contentStyle={contentStyle}
                    cardStyle={cardStyle}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetStylePreview;
