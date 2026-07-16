import StatCard from "./StatCard";

const DashboardStatsGrid = ({ statCards, bannerUrl }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {statCards.map((stat) => (
      <StatCard key={stat.label} stat={stat} bannerUrl={bannerUrl} />
    ))}
  </div>
);

export default DashboardStatsGrid;
