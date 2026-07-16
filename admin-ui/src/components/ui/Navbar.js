import { Link, useLocation } from "react-router-dom";
import { useRef, useState, useLayoutEffect, forwardRef } from "react";
import {
  Star,
  LayoutGrid,
  LayoutTemplate,
  Mail,
  Upload,
  Store,
  MessageCircle,
  SlidersHorizontal,
  Palette,
  FileText,
  Send,
} from "lucide-react";
import { useNavCounts, formatCount } from "./hooks/useNavCounts";

const PRIMARY_NAV = [
  { path: "/home", label: "Dashboard", icon: LayoutGrid },
  { path: "/review", label: "Reviews", icon: Star, section: "reviews" },
  { path: "/widgets", label: "Widgets", icon: LayoutTemplate },
  { path: "/settings", label: "Email Flow", icon: Mail, search: "?tab=email_details", section: "email_flow" },
  { path: "/settings", label: "Imports", icon: Upload, search: "?tab=csv", section: "imports" },
];

const EMAIL_FLOW_SUB_NAV = [
  { tab: "email_details", label: "Email Details", icon: Mail },
  { tab: "automation", label: "Automation Rules", icon: SlidersHorizontal },
  { tab: "email_template", label: "Email Templates", icon: Palette },
  { tab: "submission_form", label: "Submission Form", icon: FileText },
  { tab: "manual", label: "Manual Request", icon: Send },
];

const REVIEWS_SUB_NAV = [
  { path: "/review", label: "Product Reviews", icon: Star, countKey: "productReviews" },
  { path: "/request", label: "Store Reviews", icon: Store, countKey: "storeReviews", search: "?tab=store", matchPath: "/request" },
  { path: "/review", label: "Visitor Replies", icon: MessageCircle, countKey: "visitorReplies", search: "?tab=visitor" },
];

const isHomePath = (pathname) =>
  pathname === "/" || pathname === "" || pathname === "/home";

const isReviewsSection = (pathname) =>
  pathname === "/review" || pathname === "/request";

const isEmailFlowSection = (pathname, search) => {
  if (pathname !== "/settings") return false;
  const tab = new URLSearchParams(search).get("tab");
  return tab !== "csv";
};

const isImportsSection = (pathname, search) =>
  pathname === "/settings" && new URLSearchParams(search).get("tab") === "csv";

const NAV_TRANSITION = "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
const NAV_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function useSlidingIndicator(activeIndex, deps = []) {
  const navRef = useRef(null);
  const itemRefs = useRef([]);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, opacity: 0 });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const nav = navRef.current;
      const activeEl = itemRefs.current[activeIndex];
      if (!nav || !activeEl || activeIndex < 0) {
        setIndicator((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }));
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      const top = itemRect.top - navRect.top;
      const height = itemRect.height;
      setIndicator((prev) => {
        if (prev.top === top && prev.height === height && prev.opacity === 1) {
          return prev;
        }
        return { top, height, opacity: 1 };
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, ...deps]);

  return { navRef, itemRefs, indicator };
}

const NavSubLink = forwardRef(({ to, active, icon: Icon, label, badge }, ref) => (
  <Link
    ref={ref}
    to={to}
    className={`relative z-10 flex items-center gap-3 rounded-md px-3 py-2 focus:outline-none ${NAV_TRANSITION} ${
      active ? "" : "text-gray-500 hover:bg-gray-50/80"
    }`}
  >
    <Icon
      className={`h-4 w-4 shrink-0 ${NAV_TRANSITION} ${active ? "text-black" : "text-gray-400"}`}
      strokeWidth={active ? 2.5 : 1.5}
    />
    <span
      className={`flex-1 truncate text-[13px] font-semibold ${NAV_TRANSITION} ${
        active ? "text-black" : "text-gray-600"
      }`}
    >
      {label}
    </span>
    {badge !== undefined && (
      <span
        className={`min-w-[36px] rounded-full px-2.5 py-0.5 text-center text-[11px] font-bold ${NAV_TRANSITION} ${
          active ? "bg-black text-[#F5B800]" : "bg-gray-100 text-gray-500"
        }`}
      >
        {badge}
      </span>
    )}
  </Link>
));

NavSubLink.displayName = "NavSubLink";

