import {
  Settings,
  LayoutGrid,
  Palette,
  Type,
  Eye,
  FileText,
  Search,
  Image,
  Shield,
  SlidersHorizontal,
} from "lucide-react";

export const WIDGET_DISPLAY_NAMES = {
  "product-review": "Product Review Widget",
  "video-carousel": "Video Carousel",
  "card-carousel": "Card Carousel",
  "testimonials-carousel": "Testimonials Carousel",
  "site-rating": "Overall Site Rating",
};

export const WIDGET_EDITOR_CATEGORIES = [
  { id: "general", label: "General", icon: Settings },
  { id: "layout", label: "Layout", icon: LayoutGrid },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "display", label: "Display", icon: Eye },
  { id: "content", label: "Content", icon: FileText },
  { id: "search", label: "Search", icon: Search },
  { id: "media", label: "Media", icon: Image },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "advanced", label: "Advanced", icon: SlidersHorizontal },
];
