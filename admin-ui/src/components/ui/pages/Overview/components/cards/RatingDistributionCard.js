import { Star } from "lucide-react";
import { formatStatNumber } from "../../hooks/useDashboardStats";

const RatingDistributionCard = ({ ratingDistribution, ratingRows }) => (
  <div className="rounded-3xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
    <div className="mb-2 flex items-start justify-between">
      <div>
        <div className="text-[18px] font-bold text-gray-900">Rating Distribution</div>
        <div className="text-[13px] text-gray-500">
          All time · {formatStatNumber(ratingDistribution.total)} reviews
        </div>
      </div>
      <div className="text-right">
        <div className="text-[26px] font-bold leading-none text-gray-900">
          {Number(ratingDistribution.average || 0).toFixed(2)}
        </div>
        <div className="mt-1 flex justify-end gap-0.5 text-[13px] text-orange-400">
          {"★★★★★"}
        </div>
      </div>
    </div>

    <div className="space-y-7">
      {ratingRows.map((row) => (
        <div key={row.star} className="flex items-center gap-3">
          <div className="flex w-8 shrink-0 items-center gap-0.5 text-[13px] font-semibold text-gray-600">
            {row.star}
            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
          </div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${row.pct}%` }}
            />
          </div>
          <div className="w-14 shrink-0 text-right text-[13px] font-semibold text-gray-700">
            {formatStatNumber(row.count)}
          </div>
          <div className="w-9 shrink-0 text-right text-[13px] text-gray-400">{row.pct}%</div>
        </div>
      ))}
    </div>
  </div>
);

export default RatingDistributionCard;
