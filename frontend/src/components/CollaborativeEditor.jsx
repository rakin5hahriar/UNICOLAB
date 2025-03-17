import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { RoomProvider, useRoom, useMyPresence, useOthers } from '../liveblocks';
import { FaBold, FaItalic, FaListUl, FaListOl, FaQuoteLeft, FaCode, FaRedo, FaUndo } from 'react-icons/fa';
import './CollaborativeEditor.css';

// Editor toolbar component
const EditorToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="Bold"
      >
        <FaBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="Italic"
      >
        <FaItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        title="Bullet List"
      >
        <FaListUl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        title="Ordered List"
      >
        <FaListOl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        title="Quote"
      >
        <FaQuoteLeft />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
        title="Code Block"
      >
        <FaCode />
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <FaUndo />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <FaRedo />
      </button>
    </div>
  );
};

// User cursors component
const UserCursors = () => {
  const others = useOthers();
  
  return (
    <div className="user-cursors">
      {others.count > 0 && (
        <div className="active-users">
          <span>{others.count} active user{others.count !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

// Editor component with Liveblocks collaboration
const Editor = ({ documentId, initialContent, onSave }) => {
  const room = useRoom();
  const [status, setStatus] = useState('connecting');
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  // Set up the editor with collaboration extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Disable history as we're using Collaboration
      }),
      Collaboration.configure({
        document: room.getStorage(),
      }),
      CollaborationCursor.configure({
        provider: room,
        user: {
          name: myPresence.name || 'Anonymous',
          color: myPresence.color,
        },
      }),
    ],
    content: initialContent || '<p>Start typing here...</p>',
    onUpdate: ({ editor }) => {
      // Save content when it changes
      if (onSave) {
        onSave(editor.getHTML());
      }
    },
  });

  // Update connection status
  useEffect(() => {
    if (room.connection.status === 'connected') {
      setStatus('connected');
    } else {
      setStatus('connecting');
    }
  }, [room.connection.status]);

  return (
    <div className="collaborative-editor">
      {status === 'connecting' && (
        <div className="connection-status">
          Connecting to collaborative session...
        </div>
      )}
      
      <UserCursors />
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
};

// Main component that wraps the editor with RoomProvider
const CollaborativeEditor = ({ documentId, initialContent, onSave, userName, userColor }) => {
  return (
    <RoomProvider
      id={`document-${documentId}`}
      initialPresence={{
        name: userName || 'Anonymous',
        color: userColor || '#' + Math.floor(Math.random() * 16777215).toString(16),
      }}
    >
      <Editor 
        documentId={documentId} 
        initialContent={initialContent} 
        onSave={onSave} 
      />
    </RoomProvider>
  );
};

export default CollaborativeEditor; 