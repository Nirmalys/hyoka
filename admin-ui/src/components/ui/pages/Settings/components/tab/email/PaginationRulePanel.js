import { parseReviewsPerPage } from "../../../utils";

const PaginationRulePanel = ({ form, updateField }) => {
  const perPage = parseReviewsPerPage(form.reviews_per_page, 10);

  return (
    <div className="space-y-3">
      <label className="block text-[15px] font-bold text-gray-900">
        Reviews per page: <span className="text-orange-600">{perPage}</span>
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        {[5, 10, 20, 50].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => updateField("reviews_per_page", val)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
              perPage === val
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
            }`}
          >
            {val}
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={100}
          value={form.reviews_per_page ?? perPage}
          onChange={(e) => updateField("reviews_per_page", e.target.value)}
          className="w-16 px-3 py-2 rounded-lg border border-gray-100 bg-white text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default PaginationRulePanel;

