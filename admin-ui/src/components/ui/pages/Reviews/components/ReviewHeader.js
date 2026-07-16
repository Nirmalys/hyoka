const ReviewHeader = ({ title, subtitle, isVisitorTab = false }) => {
  return (
    <div>
      <div className="text-[22px] font-bold text-black leading-none">
        {title || (isVisitorTab ? "Visitor Replies" : "Product Reviews")}
      </div>
      <div className="text-[13px] text-gray-400 font-medium leading-none mt-1.5">
        {subtitle ||
          (isVisitorTab
            ? "Replies from visitors threaded under the original customer review."
            : "Manage, moderate and reply to every customer review of your products")}
      </div>
    </div>
  );
};

export default ReviewHeader;
