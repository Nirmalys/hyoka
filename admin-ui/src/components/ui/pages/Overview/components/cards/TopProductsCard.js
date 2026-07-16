import {
  Star,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { formatStatNumber } from "../../hooks/useDashboardStats";

const TopProductsCard = ({ topProducts }) => (
  <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
    <div className="mb-4">
      <div className="text-[18px] font-bold text-gray-900">Top Performing Products</div>
      <div className="text-[13px] text-gray-500">Ranked by review performance</div>
    </div>

    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-3 border-b border-gray-100 px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
      <div>Product</div>
      <div>Rating</div>
      <div>Reviews</div>
      <div>Conversion Impact</div>
      <div className="text-right">Action</div>
    </div>

    {topProducts.length === 0 ? (
      <div className="py-10 text-center text-[13px] text-gray-400">
        No product reviews yet.
      </div>
    ) : (
      topProducts.map((product) => (
        <div
          key={product.id}
          className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-3 border-b border-gray-50 px-1 py-3 last:border-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amber-50 text-orange-400">
              {product.image ? (
                <img src={product.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold text-gray-900">{product.name}</div>
              <div className="text-[11px] text-gray-400">{product.sku || "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-gray-800">
            {product.rating}
            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
          </div>
          <div className="text-[13px] text-gray-600">{formatStatNumber(product.reviews)}</div>
          <div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                product.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
              }`}
            >
              {product.up ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {product.impact}
            </span>
          </div>
          <div className="text-right">
            {product.url ? (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[12px] font-bold text-gray-700 hover:text-orange-500"
              >
                View product
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="text-[12px] text-gray-300">—</span>
            )}
          </div>
        </div>
      ))
    )}
  </div>
);

export default TopProductsCard;
