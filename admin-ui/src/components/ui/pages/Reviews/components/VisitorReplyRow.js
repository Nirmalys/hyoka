import { useState } from "react";
import { logApiError } from "../../../../../utils/apiError";
import { CornerDownRight, MoreHorizontal } from "lucide-react";
import axiosClient from "../../../../axiosClient";
import ReviewStatus from "./ReviewStatus";

const formatStatus = (status) => {
  const raw = String(status || "pending").toLowerCase();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const VisitorReplyRow = ({
  parent,
  reply,
  onOpenDrawer,
  onUserReplyStatusUpdate,
}) => {
  const [updating, setUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const author = reply.author || "Visitor";
  const status = formatStatus(reply.status);

  const handleStatus = async (newStatus) => {
    if (!parent?.id || !reply?.id) return;
    setUpdating(true);
    setMenuOpen(false);
    try {
      const response = await axiosClient.post("", {
        action: "hyoka_update_user_reply_status",
        review_id: parent.id,
        reply_id: reply.id,
        status: newStatus,
        _ajax_nonce: window.hyokaData?.nonce || "",
      });
      if (response.data?.success) {
        const updatedReplies = (parent.user_replies || []).map((item) =>
          item.id === reply.id ? { ...item, status: newStatus } : item
        );
        onUserReplyStatusUpdate?.(parent.id, updatedReplies);
      } else {
        alert(response.data?.data?.message || "Failed to update reply.");
      }
    } catch (error) {
      logApiError(error, "Failed to update visitor reply");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <tr className="group">
      <td colSpan={9} className="p-0 pb-2">
        <div
          className="flex items-center bg-white rounded-2xl border border-gray-100 ml-6 transition-all duration-200 hover:border-gray-200"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="w-8 flex-shrink-0" />

          <div className="w-[19%] min-w-[160px] px-2 py-3.5 flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2} />
          </div>

          <div className="w-[11%] min-w-0 px-2 py-3.5">
            <span className="text-[13px] font-bold text-black truncate block">{author}</span>
          </div>

          <div className="flex-1 min-w-0 px-2 py-3.5">
            <p className="text-[13px] text-gray-500 truncate font-normal">{reply.content}</p>
          </div>

          <div className="w-[8%] px-2 py-3.5" />
          <div className="w-[8%] px-2 py-3.5" />

          <div className="w-[10%] px-2 py-3.5">
            <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
              {reply.date || parent?.date || "—"}
            </span>
          </div>

          <div className="w-[11%] px-2 py-3.5 flex justify-center">
            <ReviewStatus status={status} />
          </div>

          <div className="w-[4%] pr-3 py-3.5 flex justify-center relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              disabled={updating}
              className="p-1 text-gray-300 hover:text-gray-600 rounded-lg transition-all focus:outline-none"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleStatus("approved")}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus("rejected")}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenDrawer(parent);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    View review
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

export default VisitorReplyRow;
