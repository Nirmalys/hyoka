import {
  CHART,
  CHART_PLOT_H,
  CHART_PLOT_W,
  buildSmoothPath,
  shouldShowChartLabel,
} from "../../utils/dashboardChartUtils";

const ReviewGrowthCard = ({
  range,
  reviewSeries,
  requestSeries,
  chartMaxY,
  chartGrid,
}) => (
  <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <div className="text-[18px] font-bold text-gray-900">Review Growth</div>
        <div className="text-[13px] text-gray-500">
          Last {range.toLowerCase()} — reviews collected vs. requests sent
        </div>
      </div>
      <div className="flex items-center gap-4 text-[13px] font-semibold text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Reviews
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
          Requests
        </span>
      </div>
    </div>

    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height: 260 }}
    >
      {chartGrid.map((gv) => {
        const y = CHART.padTop + CHART_PLOT_H - (gv / chartMaxY) * CHART_PLOT_H;
        return (
          <g key={gv}>
            <line
              x1={CHART.padX}
              y1={y}
              x2={CHART.width - 10}
              y2={y}
              stroke="#F1F1F1"
              strokeWidth="1"
            />
            <text x={CHART.padX - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#9CA3AF">
              {gv}
            </text>
          </g>
        );
      })}
      {reviewSeries.map((_, i) => {
        if (!shouldShowChartLabel(i, reviewSeries.length)) return null;
        const x =
          CHART.padX +
          (reviewSeries.length > 1 ? (i / (reviewSeries.length - 1)) * CHART_PLOT_W : 0);
        return (
          <text
            key={i}
            x={x}
            y={CHART.height - 8}
            textAnchor="middle"
            fontSize="9"
            fill="#9CA3AF"
          >
            {i + 1}
          </text>
        );
      })}
      <path
        d={buildSmoothPath(requestSeries, chartMaxY)}
        fill="none"
        stroke="#111827"
        strokeWidth="2.5"
      />
      <path
        d={buildSmoothPath(reviewSeries, chartMaxY)}
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2.5"
      />
    </svg>
  </div>
);

export default ReviewGrowthCard;
