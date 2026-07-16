import React from "react";
import { getLayoutBlockEditValue } from "../../../Settings/components/tab/email/preview/emailTemplateLayoutContent";
import LayoutBlockStyleControls from "../../../Settings/components/tab/email/preview/LayoutBlockStyleControls";
import { getBlockStyle } from "../../../Settings/components/tab/email/preview/emailTemplateBlockStyles";

const LayoutBlockProperties = ({
  selectedElement,
  form,
  updateField,
  updateEmailLayoutBlock,
  updateEmailLayoutBlockStyle,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {selectedElement.label}
      </label>
      {selectedElement.inputType === "readonly" ? (
        <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
          This image is pulled automatically from the customer&apos;s order when the email is sent. You can adjust size and alignment below.
        </p>
      ) : selectedElement.inputType === "textarea" ? (
        <textarea
          value={getLayoutBlockEditValue(
            form,
            selectedElement.templateId,
            selectedElement.blockKey,
            selectedElement.formField
          )}
          onChange={(e) => {
            const value = e.target.value;
            if (selectedElement.formField) {
              updateField(selectedElement.formField, value);
            } else if (typeof updateEmailLayoutBlock === "function") {
              updateEmailLayoutBlock(
                selectedElement.templateId,
                selectedElement.blockKey,
                value
              );
            }
          }}
          className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-medium text-gray-900 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 min-h-[120px] leading-relaxed"
        />
      ) : (
        <input
          type="text"
          value={getLayoutBlockEditValue(
            form,
            selectedElement.templateId,
            selectedElement.blockKey,
            selectedElement.formField
          )}
          onChange={(e) => {
            const value = e.target.value;
            if (selectedElement.formField) {
              updateField(selectedElement.formField, value);
            } else if (typeof updateEmailLayoutBlock === "function") {
              updateEmailLayoutBlock(
                selectedElement.templateId,
                selectedElement.blockKey,
                value
              );
            }
          }}
          className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
      )}
      {selectedElement.inputType !== "readonly" && (
        <p className="mt-2 text-[11px] font-medium text-gray-400">
          Use {"{customer_name}"}, {"{product_name}"}, {"{site_name}"} as placeholders.
        </p>
      )}
    </div>
    <LayoutBlockStyleControls
      blockKey={selectedElement.blockKey}
      style={getBlockStyle(
        form,
        selectedElement.templateId,
        selectedElement.blockKey,
        form.primary_color || "#F59E0B"
      )}
      onChange={(styleKey, value) => {
        if (typeof updateEmailLayoutBlockStyle === "function") {
          updateEmailLayoutBlockStyle(
            selectedElement.templateId,
            selectedElement.blockKey,
            styleKey,
            value
          );
        }
      }}
      showStarColor={selectedElement.blockKey === "starsHint"}
      showButtonColors={selectedElement.blockKey === "buttonText"}
      showImageControls={selectedElement.blockKey === "productImage"}
    />
  </div>
);

export default LayoutBlockProperties;
