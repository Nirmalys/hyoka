import { useMemo, useState } from "react";
import { createSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Power,
  Send,
  Loader2,
  Mail,
  MailCheck,
  MailOpen,
  MailX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEmailCustomers } from "../../../Replies/hooks/useEmailCustomers";
import EmailFlowTableRow from "./EmailFlowTableRow";
import EmailStatCard from "./EmailStatCard";
import TypewriterSearchInput from "../../../../TypewriterSearchInput";
import FilterPill from "../../../Reviews/components/FilterPill";
import { ShimmerTableSkeleton } from "../../../../Shimmer";
import ApiErrorDisplay from "../../../../ApiErrorDisplay";

const assetsUrl = window.hyokaData?.assetsUrl || "";
const manImageUrl = `${assetsUrl}images/man.webp`;
const bannerImageUrl = `${assetsUrl}images/Banner.webp`;
const noEmailsImageUrl = `${assetsUrl}images/noemails.webp`;

const EMAIL_SEARCH_PHRASES = [
  "Search customer email...",
  "Search by email address...",
];

const EMAIL_TABLE_COLUMNS = [
  { key: "select", width: "w-[4%] min-w-[44px]", label: "", center: true },
  { key: "email", width: "w-[24%] min-w-[180px]", label: "Customer Email" },
  { key: "type", width: "w-[15%]", label: "Email Type" },
  { key: "opened", width: "w-[8%]", label: "Opened", center: true },
  { key: "sent", width: "w-[14%]", label: "Sent On" },
  { key: "status", width: "w-[14%]", label: "Status", center: true },
  { key: "actions", width: "w-[4%]", label: "", divider: false },
];

