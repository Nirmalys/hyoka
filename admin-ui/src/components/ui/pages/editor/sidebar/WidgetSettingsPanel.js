import React from "react";
import { X } from "lucide-react";
import ElementPropertiesPanel from "../properties/ElementPropertiesPanel";
import WidgetLayoutTab from "../properties/WidgetLayoutTab";
import SiteRatingProperties from "../properties/panels/SiteRatingProperties";
import {
  WidgetGeneralTab,
  WidgetColorsTab,
  WidgetTypographyTab,
  WidgetDisplayTab,
  WidgetContentTab,
  WidgetSearchTab,
  WidgetMediaTab,
  WidgetPrivacyTab,
  WidgetAdvancedTab,
} from "../properties/WidgetEditorTabs";
import { WIDGET_EDITOR_CATEGORIES } from "../widgetEditorConfig";

const WidgetSettingsPanel = ({
  category,
  widgetId,
  form,
  updateField,
  selectedElement,
  setSelectedElementId,
  headingFieldKey,
  subjectFieldKey,
  updateElement,
  updateEmailLayoutBlock,
  updateEmailLayoutBlockStyle,
  moveElement,
  duplicateElement,
  removeElement,
  hideHeader = false,
}) => {
  const activeCategory = WIDGET_EDITOR_CATEGORIES.find((c) => c.id === category);

  const renderCategoryPanel = () => {
    if (selectedElement) return null;

    switch (category) {
      case "general":
        return <WidgetGeneralTab form={form} updateField={updateField} />;
      case "layout":
        return <WidgetLayoutTab mode="widget" widgetId={widgetId} form={form} updateField={updateField} />;
      case "colors":
        return <WidgetColorsTab form={form} updateField={updateField} />;
      case "typography":
        return <WidgetTypographyTab form={form} updateField={updateField} />;
      case "display":
        return <WidgetDisplayTab form={form} updateField={updateField} widgetId={widgetId} />;
      case "content":
        return <WidgetContentTab form={form} updateField={updateField} />;
      case "search":
        return <WidgetSearchTab form={form} updateField={updateField} />;
      case "media":
        return <WidgetMediaTab form={form} updateField={updateField} />;
      case "privacy":
        return <WidgetPrivacyTab form={form} updateField={updateField} />;
      case "advanced":
        return (
          <div className="space-y-4">
            <WidgetAdvancedTab widgetId={widgetId} />
            {widgetId === "site-rating" && (
              <SiteRatingProperties form={form} updateField={updateField} />
            )}
          </div>
        );
      default:
        return <WidgetGeneralTab form={form} updateField={updateField} />;
    }
  };

  return (
    <div className={`${hideHeader ? "flex-1 flex flex-col min-h-0" : "w-[272px] bg-white border-r border-gray-200 flex flex-col shrink-0"}`}>
      {!hideHeader && (
        <div className="px-3 pt-4 pb-2 border-b border-gray-100">
          <div className="text-[13px] font-black text-gray-900 uppercase tracking-wide leading-none">
            Widget Settings
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">All customizations · live preview</div>
        </div>
      )}

      {selectedElement && (
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-[#FFFBF0]">
          <span className="text-[12px] font-bold text-gray-800 truncate">
            Editing: {selectedElement.label}
          </span>
          <button
            type="button"
            onClick={() => setSelectedElementId(null)}
            className="p-1 hover:bg-white rounded-md text-gray-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 p-3 overflow-y-auto">
        {selectedElement ? (
          <ElementPropertiesPanel
            selectedElement={selectedElement}
            form={form}
            headingFieldKey={headingFieldKey}
            subjectFieldKey={subjectFieldKey}
            updateField={updateField}
            updateElement={updateElement}
            updateEmailLayoutBlock={updateEmailLayoutBlock}
            updateEmailLayoutBlockStyle={updateEmailLayoutBlockStyle}
            moveElement={moveElement}
            duplicateElement={duplicateElement}
            removeElement={removeElement}
          />
        ) : (
          <>
            {activeCategory && (() => {
              const CategoryIcon = activeCategory.icon;
              return (
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 shrink-0">
                    {CategoryIcon && (
                      <CategoryIcon className="w-4 h-4 text-[#F59E0B]" strokeWidth={2.2} />
                    )}
                  </span>
                  <div className="text-[13px] font-black text-gray-900 uppercase tracking-wide leading-none">
                    {activeCategory.label}
                  </div>
                </div>
              );
            })()}
            {renderCategoryPanel()}
          </>
        )}
      </div>
    </div>
  );
};

export default WidgetSettingsPanel;
