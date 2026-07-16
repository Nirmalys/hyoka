import React from "react";
import ElementPropertiesHeader from "./shared/ElementPropertiesHeader";
import LayoutBlockProperties from "./panels/LayoutBlockProperties";
import EmailVirtualProperties from "./panels/EmailVirtualProperties";
import TextElementProperties from "./panels/TextElementProperties";
import LinkElementProperties from "./panels/LinkElementProperties";
import DividerElementProperties from "./panels/DividerElementProperties";
import SpacerElementProperties from "./panels/SpacerElementProperties";
import ButtonElementProperties from "./panels/ButtonElementProperties";
import ImageElementProperties from "./panels/ImageElementProperties";
import StarsElementProperties from "./panels/StarsElementProperties";
import VideoElementProperties from "./panels/VideoElementProperties";
import ReviewCardProperties from "./panels/ReviewCardProperties";
import WidgetHeaderProperties from "./panels/WidgetHeaderProperties";
import WidgetSubtitleProperties from "./panels/WidgetSubtitleProperties";
import SiteRatingProperties from "./panels/SiteRatingProperties";
import WidgetStarsProperties from "./panels/WidgetStarsProperties";
import { WidgetColorsTab } from "./WidgetEditorTabs";

const ElementPropertiesPanel = ({
  selectedElement,
  form,
  headingFieldKey,
  subjectFieldKey,
  updateField,
  updateElement,
  updateEmailLayoutBlock,
  updateEmailLayoutBlockStyle,
  moveElement,
  duplicateElement,
  removeElement,
}) => (
  <div className="space-y-5">
    <ElementPropertiesHeader
      selectedElement={selectedElement}
      onMoveUp={() => moveElement(selectedElement.id, "up")}
      onMoveDown={() => moveElement(selectedElement.id, "down")}
      onDuplicate={() => duplicateElement(selectedElement.id)}
      onRemove={() => removeElement(selectedElement.id)}
    />

    {selectedElement.type === "layoutBlock" && (
      <LayoutBlockProperties
        selectedElement={selectedElement}
        form={form}
        updateField={updateField}
        updateEmailLayoutBlock={updateEmailLayoutBlock}
        updateEmailLayoutBlockStyle={updateEmailLayoutBlockStyle}
      />
    )}

    <EmailVirtualProperties
      selectedElement={selectedElement}
      form={form}
      headingFieldKey={headingFieldKey}
      subjectFieldKey={subjectFieldKey}
      updateField={updateField}
    />

    {selectedElement.type === "text" && (
      <TextElementProperties selectedElement={selectedElement} updateElement={updateElement} />
    )}

    {selectedElement.type === "link" && (
      <LinkElementProperties selectedElement={selectedElement} form={form} updateElement={updateElement} />
    )}

    {selectedElement.type === "divider" && (
      <DividerElementProperties selectedElement={selectedElement} updateElement={updateElement} />
    )}

    {selectedElement.type === "spacer" && (
      <SpacerElementProperties selectedElement={selectedElement} updateElement={updateElement} />
    )}

    {selectedElement.type === "button" && (
      <ButtonElementProperties selectedElement={selectedElement} form={form} updateElement={updateElement} />
    )}

    {selectedElement.type === "image" && (
      <ImageElementProperties selectedElement={selectedElement} updateElement={updateElement} />
    )}

    {(selectedElement.type === "stars" || selectedElement.type === "rating") && (
      <StarsElementProperties selectedElement={selectedElement} form={form} updateElement={updateElement} />
    )}

    {selectedElement.type === "review-card" && (
      <ReviewCardProperties form={form} updateField={updateField} />
    )}

    {selectedElement.type === "video" && (
      <VideoElementProperties selectedElement={selectedElement} updateElement={updateElement} />
    )}

    {selectedElement.type === "widget-header" && (
      <WidgetHeaderProperties form={form} updateField={updateField} />
    )}

    {selectedElement.type === "widget-subtitle" && (
      <WidgetSubtitleProperties form={form} updateField={updateField} />
    )}

    {selectedElement.type === "site-rating" && (
      <SiteRatingProperties form={form} updateField={updateField} />
    )}

    {selectedElement.type === "widget-stars" && (
      <WidgetStarsProperties form={form} updateField={updateField} />
    )}

    {selectedElement.type === "widget-attributes" && (
      <WidgetColorsTab form={form} updateField={updateField} />
    )}
  </div>
);

export default ElementPropertiesPanel;
