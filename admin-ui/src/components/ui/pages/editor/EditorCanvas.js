import EmailTemplateEditorCanvas from "../Settings/components/tab/email/EmailTemplateEditorCanvas";
import SubmissionFormPreview from "./SubmissionFormPreview";
import WidgetStylePreview from "../Widgets/components/WidgetStylePreview";

/**
 * Single canvas for all editor targets: email templates, submission form, widgets.
 * Used by CommonEditor — do not mount separate preview components elsewhere.
 */
const EditorCanvas = ({
  mode,
  emailTemplateId,
  widgetId,
  form,
  previewFontStack,
  previewPrimaryHex,
  elements,
  removeElement,
  updateElement,
  selectedElementId,
  setSelectedElementId,
  updateEmailLayoutBlock,
  handleDrop,
  handleDropAtSlot,
  handleDragStart,
  handleDragEnd,
  onSlotHover,
  draggedType,
  draggedElementId,
  dropInsertIndex,
  setDropInsertIndex,
  previewDevice = "desktop",
}) => {
  if (mode === "email") {
    return (
      <EmailTemplateEditorCanvas
        emailTemplateId={emailTemplateId}
        form={form}
        previewFontStack={previewFontStack}
        previewPrimaryHex={previewPrimaryHex}
        selectedElementId={selectedElementId}
        setSelectedElementId={setSelectedElementId}
        elements={elements}
        removeElement={removeElement}
        updateElement={updateElement}
        handleDropAtSlot={handleDropAtSlot}
        handleDragStart={handleDragStart}
        draggedType={draggedType}
        draggedElementId={draggedElementId}
        updateEmailLayoutBlock={updateEmailLayoutBlock}
        onSlotHover={onSlotHover}
      />
    );
  }

  if (mode === "widget") {
    return (
      <WidgetStylePreview
        widgetId={widgetId}
        form={form}
        previewFontStack={previewFontStack}
        elements={elements}
        selectedElementId={selectedElementId}
        setSelectedElementId={setSelectedElementId}
        handleDrop={handleDrop}
        handleDragStart={handleDragStart}
        draggedType={draggedType}
        draggedElementId={draggedElementId}
        dropInsertIndex={dropInsertIndex}
        setDropInsertIndex={setDropInsertIndex}
        updateElement={updateElement}
        removeElement={removeElement}
        previewDevice={previewDevice}
      />
    );
  }

  if (mode === "form") {
    return (
      <SubmissionFormPreview
        form={form}
        elements={elements}
        removeElement={removeElement}
        updateElement={updateElement}
        selectedElementId={selectedElementId}
        setSelectedElementId={setSelectedElementId}
        handleDrop={handleDrop}
        handleDragStart={handleDragStart}
        draggedType={draggedType}
        draggedElementId={draggedElementId}
        dropInsertIndex={dropInsertIndex}
        setDropInsertIndex={setDropInsertIndex}
      />
    );
  }

  return null;
};

export default EditorCanvas;
