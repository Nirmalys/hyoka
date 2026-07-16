import {
  Image as ImageIcon,
  Type,
  Video as VideoIcon,
  Plus,
  Minus,
  MoveVertical,
  Link2,
  Star,
} from "lucide-react";

export const TOOL_DEFS = {
  text: { icon: Type, label: "Text" },
  image: { icon: ImageIcon, label: "Image" },
  video: { icon: VideoIcon, label: "Video" },
  button: { icon: Plus, label: "Button" },
  divider: { icon: Minus, label: "Divider" },
  spacer: { icon: MoveVertical, label: "Spacer" },
  link: { icon: Link2, label: "Link" },
  stars: { icon: Star, label: "Stars" },
};

export const ELEMENT_TYPE_LABELS = {
  text: "Text",
  image: "Image",
  video: "Video",
  button: "Button",
  stars: "Star rating",
  rating: "Star rating",
  divider: "Divider",
  spacer: "Spacer",
  link: "Link",
};
