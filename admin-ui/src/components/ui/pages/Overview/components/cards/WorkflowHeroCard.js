import { Link } from "react-router-dom";
import { Play, Power } from "lucide-react";

const WorkflowHeroCard = ({ manUrl }) => (
  <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-linear-to-br from-amber-50 to-amber-100/50 p-8">
    <div className="relative z-10 max-w-[62%]">
      <div className="text-[20px] font-bold text-gray-900">Configure the email workflows</div>
      <div className="mt-6 text-[15px] text-gray-600">
        You have <span className="font-bold">12 reviews</span> awaiting moderation and 4
        questions needing replies.
      </div>
      <div className="mt-9 flex flex-wrap items-center gap-2">
        <Link
          to="/request"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-[12px] font-bold text-white hover:bg-gray-800"
        >
          <Play className="h-3.5 w-3.5" />
          Send New Request
        </Link>
        <Link
          to="/settings?tab=automation"
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-[12px] font-bold text-black hover:bg-orange-600"
        >
          <Power className="h-3.5 w-3.5" />
          Automation: ACTIVE
        </Link>
      </div>
    </div>
    {manUrl && (
      <img
        src={manUrl}
        alt=""
        className="pointer-events-none absolute bottom-0 right-2 top-0 z-0 my-auto h-full max-h-52 w-auto origin-right scale-125 object-contain"
      />
    )}
  </div>
);

export default WorkflowHeroCard;
