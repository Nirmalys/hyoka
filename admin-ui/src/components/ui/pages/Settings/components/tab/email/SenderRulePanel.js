const SenderRulePanel = ({ form, updateField }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Sender name
        </label>
        <input
          type="text"
          value={form.email_from_name || ""}
          onChange={(e) => updateField("email_from_name", e.target.value)}
          placeholder="Your store name"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[15px] font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Sender email address
        </label>
        <input
          type="email"
          value={form.email_from_address || ""}
          onChange={(e) => updateField("email_from_address", e.target.value)}
          placeholder="noreply@yourdomain.com"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[15px] font-medium text-gray-900 focus:border-orange-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default SenderRulePanel;
