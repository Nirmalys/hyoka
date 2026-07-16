import { Video as VideoIcon } from "lucide-react";
import {
  getEditorBorderBase,
  getElementShellClassRounded,
} from "../elementSelectionStyles";

const normalizeUrl = (value) => {
  if (!value) return "";
  const v = String(value).trim();
  if (!v) return "";
  // allow protocol-relative? normalize to https
  if (v.startsWith("//")) return `https:${v}`;
  return v;
};

const safeParseUrl = (value) => {
  const v = normalizeUrl(value);
  if (!v) return null;
  try {
    // support bare domains like "youtube.com/watch?v=..."
    const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    return new URL(withProto);
  } catch {
    return null;
  }
};

const detectEmbed = (value) => {
  const u = safeParseUrl(value);
  if (!u) return { type: "unknown", embedUrl: null };

  const host = u.hostname.replace(/^www\./i, "").toLowerCase();
  const path = u.pathname || "/";

  // YouTube
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be"
  ) {
    let id = "";
    if (host === "youtu.be") {
      id = path.split("/").filter(Boolean)[0] || "";
    } else if (path.startsWith("/watch")) {
      id = u.searchParams.get("v") || "";
    } else if (path.startsWith("/embed/")) {
      id = path.split("/embed/")[1]?.split("/")[0] || "";
    } else if (path.startsWith("/shorts/")) {
      id = path.split("/shorts/")[1]?.split("/")[0] || "";
    } else if (path.startsWith("/live/")) {
      id = path.split("/live/")[1]?.split("/")[0] || "";
    }

    if (id) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
      };
    }
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = path.split("/").filter(Boolean);
    let id = "";
    if (host === "player.vimeo.com") {
      // /video/<id>
      const videoIdx = parts.indexOf("video");
      id = (videoIdx >= 0 ? parts[videoIdx + 1] : parts[0]) || "";
    } else {
      // /<id> or /channels/<channel>/<id> etc -> grab last numeric part
      const numeric = parts.filter((p) => /^\d+$/.test(p));
      id = numeric[numeric.length - 1] || "";
    }

    if (id) {
      return {
        type: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(id)}`,
      };
    }
  }

  return { type: "unknown", embedUrl: null };
};

const isVideoFileUrl = (value) => {
  const v = normalizeUrl(value);
  if (!v) return false;
  // allow querystrings after extension
  return /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(v);
};

const VideoElement = ({
  url,
  isSelected,
  onSelect,
  onChangeUrl,
  selectionVariant = "default",
  reorderDragProps = {},
}) => {
  const normalized = normalizeUrl(url);
  const embed = detectEmbed(normalized);
  const idleClass =
    selectionVariant === "email"
      ? "border-0 bg-transparent"
      : "border-dashed border-gray-100 bg-gray-50/30 hover:bg-orange-50/50 hover:border-orange-200";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect();
      }}
      className={`group relative transition-all rounded-lg p-1 flex flex-col items-center justify-center gap-3 ${
        selectionVariant === "email"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer"
      } ${getEditorBorderBase(
        selectionVariant
      )} ${isSelected ? getElementShellClassRounded(true, selectionVariant) : idleClass}`}
    >
      <div
        className={
          url
            ? "hidden group-hover:flex absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex-col items-center justify-center gap-2 transition-all duration-300"
            : "flex flex-col items-center justify-center gap-3"
        }
      >
        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
          <VideoIcon className="w-6 h-6 text-orange-500" />
        </div>
        <div className="text-center">
          <p className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-1">
            {url ? "Change Video" : "Add Video"}
          </p>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
            Paste YouTube/Vimeo link or use MP4/MOV
          </p>
        </div>
      </div>

      {url && (
        <div className="w-full relative rounded-md overflow-hidden bg-black shadow-inner aspect-video">
          {embed.embedUrl ? (
            <iframe
              src={embed.embedUrl}
              title={embed.type === "youtube" ? "YouTube video" : "Vimeo video"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              src={normalized}
              controls
              className="w-full h-full object-contain"
            />
          )}
        </div>
      )}

      {isSelected && (
        <div className="w-full">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Video URL (YouTube/Vimeo or direct file)
          </label>
          <input
            {...reorderDragProps}
            type="text"
            value={normalized}
            onChange={(e) => onChangeUrl?.(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            className={`w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300 ${
              reorderDragProps.draggable ? "cursor-grab active:cursor-grabbing" : ""
            }`}
          />
          {normalized && !embed.embedUrl && !isVideoFileUrl(normalized) && (
            <p className="mt-2 text-[11px] font-medium text-gray-400">
              Tip: For self-hosted videos, use a direct file URL ending in .mp4, .mov, .webm, etc.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoElement;

