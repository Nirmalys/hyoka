import React from "react";

const VideoElementProperties = ({ selectedElement, updateElement }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        Video URL
      </label>
      <input
        type="text"
        value={selectedElement.url || ""}
        onChange={(e) => updateElement(selectedElement.id, "url", e.target.value)}
        placeholder="YouTube/Vimeo link or direct .mp4/.mov URL"
        className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 outline-none focus:border-gray-300"
      />
      <p className="mt-2 text-[11px] font-medium text-gray-400">
        Supported: YouTube, Vimeo, and direct video files (MP4/MOV/WebM).
      </p>
    </div>
  </div>
);

export default VideoElementProperties;
