import React from "react";
import { X, Send, Loader2, ChevronRight } from "lucide-react";
import ElementPropertiesPanel from "../properties/ElementPropertiesPanel";
import GlobalStyleProperties from "../properties/GlobalStyleProperties";
import WidgetLayoutTab from "../properties/WidgetLayoutTab";

const PropertiesSidebar = ({
  mode,
  widgetId,
  form,
  config,
  activeTab,
  setActiveTab,
  selectedElement,
  setSelectedElementId,
  headingFieldKey,
  subjectFieldKey,
  usesLayoutPreview,
  templateMeta,
  updateField,
  updateElement,
  updateEmailLayoutBlock,
  updateEmailLayoutBlockStyle,
  moveElement,
  duplicateElement,
  removeElement,
  hideSaveButton,
  runSave,
  savingContext,
}) => (
  <div className="w-80 bg-white border-r border-gray-100 flex flex-col shrink-0">
    {mode !== "widget" && (
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider truncate">
            {selectedElement ? selectedElement.label || "Element" : "Settings"}
          </h4>
          <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
            All customizations · live preview
          </p>
        </div>
        {selectedElement ? (
          <button
            onClick={() => setSelectedElementId(null)}
            className="mt-0.5 p-1.5 hover:bg-gray-50 rounded-md text-gray-400 transition-colors shrink-0"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <ChevronRight className="mt-1 w-4 h-4 text-gray-300 shrink-0" />
        )}
      </div>
    )}
    {mode === "widget" && (
      <div className="flex border-b border-gray-50">
        {["Style", "Layout"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all outline-none focus:outline-none ${
              activeTab === tab ? "text-gray-900 bg-gray-50" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    )}
    {mode === "widget" && selectedElement && (
      <button
        onClick={() => setSelectedElementId(null)}
        className="p-1.5 hover:bg-gray-50 rounded-md text-gray-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}

    <div className="flex-1 p-5 space-y-6 overflow-y-auto">
      {activeTab === "Style" && (
        <>
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
            <GlobalStyleProperties
              form={form}
              updateField={updateField}
              usesLayoutPreview={usesLayoutPreview}
              templateMeta={templateMeta}
              subjectFieldKey={subjectFieldKey}
              headingFieldKey={headingFieldKey}
              mode={mode}
            />
          )}
        </>
      )}

      {activeTab === "Layout" && (
        <WidgetLayoutTab mode={mode} widgetId={widgetId} form={form} updateField={updateField} />
      )}
    </div>

    {!hideSaveButton && (
      <div className="p-5 border-t border-gray-50 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button
          onClick={runSave}
          disabled={savingContext === "template" || savingContext === "submission_form"}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[13px] font-black shadow-xl shadow-gray-200 flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {savingContext === "template" || savingContext === "submission_form" ? (
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          ) : (
            <Send className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
          )}
          {config.saveLabel}
        </button>
      </div>
    )}
  </div>
);

export default PropertiesSidebar;
