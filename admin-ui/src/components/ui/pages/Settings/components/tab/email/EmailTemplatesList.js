import { useMemo, useState } from "react";
import EmailTemplateCard from "./EmailTemplateCard";
import EmailTemplatePreviewModal from "./EmailTemplatePreviewModal";
import { EMAIL_TEMPLATE_SECTIONS, getTemplateEditorMeta } from "./emailTemplatesConfig";
import { EMAIL_TEMPLATE_BANNERS } from "../../../../../../../assets/emailTemplateBanners";

const EmailTemplatesList = ({
  form,
  onEditTemplate,
  onToggleTemplate,
  previewFontStack,
  previewPrimaryHex,
  emailTemplatesDirty,
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = useMemo(() => {
    if (!activeTemplateId) return null;
    for (const section of EMAIL_TEMPLATE_SECTIONS) {
      const found = section.items.find(
        (item) => (item.editorId || item.id) === activeTemplateId
      );
      if (found) return { item: found, section };
    }
    return null;
  }, [activeTemplateId]);

  const activeMeta = activeTemplateId ? getTemplateEditorMeta(activeTemplateId) : null;

  const openPreview = (item) => {
    setActiveTemplateId(item.editorId || item.id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleEdit = () => {
    if (activeTemplateId) {
      closeDrawer();
      onEditTemplate(activeTemplateId);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      {EMAIL_TEMPLATE_SECTIONS.map((section) => (
        <section
          key={section.id}
          aria-label={section.title}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 pt-5 pb-6"
        >
          <div className="mb-5">
            <div className="text-[16px] font-bold text-gray-900 leading-tight">{section.title}</div>
            {section.description && (
              <div className="text-[13px] text-gray-500 leading-tight mt-1.5">
                {section.description}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full items-start">
            {section.items.map((item) => {
              const editorId = item.editorId || item.id;
              const toggleDisabled =
                !!item.requiresAdminNotifications && !form.admin_notifications_enabled;

              return (
                <EmailTemplateCard
                  key={item.id}
                  item={item}
                  form={form}
                  banner={EMAIL_TEMPLATE_BANNERS[item.id]}
                  selected={drawerOpen && activeTemplateId === editorId}
                  onOpenEditor={(tpl) => onEditTemplate(tpl.editorId || tpl.id)}
                  onPreview={openPreview}
                  onToggle={onToggleTemplate}
                  toggleDisabled={toggleDisabled}
                />
              );
            })}
          </div>
        </section>
      ))}

      {activeMeta && activeItem && (
        <EmailTemplatePreviewModal
          isOpen={drawerOpen}
          onClose={closeDrawer}
          onEdit={handleEdit}
          title={activeMeta.title}
          description={
            activeItem.item.subtitle ||
            activeItem.item.description ||
            activeItem.section.description
          }
          form={form}
          templateId={activeTemplateId}
          previewFontStack={previewFontStack}
          previewPrimaryHex={previewPrimaryHex}
        />
      )}
    </div>
  );
};

export default EmailTemplatesList;
