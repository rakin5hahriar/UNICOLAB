import React, { useState, useEffect, useMemo } from 'react';
import { createEditor } from 'slate';
import { withReact, Slate, Editable } from 'slate-react';
import { renderElement, renderLeaf } from './renderers';
import { initialSlateValue } from './initialSlateValue';
import { EditorToolbar } from './EditorToolbar';
import './CollaborativeEditor.css';

const CollaborativeEditor = ({ initialContent, onContentChange, readOnly }) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  
  // Parse the initial content or use default value
  const [content, setContent] = useState(() => {
    try {
      return initialContent ? JSON.parse(initialContent) : initialSlateValue;
    } catch (error) {
      console.error('Error parsing initial content:', error);
      return initialSlateValue;
    }
  });
  
  // Update content when initialContent changes
  useEffect(() => {
    if (initialContent) {
      try {
        const parsedContent = JSON.parse(initialContent);
        setContent(parsedContent);
        console.log('Content updated from props');
      } catch (error) {
        console.error('Error parsing updated content:', error);
      }
    }
  }, [initialContent]);

  // Handle editor changes
  const handleChange = newValue => {
    setContent(newValue);
    
    // Notify parent component of changes
    if (onContentChange) {
      const contentString = JSON.stringify(newValue);
      console.log('Content changed, notifying parent');
      onContentChange(contentString);
    }
  };

  return (
    <div className="collaborative-editor">
      <Slate
        editor={editor}
        value={content}
        onChange={handleChange}
      >
        <EditorToolbar />
        <Editable
          className="editor-content"
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Start typing..."
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  );
};

export default CollaborativeEditor; 