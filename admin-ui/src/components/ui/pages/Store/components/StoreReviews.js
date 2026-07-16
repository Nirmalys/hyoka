import { useState, useEffect } from "react";
import { useReviews } from "../../Reviews/hooks/useReviews";
import StoreItem from "./StoreItem";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StoreSkeleton from "./StoreSkeleton";
import ApiErrorDisplay from "../../../ApiErrorDisplay";

const StoreReviews = () => {
  const { 
    reviews, 
    loading,
    loadError,
    loadErrorIsNetwork,
    fetchReviews,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems
  } = useReviews();

  const [localReviews, setLocalReviews] = useState([]);

  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  const handleReplySaved = (reviewId, reply) => {
    setLocalReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, reply: reply } : r
    ));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="flex-1 overflow-y-auto p-8 pb-4">
        <div className="max-w-5xl mx-auto">
          {loadError && !loading ? (
            <ApiErrorDisplay
              message={loadError}
              isNetwork={loadErrorIsNetwork}
              onRetry={loadErrorIsNetwork ? () => fetchReviews(true) : undefined}
              className="mb-6"
            />
          ) : null}
          {loading && localReviews.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <StoreSkeleton key={i} />
              ))}
            </div>
          ) : localReviews.length > 0 ? (
            <div className="space-y-2">
              {localReviews.map((review) => (
                <StoreItem 
                  key={review.id} 
                  review={review} 
                  onReplySaved={handleReplySaved}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-24 text-center">
              <div className="w-64 h-64 mb-6 mx-auto">
                <img 
                  src={`${window.hyokaData?.assetsUrl}images/storereview.webp`} 
                  alt="No reviews" 
                  className="w-full h-full object-contain select-none transition-all duration-700 ease-in-out"
                />
              </div>
              <h3 className="text-2xl font-black text-[#1D2939] mb-3">No reviews found</h3>
              <p className="text-[#64748b] text-[16px] leading-relaxed max-w-md mx-auto font-medium">
                It looks like there aren't any reviews to respond to yet. Everything is caught up and your review program is in great shape!
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="max-w-5xl mx-auto w-full px-8 py-6 mb-4 flex items-center justify-between border-t border-gray-100 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-900">{localReviews.length ? (currentPage - 1) * 10 + 1 : 0}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * 10, totalItems)}</span> of <span className="font-bold text-gray-900">{totalItems}</span> reviews
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-white hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={3} />
              Previous
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200">
              Page <span className="text-gray-900 font-black">{currentPage}</span> of {totalPages}
            </div>
            <button 
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages || totalPages === 0 || loading}
               className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-white hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreReviews;
