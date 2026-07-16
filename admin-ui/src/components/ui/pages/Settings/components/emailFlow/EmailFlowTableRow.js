import { useState } from "react";
import { createSearchParams, useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { formatSentOn } from "../../../../../../utils/formatDate";
import { getEmailTypeLabel, DeliveryBadge } from "../../../../../../utils/emailCustomerDisplay";

const EmailFlowTableRow = ({ customer }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const email = customer.email || "—";
  const emailSent = !!customer.email_sent;
  const emailType = getEmailTypeLabel(customer);
  const sentAt = customer.email_sent_at || customer.reminder_sent_at || "";
  const sentOn = formatSentOn(sentAt, customer.date || "—");
  const openedLabel = emailSent ? "YES" : "—";

  const openManual = () => {
    setMenuOpen(false);
    navigate({
      pathname: "/settings",
      search: createSearchParams({
        tab: "manual",
        email: customer.email || "",
      }).toString(),
    });
  };

  return (
    <tr className="group">
      <td colSpan={7} className="p-0 pb-2">
        <div
          className="flex items-center rounded-2xl border bg-white border-gray-100 hover:border-gray-200 transition-all duration-200"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="w-[4%] min-w-[44px] px-3 py-3.5 flex justify-center">
            <input
              type="checkbox"
              readOnly
              className="w-4 h-4 rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800]/30 cursor-default"
              aria-label={`Select ${email}`}
            />
          </div>

          <div className="w-[24%] min-w-[180px] px-2 py-3.5">
            <span className="text-[13px] font-bold text-[#1D2939] truncate block">{email}</span>
          </div>

          <div className="w-[15%] min-w-0 px-2 py-3.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[12px] font-semibold text-gray-600 whitespace-nowrap">
              {emailType}
            </span>
          </div>

          <div className="w-[8%] px-2 py-3.5 flex justify-center">
            <span
              className={`text-[12px] font-semibold ${
                openedLabel === "YES" ? "text-gray-500" : "text-gray-300"
              }`}
            >
              {openedLabel}
            </span>
          </div>

          <div className="w-[14%] min-w-0 px-2 py-3.5">
            <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">{sentOn}</span>
          </div>

          <div className="w-[14%] px-2 py-3.5 flex justify-center">
            <DeliveryBadge delivered={emailSent} />
          </div>

          <div className="w-[4%] pr-3 py-3.5 flex justify-center relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1 text-gray-300 hover:text-gray-600 rounded-lg transition-all focus:outline-none"
              aria-label="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={openManual}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    Send manual request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default EmailFlowTableRow;
