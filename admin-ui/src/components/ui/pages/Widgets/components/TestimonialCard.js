import { Star, Play } from "lucide-react";

const TestimonialCard = ({ 
  rating, 
  review, 
  reviewer, 
  product, 
  isVideo, 
  onSelect,
  isSelected,
  onUpdateContent,
  titleStyle = {},
  contentStyle = {},
  cardStyle = {}
}) => {
  const { title, content } = review || {};
  const { name, initials } = reviewer || {};
  
  const cardContainerStyle = {
    borderRadius: cardStyle.radius || '8px',
    borderColor: cardStyle.borderColor || '#EAECF0',
    ...cardStyle.style
  };
  return (
    <div 
      className={`bg-white border p-5 transition-all duration-300 flex flex-col relative overflow-hidden group ${isVideo ? "min-h-[450px]" : "h-full"} ${isSelected ? 'border-orange-500 ring-2 ring-orange-50 shadow-lg' : 'shadow-sm hover:shadow-md'}`}
      style={cardContainerStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {isVideo && (
        <div className="absolute inset-x-0 top-0 h-48 bg-gray-100 flex items-center justify-center -mt-5 -mx-5 mb-5 group-hover:bg-gray-200 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B] ml-0.5" />
          </div>
        </div>
      )}
      
      <div className={`flex gap-0.5 mb-3 ${isVideo ? "mt-48" : ""}`}>
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < rating ? "text-[#FF4405] fill-[#FF4405]" : "text-gray-200 fill-gray-200"}`} 
          />
        ))}
      </div>
      
      {title && (
        <h4 
          className="mb-1.5 leading-tight outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
          style={{
            fontSize: titleStyle.fontSize || "15px",
            fontWeight: titleStyle.fontWeight || "700",
            color: titleStyle.color || "#1D2939",
          }}
          contentEditable={Boolean(onUpdateContent)}
          onBlur={(e) => onUpdateContent?.({ ...review, title: e.target.innerText })}
          suppressContentEditableWarning
        >
          {title}
        </h4>
      )}
      <p 
        className="leading-relaxed mb-6 flex-1 outline-none focus:bg-orange-50/50 rounded px-1 -mx-1"
        style={{
          fontSize: contentStyle.fontSize || "13px",
          fontWeight: contentStyle.fontWeight || "400",
          color: contentStyle.color || "#667085",
        }}
        contentEditable={Boolean(onUpdateContent)}
        onBlur={(e) => onUpdateContent?.({ ...review, content: e.target.innerText })}
        suppressContentEditableWarning
      >
        {content}
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-auto">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 bg-orange-400`}>
          {initials || name?.charAt(0) || "A"}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#1D2939] leading-tight truncate">{name}</div>
          <div className="text-[11px] text-[#98A2B3] leading-tight truncate">on {product}</div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