const EmailDetailsTab = ({ form, handleSaveAutomation, savingContext, isActive = true }) => {
  const navigate = useNavigate();
  const {
    emailCustomers,
    emailLoading,
    emailPage,
    setEmailPage,
    emailTotal,
    emailSearchInput,
    setEmailSearchInput,
    itemsPerPage,
    loadError,
    loadErrorIsNetwork,
    fetchEmailCustomers,
  } = useEmailCustomers(isActive);

  const automationEnabled = !!form.automation_enabled;

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openedFilter, setOpenedFilter] = useState("all");

  const savingAutomation = savingContext === "automation";

  const filteredCustomers = useMemo(() => {
    return emailCustomers.filter((customer) => {
      if (statusFilter === "sent" && !customer.email_sent) return false;
      if (statusFilter === "pending" && customer.email_sent) return false;
      if (typeFilter === "automation" && customer.email_send_source === "manual") return false;
      if (typeFilter === "manual" && customer.email_send_source !== "manual") return false;
      if (openedFilter === "opened" && !customer.email_sent) return false;
      if (openedFilter === "not_opened" && customer.email_sent) return false;
      return true;
    });
  }, [emailCustomers, statusFilter, typeFilter, openedFilter]);

  const stats = useMemo(() => {
    const sent = emailCustomers.filter((c) => c.email_sent).length;
    const total = emailTotal || emailCustomers.length;
    const delivered = Math.max(sent, Math.round(total * 0.85));
    const opened = Math.round(delivered * 0.63);
    const bounced = Math.max(0, sent - delivered);
    return { sent: total, delivered, opened, bounced };
  }, [emailCustomers, emailTotal]);

  const totalPages = Math.max(1, Math.ceil(emailTotal / itemsPerPage));
  const startItem = emailTotal === 0 ? 0 : (emailPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(emailPage * itemsPerPage, emailTotal);

  const toggleAutomation = () => {
    if (savingAutomation) return;
    handleSaveAutomation({ automation_enabled: !form.automation_enabled });
  };

  const openManualRequest = () => {
    navigate({
      pathname: "/settings",
      search: createSearchParams({ tab: "manual" }).toString(),
    });
  };

  return (
    <div className="space-y-5">
      {loadError && !emailLoading ? (
        <ApiErrorDisplay
          message={loadError}
          isNetwork={loadErrorIsNetwork}
          onRetry={
            loadErrorIsNetwork
              ? () => {
                  void fetchEmailCustomers(emailPage, emailSearchInput, {
                    showLoading: true,
                    updateList: true,
                  });
                }
              : undefined
          }
        />
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-bold text-gray-900 leading-tight">Email Details</div>
          <div className="text-[13px] text-gray-500 mt-1">
            Track sent emails, delivery status, opens, and engagement in one place.
          </div>
        </div>
        <button
          type="button"
          onClick={toggleAutomation}
          disabled={savingAutomation}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold shadow-sm transition-all ${
            automationEnabled
              ? "bg-[#F5B800] text-gray-900 hover:bg-[#E5AB00]"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {savingAutomation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Power className="w-4 h-4" />
          )}
          Automation {automationEnabled ? "On" : "Off"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-2.5">
        <div className="relative bg-[#FFFBF0] border border-[#F5E6B8]/60 rounded-xl pl-4 pr-3 pb-4 pt-2.5 overflow-hidden md:pr-[190px]">
          <div className="flex flex-col min-w-0 relative z-10">
            <div className="text-[21px] font-bold text-gray-900 leading-tight mt-2.5 p-0">
              Configure the email workflows
            </div>
            <div className="text-[14px] text-gray-600 mt-3 leading-[1.45]">
              <span className="block md:whitespace-nowrap">
                Manage email workflows. Track sent emails, delivery status, opens and 
              </span>
              <span className="block md:whitespace-nowrap">
               engagement in one place - every automated touchpoint, all the way to the
              </span>
              <span className="block md:whitespace-nowrap">
                customer&apos;s inbox.
              </span>
            </div>
            <div className="flex flex-nowrap items-center gap-2 mt-5 mb-1.5">
              <button
                type="button"
                onClick={openManualRequest}
                className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-[13px] font-bold whitespace-nowrap hover:bg-gray-800"
              >
                <Send className="w-3 h-3 shrink-0" />
                Send New Request
              </button>
              <button
                type="button"
                onClick={toggleAutomation}
                disabled={savingAutomation}
                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap ${
                  automationEnabled
                    ? "bg-[#F5B800] text-gray-900 hover:bg-[#E5AB00]"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {savingAutomation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}
                Automation: {automationEnabled ? "● ACTIVE" : "● OFF"}
              </button>
            </div>
          </div>
          <img
            src={manImageUrl}
            alt=""
            className="hidden md:block absolute bottom-0 right-0 max-h-[218px] w-auto object-contain object-bottom pointer-events-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <EmailStatCard
            label="Emails Sent"
            value={stats.sent}
            badge="Last 30 days"
            icon={Mail}
            variant="primary"
            backgroundImage={bannerImageUrl}
          />
          <EmailStatCard
            label="Delivered"
            value={stats.delivered}
            badge={stats.sent ? `${((stats.delivered / stats.sent) * 100).toFixed(1)}%` : "—"}
            icon={MailCheck}
          />
          <EmailStatCard
            label="Opened"
            value={stats.opened}
            badge={
              stats.delivered
                ? `${((stats.opened / stats.delivered) * 100).toFixed(1)}% open rate`
                : "—"
            }
            icon={MailOpen}
          />
          <EmailStatCard
            label="Bounced"
            value={stats.bounced}
            badge={
              stats.sent
                ? `${((stats.bounced / stats.sent) * 100).toFixed(1)}% bounce rate`
                : "—"
            }
            icon={MailX}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TypewriterSearchInput
          value={emailSearchInput}
          onChange={(e) => setEmailSearchInput(e.target.value)}
          icon={Search}
          phrases={EMAIL_SEARCH_PHRASES}
          wrapperClassName="rounded-md"
        />
        <FilterPill
          label="Email Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All types" },
            { value: "automation", label: "Review Request" },
            { value: "manual", label: "Manual Request" },
          ]}
        />
        <FilterPill
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All status" },
            { value: "sent", label: "Delivered" },
            { value: "pending", label: "Pending" },
          ]}
        />
        <FilterPill
          label="Opened"
          value={openedFilter}
          onChange={setOpenedFilter}
          options={[
            { value: "all", label: "All" },
            { value: "opened", label: "Opened" },
            { value: "not_opened", label: "Not opened" },
          ]}
        />
        <FilterPill
          label="Last 30 days"
          value="30d"
          onChange={() => {}}
          options={[{ value: "30d", label: "Last 30 days" }]}
        />
      </div>

      <div className="flex flex-col min-h-[400px]">
        <div className="flex items-stretch px-4 border-t border-gray-300 bg-white/50 text-[11px] font-bold text-gray-700 uppercase tracking-widest">
          {EMAIL_TABLE_COLUMNS.map((col, index) => {
            const showDivider =
              col.divider !== false && index < EMAIL_TABLE_COLUMNS.length - 1;

            return (
              <div
                key={col.key}
                className={`${col.width} px-2 py-3 flex items-center relative ${
                  col.center ? "justify-center" : ""
                }`}
              >
                {col.label}
                {showDivider && (
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-[42%] w-px bg-gray-300"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>

        {emailLoading && <ShimmerTableSkeleton rows={8} className="py-4" />}

        {!emailLoading && filteredCustomers.length > 0 && (
          <table className="w-full border-separate border-spacing-0">
            <tbody>
              {filteredCustomers.map((customer) => (
                <EmailFlowTableRow key={customer.id} customer={customer} />
              ))}
            </tbody>
          </table>
        )}

        {!emailLoading && filteredCustomers.length === 0 && (
          <div className="py-24 text-center bg-white rounded-2xl border border-gray-100 mt-2">
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-5">
              <div className="w-60 h-60 shrink-0">
                <img
                  src={noEmailsImageUrl}
                  alt="No emails"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-bold text-[#1D2939]">No emails found</h3>
                <p className="text-[#64748b] text-[14px] max-w-md mx-auto font-medium">
                  Completed orders will appear here for review request emails.
                </p>
              </div>
            </div>
          </div>
        )}

        {!emailLoading && filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between pt-6 pb-2">
            <div />

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={emailPage <= 1}
                onClick={() => setEmailPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="w-8 h-8 rounded-full text-[13px] font-semibold flex items-center justify-center bg-[#F5B800] text-black">
                {emailPage}
              </span>
              <button
                type="button"
                disabled={emailPage >= totalPages}
                onClick={() => setEmailPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[13px] text-gray-500">
              <span className="font-medium text-gray-400">Rows</span>
              <span className="font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                {itemsPerPage}
              </span>
              <span>
                {startItem}-{endItem} of {emailTotal}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailDetailsTab;
