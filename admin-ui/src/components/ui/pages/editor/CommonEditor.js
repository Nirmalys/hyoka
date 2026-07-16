import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { EDITOR_MODES, previewFontStack } from "./editorConfig";
import { useEditor } from "./EditorContext";
import { getTemplateEditorMeta } from "../Settings/components/tab/email/emailTemplatesConfig";
import { getBlockFormField } from "../Settings/components/tab/email/preview/emailTemplateLayoutContent";
import {
  getLayoutBlockDef,
  parseLayoutBlockSelectionId,
} from "../Settings/components/tab/email/preview/emailTemplateLayoutDefaults";
import {
  getTemplateAnchors,
  mergeElementsBySlot,
  normalizeInsertAnchor,
  normalizeLayoutExtras,
} from "../Settings/components/tab/email/preview/emailTemplateElementSlots";

import EditorHeader from "./EditorHeader";
import EditorCanvas from "./EditorCanvas";
import BuildingBlocksSidebar from "./sidebar/BuildingBlocksSidebar";
import EmailCategorySidebar from "./sidebar/EmailCategorySidebar";
import TemplateSettingsPanel from "./sidebar/TemplateSettingsPanel";
import WidgetElementsSidebar from "./sidebar/WidgetElementsSidebar";
import WidgetSettingsPanel from "./sidebar/WidgetSettingsPanel";
import WidgetEditorShell from "./sidebar/WidgetEditorShell";
import CanvasWorkspace from "./sidebar/CanvasWorkspace";
import PropertiesSidebar from "./sidebar/PropertiesSidebar";
import useEditorHistory from "./hooks/useEditorHistory";

export { DropZone } from "./DropZone";