const SubNavList = ({ activeIndex, deps, className, children }) => {
  const { navRef, itemRefs, indicator } = useSlidingIndicator(activeIndex, deps);

  return (
    <nav ref={navRef} className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 rounded-md bg-linear-to-r from-[#eaba1e] via-[#F5B800] to-[#E5A800]"
        style={{
          top: indicator.top,
          height: indicator.height,
          opacity: indicator.opacity,
          transition: `top 0.32s ${NAV_EASE}, height 0.32s ${NAV_EASE}, opacity 0.2s ease`,
        }}
      />
      {children(itemRefs)}
    </nav>
  );
};

const Navbar = () => {
  const location = useLocation();
  const { counts } = useNavCounts();
  const { pathname, search } = location;
  const settingsTab = new URLSearchParams(search).get("tab") || "email_details";

  const isPrimaryActive = (item) => {
    if (item.section === "reviews") return isReviewsSection(pathname);
    if (item.section === "imports") return isImportsSection(pathname, search);
    if (item.section === "email_flow") return isEmailFlowSection(pathname, search);
    if (item.path === "/home") return isHomePath(pathname);
    if (item.search) {
      return pathname === item.path && search === item.search;
    }
    return pathname === item.path;
  };

  const isSubNavActive = (item) => {
    if (item.search === "?tab=visitor") {
      return pathname === "/review" && search === "?tab=visitor";
    }
    if (item.matchPath === "/request" || item.search === "?tab=store") {
      return pathname === "/request";
    }
    return pathname === "/review" && search !== "?tab=visitor";
  };

  const showReviewsSubNav = isReviewsSection(pathname);
  const showEmailFlowSubNav = isEmailFlowSection(pathname, search);

  const isEmailSubNavActive = (item) => settingsTab === item.tab;

  const activePrimaryIndex = PRIMARY_NAV.findIndex((item) => isPrimaryActive(item));
  const activeReviewsIndex = REVIEWS_SUB_NAV.findIndex((item) => isSubNavActive(item));
  const activeEmailIndex = EMAIL_FLOW_SUB_NAV.findIndex((item) => isEmailSubNavActive(item));

  const {
    navRef: primaryNavRef,
    itemRefs: primaryItemRefs,
    indicator: primaryIndicator,
  } = useSlidingIndicator(activePrimaryIndex, [pathname, search]);

  return (
    <div className="flex flex-shrink-0 h-full">
      {/* Primary icon sidebar */}
      <aside
        className="w-[92px] flex flex-col items-center pt-2 pb-5 bg-white z-20 relative"
        style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.05)" }}
      >
        <nav ref={primaryNavRef} className="relative flex flex-1 w-full flex-col items-center gap-1.5 px-2.5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 rounded-2xl bg-[#FFF9E5]"
            style={{
              top: primaryIndicator.top,
              height: primaryIndicator.height,
              opacity: primaryIndicator.opacity,
              transition: `top 0.32s ${NAV_EASE}, height 0.32s ${NAV_EASE}, opacity 0.2s ease`,
            }}
          />
          {PRIMARY_NAV.map((item, index) => {
            const active = isPrimaryActive(item);
            const to = item.search ? `${item.path}${item.search}` : item.path;
            return (
              <Link
                key={`${item.path}-${item.label}`}
                ref={(el) => {
                  primaryItemRefs.current[index] = el;
                }}
                to={to}
                title={item.label}
                className={`group relative z-10 flex w-full flex-col items-center justify-center rounded-2xl py-2 focus:outline-none ${NAV_TRANSITION} hover:bg-gray-50/60`}
              >
                <item.icon
                  className={`mb-1 h-6 w-6 ${NAV_TRANSITION} ${
                    active ? "text-[#F5B800]" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span
                  className={`text-center text-[11px] font-semibold leading-tight ${NAV_TRANSITION} ${
                    active ? "text-[#F5B800]" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Secondary reviews sidebar */}
      {showReviewsSubNav && (
        <aside
          className="hyoka-nav-sub-panel relative z-10 flex w-[258px] flex-col bg-white"
          style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.04)" }}
        >
          <div className="px-6 pt-6 pb-5">
            <div className="text-[17px] font-bold text-gray-900 leading-none">Reviews</div>
            <div className="text-[12px] text-gray-400 font-medium leading-none mt-1.5">
              Manage &amp; Reply to Reviews
            </div>
          </div>
          <div className="mx-6 mt-1 border-t border-gray-200" />

          <SubNavList
            activeIndex={activeReviewsIndex}
            deps={[pathname, search]}
            className="flex flex-1 flex-col gap-1.5 px-4 pt-3"
          >
            {(itemRefs) =>
              REVIEWS_SUB_NAV.map((item, index) => {
                const active = isSubNavActive(item);
                const to = item.search ? `${item.path}${item.search}` : item.path;
                const count = counts[item.countKey] ?? 0;

                return (
                  <NavSubLink
                    key={item.label}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    to={to}
                    active={active}
                    icon={item.icon}
                    label={item.label}
                    badge={formatCount(count)}
                  />
                );
              })
            }
          </SubNavList>
        </aside>
      )}

      {showEmailFlowSubNav && (
        <aside
          className="hyoka-nav-sub-panel relative z-10 flex w-[258px] flex-col bg-white"
          style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.04)" }}
        >
          <div className="px-6 pt-6 pb-5">
            <div className="text-[17px] font-bold text-gray-900 leading-none">Email Automation</div>
            <div className="text-[12px] text-gray-400 font-medium leading-none mt-1.5">
              Manage email workflows
            </div>
          </div>
          <div className="mx-6 mt-1 border-t border-gray-200" />

          <SubNavList
            activeIndex={activeEmailIndex}
            deps={[pathname, search, settingsTab]}
            className="flex flex-1 flex-col gap-1.5 px-4 pt-3"
          >
            {(itemRefs) =>
              EMAIL_FLOW_SUB_NAV.map((item, index) => {
                const active = isEmailSubNavActive(item);
                const to = `/settings?tab=${item.tab}`;

                return (
                  <NavSubLink
                    key={item.tab}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    to={to}
                    active={active}
                    icon={item.icon}
                    label={item.label}
                  />
                );
              })
            }
          </SubNavList>
        </aside>
      )}
    </div>
  );
};

export default Navbar;
