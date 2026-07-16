import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  Approved: {
    container: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
  },
  Pending: {
    container: "bg-amber-50 text-amber-700",
    icon: Clock,
    iconClass: "text-amber-500",
  },
  Rejected: {
    container: "bg-red-50 text-red-600",
    icon: XCircle,
    iconClass: "text-red-500",
  },
  Spam: {
    container: "bg-orange-50 text-orange-700",
    icon: AlertCircle,
    iconClass: "text-orange-500",
  },
};

const ReviewStatus = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${config.container}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconClass}`} strokeWidth={2} />
      {status}
    </div>
  );
};

export default ReviewStatus;
