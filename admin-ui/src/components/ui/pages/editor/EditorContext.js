import { createContext, useContext, useState } from "react";

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");

  return (
    <EditorContext.Provider value={{ isEditorActive, setIsEditorActive, editorTitle, setEditorTitle }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};

