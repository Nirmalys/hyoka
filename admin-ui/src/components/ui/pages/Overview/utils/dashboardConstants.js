import {
  Star,
  Send,
  Video,
  Reply,
  MessageCircleQuestion,
  Upload,
} from "lucide-react";

export const DATE_RANGES = ["7 Days", "30 Days", "90 Days"];

export const ACTIVITY_META = {
  review: { dot: "bg-orange-400", icon: Star },
  video: { dot: "bg-gray-900", icon: Video },
  send: { dot: "bg-emerald-400", icon: Send },
  reply: { dot: "bg-gray-900", icon: Reply },
  question: { dot: "bg-orange-400", icon: MessageCircleQuestion },
  import: { dot: "bg-orange-400", icon: Upload },
};
