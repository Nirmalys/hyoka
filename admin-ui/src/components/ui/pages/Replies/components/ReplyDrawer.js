import { useState, useEffect } from "react";
import { logApiError } from "../../../../../utils/apiError";
import { X, MessageCircle, Mail, Send, Check, X as XIcon, AlertOctagon, ShoppingBag, CheckCircle2, Clock } from "lucide-react";
import axiosClient from "../../../../axiosClient";

const ReplyDrawer = ({ isOpen, onClose, data, onReplySuccess, onStatusUpdate, type }) => {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const isEmailTab = type === 'EmailDetails';

  useEffect(() => {
    if (data) {
      setActiveItem(data);
      if (!isEmailTab) {
        setReplyText(data.reply || "");
      }
    }
  }, [data, isEmailTab]);

  if (!activeItem) return null;

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post("", {
        action: 'hyoka_save_reply',
        review_id: activeItem.id,
        reply: replyText,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });

      if (response.data.success) {
        onReplySuccess(activeItem.id, replyText);
      } else {
        alert(response.data.data?.message || "Failed to save reply.");
      }
    } catch (error) {
      logApiError(error, "Failed to save reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatus = !isEmailTab ? (activeItem.status?.toLowerCase() || 'pending') : '';

  return (
    <div className={`fixed inset-0 z-[100] flex justify-end overflow-hidden transition-all duration-500 ${isOpen ? 'visible' : 'invisible delay-500'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div 
        className={`relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 transition-all duration-700 delay-150 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-lg font-bold border-2 border-white shadow-sm ring-4 ring-orange-50">
              {isEmailTab 
                ? (activeItem.name ? activeItem.name[0].toUpperCase() : 'C') 
                : (activeItem.reviewer?.initials || 'U')}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-none mb-1">
                {!isEmailTab && (activeItem.name || activeItem.reviewer?.name)}
              </h2>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5" />
                {isEmailTab ? activeItem.email : activeItem.reviewer?.email}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Product Info Section */}
          <div className={`bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 transition-all duration-700 delay-200 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white p-1 border border-gray-100 overflow-hidden flex-shrink-0 shadow-sm">
                <img 
                    src={isEmailTab ? activeItem.product?.image : activeItem.product?.image} 
                    alt={isEmailTab ? activeItem.product?.title : activeItem.product?.name} 
                    className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Product</span>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
                    {!isEmailTab && activeItem.product?.sku}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 line-clamp-1 leading-tight">
                    {isEmailTab ? activeItem.product?.title : activeItem.product?.name}
                </h3>
              </div>
            </div>
          </div>

          {!isEmailTab ? (
              /* Question/Reply Content */
              <div className={`space-y-6 transition-all duration-700 delay-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">Item Details</span>
                    </div>
                    <span className="text-sm font-medium text-gray-400">{activeItem.date}</span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xl font-black text-gray-900 leading-tight tracking-tight">{activeItem.review?.title}</h4>
                  <p className="text-gray-600 leading-relaxed text-[15px] font-medium whitespace-pre-wrap">{activeItem.review?.content}</p>
                </div>
              </div>
          ) : (
              /* Email Details Content */
              <div className={`space-y-6 transition-all duration-700 delay-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">Purchase Details</span>
                    </div>
                    <span className="text-sm font-medium text-gray-400">{activeItem.date}</span>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                        <span className="text-sm text-gray-400 font-medium">Order Status</span>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tight">Completed</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                        <span className="text-sm text-gray-400 font-medium">Follow-up Email</span>
                        {activeItem.email_sent ? (
                            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Sent
                            </span>
                        ) : (
                            <span className="text-sm font-bold text-orange-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Pending
                            </span>
                        )}
                    </div>
                </div>
              </div>
          )}

          {/* Reply Section (Not for email tab in this view) */}
          {!isEmailTab && (
              <div className={`pt-8 space-y-4 border-t border-gray-100 transition-all duration-700 delay-500 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {activeItem.reply && (
                    <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 mt-2">
                        <div className="flex items-center gap-2 mb-3 text-emerald-700">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Store Team's Response</span>
                        </div>
                        <p className="text-sm font-medium text-emerald-900 leading-relaxed">{activeItem.reply}</p>
                    </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block pl-1">Post a Response</label>
                  <div className="relative group">
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 outline-none transition-all resize-none placeholder:text-gray-300"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handlePostReply}
                      disabled={isSubmitting || !replyText.trim() || replyText === activeItem.reply}
                      className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100 transition-all shadow-md shadow-orange-200"
                    >
                      <Send className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
                      {isSubmitting ? 'Saving...' : 'Post response'}
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        {!isEmailTab && (
            <div className={`px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 transition-all duration-700 delay-600 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button 
                onClick={() => onStatusUpdate(activeItem.id, 'spam')}
                disabled={currentStatus === 'spam'}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale focus:outline-none"
            >
                <AlertOctagon className="w-4 h-4" />
                Spam
            </button>
            <button 
                onClick={() => onStatusUpdate(activeItem.id, 'rejected')}
                disabled={currentStatus === 'rejected'}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale focus:outline-none"
            >
                <XIcon className="w-4 h-4" strokeWidth={3} />
                Reject
            </button>
            <button 
                onClick={() => onStatusUpdate(activeItem.id, 'approved')}
                disabled={currentStatus === 'approved'}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:grayscale focus:outline-none"
            >
                <Check className="w-4 h-4" strokeWidth={3} />
                Approve
            </button>
            </div>
        )}
        
        {isEmailTab && (
             <div className={`px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 transition-all duration-700 delay-600 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <button 
                    onClick={() => {
                        window.location.hash = `#/settings?customer_id=${encodeURIComponent(String(activeItem.id))}`;
                        onClose();
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-100 focus:outline-none"
                >
                    <Send className="w-4 h-4" />
                    Configure Email
                </button>
             </div>
        )}
      </div>
    </div>
  );
};

export default ReplyDrawer;
