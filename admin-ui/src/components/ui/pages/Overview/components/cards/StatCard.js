import { Star } from "lucide-react";

const StatCard = ({ stat, bannerUrl }) => {
  const Icon = stat.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        stat.highlight
          ? "border-orange-500 bg-orange-500 bg-cover bg-center text-black"
          : "border-gray-100 bg-white"
      }`}
      style={
        stat.highlight && bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined
      }
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            stat.highlight ? "bg-black text-orange-400" : "bg-amber-50 text-orange-500"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={`text-[13px] font-semibold ${
            stat.highlight ? "text-black" : "text-gray-500"
          }`}
        >
          {stat.label}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-[26px] font-bold leading-none">{stat.value}</span>
        {stat.star && (
          <Star
            className={`mb-0.5 h-4 w-4 ${
              stat.highlight ? "fill-black text-black" : "fill-orange-400 text-orange-400"
            }`}
          />
        )}
        <span
          className={`mb-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            stat.highlight ? "bg-black/10 text-black" : "bg-gray-100 text-gray-600"
          }`}
        >
          {stat.delta}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
