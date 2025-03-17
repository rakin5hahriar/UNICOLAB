import React, { useState, useEffect, useRef } from 'react';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, Modifier, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import './CollaborativeTextEditor.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faItalic, faUnderline, faAlignLeft, faAlignCenter, faAlignRight, 
         faListUl, faListOl, faQuoteRight, faCode, faUndo, faRedo, faPalette, faFont,
         faSave, faFilePdf, faDownload } from '@fortawesome/free-solid-svg-icons';
import html2pdf from 'html2pdf.js';

const CollaborativeTextEditor = ({ socket, documentId }) => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [currentAlignment, setCurrentAlignment] = useState('left');
  const [documentTitle, setDocumentTitle] = useState('Title');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const editorRef = useRef(null);
  const contentRef = useRef(null);
  const lastSyncedContentRef = useRef(null);
  const colorPickerRef = useRef(null);
  const highlightPickerRef = useRef(null);

  // Color options
  const textColors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', 
    '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff', '#980000', 
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', 
    '#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#e6b8af', 
    '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', 
    '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
  ];

  // Initialize editor with content from server
  useEffect(() => {
    if (socket && documentId) {
      // Request document content when component mounts
      socket.emit('get-document', documentId);

      // Listen for document content from server
      socket.on('load-document', (document) => {
        try {
          if (document.content && Object.keys(document.content).length > 0) {
            const contentState = convertFromRaw(document.content);
            setEditorState(EditorState.createWithContent(contentState));
            lastSyncedContentRef.current = document.content;
          }
          if (document.title) {
            setDocumentTitle(document.title);
          }
        } catch (error) {
          console.error('Error loading document:', error);
        }
      });

      // Listen for changes from other clients
      socket.on('receive-changes', (delta) => {
        try {
          if (delta && Object.keys(delta).length > 0) {
            const contentState = convertFromRaw(delta);
            setEditorState(EditorState.createWithContent(contentState));
            lastSyncedContentRef.current = delta;
          }
        } catch (error) {
          console.error('Error applying changes:', error);
        }
      });

      // Listen for save confirmation
      socket.on('document-saved', () => {
        setIsSaving(false);
        setSaveStatus('Saved');
        
        // Clear the status after 3 seconds
        setTimeout(() => {
          setSaveStatus('');
        }, 3000);
      });
    }

    return () => {
      if (socket) {
        socket.off('load-document');
        socket.off('receive-changes');
        socket.off('document-saved');
      }
    };
  }, [socket, documentId]);

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowTextColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(event.target)) {
        setShowHighlightColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Send changes to server
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (socket && documentId) {
        const contentState = editorState.getCurrentContent();
        const rawContent = convertToRaw(contentState);
        
        // Only send if content has changed
        if (JSON.stringify(rawContent) !== JSON.stringify(lastSyncedContentRef.current)) {
          socket.emit('send-changes', { documentId, delta: rawContent, title: documentTitle });
          lastSyncedContentRef.current = rawContent;
        }
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [editorState, documentTitle, socket, documentId]);

  // Focus the editor when component mounts
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Handle editor state changes
  const onChange = (newState) => {
    setEditorState(newState);
  };

  // Handle keyboard shortcuts
  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  // Map keys to commands
  const mapKeyToEditorCommand = (e) => {
    return getDefaultKeyBinding(e);
  };

  // Toggle inline styles (bold, italic, underline)
  const toggleInlineStyle = (inlineStyle) => {
    onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  // Toggle block types (headers, lists, quotes, code blocks)
  const toggleBlockType = (blockType) => {
    console.log('Toggling block type:', blockType);
    
    // Get current content and selection
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    
    // Check if we're already using this block type
    const currentBlock = contentState.getBlockForKey(selection.getStartKey());
    const currentType = currentBlock.getType();
    const isActive = currentType === blockType;
    
    // Apply the block type change
    const newEditorState = RichUtils.toggleBlockType(editorState, blockType);
    
    // For lists, we need to ensure proper nesting and styling
    if (blockType === 'unordered-list-item' || blockType === 'ordered-list-item') {
      // Apply direct styling to ensure lists render correctly
      setTimeout(() => {
        try {
          const listBlocks = document.querySelectorAll(
            blockType === 'unordered-list-item' 
              ? '.public-DraftStyleDefault-unorderedListItem' 
              : '.public-DraftStyleDefault-orderedListItem'
          );
          
          listBlocks.forEach(block => {
            // Ensure list items have proper styling
            if (blockType === 'unordered-list-item') {
              block.style.listStyleType = 'disc';
            } else {
              block.style.listStyleType = 'decimal';
            }
            
            // Ensure proper indentation
            block.style.marginLeft = '1.5em';
            
            // Fix any parent elements that might be affecting the list
            const parentBlock = block.closest('[data-block="true"]');
            if (parentBlock) {
              parentBlock.style.marginLeft = '0';
            }
          });
        } catch (error) {
          console.error('Error applying list styles:', error);
        }
      }, 0);
    }
    
    // Update editor state
    onChange(newEditorState);
    
    // Emit changes to socket
    if (socket && documentId) {
      const rawContent = convertToRaw(newEditorState.getCurrentContent());
      socket.emit('send-changes', { documentId, delta: rawContent, title: documentTitle });
      lastSyncedContentRef.current = rawContent;
    }
  };

  // Apply text color
  const applyTextColor = (color) => {
    const selection = editorState.getSelection();
    const nextContentState = Modifier.applyInlineStyle(
      editorState.getCurrentContent(),
      selection,
      `COLOR-${color.replace('#', '')}`
    );
    
    const nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style'
    );
    
    onChange(nextEditorState);
    setShowTextColorPicker(false);
  };

  // Apply highlight color
  const applyHighlightColor = (color) => {
    const selection = editorState.getSelection();
    const nextContentState = Modifier.applyInlineStyle(
      editorState.getCurrentContent(),
      selection,
      `BGCOLOR-${color.replace('#', '')}`
    );
    
    const nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style'
    );
    
    onChange(nextEditorState);
    setShowHighlightColorPicker(false);
  };

  // Toggle text alignment
  const toggleAlignment = (alignment) => {
    // Log the alignment being applied
    console.log('Applying alignment:', alignment);
    
    // Update current alignment state
    setCurrentAlignment(alignment);
    
    // Get current content and selection
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    
    // Get all selected blocks
    const startKey = selectionState.getStartKey();
    const endKey = selectionState.getEndKey();
    let currentBlock = contentState.getBlockForKey(startKey);
    
    // Create a new content state
    let newContentState = contentState;
    
    // If selection spans multiple blocks, update each block
    if (startKey !== endKey) {
      let blockKey = startKey;
      
      while (blockKey) {
        const blockSelection = selectionState.merge({
          anchorKey: blockKey,
          anchorOffset: 0,
          focusKey: blockKey,
          focusOffset: currentBlock.getLength(),
        });
        
        // Apply alignment to this block
        newContentState = Modifier.setBlockData(
          newContentState,
          blockSelection,
          { 'text-align': alignment }
        );
        
        // Move to next block
        const nextBlock = newContentState.getBlockAfter(blockKey);
        if (!nextBlock || nextBlock.getKey() === endKey) {
          // If we've reached the end block, apply alignment to it and break
          if (nextBlock) {
            const endBlockSelection = selectionState.merge({
              anchorKey: endKey,
              anchorOffset: 0,
              focusKey: endKey,
              focusOffset: nextBlock.getLength(),
            });
            
            newContentState = Modifier.setBlockData(
              newContentState,
              endBlockSelection,
              { 'text-align': alignment }
            );
          }
          break;
        }
        
        blockKey = nextBlock.getKey();
        currentBlock = nextBlock;
      }
    } else {
      // If selection is within a single block, just update that block
      newContentState = Modifier.setBlockData(
        newContentState,
        selectionState,
        { 'text-align': alignment }
      );
    }
    
    // Create new editor state with updated content
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      'change-block-data'
    );
    
    // Update editor state
    onChange(newEditorState);
    
    // Emit changes to socket
    if (socket && documentId) {
      const rawContent = convertToRaw(newContentState);
      socket.emit('send-changes', { documentId, delta: rawContent, title: documentTitle });
      lastSyncedContentRef.current = rawContent;
    }
  };

  // Custom style map for colors and alignment
  const customStyleMap = {
    ...textColors.reduce((styles, color) => {
      const colorWithoutHash = color.replace('#', '');
      styles[`COLOR-${colorWithoutHash}`] = { color };
      styles[`BGCOLOR-${colorWithoutHash}`] = { backgroundColor: color };
      return styles;
    }, {}),
    BOLD: { fontWeight: 'bold' },
    ITALIC: { fontStyle: 'italic' },
    UNDERLINE: { textDecoration: 'underline' }
  };

  // Custom block styling
  const blockStyleFn = (contentBlock) => {
    const blockData = contentBlock.getData();
    const alignment = blockData.get('text-align');
    
    if (alignment) {
      return `text-align-${alignment}`;
    }
    
    return '';
  };

  // Custom style function for blocks
  const styleMap = {
    'text-align-left': { textAlign: 'left' },
    'text-align-center': { textAlign: 'center' },
    'text-align-right': { textAlign: 'right' }
  };

  // Function to apply styles to block elements
  const applyBlockStyles = () => {
    // Apply alignment styles to all blocks
    setTimeout(() => {
      try {
        const blocks = document.querySelectorAll('[data-block="true"]');
        blocks.forEach(block => {
          const blockKey = block.getAttribute('data-offset-key').split('-')[0];
          const contentBlock = editorState.getCurrentContent().getBlockForKey(blockKey);
          if (contentBlock) {
            const alignment = contentBlock.getData().get('text-align');
            if (alignment) {
              block.style.textAlign = alignment;
              
              // Apply to nested elements
              const nestedElements = block.querySelectorAll('.public-DraftStyleDefault-block');
              nestedElements.forEach(el => {
                el.style.textAlign = alignment;
              });
            }
          }
        });
      } catch (error) {
        console.error('Error applying block styles:', error);
      }
    }, 0);
  };

  // Apply styles after editor state changes
  useEffect(() => {
    applyBlockStyles();
  }, [editorState]);

  // Undo and Redo functions
  const onUndo = () => {
    onChange(EditorState.undo(editorState));
  };

  const onRedo = () => {
    onChange(EditorState.redo(editorState));
  };

  // Check if a block type is active
  const hasBlockType = (blockType) => {
    const selection = editorState.getSelection();
    const blockKey = selection.getStartKey();
    const block = editorState.getCurrentContent().getBlockForKey(blockKey);
    return block.getType() === blockType;
  };

  // Check if an inline style is active
  const hasInlineStyle = (style) => {
    return editorState.getCurrentInlineStyle().has(style);
  };

  // Handle title change
  const handleTitleChange = (e) => {
    setDocumentTitle(e.target.value);
    if (socket && documentId) {
      socket.emit('update-title', { documentId, title: e.target.value });
    }
  };

  // Save document
  const saveDocument = () => {
    if (socket && documentId) {
      setIsSaving(true);
      setSaveStatus('Saving...');
      
      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      
      socket.emit('save-document', { 
        documentId, 
        content: rawContent, 
        title: documentTitle 
      });
    }
  };

  // Export as PDF
  const exportToPdf = () => {
    if (!contentRef.current) return;
    
    // Set options for PDF generation
    const options = {
      margin: [15, 15, 15, 15],
      filename: `${documentTitle || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Create a clone of the content to style for PDF
    const contentClone = contentRef.current.cloneNode(true);
    const titleElement = document.createElement('h1');
    titleElement.textContent = documentTitle;
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '20px';
    contentClone.prepend(titleElement);
    
    // Generate PDF
    html2pdf().set(options).from(contentClone).save();
  };

  return (
    <div className="justpaste-editor-container">
      <div className="justpaste-editor-header">
        <input 
          type="text" 
          className="justpaste-title-input"
          value={documentTitle}
          onChange={handleTitleChange}
          placeholder="Title"
        />
        <div className="justpaste-toolbar">
          {/* Text formatting group */}
          <div className="justpaste-toolbar-group">
            <button
              className={`justpaste-toolbar-button ${hasInlineStyle('BOLD') ? 'active' : ''}`}
              onClick={() => toggleInlineStyle('BOLD')}
              title="Bold"
              aria-pressed={hasInlineStyle('BOLD')}
            >
              <FontAwesomeIcon icon={faBold} />
            </button>
            <button
              className={`justpaste-toolbar-button ${hasInlineStyle('ITALIC') ? 'active' : ''}`}
              onClick={() => toggleInlineStyle('ITALIC')}
              title="Italic"
              aria-pressed={hasInlineStyle('ITALIC')}
            >
              <FontAwesomeIcon icon={faItalic} />
            </button>
            <button
              className={`justpaste-toolbar-button ${hasInlineStyle('UNDERLINE') ? 'active' : ''}`}
              onClick={() => toggleInlineStyle('UNDERLINE')}
              title="Underline"
              aria-pressed={hasInlineStyle('UNDERLINE')}
            >
              <FontAwesomeIcon icon={faUnderline} />
            </button>
          </div>

          {/* Alignment group */}
          <div className="justpaste-toolbar-group">
            <button
              className={`justpaste-toolbar-button ${currentAlignment === 'left' ? 'active' : ''}`}
              onClick={() => toggleAlignment('left')}
              title="Align Left"
              aria-pressed={currentAlignment === 'left'}
            >
              <FontAwesomeIcon icon={faAlignLeft} />
            </button>
            <button
              className={`justpaste-toolbar-button ${currentAlignment === 'center' ? 'active' : ''}`}
              onClick={() => toggleAlignment('center')}
              title="Align Center"
              aria-pressed={currentAlignment === 'center'}
            >
              <FontAwesomeIcon icon={faAlignCenter} />
            </button>
            <button
              className={`justpaste-toolbar-button ${currentAlignment === 'right' ? 'active' : ''}`}
              onClick={() => toggleAlignment('right')}
              title="Align Right"
              aria-pressed={currentAlignment === 'right'}
            >
              <FontAwesomeIcon icon={faAlignRight} />
            </button>
          </div>

          {/* List group */}
          <div className="justpaste-toolbar-group">
            <button
              className={`justpaste-toolbar-button ${hasBlockType('unordered-list-item') ? 'active' : ''}`}
              onClick={() => toggleBlockType('unordered-list-item')}
              title="Bullet List"
              aria-pressed={hasBlockType('unordered-list-item')}
            >
              <FontAwesomeIcon icon={faListUl} />
            </button>
            <button
              className={`justpaste-toolbar-button ${hasBlockType('ordered-list-item') ? 'active' : ''}`}
              onClick={() => toggleBlockType('ordered-list-item')}
              title="Numbered List"
              aria-pressed={hasBlockType('ordered-list-item')}
            >
              <FontAwesomeIcon icon={faListOl} />
            </button>
          </div>

          {/* Color group */}
          <div className="justpaste-toolbar-group">
            <div className="justpaste-color-picker" ref={colorPickerRef}>
              <button
                className="justpaste-toolbar-button"
                onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                title="Text Color"
              >
                <FontAwesomeIcon icon={faFont} style={{ color: '#1a73e8' }} />
              </button>
              {showTextColorPicker && (
                <div className="justpaste-color-dropdown">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      className="justpaste-color-option"
                      style={{ backgroundColor: color }}
                      onClick={() => applyTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="justpaste-color-picker" ref={highlightPickerRef}>
              <button
                className="justpaste-toolbar-button"
                onClick={() => setShowHighlightColorPicker(!showHighlightColorPicker)}
                title="Highlight Color"
              >
                <FontAwesomeIcon icon={faPalette} style={{ color: '#f1c40f' }} />
              </button>
              {showHighlightColorPicker && (
                <div className="justpaste-color-dropdown">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      className="justpaste-color-option"
                      style={{ backgroundColor: color }}
                      onClick={() => applyHighlightColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Block formatting group */}
          <div className="justpaste-toolbar-group">
            <button
              className={`justpaste-toolbar-button ${hasBlockType('blockquote') ? 'active' : ''}`}
              onClick={() => toggleBlockType('blockquote')}
              title="Quote"
              aria-pressed={hasBlockType('blockquote')}
            >
              <FontAwesomeIcon icon={faQuoteRight} />
            </button>
            <button
              className={`justpaste-toolbar-button ${hasBlockType('code-block') ? 'active' : ''}`}
              onClick={() => toggleBlockType('code-block')}
              title="Code Block"
              aria-pressed={hasBlockType('code-block')}
            >
              <FontAwesomeIcon icon={faCode} />
            </button>
          </div>

          {/* Save and Export group */}
          <div className="justpaste-toolbar-group">
            <button
              className="justpaste-toolbar-button"
              onClick={saveDocument}
              title="Save Document"
              disabled={isSaving}
            >
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button
              className="justpaste-toolbar-button"
              onClick={exportToPdf}
              title="Export as PDF"
            >
              <FontAwesomeIcon icon={faFilePdf} />
            </button>
          </div>

          {/* History group */}
          <div className="justpaste-toolbar-group">
            <button
              className="justpaste-toolbar-button"
              onClick={onUndo}
              title="Undo"
              disabled={editorState.getUndoStack().size === 0}
            >
              <FontAwesomeIcon icon={faUndo} />
            </button>
            <button
              className="justpaste-toolbar-button"
              onClick={onRedo}
              title="Redo"
              disabled={editorState.getRedoStack().size === 0}
            >
              <FontAwesomeIcon icon={faRedo} />
            </button>
          </div>
        </div>
      </div>

      <div className="justpaste-editor-content" ref={contentRef}>
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={onChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          blockStyleFn={blockStyleFn}
          customStyleMap={customStyleMap}
          placeholder="Start writing..."
          spellCheck={true}
        />
      </div>
      
      <div className="justpaste-editor-footer">
        <div className="justpaste-editor-status">
          <span className="save-status">{saveStatus || 'Saved'}</span>
          <div className="justpaste-editor-mode">
            <button className="justpaste-mode-button active">EDITOR</button>
            <button className="justpaste-mode-button">HTML</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeTextEditor; 