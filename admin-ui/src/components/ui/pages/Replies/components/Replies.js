import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import StoreReviews from "./StoreReviews";
import FeedbackHeader from "./FeedbackHeader";
import QuestionItem from "./QuestionItem";
import EmailCustomerItem from "./EmailCustomerItem";
import RepliesSortFilters from "./RepliesSortFilters";
import RepliesEmailFilters from "./RepliesEmailFilters";
import { useReviews } from "../../Reviews/hooks/useReviews";
import {
  Search,
  SlidersHorizontal,
  MessageSquare,
  Star,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StoreSkeleton from "../../Store/components/StoreSkeleton";
import ApiErrorDisplay from "../../../ApiErrorDisplay";
import { useEmailCustomers } from "../hooks/useEmailCustomers";

const ITEMS_PER_PAGE = 10;
const EMAIL_TAB = "EmailDetails";
const SEARCH_DEBOUNCE_MS = 300;
const SKIP_FETCH_ON_TABS = Object.freeze([EMAIL_TAB]);

const Replies = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const isStoreReviewsPage = tab === "store";

  if (isStoreReviewsPage) {
    return <StoreReviews />;
  }

  return <RepliesLegacy />;
};

const RepliesLegacy = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    reviews,
    loading: reviewsLoading,
    loadError: reviewsLoadError,
    loadErrorIsNetwork: reviewsLoadErrorIsNetwork,
    fetchReviews,
    activeTab,
    setActiveTab,
    tabs: reviewTabs,
    currentPage: reviewPage,
    setCurrentPage: setReviewPage,
    totalPages: reviewTotalPages,
    totalItems: reviewTotalItems,
    searchQuery,
    setSearchQuery,
    orderBy,
    setOrderBy,
    order,
    setOrder,
    counts: reviewCounts,
  } = useReviews("questions", { skipFetchOnTabs: SKIP_FETCH_ON_TABS });

  const isEmailTab = activeTab === EMAIL_TAB;

  const {
    emailCustomers,
    emailLoading,
    emailPage,
    setEmailPage,
    emailTotal,
    emailCount,
    emailSearchInput,
    setEmailSearchInput,
    emailSearchQuery,
    automationEnabled,
    loadError: emailLoadError,
    loadErrorIsNetwork: emailLoadErrorIsNetwork,
    fetchEmailCustomers,
  } = useEmailCustomers(isEmailTab);

  const [localReviews, setLocalReviews] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [emailSentFilter, setEmailSentFilter] = useState("all");
  const filterMenuRef = useRef(null);

  // Review tabs: debounced into useReviews searchQuery.
  const [searchInput, setSearchInput] = useState(searchQuery || "");

  const filtersActive = isEmailTab
    ? emailSentFilter !== "all"
    : orderBy !== "created_at" || order !== "DESC";

  const filteredEmailCustomers = useMemo(() => {
    if (emailSentFilter === "sent") {
      return emailCustomers.filter((c) => c.email_sent);
    }
    if (emailSentFilter === "pending") {
      return emailCustomers.filter((c) => !c.email_sent);
    }
    return emailCustomers;
  }, [emailCustomers, emailSentFilter]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "store") {
      setActiveTab("StoreReviews");
    }
  }, [searchParams, setActiveTab]);

  useEffect(() => {
    if (reviews && reviews.length > 0) {
      setLocalReviews(reviews);
    } else {
      setLocalReviews([]);
    }
  }, [reviews]);

  // Debounce review search -> shared searchQuery.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleReplySaved = (reviewId, reply) => {
    setLocalReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply } : r)));
  };

  const emailTabCount = isEmailTab
    ? emailCount || 0
    : Number(reviewCounts?.EmailDetails) || emailCount || 0;

  const tabs = useMemo(
    () => [
      ...reviewTabs,
      {
        name: EMAIL_TAB,
        label: "Email Details",
        count: String(emailTabCount),
      },
    ],
    [reviewTabs, emailTabCount]
  );

  const loading = isEmailTab ? emailLoading : reviewsLoading;
  const activeLoadError = isEmailTab ? emailLoadError : reviewsLoadError;
  const activeLoadErrorIsNetwork = isEmailTab ? emailLoadErrorIsNetwork : reviewsLoadErrorIsNetwork;
  const totalItems = isEmailTab ? emailTotal : reviewTotalItems;
  const totalPages = isEmailTab
    ? Math.max(1, Math.ceil(emailTotal / ITEMS_PER_PAGE))
    : reviewTotalPages || 1;
  const currentPage = isEmailTab ? emailPage : reviewPage;
  const setCurrentPage = isEmailTab ? setEmailPage : setReviewPage;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const tabIconMap = {
    Questions: MessageSquare,
    StoreReviews: Star,
    StoreReplies: MessageSquare,
    [EMAIL_TAB]: Mail,
  };

  const indicatorStyle = useMemo(() => {
    const idx = Math.max(0, tabs.findIndex((t) => t.name === activeTab));
    return {
      top: "4px",
      bottom: "4px",
      width: `calc(${100 / tabs.length}% - 8px)`,
      left: `calc(${(100 / tabs.length) * idx}% + 4px)`,
    };
  }, [tabs, activeTab]);

  const empty = useMemo(() => {
    if (isEmailTab) {
      return {
        title: "No purchased customers yet",
        body:
          "Only customers from WooCommerce orders with status Completed are listed here. If the order is no longer Completed, the row is hidden.",
      };
    }
    if (activeTab === "Questions") {
      return {
        title: "No questions yet",
        body:
          "When customers ask questions about your products, they'll appear here for you to answer!",
      };
    }
    return {
      title: activeTab === "StoreReviews" ? "No reviews to reply to" : "No replies found",
      body: "Everything is caught up! Your review program is currently in great shape.",
    };
  }, [activeTab, isEmailTab]);

  useEffect(() => {
    setShowFilters(false);
    setEmailSentFilter("all");
  }, [activeTab]);

  useEffect(() => {
    if (!showFilters) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  return (
    <div className="flex flex-col h-full bg-[#FCF9F6]">
      <FeedbackHeader />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {activeLoadError && !loading ? (
            <ApiErrorDisplay
              message={activeLoadError}
              isNetwork={activeLoadErrorIsNetwork}
              onRetry={
                activeLoadErrorIsNetwork
                  ? () => {
                      if (isEmailTab) {
                        void fetchEmailCustomers(emailPage, emailSearchQuery, {
                          showLoading: true,
                          updateList: true,
                        });
                        return;
                      }
                      void fetchReviews(true);
                    }
                  : undefined
              }
              className="mb-6"
            />
          ) : null}
          {/* Tabs + search/filter on one row */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex bg-[#F3F0EC] p-1 rounded-md relative flex-1 min-w-0">
              <div
                className="absolute bg-white shadow-sm rounded-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={indicatorStyle}
              />
              {tabs.map((tab) => {
                const Icon = tabIconMap[tab.name] || MessageSquare;
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => {
                      if (tab.name === "StoreReviews") {
                        navigate("/request?tab=store");
                        return;
                      }
                      setActiveTab(tab.name);
                    }}
                    className={`relative z-20 flex-1 flex items-center justify-center gap-1.5 px-0 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 focus:outline-none focus:ring-0 ${
                      isActive ? "text-[#101828]" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${isActive ? "text-gray-900" : "text-gray-400"}`}
                    />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md transition-all duration-300 bg-[rgba(245, 158, 11, 0.12)] text-[#F59E0B] font-black border border-[#F59E0B]/10">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={isEmailTab ? emailSearchInput : searchInput}
                  onChange={(e) =>
                    isEmailTab ? setEmailSearchInput(e.target.value) : setSearchInput(e.target.value)
                  }
                  className="w-full h-[38px] bg-white border border-gray-200 rounded-xl py-0 pl-9 pr-3 text-sm leading-none focus:outline-none focus:border-orange-200 focus:ring-0 transition-all"
                />
              </div>
              <div className="relative shrink-0" ref={filterMenuRef}>
                <button
                  type="button"
                  aria-label="Filters"
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`h-[38px] w-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 focus:outline-none ${
                    showFilters || filtersActive
                      ? "bg-orange-50 border-orange-200 text-orange-600"
                      : "bg-white border-gray-200 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                {showFilters && (
                  <div
                    className="absolute top-full z-[100] mt-2"
                    style={{ right: 0, left: "auto" }}
                  >
                    {isEmailTab ? (
                      <RepliesEmailFilters
                        emailSentFilter={emailSentFilter}
                        setEmailSentFilter={setEmailSentFilter}
                        onSelect={() => setShowFilters(false)}
                      />
                    ) : (
                      <RepliesSortFilters
                        orderBy={orderBy}
                        setOrderBy={setOrderBy}
                        order={order}
                        setOrder={setOrder}
                        onSelect={() => setShowFilters(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* List Content — only this region updates on search */}
          <ListContent
            loading={loading}
            isEmailTab={isEmailTab}
            automationEnabled={automationEnabled}
            emailCustomers={filteredEmailCustomers}
            localReviews={localReviews}
            activeTab={activeTab}
            fetchReviews={fetchReviews}
            handleReplySaved={handleReplySaved}
            empty={empty}
          />

          {/* Pagination Footer */}
          {!loading && (isEmailTab ? filteredEmailCustomers.length > 0 : localReviews.length > 0) && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 pb-10">
              <div className="text-[13px] font-medium text-gray-500 whitespace-nowrap">
                Showing <span className="text-gray-900 font-bold">{startItem}</span> to{" "}
                <span className="text-gray-900 font-bold">{endItem}</span> of{" "}
                <span className="text-gray-900 font-bold">{totalItems}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 flex items-center gap-1 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="bg-[#F8F9FA] px-4 py-2 rounded-xl text-[12px] font-bold text-gray-800 uppercase tracking-wider border border-gray-100 shadow-inner">
                  Page <span className="text-orange-500">{currentPage}</span> of {totalPages || 1}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 flex items-center gap-1 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ListContent = React.memo(function ListContent({
  loading,
  isEmailTab,
  automationEnabled,
  emailCustomers,
  localReviews,
  activeTab,
  fetchReviews,
  handleReplySaved,
  empty,
}) {
  if (loading) {
    return (
      <div className="mb-10">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <StoreSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isEmailTab) {
    return (
      <div className="mb-10">
        {emailCustomers.length > 0 ? (
          <div className="space-y-4">
            {emailCustomers.map((customer) => (
              <EmailCustomerItem
                key={customer.id}
                customer={customer}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-5">
              <div className="w-60 h-60 shrink-0">
                <img
                  src={`${window.hyokaData?.assetsUrl}images/noemails.webp`}
                  alt="No purchased customers"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-2xl font-black text-[#1D2939]">{empty.title}</h3>
                <p className="text-[#64748b] text-[16px] max-w-md mx-auto leading-relaxed font-medium">
                  {empty.body}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-10">
      {localReviews.length > 0 ? (
        <div className="space-y-4">
          {localReviews.map((review) => (
            <QuestionItem
              key={review.id}
              review={review}
              type={activeTab}
              onSuccess={fetchReviews}
              onReplySaved={handleReplySaved}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-md border border-[#F3F0EC] shadow-sm">
          <div className="w-64 h-64 mb-6 mx-auto">
            <img
              src={`${window.hyokaData?.assetsUrl}images/monks.webp`}
              alt="No feedback"
              className="w-full h-full object-contain select-none"
            />
          </div>
          <h3 className="text-2xl font-black text-[#1D2939] mb-3">{empty.title}</h3>
          <p className="text-[#64748b] text-[16px] max-w-md mx-auto leading-relaxed font-medium">
            {empty.body}
          </p>
        </div>
      )}
    </div>
  );
});

export default Replies;