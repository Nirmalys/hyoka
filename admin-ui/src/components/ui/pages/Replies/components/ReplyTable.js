import ReplyRow from "./ReplyRow";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ShimmerTableSkeleton } from "../../../Shimmer";

/**
 * ReplyTable component.
 */
const ReplyTable = ({ 
  data, 
  loading, 
  onOpenDrawer,
  totalItems,
  currentPage,
  setCurrentPage,
  totalPages,
  activeTab
}) => {
  const { assetsUrl } = window.hyokaData || {};
  const isEmailTab = activeTab === "EmailDetails";
  const emptyStateImage =
    activeTab === "StoreReviews"
      ? `${assetsUrl}images/storereview.webp`
      : `${assetsUrl}images/monks.webp`;

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'Questions': return 'No questions found';
      case 'StoreReviews': return 'No reviews to reply to';
      case 'StoreReplies': return 'No replies found';
      case 'EmailDetails': return 'No purchased customers yet';
      default: return 'No items found';
    }
  };

  return (
    <div className="flex flex-col min-h-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 uppercase tracking-tighter">
              <th className="pl-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[220px]">
                {isEmailTab ? 'Customer' : 'Reviewer'}
              </th>
              {isEmailTab ? (
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[150px]">Date</th>
              ) : (
                  <>
                    <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[120px]">Date</th>
                  </>
              )}
              <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-[120px]">Status</th>
              <th className="pr-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-[80px]">Actions</th>
            </tr>
          </thead>
          {!loading && data.length > 0 && (
            <tbody className="divide-y divide-gray-100/80">
              {data.map((row) => (
                <ReplyRow 
                  key={row.id} 
                  row={row} 
                  type={activeTab}
                  onOpenDrawer={onOpenDrawer}
                />
              ))}
            </tbody>
          )}
        </table>

        {loading && <ShimmerTableSkeleton rows={7} className="py-6 bg-white" />}

        {!loading && data.length === 0 && (
          <div className="py-24 text-center bg-white">
            <div className="flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-48 h-48 mb-6 opacity-80">
                <img 
                  src={emptyStateImage} 
                  alt="Empty" 
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <h3 className="text-xl font-black text-[#1D2939] mb-2">{getEmptyMessage()}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                Everything looks clear! We'll notify you when new {activeTab.toLowerCase()} arrive.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between mt-auto">
        <div className="text-[12px] font-medium text-gray-500">
          Showing <span className="text-gray-900 font-bold">{data.length ? (currentPage - 1) * 10 + 1 : 0}</span> to <span className="text-gray-900 font-bold">{Math.min(currentPage * 10, totalItems)}</span> of <span className="text-gray-900 font-bold">{totalItems}</span> items
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-orange-100 text-[11px] font-bold text-orange-600 shadow-sm shadow-orange-50">
            Page {currentPage} of {totalPages || 1}
          </div>
          <button 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
             disabled={currentPage >= totalPages || totalPages === 0}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 bg-white"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyTable;
