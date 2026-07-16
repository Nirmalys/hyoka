const EmailStatCard = ({
  label,
  value,
  badge,
  icon: Icon,
  variant = "default",
  backgroundImage = null,
}) => {
  const isPrimary = variant === "primary";

  return (
    <div
      className={`rounded-xl px-4 py-3.5 border shadow-sm relative overflow-hidden ${
        isPrimary
          ? "border-[#F5B800] bg-[#F5B800] bg-cover bg-center"
          : "bg-white border-gray-100"
      }`}
      style={
        isPrimary && backgroundImage
          ? { backgroundImage: `url(${backgroundImage})` }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isPrimary ? "bg-gray-900" : "bg-[#FFF9E5]"
          }`}
        >
          <Icon
            className={`w-[15px] h-[15px] ${isPrimary ? "text-[#F5B800]" : "text-[#F5B800]"}`}
            strokeWidth={2}
          />
        </div>
        <span
          className={`text-[12px] font-bold uppercase tracking-wide leading-none ${
            isPrimary ? "text-gray-900/75" : "text-gray-500"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-[29px] font-bold leading-none text-gray-900">
          {value.toLocaleString()}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold leading-tight whitespace-nowrap mb-0.5 ${
            isPrimary ? "bg-gray-900/85 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
};

export default EmailStatCard;
