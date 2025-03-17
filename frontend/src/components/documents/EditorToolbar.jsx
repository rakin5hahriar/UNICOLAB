import React from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaCode, 
  FaHeading, 
  FaListUl, 
  FaListOl, 
  FaQuoteRight 
} from 'react-icons/fa';
import './EditorToolbar.css';

// Helper to check if mark is active
const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

// Helper to toggle mark
const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);
  
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// Helper to check if block is active
const isBlockActive = (editor, format) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => 
        !Editor.isEditor(n) && 
        SlateElement.isElement(n) && 
        n.type === format,
    })
  );
  
  return !!match;
};

// Helper to toggle block
const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === 'bulleted-list' || format === 'numbered-list';
  
  Transforms.unwrapNodes(editor, {
    match: n => 
      !Editor.isEditor(n) && 
      SlateElement.isElement(n) && 
      ['bulleted-list', 'numbered-list'].includes(n.type),
    split: true,
  });
  
  const newProperties = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };
  
  Transforms.setNodes(editor, newProperties);
  
  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

// Format button component
const FormatButton = ({ format, icon, blockFormat = false }) => {
  const editor = useSlate();
  const isActive = blockFormat 
    ? isBlockActive(editor, format) 
    : isMarkActive(editor, format);
  
  return (
    <button
      className={`toolbar-button ${isActive ? 'active' : ''}`}
      onMouseDown={event => {
        event.preventDefault();
        blockFormat 
          ? toggleBlock(editor, format) 
          : toggleMark(editor, format);
      }}
    >
      {icon}
    </button>
  );
};

export const EditorToolbar = () => {
  return (
    <div className="editor-toolbar">
      <FormatButton format="bold" icon={<FaBold />} />
      <FormatButton format="italic" icon={<FaItalic />} />
      <FormatButton format="underline" icon={<FaUnderline />} />
      <FormatButton format="code" icon={<FaCode />} />
      <div className="toolbar-divider" />
      <FormatButton format="heading-one" icon={<FaHeading />} blockFormat />
      <FormatButton format="heading-two" icon={<FaHeading size="0.8em" />} blockFormat />
      <FormatButton format="block-quote" icon={<FaQuoteRight />} blockFormat />
      <FormatButton format="bulleted-list" icon={<FaListUl />} blockFormat />
      <FormatButton format="numbered-list" icon={<FaListOl />} blockFormat />
    </div>
  );
}; 