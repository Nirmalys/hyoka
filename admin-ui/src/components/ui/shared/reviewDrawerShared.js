export const DRAWER_CLOSE_MS = 500;

const STATUS_BANNER_BASE = {
  Approved: {
    container: "bg-[#E8F5E9] border-t border-[#C8E6C9]",
    iconWrap: "bg-[#00C853]",
    title: "Approved & live on storefront",
    badgeBg: "bg-[#C8E6C9]",
    badgeDot: "bg-[#2E7D32]",
    badgeText: "text-[#2E7D32]",
  },
  Pending: {
    container: "bg-amber-50 border-t border-amber-100",
    iconWrap: "bg-amber-500",
    title: "Pending moderation",
    subtitle: "Not visible on the storefront yet",
    badgeBg: "bg-amber-100",
    badgeDot: "bg-amber-600",
    badgeText: "text-amber-700",
  },
  Rejected: {
    container: "bg-red-50 border-t border-red-100",
    iconWrap: "bg-red-500",
    title: "Rejected",
    subtitle: "Hidden from the storefront",
    badgeBg: "bg-red-100",
    badgeDot: "bg-red-600",
    badgeText: "text-red-700",
  },
  Spam: {
    container: "bg-orange-50 border-t border-orange-100",
    iconWrap: "bg-orange-500",
    title: "Marked as spam",
    subtitle: "Hidden from the storefront",
    badgeBg: "bg-orange-100",
    badgeDot: "bg-orange-600",
    badgeText: "text-orange-700",
  },
};

const APPROVED_SUBTITLES = {
  product: "Visible to customers on the product page",
  store: "Visible to customers on the review page",
};

export const getReviewStatusBanner = (status, variant = "product") => {
  const base = STATUS_BANNER_BASE[status] || STATUS_BANNER_BASE.Pending;
  if (status !== "Approved") {
    return base;
  }
  return {
    ...base,
    subtitle: APPROVED_SUBTITLES[variant] || APPROVED_SUBTITLES.product,
  };
};

export const SectionTitle = ({ children }) => (
  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.14em] mb-2">
    {children}
  </div>
);

export const DrawerStatusBadge = ({ status, banner }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0 ${banner.badgeBg} ${banner.badgeText}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${banner.badgeDot}`} />
    {status}
  </span>
);
