import ProductReviewWidgetPreview from "./ProductReviewWidgetPreview";
import VideoCarouselWidgetPreview from "./VideoCarouselWidgetPreview";
import CardCarouselWidgetPreview from "./CardCarouselWidgetPreview";
import TestimonialsCarouselWidgetPreview from "./TestimonialsCarouselWidgetPreview";
import SiteRatingWidgetPreview from "./SiteRatingWidgetPreview";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TestimonialCard from "./TestimonialCard";
import { mockReviews } from "../mockData";

const WidgetPreview = ({ widgetId }) => {
  const wrap = (node) => <div className="w-full max-w-full min-w-0 mx-auto">{node}</div>;

  if (widgetId === "product-review") {
    return wrap(<ProductReviewWidgetPreview />);
  }

  if (widgetId === "video-carousel") {
    return wrap(<VideoCarouselWidgetPreview />);
  }

  if (widgetId === "card-carousel") {
    return wrap(<CardCarouselWidgetPreview />);
  }

  if (widgetId === "testimonials-carousel") {
    return wrap(<TestimonialsCarouselWidgetPreview />);
  }

  if (widgetId === "site-rating") {
    return wrap(<SiteRatingWidgetPreview />);
  }

  const reviews = mockReviews.slice(0, 3);

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 overflow-hidden w-full max-w-full">
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
        {reviews.map((review) => (
          <div key={review.id} className="w-[min(300px,85vw)] shrink-0">
            <TestimonialCard
              rating={review.rating}
              review={review.review}
              reviewer={review.reviewer}
              product={review.product}
              date={review.date}
              isVideo={false}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-1 bg-black rounded-full px-1 py-1">
          <button type="button" className="p-1 text-white/70">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" className="p-1 text-white/70">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetPreview;
