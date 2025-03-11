import React, { useState, useEffect, useRef } from 'react';
import './DocumentEditor.css';

// Safe check for browser environment
const isBrowser = typeof window !== 'undefined';

const SimpleEditor = ({ initialContent, onContentChange, onCursorMove }) => {
  // Use local state for content
  const [content, setContent] = useState(initialContent || '');
  const editorRef = useRef(null);
  const initialContentRef = useRef(initialContent);
  
  // Only update content from props on initial load or when it changes significantly
  useEffect(() => {
    // Only update if initialContent has changed and is different from current content
    if (initialContent !== initialContentRef.current) {
      console.log('SimpleEditor: Updating content from props', { 
        oldLength: initialContentRef.current?.length || 0,
        newLength: initialContent?.length || 0
      });
      initialContentRef.current = initialContent;
      setContent(initialContent || '');
    }
  }, [initialContent]);

  const handleChange = (e) => {
    try {
      const newContent = e.target.value;
      console.log('SimpleEditor: Content changed', { 
        oldLength: content.length, 
        newLength: newContent.length 
      });
      setContent(newContent);
      if (onContentChange) {
        onContentChange(newContent);
      }
    } catch (error) {
      console.error('Error in handleChange:', error);
    }
  };

  const handleSelect = () => {
    try {
      if (onCursorMove && editorRef.current) {
        const { selectionStart, selectionEnd } = editorRef.current;
        onCursorMove({ 
          start: selectionStart, 
          end: selectionEnd 
        });
      }
    } catch (error) {
      console.error('Error in handleSelect:', error);
    }
  };

  // Handle cursor movement with keyboard or mouse
  const handleKeyUp = (e) => {
    try {
      // Only track cursor on navigation keys
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
      if (navKeys.includes(e.key)) {
        handleSelect();
      }
    } catch (error) {
      console.error('Error in handleKeyUp:', error);
    }
  };

  const handleClick = () => {
    try {
      handleSelect();
    } catch (error) {
      console.error('Error in handleClick:', error);
    }
  };

  // Safe execCommand function that checks for browser environment
  const safeExecCommand = (command) => {
    try {
      if (isBrowser && document && document.execCommand) {
        document.execCommand(command);
        handleSelect();
      }
    } catch (err) {
      console.error(`Error executing command ${command}:`, err);
    }
  };

  // If not in browser environment, render a placeholder
  if (!isBrowser) {
    return <div className="simple-editor-placeholder">Editor loading...</div>;
  }

  return (
    <div className="simple-editor">
      <div className="simple-editor-toolbar">
        <button onClick={() => safeExecCommand('bold')}>Bold</button>
        <button onClick={() => safeExecCommand('italic')}>Italic</button>
        <button onClick={() => safeExecCommand('underline')}>Underline</button>
        <span className="simple-editor-note">
          Using simple editor mode. Type in the area below.
        </span>
      </div>
      <textarea
        ref={editorRef}
        className="simple-editor-content"
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        placeholder="Start typing here..."
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 200px)', 
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      />
    </div>
  );
};

export default SimpleEditor; 