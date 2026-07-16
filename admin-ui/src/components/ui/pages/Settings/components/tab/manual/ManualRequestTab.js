import { useEffect, useRef, useState } from "react";
import {
  Search,
  Send,
  ChevronDown,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Loader2,
  Package,
  Check,
} from "lucide-react";
import { ShimmerTableSkeleton } from "../../../../../Shimmer";
import FilterPill from "../../../../Reviews/components/FilterPill";
import { formatSentOn } from "../../../../../../../utils/formatDate";
import { getEmailTypeLabel } from "../../../../../../../utils/emailCustomerDisplay";

const EMAIL_TYPE_OPTIONS = ["Review Request", "Reminder", "Manual Request", "Review Confirmation"];

const toFilterOptions = (items, allLabel) => [
  { value: "", label: allLabel },
  ...items.map((item) => ({ value: item, label: item })),
];

const EmailTypeSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative w-44" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-[13px] font-medium text-gray-500 focus:outline-none"
      >
        <span className="truncate">{value || "Select email type"}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="absolute left-0 right-0 z-40 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {EMAIL_TYPE_OPTIONS.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  value === opt
                    ? "bg-[#F59E0B] text-white"
                    : "text-gray-900 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const StatusBadge = ({ delivered }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${
        delivered ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"
      }`}
    >
      {delivered ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {delivered ? "Delivered" : "Pending"}
    </span>
  );
};

const ManualRequestTab = ({
  manualQuery,
  setManualQuery,
  manualResults,
  manualLoading,
  manualSelected,
  setManualSelected,
  sending,
  handleSendManualDirect,
  manualSavedNote,
  error,
  recentManualRequests,
  recentLoading,
}) => {
  const [orderNumber, setOrderNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailType, setEmailType] = useState(null);
  const [recentSearch, setRecentSearch] = useState("");
  const [filterEmailType, setFilterEmailType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterOpened, setFilterOpened] = useState(null);

  const result = manualSelected || manualResults[0] || null;
  const showRecentSection = recentLoading || recentManualRequests.length > 0;

  const findOrder = () => {
    const query = orderNumber.trim() || customerEmail.trim();
    if (query) setManualQuery(query);
  };

  const filteredRecent = recentManualRequests.filter((row) => {
    const q = recentSearch.trim().toLowerCase();
    const productTitle = row.product?.title || "";
    const email = row.email || "";
    const emailTypeLabel = getEmailTypeLabel(row);
    const openedLabel = row.email_sent ? "YES" : "—";
    const delivered = !!row.email_sent;

    if (q && !email.toLowerCase().includes(q) && !productTitle.toLowerCase().includes(q)) {
      return false;
    }
    if (filterEmailType && emailTypeLabel !== filterEmailType) {
      return false;
    }
    if (filterStatus === "Delivered" && !delivered) {
      return false;
    }
    if (filterStatus === "Pending" && delivered) {
      return false;
    }
    if (filterOpened === "Yes" && openedLabel !== "YES") {
      return false;
    }
    if (filterOpened === "No" && openedLabel === "YES") {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full pb-8 space-y-8">
      {/* Find Order card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-500">
              Order number
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findOrder()}
              placeholder="#10421"
              className="h-11 w-full rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-500">
              Customer email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findOrder()}
              placeholder="customer@email.com"
              className="h-11 w-full rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={findOrder}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-6 text-[14px] font-bold text-gray-900 transition-opacity hover:opacity-90 md:w-56"
          >
            {manualLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find Order
          </button>
        </div>

        {result && (
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <Check className="h-4 w-4" strokeWidth={3} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold text-gray-900">
                    {result.name}
                    {result.product?.title ? ` · ${result.product.title}` : ""}
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                    Eligible
                  </span>
                </div>
                <div className="text-[12px] text-gray-400">
                  {result.date ? `Purchased ${result.date} · ` : ""}Eligible for review request
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <EmailTypeSelect value={emailType} onChange={setEmailType} />
              <button
                type="button"
                onClick={() => result && handleSendManualDirect(result.id)}
                disabled={!result || result.email_sent || sending}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F59E0B] px-4 text-[13px] font-bold text-gray-900 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Email
              </button>
            </div>
          </div>
        )}

        {(manualSavedNote || error) && (
          <div className="mt-3 text-[12px]">
            {manualSavedNote && (
              <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> {manualSavedNote}
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1.5 font-bold text-red-500">
                <XCircle className="h-3.5 w-3.5" /> {error}
              </span>
            )}
          </div>
        )}
      </div>

      {showRecentSection && (
        <div>
          <div className="mb-4 text-[18px] font-bold text-gray-900">
            Recent Manual Requests
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={recentSearch}
                onChange={(e) => setRecentSearch(e.target.value)}
                placeholder="Search recipient..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                label="Email Type"
                value={filterEmailType || ""}
                options={toFilterOptions(EMAIL_TYPE_OPTIONS, "All Types")}
                onChange={(value) => setFilterEmailType(value || null)}
              />
              <FilterPill
                label="Status"
                value={filterStatus || ""}
                options={toFilterOptions(["Delivered", "Pending"], "All Status")}
                onChange={(value) => setFilterStatus(value || null)}
              />
              <FilterPill
                label="Opened"
                value={filterOpened || ""}
                options={toFilterOptions(["Yes", "No"], "All")}
                onChange={(value) => setFilterOpened(value || null)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="grid grid-cols-[32px_1.5fr_1.6fr_1.1fr_0.7fr_0.8fr_1fr_48px] items-center gap-3 border-b border-gray-100 px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-gray-400">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
              <span>Product Detail</span>
              <span>Customer Email</span>
              <span>Email Type</span>
              <span>Opened</span>
              <span>Sent On</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {recentLoading ? (
              <ShimmerTableSkeleton rows={5} />
            ) : (
              filteredRecent.map((row) => {
                const productTitle = row.product?.title || "—";
                const productImage = row.product?.image || "";
                const emailTypeLabel = getEmailTypeLabel(row);
                const sentOn = formatSentOn(row.email_sent_at, row.date || "—");
                const openedLabel = row.email_sent ? "YES" : "—";

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[32px_1.5fr_1.6fr_1.1fr_0.7fr_0.8fr_1fr_48px] items-center gap-3 border-b border-gray-50 px-4 py-3.5 last:border-b-0 hover:bg-gray-50/50"
                  >
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                      </div>
                      <span className="truncate text-[13px] font-bold text-gray-900">
                        {productTitle}
                      </span>
                    </div>
                    <span className="truncate text-[13px] font-semibold text-gray-700">
                      {row.email || "—"}
                    </span>
                    <span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-semibold text-gray-600">
                        {emailTypeLabel}
                      </span>
                    </span>
                    <span className="text-[13px] font-semibold text-gray-600">
                      {openedLabel}
                    </span>
                    <span className="text-[13px] font-medium text-gray-500">
                      {sentOn}
                    </span>
                    <span>
                      <StatusBadge delivered={!!row.email_sent} />
                    </span>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualRequestTab;
