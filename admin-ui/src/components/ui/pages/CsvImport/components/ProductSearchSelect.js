import { useState, useEffect, useRef } from "react";
import { logApiError } from "../../../../../utils/apiError";
import { Search, X } from "lucide-react";
import axiosClient from "../../../../axiosClient";
import { ShimmerBox } from "../../../Shimmer";

const ProductSearchSelect = ({ value, onChange, placeholder = "Search product" }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosClient.post("", {
          action: "hyoka_search_products",
          search: query,
          page: 1,
        });
        if (res.data?.success) {
          setResults(res.data.data?.products || []);
        }
      } catch (e) {
        logApiError(e, "Product search failed");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative min-w-[200px]">
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-orange-200 bg-orange-50/50 text-[12px]">
          {value.image ? (
            <img src={value.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
          ) : null}
          <span className="font-bold text-gray-800 truncate flex-1">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-0.5 hover:bg-orange-100 rounded"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2 rounded-md border border-gray-200 bg-gray-50 text-[12px] font-medium focus:bg-white focus:border-orange-500 focus:outline-none"
            />
            {loading && (
              <ShimmerBox
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                rounded="rounded-full"
              />
            )}
          </div>
          {open && (
            <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-md shadow-lg">
              {loading && (
                <div className="space-y-2 p-2">
                  <ShimmerBox className="h-9 w-full" rounded="rounded-md" />
                  <ShimmerBox className="h-9 w-full" rounded="rounded-md" />
                  <ShimmerBox className="h-9 w-full" rounded="rounded-md" />
                </div>
              )}
              {!loading && results.length === 0 && (
                <p className="px-3 py-2 text-[12px] text-gray-400">No products found</p>
              )}
              {!loading && results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  {p.image ? (
                    <img src={p.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-gray-900 truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-400">
                      ID {p.id}
                      {p.sku ? ` · ${p.sku}` : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductSearchSelect;
