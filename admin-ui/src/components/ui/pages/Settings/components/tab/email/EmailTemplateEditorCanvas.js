import { useMemo, useCallback, useRef, useState } from "react";
import { getTemplateEditorMeta } from "./emailTemplatesConfig";
import {buildTokensFromForm,getPreviewHeading, renderEmailTemplatePreviewBody,} from "./preview/emailTemplatePreviewLayouts";
import { resolveTemplateContent } from "./preview/emailTemplateLayoutContent";
import { layoutBlockSelectionId } from "./preview/emailTemplateLayoutDefaults";
import { getBlockStyle } from "./preview/emailTemplateBlockStyles";
import { getEmailDisplayContext, getEmailMediaContext } from "./preview/emailGlobalSettings";
import { filterElementsForAnchor,getTemplateAnchors,} from "./preview/emailTemplateElementSlots";
import CanvasElementRenderer from "../../../../editor/CanvasElementRenderer";
import InlineElementSlot from "./InlineElementSlot";

const findNearestAnchor = (anchorEls, clientY, fallback) => {
  let best = fallback;
  let bestDist = Infinity;

  anchorEls.forEach((el, id) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const dist = Math.abs(clientY - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  });

  return best;
};

const EmailTemplateEditorCanvas = ({
  emailTemplateId,
  form,
  previewFontStack,
  previewPrimaryHex,
  selectedElementId,
  setSelectedElementId,
  elements = [],
  removeElement,
  updateElement,
  handleDropAtSlot,
  handleDragStart,
  draggedType,
  draggedElementId,
  onSlotHover,
  updateEmailLayoutBlock,
}) => {
  const meta = getTemplateEditorMeta(emailTemplateId);
  const allowExtraBlocks = !meta?.stylingOnly;
  const siteName = form?.email_from_name?.trim() || "Your store";
  const primaryColor = previewPrimaryHex || form.primary_color || "#F59E0B";

  const anchorElsRef = useRef(new Map());
  const dropPlacementRef = useRef({ anchor: "start", index: 0 });
  const [activeAnchor, setActiveAnchor] = useState(null);

  const defaultAnchor = useMemo(() => {
    const anchors = getTemplateAnchors(emailTemplateId);
    return anchors[0] || "start";
  }, [emailTemplateId]);

  const tokens = useMemo(() => buildTokensFromForm(siteName), [siteName]);
  const display = useMemo(() => getEmailDisplayContext(form), [form]);
  const media = useMemo(() => getEmailMediaContext(form), [form]);

  const content = useMemo(
    () => resolveTemplateContent(form, emailTemplateId, tokens),
    [form, emailTemplateId, tokens]
  );

  const previewHeading = useMemo(
    () => getPreviewHeading(form, meta, tokens, content),
    [form, meta, tokens, content]
  );

  const getStyle = useCallback(
    (blockKey) => getBlockStyle(form, emailTemplateId, blockKey, primaryColor),
    [form, emailTemplateId, primaryColor]
  );

  const onSelectBlock = useCallback(
    (blockKey) => {
      if (!setSelectedElementId || !blockKey) return;
      setSelectedElementId(layoutBlockSelectionId(emailTemplateId, blockKey));
    },
    [emailTemplateId, setSelectedElementId]
  );

  const onUpdateBlock = useCallback(
    (blockKey, newVal) => {
      if (typeof updateEmailLayoutBlock !== "function") return;
      updateEmailLayoutBlock(emailTemplateId, blockKey, newVal);
    },
    [emailTemplateId, updateEmailLayoutBlock]
  );

  const registerAnchor = useCallback((anchorId, node) => {
    if (node) {
      anchorElsRef.current.set(anchorId, node);
    } else {
      anchorElsRef.current.delete(anchorId);
    }
  }, []);

  const pickAnchorAtY = useCallback(
    (clientY) =>
      findNearestAnchor(anchorElsRef.current, clientY, defaultAnchor),
    [defaultAnchor]
  );

  const resolveDropPlacement = useCallback(
    (clientY) => {
      const anchor = pickAnchorAtY(clientY);
      const anchorEl = anchorElsRef.current.get(anchor);
      const slotElements = filterElementsForAnchor(
        elements,
        emailTemplateId,
        anchor
      );
      let index = slotElements.length;

      if (!anchorEl) {
        return { anchor, index };
      }

      const nodes = anchorEl.querySelectorAll("[data-canvas-element]");
      if (!nodes.length) {
        return { anchor, index: 0 };
      }

      let nodeIndex = 0;
      for (let i = 0; i < slotElements.length; i++) {
        const el = slotElements[i];
        if (draggedElementId && el.id === draggedElementId) {
          continue;
        }
        const node = nodes[nodeIndex];
        if (!node) break;
        nodeIndex += 1;
        const rect = node.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (clientY < midpoint) {
          index = i;
          break;
        }
      }

      return { anchor, index };
    },
    [pickAnchorAtY, elements, emailTemplateId, draggedElementId]
  );

  const handleDropPlacement = useCallback((anchor, index) => {
    dropPlacementRef.current = {
      anchor,
      index: typeof index === "number" ? index : 0,
    };
  }, []);

  const handleCanvasDragOver = useCallback(
    (e) => {
      if (!draggedType) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      const { anchor, index } = resolveDropPlacement(e.clientY);
      setActiveAnchor(anchor);
      onSlotHover?.(anchor);
      dropPlacementRef.current = { anchor, index };
    },
    [draggedType, resolveDropPlacement, onSlotHover]
  );

  const handleCanvasDrop = useCallback(
    (e) => {
      if (!draggedType || typeof handleDropAtSlot !== "function") return;
      e.preventDefault();
      e.stopPropagation();
      const { anchor, index } = resolveDropPlacement(e.clientY);
      handleDropAtSlot(e, anchor, index);
      setActiveAnchor(null);
    },
    [draggedType, handleDropAtSlot, resolveDropPlacement]
  );

  const renderElement = useCallback(
    (el, _index, dragProps) => (
      <CanvasElementRenderer
        el={el}
        form={form}
        selectedElementId={selectedElementId}
        setSelectedElementId={setSelectedElementId}
        updateElement={updateElement}
        removeElement={removeElement}
        editorVariant="email"
        onReorderDragStart={dragProps?.onReorderDragStart}
      />
    ),
    [form, selectedElementId, setSelectedElementId, updateElement, removeElement]
  );

  const renderElementSlot = useCallback(
    (slotId) => {
      if (!allowExtraBlocks || typeof handleDropAtSlot !== "function") {
        return null;
      }
      return (
        <InlineElementSlot
          templateId={emailTemplateId}
          slotId={slotId}
          elements={elements}
          draggedType={draggedType}
          draggedElementId={draggedElementId}
          activeAnchor={activeAnchor}
          onDropAtSlot={handleDropAtSlot}
          onDragStart={handleDragStart}
          onSlotHover={onSlotHover}
          onRegisterAnchor={registerAnchor}
          onDropPlacement={handleDropPlacement}
          renderElement={renderElement}
        />
      );
    },
    [
      allowExtraBlocks,
      emailTemplateId,
      elements,
      draggedType,
      draggedElementId,
      activeAnchor,
      handleDropAtSlot,
      handleDragStart,
      onSlotHover,
      registerAnchor,
      handleDropPlacement,
      renderElement,
    ]
  );

  const body = useMemo(
    () =>
      renderEmailTemplatePreviewBody(emailTemplateId, {
        heading: previewHeading,
        siteName,
        primaryColor,
        productName: tokens["{product_name}"],
        content,
        editable: true,
        selectedBlockId: selectedElementId,
        onSelectBlock,
        getStyle,
        renderElementSlot,
        onUpdateBlock,
        display,
        media,
      }),
    [
      emailTemplateId,
      previewHeading,
      siteName,
      primaryColor,
      tokens,
      content,
      selectedElementId,
      onSelectBlock,
      getStyle,
      renderElementSlot,
      onUpdateBlock,
      display,
      media,
      form?.email_layout_block_styles,
    ]
  );

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <div
        className="mx-auto max-w-[520px] bg-white shadow-sm rounded-lg border border-gray-100 mt-4"
        style={{ fontFamily: previewFontStack }}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onDragLeave={() => setActiveAnchor(null)}
      >
        <div
          className="px-6 sm:px-10 py-8 sm:py-10 text-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedElementId?.(null);
            }
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditorCanvas;
