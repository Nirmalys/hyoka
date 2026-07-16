import { Check } from "lucide-react";

export const getEmailTypeLabel = (customer) => {
  if (customer.email_type) return customer.email_type;
  if (customer.email_send_source === "manual") return "Manual Request";
  if (customer.reminder_sent) return "Reminder";
  return "Review Request";
};

export const DeliveryBadge = ({ delivered }) => {
  if (delivered) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[12px] font-semibold whitespace-nowrap">
        <span className="w-4 h-4 rounded-full bg-[#00C853] flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
        </span>
        Delivered
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[12px] font-semibold whitespace-nowrap">
      <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
      </span>
      Pending
    </span>
  );
};
