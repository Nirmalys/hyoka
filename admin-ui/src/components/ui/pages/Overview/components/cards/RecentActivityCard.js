import { formatTimeAgo } from "../../hooks/useDashboardStats";
import { ACTIVITY_META } from "../../utils/dashboardConstants";

const RecentActivityCard = ({ recentActivity }) => (
  <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <div className="text-[18px] font-bold text-gray-900">Recent Activity</div>
      <div className="text-[13px] text-gray-500">Live event timeline</div>
    </div>

    <div className="space-y-4">
      {recentActivity.length === 0 && (
        <div className="py-8 text-center text-[13px] text-gray-400">
          No recent activity yet.
        </div>
      )}
      {recentActivity.map((item) => {
        const meta = ACTIVITY_META[item.type] || ACTIVITY_META.review;
        const Icon = meta.icon;
        return (
          <div key={item.id} className="flex items-start gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-800">{item.text}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[12px] text-gray-400">
                <Icon className="h-3 w-3" />
                {formatTimeAgo(item.occurred_at)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default RecentActivityCard;
