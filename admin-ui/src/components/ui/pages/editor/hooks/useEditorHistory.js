import { useState, useCallback, useEffect } from "react";

export const useEditorHistory = (form, updateField) => {
  const [history, setHistory] = useState([JSON.parse(JSON.stringify(form))]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoingRedoing, setIsUndoingRedoing] = useState(false);

  const pushToHistory = useCallback(
    (newForm) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(JSON.parse(JSON.stringify(newForm)));
        if (next.length > 50) next.shift();
        return next;
      });
      setHistoryIndex((prev) => {
        const nextCount = Math.min(historyIndex + 2, 50);
        return nextCount - 1;
      });
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevForm = history[prevIndex];
      setIsUndoingRedoing(true);
      setHistoryIndex(prevIndex);

      Object.keys(prevForm).forEach((key) => {
        if (JSON.stringify(prevForm[key]) !== JSON.stringify(form[key])) {
          updateField(key, prevForm[key]);
        }
      });
    }
  }, [history, historyIndex, form, updateField]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextForm = history[nextIndex];
      setIsUndoingRedoing(true);
      setHistoryIndex(nextIndex);

      Object.keys(nextForm).forEach((key) => {
        if (JSON.stringify(nextForm[key]) !== JSON.stringify(form[key])) {
          updateField(key, nextForm[key]);
        }
      });
    }
  }, [history, historyIndex, form, updateField]);

  useEffect(() => {
    if (isUndoingRedoing) {
      setIsUndoingRedoing(false);
      return;
    }

    const timer = setTimeout(() => {
      const currentSnapshot = history[historyIndex];
      if (JSON.stringify(form) !== JSON.stringify(currentSnapshot)) {
        pushToHistory(form);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form, isUndoingRedoing, history, historyIndex, pushToHistory]);

  return {
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
  };
};

export default useEditorHistory;
