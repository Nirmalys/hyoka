const EmailPreviewShell = ({ subject, children, fontFamily }) => (
  <div className="space-y-4">
    {subject && (
      <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Subject line
        </p>
        <p className="text-[14px] font-semibold text-gray-900">{subject}</p>
      </div>
    )}

    <div className="rounded-lg border border-gray-200 bg-gray-100/60 p-4 sm:p-6">
      <div
        className="mx-auto max-w-[520px] bg-white shadow-sm overflow-hidden"
        style={{ fontFamily }}
      >
        <div className="px-6 sm:px-10 py-8 sm:py-10 text-center">{children}</div>
      </div>
    </div>
  </div>
);

export default EmailPreviewShell;
