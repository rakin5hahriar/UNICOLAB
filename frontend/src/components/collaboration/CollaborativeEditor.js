import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  RoomProvider, 
  useMyPresence, 
  useOthers, 
  useBroadcastEvent,
  useEventListener
} from '../../liveblocks.config';
import { nanoid } from 'nanoid';
import './CollaborativeEditor.css';

// Cursor component to show other users' cursors
const Cursor = ({ user }) => {
  if (!user.presence?.cursor) return null;
  
  return (
    <div 
      className="cursor" 
      style={{
        position: 'absolute',
        left: user.presence.cursor.x,
        top: user.presence.cursor.y,
        backgroundColor: user.info?.color || '#000',
      }}
    >
      <div className="cursor-name">{user.info?.name || 'Anonymous'}</div>
    </div>
  );
};

// The actual editor component
const Editor = ({ roomId, initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const broadcastEvent = useBroadcastEvent();
  
  // Set up TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
      broadcastEvent({
        type: 'CONTENT_UPDATE',
        data: { content: newContent }
      });
    },
  });

  // Listen for content updates from other users
  useEventListener(({ event }) => {
    if (event.type === 'CONTENT_UPDATE' && editor) {
      const newContent = event.data.content;
      // Only update if content is different to avoid loops
      if (newContent !== editor.getHTML()) {
        editor.commands.setContent(newContent, false);
      }
    }
  });

  // Track mouse movement for cursor position
  useEffect(() => {
    const handleMouseMove = (e) => {
      const editorElement = document.querySelector('.ProseMirror');
      if (!editorElement) return;
      
      const rect = editorElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      updateMyPresence({ cursor: { x, y } });
    };
    
    const handleMouseLeave = () => {
      updateMyPresence({ cursor: null });
    };
    
    const handleKeyDown = () => {
      updateMyPresence({ isTyping: true });
    };
    
    const handleKeyUp = () => {
      updateMyPresence({ isTyping: false });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateMyPresence]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="collaborative-editor">
      <div className="editor-header">
        <div className="room-info">
          <h3>Room: {roomId}</h3>
          <div className="users-online">
            <span>Users online: {others.length + 1}</span>
            <div className="user-avatars">
              {others.map(user => (
                <div 
                  key={user.connectionId} 
                  className="user-avatar"
                  title={user.info?.name || 'Anonymous'}
                  style={{ backgroundColor: user.info?.color || '#ccc' }}
                >
                  {user.info?.name?.charAt(0) || 'A'}
                </div>
              ))}
              <div 
                className="user-avatar current-user"
                title="You"
              >
                You
              </div>
            </div>
          </div>
        </div>
        <div className="typing-indicator">
          {others.filter(user => user.presence.isTyping).length > 0 && (
            <span>
              {others.filter(user => user.presence.isTyping).map(user => user.info?.name || 'Someone').join(', ')} 
              {' is typing...'}
            </span>
          )}
        </div>
      </div>
      
      <div className="editor-container">
        <EditorContent editor={editor} />
        
        {/* Render other users' cursors */}
        {others.map(user => (
          <Cursor key={user.connectionId} user={user} />
        ))}
      </div>
    </div>
  );
};

// Wrapper component that provides the Liveblocks room
const CollaborativeEditor = ({ workspaceId, initialContent = '' }) => {
  // Generate a room ID based on the workspace ID or use a provided one
  const roomId = workspaceId || `workspace-${nanoid()}`;
  
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        selection: null,
        isTyping: false,
      }}
    >
      <Editor roomId={roomId} initialContent={initialContent} />
    </RoomProvider>
  );
};

export default CollaborativeEditor; 