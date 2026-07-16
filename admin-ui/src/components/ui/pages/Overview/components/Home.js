import { useState, useEffect } from "react";
import { useDashboardStats, defaultDashboardStats } from "../hooks/useDashboardStats";
import { useStatCards } from "../hooks/useStatCards";
import { useOnboarding } from "../../../onboarding/OnboardingContext";
import OnboardingDialog from "../../../onboarding/OnboardingDialog";
import { SetupChecklist } from "../../../onboarding/SetupChecklist";
import { ShimmerDashboardSkeleton } from "../../../Shimmer";
import ApiErrorDisplay from "../../../ApiErrorDisplay";
import DashboardHeader from "./cards/DashboardHeader";
import WorkflowHeroCard from "./cards/WorkflowHeroCard";
import DashboardStatsGrid from "./cards/DashboardStatsGrid";
import ReviewGrowthCard from "./cards/ReviewGrowthCard";
import RatingDistributionCard from "./cards/RatingDistributionCard";
import RecentActivityCard from "./cards/RecentActivityCard";
import TopProductsCard from "./cards/TopProductsCard";

const Home = () => {
  const [range, setRange] = useState("30 Days");
  const { stats, loading: statsLoading, loadError, loadErrorIsNetwork, refresh } = useDashboardStats(range);
  const statCards = useStatCards(stats);
  const {
    steps: setupSteps,
    doneCount,
    totalSteps,
    percent,
    allComplete,
    dialogDismissed,
    dialogOpen,
    openDialog,
    dismissDialog,
    goToStep,
  } = useOnboarding();

  useEffect(() => {
    if (!allComplete && !dialogDismissed) {
      openDialog();
    }
  }, [allComplete, dialogDismissed, openDialog]);

  const assetsUrl = window.hyokaData?.assetsUrl || "";
  const bannerUrl = assetsUrl ? `${assetsUrl}images/Banner.webp` : null;
  const manUrl = assetsUrl ? `${assetsUrl}images/man.webp` : null;

  const recentActivity = stats.recent_activity || defaultDashboardStats.recent_activity;
  const topProducts = stats.top_products || defaultDashboardStats.top_products;
  const reviewGrowth = stats.review_growth || defaultDashboardStats.review_growth;
  const ratingDistribution = stats.rating_distribution || defaultDashboardStats.rating_distribution;
  const reviewSeries = reviewGrowth.reviews?.length
    ? reviewGrowth.reviews
    : Array(reviewGrowth.days || 30).fill(0);
  const requestSeries = reviewGrowth.requests?.length
    ? reviewGrowth.requests
    : Array(reviewGrowth.days || 30).fill(0);
  const chartMaxY = reviewGrowth.max_y || 4;
  const chartGrid = reviewGrowth.grid?.length ? reviewGrowth.grid : [0, 1, 2, 3, 4];
  const ratingRows = ratingDistribution.rows?.length
    ? ratingDistribution.rows
    : [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, pct: 0 }));

  return (
    <div className="flex h-full flex-col bg-[#FAFAFA]">
      <OnboardingDialog
        isOpen={dialogOpen}
        onClose={dismissDialog}
        steps={setupSteps}
        doneCount={doneCount}
        totalSteps={totalSteps}
        percent={percent}
        onStepAction={(step) => {
          dismissDialog();
          goToStep(step.id);
        }}
      />
      <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
        <DashboardHeader
          range={range}
          onRangeChange={setRange}
          loading={statsLoading}
        />

        {loadError && !statsLoading ? (
          <ApiErrorDisplay
            message={loadError}
            isNetwork={loadErrorIsNetwork}
            onRetry={loadErrorIsNetwork ? refresh : undefined}
            className="mb-6"
          />
        ) : null}

        {!allComplete && !dialogOpen && (
          <div className="mb-6">
            <SetupChecklist
              steps={setupSteps}
              doneCount={doneCount}
              totalSteps={totalSteps}
              percent={percent}
              onStepAction={(step) => goToStep(step.id)}
            />
          </div>
        )}

        {statsLoading ? (
          <ShimmerDashboardSkeleton />
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <WorkflowHeroCard manUrl={manUrl} />
              <DashboardStatsGrid statCards={statCards} bannerUrl={bannerUrl} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ReviewGrowthCard
                range={range}
                reviewSeries={reviewSeries}
                requestSeries={requestSeries}
                chartMaxY={chartMaxY}
                chartGrid={chartGrid}
              />
              <RatingDistributionCard
                ratingDistribution={ratingDistribution}
                ratingRows={ratingRows}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <RecentActivityCard recentActivity={recentActivity} />
              <TopProductsCard topProducts={topProducts} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
