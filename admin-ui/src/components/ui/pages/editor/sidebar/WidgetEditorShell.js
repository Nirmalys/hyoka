import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WidgetElementsSidebar, { ELEMENTS_WIDTH } from "./WidgetElementsSidebar";
import WidgetSettingsPanel from "./WidgetSettingsPanel";

const SETTINGS_WIDTH = 272;
const COLLAPSED_WIDTH = 28;

const ElementsHeader = () => (
  <div className="px-3 pt-4 pb-2 border-b border-gray-100 shrink-0">
    <div className="text-[13px] font-black text-gray-900 uppercase tracking-wide leading-none">Elements</div>
    <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">Drag onto canvas or click to edit.</div>
  </div>
);

const SettingsHeader = ({ onClose, visible }) => (
  <div
    className={`flex items-start border-b border-gray-100 shrink-0 transition-opacity duration-300 ${
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}
  >
    <div className="flex-1 min-w-0 px-3 pt-4 pb-2">
      <div className="text-[14px] font-black text-gray-900 uppercase tracking-wide leading-none">
        Widget Settings
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">All customizations · live preview</div>
    </div>
    <button
      type="button"
      onClick={onClose}
      title="Close widget settings"
      className="p-2 mr-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

const WidgetEditorShell = ({
  settingsOpen,
  onToggleSettings,
  activeCategory,
  onSelectCategory,
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
}) => (
  <div className="flex h-full shrink-0">
    <div className="flex flex-col border-r border-gray-200 bg-white shrink-0 h-full" style={{ width: ELEMENTS_WIDTH }}>
      <ElementsHeader />
      <WidgetElementsSidebar
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
        hideHeader
      />
    </div>

    <div
      className="widget-settings-panel relative h-full shrink-0 overflow-hidden border-r border-gray-200 bg-white"
      style={{ width: settingsOpen ? SETTINGS_WIDTH : COLLAPSED_WIDTH }}
    >
      <div className="flex flex-col h-full" style={{ width: SETTINGS_WIDTH }}>
        <SettingsHeader onClose={onToggleSettings} visible={settingsOpen} />
        <div
          className={`flex-1 min-h-0 transition-opacity duration-300 ${
            settingsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <WidgetSettingsPanel
            category={activeCategory}
            widgetId={widgetId}
            form={form}
            updateField={updateField}
            selectedElement={selectedElement}
            setSelectedElementId={setSelectedElementId}
            headingFieldKey={headingFieldKey}
            subjectFieldKey={subjectFieldKey}
            updateElement={updateElement}
            updateEmailLayoutBlock={updateEmailLayoutBlock}
            updateEmailLayoutBlockStyle={updateEmailLayoutBlockStyle}
            moveElement={moveElement}
            duplicateElement={duplicateElement}
            removeElement={removeElement}
            hideHeader
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleSettings}
        title={settingsOpen ? "Close widget settings" : "Open widget settings"}
        className={`absolute inset-y-0 right-0 w-7 flex flex-col items-center pt-2 bg-white z-10 transition-opacity duration-200 ${
          settingsOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <ChevronLeft className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  </div>
);

export default WidgetEditorShell;
