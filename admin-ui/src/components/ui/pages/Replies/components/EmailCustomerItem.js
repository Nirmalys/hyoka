import { createSearchParams, useNavigate } from "react-router-dom";
import { Send } from "lucide-react";

const EmailCustomerItem = ({ customer }) => {
  const navigate = useNavigate();
  const product = customer.product || {};
  const emailSent = !!customer.email_sent;
  const displayName = customer.name?.trim() || customer.email || "Customer";

  const openManualSend = () => {
    navigate({
      pathname: "/settings",
      search: createSearchParams({
        tab: "manual",
        email: customer.email || "",
      }).toString(),
    });
  };

  return (
    <div className="bg-white rounded-md border border-gray-100 shadow-sm mb-3 transition-all hover:shadow-md relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
      <div className="px-6 py-4 flex items-center gap-8 text-left">
        {/* Customer + product image */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 shadow-sm">
            {product.image ? (
              <img
                src={product.image}
                alt={product.title || "Product"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                <span className="text-xs font-bold uppercase tracking-tighter">no img</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#101828] text-[16px] truncate leading-tight">
              {displayName}
            </div>
            <div className="text-[#667085] text-[12px] font-medium uppercase tracking-wide mt-1">
              Customer
            </div>
          </div>
        </div>

        {/* Product */}
        <div className="flex items-center justify-center flex-1 min-w-0 px-2">
          {product.link ? (
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-semibold text-[#344054] truncate hover:text-[#F59E0B] transition-colors text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {product.title || "Product"}
            </a>
          ) : (
            <span className="text-[14px] font-semibold text-[#344054] truncate text-center">
              {product.title || "Product"}
            </span>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center justify-center flex-1">
          <span className="text-[14px] text-gray-500 font-semibold whitespace-nowrap">
            {customer.date}
          </span>
        </div>

        {/* Email status */}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          {emailSent ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[#F04438] text-[15px] font-bold">↳</span>
              <p className="font-bold text-[#344054] text-[14px] truncate">
                {customer.email_send_source === "automation" ? "Sent via Auto" : "Sent via Manual"}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[#F59E0B]/50 text-[15px]">↳</span>
              <p className="text-[#F59E0B] text-[13px] italic font-black uppercase tracking-tight truncate">
                {customer.email_pending_label || "Pending email..."}
              </p>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex-shrink-0 min-w-[108px] flex justify-end">
          {!emailSent ? (
            <button
              type="button"
              title="Open settings to edit template and send follow-up"
              onClick={openManualSend}
              className="h-[40px] bg-[#F59E0B] rounded-xl px-5 flex items-center gap-2 hover:bg-[#F59E0B] transition-all text-white font-black text-[14px] shadow-sm shadow-orange-100 active:scale-95 border-0 focus:outline-none focus:ring-0"
            >
              <Send className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span>Send</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EmailCustomerItem;