const CommonEditor = ({
  mode,
  widgetId,
  form,
  updateField,
  handleSaveTemplate,
  handlePublishTemplate,
  savingContext,
  widgetPublished = false,
  onBack,
  onPreview,
  hideSaveButton = false,
  formDirty = true,
  emailTemplateId = "store_review_fallback",
  stylingNotice = "",
  updateEmailLayoutBlock,
  updateEmailLayoutBlockStyle,
  updateEmailTemplateExtras,
  previewFontStack: previewFontStackProp,
  previewPrimaryHex,
}) => {
  const [draggedType, setDraggedType] = useState(null);
  const [draggedElementId, setDraggedElementId] = useState(null);
  const [dropInsertIndex, setDropInsertIndex] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [activeTab, setActiveTab] = useState("Style");
  const [widgetCategory, setWidgetCategory] = useState("content");
  const [emailCategory, setEmailCategory] = useState("general");
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(true);
  const dragPayloadRef = useRef({ type: null, id: null });
  const preferredSlotRef = useRef("after_intro");

  const { setIsEditorActive, setEditorTitle } = useEditor();
  const { canUndo, canRedo, undo, redo } = useEditorHistory(form, updateField);

  const templateMeta = useMemo(
    () => (mode === "email" ? getTemplateEditorMeta(emailTemplateId) : null),
    [mode, emailTemplateId]
  );
  const subjectFieldKey = templateMeta?.subjectKey || "subject";
  const headingFieldKey = templateMeta?.headingKey || "email_heading";
  const usesLayoutPreview = mode === "email" && Boolean(templateMeta?.layoutPreview);
  const hideBuildingBlocks = Boolean(templateMeta?.stylingOnly);
  const usesLayoutEmailEditor =
    mode === "email" && usesLayoutPreview && !templateMeta?.stylingOnly;
  const usesCenteredCanvas = usesLayoutPreview || mode === "widget";

  useEffect(() => {
    setIsEditorActive(true);
    const title =
      mode === "widget"
        ? form?.widget_title || form?.form_title || "Untitled Widget"
        : mode === "email"
          ? templateMeta?.title || "Email Template"
          : "Submission Form";
    setEditorTitle(title);
    return () => setIsEditorActive(false);
  }, [
    setIsEditorActive,
    setEditorTitle,
    form?.widget_title,
    form?.form_title,
    mode,
    templateMeta?.title,
  ]);

  useEffect(() => {
    if (mode === "email" && templateMeta?.stylingOnly) {
      setActiveTab("Style");
    }
  }, [mode, templateMeta?.stylingOnly, emailTemplateId]);

  useEffect(() => {
    setSelectedElementId(null);
    const order = getTemplateAnchors(emailTemplateId);
    preferredSlotRef.current = order[0] || "start";
  }, [emailTemplateId]);

  useEffect(() => {
    if (selectedElementId && activeTab === "Content") {
      setActiveTab("Style");
    }
    if (selectedElementId && mode === "widget") {
      setWidgetCategory("content");
    }
  }, [selectedElementId, activeTab, mode]);

  const config = EDITOR_MODES[mode] || EDITOR_MODES.email;
  const elementsKey = config.elementsKey;
  const elements = useMemo(() => {
    if (usesLayoutEmailEditor) {
      return form?.email_layouts?.[emailTemplateId]?._extras || [];
    }
    return form[elementsKey] || [];
  }, [usesLayoutEmailEditor, form, emailTemplateId, elementsKey]);

  const patchElements = useCallback(
    (updater) => {
      if (usesLayoutEmailEditor && typeof updateEmailTemplateExtras === "function") {
        updateEmailTemplateExtras(emailTemplateId, (current) => {
          const next = typeof updater === "function" ? updater(current) : updater;
          const list = normalizeLayoutExtras(
            Array.isArray(next) ? next : [],
            emailTemplateId
          );
          return mergeElementsBySlot(list, emailTemplateId);
        });
      } else {
        updateField(elementsKey, updater);
      }
    },
    [usesLayoutEmailEditor, updateEmailTemplateExtras, emailTemplateId, updateField, elementsKey]
  );

  const canvasFont = previewFontStackProp || previewFontStack(form.font_family);

  const runSave = useCallback(() => {
    if (typeof handleSaveTemplate !== "function") return;
    if (mode === "email") {
      handleSaveTemplate(emailTemplateId);
    } else if (mode === "widget") {
      handleSaveTemplate(widgetId);
    } else {
      handleSaveTemplate();
    }
  }, [handleSaveTemplate, mode, emailTemplateId, widgetId]);

  const runPublish = useCallback(() => {
    if (typeof handlePublishTemplate !== "function") return;
    handlePublishTemplate(widgetId);
  }, [handlePublishTemplate, widgetId]);

  const createElement = useCallback(
    (type, insertAfter = "end") => {
      const id = Math.random().toString(36).substr(2, 9);
      const primary = form.primary_color || "#F59E0B";
      const base = { id, type, insertAfter };
      switch (type) {
        case "text":
          return {
            ...base,
            content: "New Text Block",
            fontSize: "14px",
            textAlign: mode === "form" ? "center" : "left",
            fontWeight: "400",
            color: "#1D2939",
          };
        case "button":
          return { ...base, text: "Click Me", url: "", fontSize: "15px" };
        case "image":
          return { ...base, url: "" };
        case "video":
          return { ...base, url: "" };
        case "divider":
          return { ...base, color: form.border_color || "#EAECF0" };
        case "spacer":
          return { ...base, height: "24px" };
        case "link":
          return { ...base, text: "Learn more", url: "#", fontSize: "14px", color: primary };
        case "stars":
          return {
            ...base,
            hintText: "Click a star to leave a review",
            starColor: primary,
            starSize: "36px",
            hintFontSize: "13px",
            hintColor: "#4b5563",
            textAlign: "center",
          };
        default:
          return { ...base, content: "", textAlign: "left" };
      }
    },
    [form.primary_color, form.border_color, mode]
  );

  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    const layoutSelection = parseLayoutBlockSelectionId(selectedElementId);
    if (layoutSelection) {
      const { templateId, blockKey } = layoutSelection;
      const def = getLayoutBlockDef(blockKey);
      const formField = getBlockFormField(templateId, blockKey);
      return {
        id: selectedElementId,
        type: "layoutBlock",
        label: def.label,
        templateId,
        blockKey,
        formField,
        inputType: def.inputType,
      };
    }
    if (selectedElementId === "__heading") return { id: "__heading", type: "heading", label: "Email Header" };
    if (selectedElementId === "__subject") return { id: "__subject", type: "subject", label: "Email Subject" };
    if (selectedElementId === "__greeting") return { id: "__greeting", type: "greeting", label: "Greeting Text" };
    if (selectedElementId === "widget-header") return { id: "widget-header", type: "widget-header", label: "Widget Title" };
    if (selectedElementId === "widget-subtitle") return { id: "widget-subtitle", type: "widget-subtitle", label: "Widget Subtitle" };
    if (selectedElementId === "site-rating") return { id: "site-rating", type: "site-rating", label: "Site Rating" };
    if (selectedElementId === "widget-stars") return { id: "widget-stars", type: "widget-stars", label: "Star Rating" };
    if (selectedElementId === "widget-attributes") return { id: "widget-attributes", type: "widget-attributes", label: "Category Badges" };
    if (String(selectedElementId).startsWith("review-")) {
      return { id: selectedElementId, type: "review-card", label: "Review Card" };
    }
    return elements.find((el) => el.id === selectedElementId) || null;
  }, [elements, selectedElementId, form]);

  const handleDragEnd = () => {
    dragPayloadRef.current = { type: null, id: null };
    setDraggedType(null);
    setDraggedElementId(null);
    setDropInsertIndex(null);
  };

  const handleDragStart = (e, type, id = null) => {
    dragPayloadRef.current = { type, id: id || null };
    setDraggedType(type);
    setDraggedElementId(id || null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.setData("elementType", type);
    e.dataTransfer.setData("draggedId", id ? String(id) : "");
  };

  const handleSlotHover = useCallback((slotId) => {
    if (slotId) preferredSlotRef.current = slotId;
  }, []);

  const resolveInsertSlot = useCallback(() => {
    const order = getTemplateAnchors(emailTemplateId);
    const preferred = normalizeInsertAnchor(emailTemplateId, preferredSlotRef.current);
    if (order.includes(preferred)) return preferred;
    return order[0] || "end";
  }, [emailTemplateId]);

  const insertElementAt = useCallback(
    (type, index = null, slotId = null) => {
      const targetSlot = slotId || (usesLayoutEmailEditor ? resolveInsertSlot() : "end");
      const newElement = createElement(type, usesLayoutEmailEditor ? targetSlot : "end");
      patchElements((currentElements) => {
        const list = Array.isArray(currentElements) ? [...currentElements] : [];
        if (usesLayoutEmailEditor) {
          const slot = normalizeInsertAnchor(emailTemplateId, newElement.insertAfter || targetSlot);
          const slotKey = (el) => normalizeInsertAnchor(emailTemplateId, el.insertAfter || "end");
          const inSlot = list.filter((el) => slotKey(el) === slot);
          const other = list.filter((el) => slotKey(el) !== slot);
          const targetIndex = typeof index === "number" ? index : inSlot.length;
          inSlot.splice(targetIndex, 0, newElement);
          return mergeElementsBySlot([...other, ...inSlot], emailTemplateId);
        }
        const targetIndex = typeof index === "number" ? index : list.length;
        list.splice(targetIndex, 0, newElement);
        return list;
      });
      if (!usesLayoutEmailEditor) {
        setSelectedElementId(newElement.id);
      } else {
        setSelectedElementId(null);
      }
      setDropInsertIndex(null);
      setDraggedType(null);
    },
    [createElement, patchElements, usesLayoutEmailEditor, emailTemplateId, resolveInsertSlot]
  );

  const handleDropAtSlot = (e, slotId, index = null) => {
    e.preventDefault();
    e.stopPropagation();

    const anchor = normalizeInsertAnchor(emailTemplateId, slotId);
    const slotKey = (el) => normalizeInsertAnchor(emailTemplateId, el.insertAfter || "end");

    const type =
      e.dataTransfer.getData("elementType") ||
      e.dataTransfer.getData("text/plain") ||
      dragPayloadRef.current.type;
    const draggedId = e.dataTransfer.getData("draggedId") || dragPayloadRef.current.id;

    if (!type) {
      handleDragEnd();
      return;
    }

    if (draggedId) {
      patchElements((currentElements) => {
        const list = Array.isArray(currentElements) ? [...currentElements] : [];
        const fromIndex = list.findIndex((el) => el.id === draggedId);
        if (fromIndex < 0) return list;

        const moving = list[fromIndex];
        const fromAnchor = slotKey(moving);
        const inSlotBefore = list.filter((el) => slotKey(el) === anchor);
        const fromSlotIndex = inSlotBefore.findIndex((el) => el.id === draggedId);

        list.splice(fromIndex, 1);

        const inSlot = list.filter((el) => slotKey(el) === anchor);
        const other = list.filter((el) => slotKey(el) !== anchor);
        let targetIndex = typeof index === "number" ? index : inSlot.length;

        if (fromAnchor === anchor && fromSlotIndex >= 0 && fromSlotIndex < targetIndex) {
          targetIndex -= 1;
        }

        const elementToMove = { ...moving, insertAfter: anchor };
        inSlot.splice(targetIndex, 0, elementToMove);
        return mergeElementsBySlot([...other, ...inSlot], emailTemplateId);
      });
      setSelectedElementId(draggedId);
    } else {
      const newElement = createElement(type, anchor);
      patchElements((currentElements) => {
        const list = Array.isArray(currentElements) ? [...currentElements] : [];
        const inSlot = list.filter((el) => slotKey(el) === anchor);
        const other = list.filter((el) => slotKey(el) !== anchor);
        const targetIndex = typeof index === "number" ? index : inSlot.length;
        inSlot.splice(targetIndex, 0, newElement);
        return mergeElementsBySlot([...other, ...inSlot], emailTemplateId);
      });
      setSelectedElementId(null);
    }
    handleDragEnd();
  };

  const handleDrop = (e, index = null) => {
    e.preventDefault();
    e.stopPropagation();

    const type =
      e.dataTransfer.getData("elementType") ||
      e.dataTransfer.getData("text/plain") ||
      dragPayloadRef.current.type;
    const draggedId = e.dataTransfer.getData("draggedId") || dragPayloadRef.current.id;

    if (!type) {
      handleDragEnd();
      return;
    }

    const targetIndex = typeof index === "number" ? index : elements.length;

    if (draggedId) {
      patchElements((currentElements) => {
        const list = Array.isArray(currentElements) ? [...currentElements] : [];
        const fromIndex = list.findIndex((el) => el.id === draggedId);
        if (fromIndex < 0) return list;
        const elementToMove = list[fromIndex];
        list.splice(fromIndex, 1);
        const finalIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
        list.splice(finalIndex, 0, elementToMove);
        return list;
      });
      setSelectedElementId(draggedId);
    } else {
      const newElement = createElement(type);
      patchElements((currentElements) => {
        const list = Array.isArray(currentElements) ? [...currentElements] : [];
        list.splice(targetIndex, 0, newElement);
        return list;
      });
      setSelectedElementId(newElement.id);
    }
    handleDragEnd();
  };

  const removeElement = (id) => {
    if (selectedElementId === id) setSelectedElementId(null);
    patchElements((list) => (Array.isArray(list) ? list : []).filter((el) => el.id !== id));
  };

  const updateElement = (id, field, value) => {
    patchElements((list) =>
      (Array.isArray(list) ? list : []).map((el) => (el.id === id ? { ...el, [field]: value } : el))
    );
  };

  const duplicateElement = (id) => {
    patchElements((list) => {
      const arr = Array.isArray(list) ? [...list] : [];
      const idx = arr.findIndex((el) => el.id === id);
      if (idx < 0) return arr;
      const copy = { ...arr[idx], id: Math.random().toString(36).substr(2, 9) };
      arr.splice(idx + 1, 0, copy);
      setSelectedElementId(copy.id);
      return arr;
    });
  };

  const moveElement = (id, direction) => {
    patchElements((list) => {
      const arr = Array.isArray(list) ? [...list] : [];
      const idx = arr.findIndex((el) => el.id === id);
      if (idx < 0) return arr;
      const next = direction === "up" ? idx - 1 : idx + 1;
      if (next < 0 || next >= arr.length) return arr;
      const [item] = arr.splice(idx, 1);
      arr.splice(next, 0, item);
      return arr;
    });
  };

  const canvas = (
    <EditorCanvas
      mode={mode}
      emailTemplateId={emailTemplateId}
      widgetId={widgetId}
      form={form}
      previewFontStack={canvasFont}
      previewPrimaryHex={previewPrimaryHex}
      elements={elements}
      removeElement={removeElement}
      updateElement={updateElement}
      selectedElementId={selectedElementId}
      setSelectedElementId={setSelectedElementId}
      updateEmailLayoutBlock={updateEmailLayoutBlock}
      handleDrop={handleDrop}
      handleDropAtSlot={handleDropAtSlot}
      handleDragStart={handleDragStart}
      handleDragEnd={handleDragEnd}
      onSlotHover={handleSlotHover}
      draggedType={draggedType}
      draggedElementId={draggedElementId}
      dropInsertIndex={dropInsertIndex}
      setDropInsertIndex={setDropInsertIndex}
      previewDevice={previewDevice}
    />
  );

  const editorTitle =
    mode === "widget"
      ? form?.widget_title || form?.form_title || "Untitled Widget"
      : mode === "email"
        ? templateMeta?.title || "Email Template"
        : "Submission Form";

  return (
    <div className="h-full min-h-0 w-full flex flex-col bg-[#F9FAFB]">
      <EditorHeader
        title={editorTitle}
        widgetId={widgetId}
        onBack={onBack || (() => window.history.back())}
        onSave={runSave}
        onPublish={mode === "widget" ? runPublish : undefined}
        onPreview={mode === "widget" ? onPreview : undefined}
        widgetPublished={widgetPublished}
        saving={savingContext === "save" || savingContext === "template" || savingContext === "submission_form"}
        publishing={savingContext === "publish"}
        device={previewDevice}
        setDevice={setPreviewDevice}
        mode={mode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        showSaveButton={mode === "widget" ? false : mode !== "form" || formDirty}
      />

      {(stylingNotice || templateMeta?.notice) && (
        <div className="px-6 py-2.5 bg-orange-50 border-b border-orange-100 text-[13px] font-medium text-orange-900">
          {stylingNotice || templateMeta.notice}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {mode === "widget" ? (
          <>
            <WidgetEditorShell
              settingsOpen={settingsSidebarOpen}
              onToggleSettings={() => setSettingsSidebarOpen((v) => !v)}
              activeCategory={widgetCategory}
              onSelectCategory={setWidgetCategory}
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
            />
            <CanvasWorkspace
              mode={mode}
              usesLayoutPreview={usesLayoutPreview}
              usesCenteredCanvas={usesCenteredCanvas}
              previewDevice={previewDevice}
              canvasFont={canvasFont}
              canvas={canvas}
              elements={elements}
              draggedType={draggedType}
              onClearSelection={() => setSelectedElementId(null)}
            />
          </>
        ) : mode === "email" ? (
          <>
            <EmailCategorySidebar
              activeCategory={emailCategory}
              onSelectCategory={setEmailCategory}
            />

            <TemplateSettingsPanel
              category={emailCategory}
              form={form}
              updateField={updateField}
              emailTemplateId={emailTemplateId}
              templateMeta={templateMeta}
              subjectFieldKey={subjectFieldKey}
              headingFieldKey={headingFieldKey}
              updateEmailLayoutBlock={updateEmailLayoutBlock}
            />

            <CanvasWorkspace
              mode={mode}
              usesLayoutPreview={usesLayoutPreview}
              usesCenteredCanvas={usesCenteredCanvas}
              previewDevice={previewDevice}
              canvasFont={canvasFont}
              canvas={canvas}
              elements={elements}
              draggedType={draggedType}
              onClearSelection={() => setSelectedElementId(null)}
            />
          </>
        ) : (
          <>
            {!hideBuildingBlocks && (
              <BuildingBlocksSidebar
                mode={mode}
                config={config}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            )}

            <PropertiesSidebar
              mode={mode}
              widgetId={widgetId}
              form={form}
              config={config}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedElement={selectedElement}
              setSelectedElementId={setSelectedElementId}
              headingFieldKey={headingFieldKey}
              subjectFieldKey={subjectFieldKey}
              usesLayoutPreview={usesLayoutPreview}
              templateMeta={templateMeta}
              updateField={updateField}
              updateElement={updateElement}
              updateEmailLayoutBlock={updateEmailLayoutBlock}
              updateEmailLayoutBlockStyle={updateEmailLayoutBlockStyle}
              moveElement={moveElement}
              duplicateElement={duplicateElement}
              removeElement={removeElement}
              hideSaveButton={hideSaveButton}
              runSave={runSave}
              savingContext={savingContext}
            />

            <CanvasWorkspace
              mode={mode}
              usesLayoutPreview={usesLayoutPreview}
              usesCenteredCanvas={usesCenteredCanvas}
              previewDevice={previewDevice}
              canvasFont={canvasFont}
              canvas={canvas}
              elements={elements}
              draggedType={draggedType}
              onClearSelection={() => setSelectedElementId(null)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CommonEditor;
