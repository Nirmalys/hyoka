export const editorZoneClass = (selectedElementId, zoneId, editorMode) => {
  if (!editorMode) return "";
  return `cursor-pointer transition-all rounded-lg border-2 ${
    selectedElementId === zoneId
      ? "border-orange-500 border-dashed bg-orange-50/50"
      : "border-transparent hover:border-dashed hover:border-orange-200 hover:bg-orange-50/30"
  }`;
};

export const handleEditorSelect = (event, setSelectedElementId, zoneId) => {
  if (!setSelectedElementId) return;
  event.stopPropagation();
  setSelectedElementId(zoneId);
};
