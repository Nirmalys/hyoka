import { MoreVertical, Calendar, MessageSquare, CheckCircle2, Mail } from "lucide-react";
import ReviewStatus from "../Reviews/ReviewStatus";


const ReplyRow = ({ 
  row, 
  onOpenDrawer,
  type 
}) => {
  const isEmailTab = type === 'EmailDetails';
  
  if (isEmailTab) {
    const product = row.product || {};
    const emailSent = !!row.email_sent;
    
    return (
      <tr className="hover:bg-gray-50/50 transition-all duration-200 group cursor-pointer" onClick={() => onOpenDrawer(row)}>
        <td className="pl-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold border border-white shadow-sm">
              {row.name ? row.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-none mb-1">{row.name || 'Customer'}</span>
              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {row.email}
              </span>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg w-fit border border-gray-100">
                <Calendar className="w-3 h-3 text-orange-400" />
                {row.date}
            </div>
        </td>
        <td className="px-4 py-3 text-center">
          {emailSent ? (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-colors bg-emerald-50 text-emerald-700 border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Sent
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
               <ReviewStatus status="Pending" />
            </div>
          )}
        </td>
        <td className="pr-6 py-3 text-right">
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenDrawer(row); }}
            className="p-1.5 rounded-lg hover:bg-white hover:shadow-md hover:text-orange-600 text-gray-400 transition-all active:scale-90"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }

  // Question/Reply Row
  const reviewer = row.reviewer || {};
  const product = row.product || {};
  const review = row.review || {};

  return (
    <tr className="hover:bg-gray-50/50 transition-all duration-200 group cursor-pointer" onClick={() => onOpenDrawer(row)}>
      <td className="pl-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold border border-white shadow-sm">
            {reviewer.initials || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-none mb-1">{reviewer.name}</span>
            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {reviewer.email}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 min-w-[200px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
             <MessageSquare className="w-3 h-3 text-orange-400" />
             <span className="text-xs font-bold text-gray-800 line-clamp-1 truncate">{review.title}</span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium line-clamp-1 truncate italic">"{review.content}"</p>
        </div>
      </td>
      <td className="px-4 py-3">
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg w-fit border border-gray-100">
              <Calendar className="w-3 h-3 text-orange-400" />
              {row.date}
          </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center">
           <ReviewStatus status={row.status} />
        </div>
      </td>
      <td className="pr-6 py-3 text-right">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenDrawer(row); }}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-md hover:text-orange-600 text-gray-400 transition-all active:scale-90"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export default ReplyRow;
