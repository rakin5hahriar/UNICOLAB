import React, { useState, useEffect } from 'react';
import './DocumentEditor.css';

const BasicEditor = ({ initialContent, onContentChange }) => {
  const [content, setContent] = useState(initialContent || '');
  
  // Update local content when initialContent changes
  useEffect(() => {
    console.log('BasicEditor: initialContent changed', { 
      oldLength: content.length, 
      newLength: initialContent?.length || 0 
    });
    
    if (initialContent !== undefined && initialContent !== content) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    console.log('BasicEditor: Content changed by user', { 
      oldLength: content.length, 
      newLength: newContent.length 
    });
    
    setContent(newContent);
    
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  return (
    <div className="basic-editor">
      <div className="basic-editor-toolbar">
        <span className="basic-editor-note">
          Simple Text Editor - Type below
        </span>
      </div>
      <textarea
        className="basic-editor-content"
        value={content}
        onChange={handleChange}
        placeholder="Start typing here..."
      />
    </div>
  );
};

export default BasicEditor; 