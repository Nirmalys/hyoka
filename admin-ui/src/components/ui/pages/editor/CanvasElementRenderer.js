import { Trash2 } from "lucide-react";
import TextElement from "./elements/TextElement";
import ImageElement from "./elements/ImageElement";
import VideoElement from "./elements/VideoElement";
import ButtonElement from "./elements/ButtonElement";
import DividerElement from "./elements/DividerElement";
import SpacerElement from "./elements/SpacerElement";
import LinkElement from "./elements/LinkElement";
import StarsElement from "./elements/StarsElement";

const CanvasElementRenderer = ({
  el,
  form,
  selectedElementId,
  setSelectedElementId,
  updateElement,
  removeElement,
  showRating = true,
  editorVariant = "default",
  onReorderDragStart,
}) => {
  const reorderDragProps = onReorderDragStart
    ? {
        draggable: true,
        onDragStart: (e) => {
          e.stopPropagation();
          onReorderDragStart(e);
        },
      }
    : {};
  const primary = form?.primary_color || "#F59E0B";
  const isSelected = el.id === selectedElementId;
  const selectionVariant = editorVariant === "email" ? "email" : "default";
  const isFormEditor = editorVariant === "form";
  const formTextAlign = el.textAlign || (isFormEditor ? "center" : "left");

  const wrap = (node) => (
    <div className="relative flex-1 min-w-0">
      {node}
      {isSelected && (
        <button
          type="button"
          data-editor-no-drag
          onClick={(e) => {
            e.stopPropagation();
            removeElement?.(el.id);
          }}
          className={`absolute -top-2 -right-2 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-all z-10 ${
            editorVariant === "email" ? "w-6 h-6" : "w-7 h-7 shadow-lg"
          }`}
          title="Remove"
        >
          <Trash2 className={editorVariant === "email" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </button>
      )}
    </div>
  );

  switch (el.type) {
    case "text":
      return wrap(
        <TextElement
          value={el.content}
          onChange={(val) => updateElement?.(el.id, "content", val)}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          reorderDragProps={reorderDragProps}
          textAlign={formTextAlign}
          fontSize={el.fontSize}
          color={el.color}
          fontWeight={el.fontWeight}
          fontStyle={el.fontStyle}
          lineHeight={el.lineHeight}
          letterSpacing={el.letterSpacing}
          textTransform={el.textTransform}
          textDecoration={el.textDecoration}
          backgroundColor={el.backgroundColor}
          paddingX={el.paddingX}
          paddingY={el.paddingY}
          selectionVariant={selectionVariant}
        />
      );
    case "image":
      return wrap(
        <ImageElement
          url={el.url}
          onUpload={(url) => updateElement(el.id, "url", url)}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          borderRadius={el.borderRadius}
          maxWidth={el.maxWidth}
          alignment={el.alignment}
          selectionVariant={selectionVariant}
        />
      );
    case "video":
      return wrap(
        <VideoElement
          url={el.url}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          onChangeUrl={(next) => updateElement(el.id, "url", next)}
          selectionVariant={selectionVariant}
          reorderDragProps={reorderDragProps}
        />
      );
    case "button": {
      return wrap(
        <ButtonElement
          text={el.text}
          color={primary}
          onChange={(val) => updateElement(el.id, "text", val)}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          reorderDragProps={reorderDragProps}
          fontSize={el.fontSize}
          backgroundColor={el.backgroundColor}
          textColor={el.textColor}
          textTransform={el.textTransform}
          fontWeight={el.fontWeight}
          borderRadius={el.borderRadius}
          padding={el.padding}
          fullWidth={el.fullWidth}
          centerAlign={isFormEditor}
          selectionVariant={selectionVariant}
        />
      );
    }
    case "divider":
      return wrap(
        <DividerElement
          color={el.color || primary}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          selectionVariant={selectionVariant}
        />
      );
    case "spacer":
      return wrap(
        <SpacerElement
          height={el.height || "24px"}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          selectionVariant={selectionVariant}
        />
      );
    case "link":
      return wrap(
        <LinkElement
          text={el.text}
          url={el.url}
          color={el.color || primary}
          fontSize={el.fontSize || "14px"}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          onChange={(val) => updateElement(el.id, "text", val)}
          selectionVariant={selectionVariant}
          reorderDragProps={reorderDragProps}
        />
      );
    case "stars":
    case "rating":
      return wrap(
        <StarsElement
          hintText={el.hintText}
          starColor={el.starColor || primary}
          starSize={el.starSize || "36px"}
          hintFontSize={el.hintFontSize || "13px"}
          hintColor={el.hintColor || "#4b5563"}
          textAlign={el.textAlign || "center"}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(el.id)}
          selectionVariant={selectionVariant}
        />
      );
    default:
      return null;
  }
};

export default CanvasElementRenderer;

