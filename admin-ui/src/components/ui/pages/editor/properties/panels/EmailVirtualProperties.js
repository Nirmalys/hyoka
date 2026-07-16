import React from "react";

const EmailVirtualProperties = ({ selectedElement, form, headingFieldKey, subjectFieldKey, updateField }) => {
  if (selectedElement.id === "__heading" && headingFieldKey) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Header Text
          </label>
          <input
            type="text"
            value={form[headingFieldKey] || ""}
            onChange={(e) => updateField(headingFieldKey, e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300"
          />
        </div>
      </div>
    );
  }

  if (selectedElement.id === "__subject" && subjectFieldKey) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Email Subject
          </label>
          <input
            type="text"
            value={form[subjectFieldKey] || ""}
            onChange={(e) => updateField(subjectFieldKey, e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300"
          />
        </div>
      </div>
    );
  }

  if (selectedElement.id === "__greeting") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Greeting Content
          </label>
          <textarea
            value={form.body || ""}
            onChange={(e) => updateField("body", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-100 bg-white text-[13px] font-bold text-gray-900 shadow-sm outline-none focus:border-gray-300 min-h-[80px]"
          />
        </div>
      </div>
    );
  }

  return null;
};

export default EmailVirtualProperties;
