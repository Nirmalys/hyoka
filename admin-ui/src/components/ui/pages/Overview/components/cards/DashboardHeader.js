import { ShimmerBox } from "../../../../Shimmer";
import { DATE_RANGES } from "../../utils/dashboardConstants";

const DashboardHeader = ({ range, onRangeChange, loading }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      {loading ? (
        <div className="space-y-2">
          <ShimmerBox className="h-8 w-56" rounded="rounded-lg" />
          <ShimmerBox className="h-4 w-80 max-w-full" />
        </div>
      ) : (
        <>
          <div className="text-[26px] font-bold leading-tight text-gray-900">
            Welcome to Hyoka
          </div>
          <div className="mt-1 text-[13px] text-gray-500">
            Manage, moderate and reply to every customer review of your products
          </div>
        </>
      )}
    </div>

    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      {DATE_RANGES.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onRangeChange(label)}
          disabled={loading}
          className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-60 ${
            range === label
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default DashboardHeader;
