import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Text } from 'react-konva';
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { getDraft, saveDraft, deleteDraft } from '../../utils/draftUtils';
import './CollaborativeWhiteboard.css';

// Mock user for development if needed
const mockUser = {
  id: 'user-1',
  name: 'Current User'
};

const CollaborativeWhiteboard = ({ sessionId, courseId }) => {
  const { currentUser } = useAuth() || { currentUser: mockUser };
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [whiteboardTitle, setWhiteboardTitle] = useState('Untitled Whiteboard');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [whiteboardId, setWhiteboardId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const socketRef = useRef(null);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Use the sessionId from props or from URL params
  const activeSessionId = sessionId || id;
  
  // Initialize the whiteboard with content from API or draft
  useEffect(() => {
    const initializeWhiteboard = async () => {
      try {
        setLoading(true);
        
        // Try to load from API first
        if (activeSessionId) {
          try {
            const response = await axios.get(`/api/whiteboards/${activeSessionId}`);
            const { title, content, collaborators: boardCollaborators } = response.data;
            
            setWhiteboardTitle(title);
            setWhiteboardId(activeSessionId);
            setCollaborators(boardCollaborators || []);
            
            if (content) {
              setLines(JSON.parse(content));
            }
            
            // Check if user has edit permissions
            const userIsCollaborator = boardCollaborators?.some(c => c.id === currentUser.id);
            setIsReadOnly(!userIsCollaborator && boardCollaborators?.length > 0);
          } catch (err) {
            console.error('Error loading whiteboard from API:', err);
            
            // If API fails, try to load from draft
            const draftData = getDraft(activeSessionId, 'whiteboard');
            if (draftData) {
              setWhiteboardTitle(draftData.title || 'Untitled Whiteboard');
              
              if (draftData.content) {
                setLines(JSON.parse(draftData.content));
              }
              
              toast.info('Loaded from your saved draft');
            }
          }
        }
      } catch (err) {
        console.error('Error initializing whiteboard:', err);
        setError('Failed to load whiteboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeWhiteboard();
    
    // Connect to socket server
    connectToSocket();
    
    // Set up stage size based on container
    const updateStageSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.max(600, window.innerHeight - 200);
        setStageSize({ width, height });
      }
    };
    
    updateStageSize();
    window.addEventListener('resize', updateStageSize);
    
    return () => {
      // Clean up socket connection, auto-save timer, and event listener
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      
      window.removeEventListener('resize', updateStageSize);
    };
  }, [activeSessionId]);
  
  // Set up auto-save
  useEffect(() => {
    if (autoSaveEnabled && !isReadOnly) {
      autoSaveTimerRef.current = setInterval(() => {
        handleSave(true);
      }, 30000); // Auto-save every 30 seconds
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [lines, whiteboardTitle, autoSaveEnabled, isReadOnly]);
  
  const connectToSocket = useCallback(() => {
    // Connect to socket server
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      query: {
        whiteboardId: activeSessionId,
        userId: currentUser.id,
        userName: currentUser.name,
        mode: 'whiteboard'
      }
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to socket server');
    });
    
    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from socket server');
    });
    
    socket.on('whiteboard-data', (data) => {
      if (data.content) {
        try {
          setLines(JSON.parse(data.content));
        } catch (err) {
          console.error('Error parsing whiteboard data:', err);
        }
      }
      
      if (data.title) {
        setWhiteboardTitle(data.title);
      }
      
      if (data.collaborators) {
        setCollaborators(data.collaborators);
      }
    });
    
    socket.on('line-added', (data) => {
      if (data.userId !== currentUser.id) {
        setLines(prevLines => [...prevLines, data.line]);
      }
    });
    
    socket.on('title-change', (data) => {
      if (data.userId !== currentUser.id) {
        setWhiteboardTitle(data.title);
      }
    });
    
    socket.on('clear-whiteboard', (data) => {
      if (data.userId !== currentUser.id) {
        setLines([]);
        toast.info(`${data.userName} cleared the whiteboard`);
      }
    });
    
    socket.on('collaborator-joined', (data) => {
      setCollaborators(prev => {
        if (!prev.some(c => c.id === data.user.id)) {
          return [...prev, data.user];
        }
        return prev;
      });
      
      toast.info(`${data.user.name} joined the whiteboard`);
    });
    
    socket.on('collaborator-left', (data) => {
      setCollaborators(prev => prev.filter(c => c.id !== data.userId));
      toast.info(`${data.userName} left the whiteboard`);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error. Some changes may not be saved.');
    });
  }, [activeSessionId, currentUser]);
  
  const handleMouseDown = (e) => {
    if (isReadOnly) return;
    
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'eraser') {
      // Implement eraser logic - remove lines that are close to the current position
      const eraserRadius = strokeWidth * 2;
      setLines(prevLines => 
        prevLines.filter(line => {
          return !line.points.some((point, i) => {
            if (i % 2 === 0) {
              const x = point;
              const y = line.points[i + 1];
              const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
              return distance < eraserRadius;
            }
            return false;
          });
        })
      );
    } else {
      // Start drawing a new line
      setCurrentLine({
        tool,
        color,
        strokeWidth,
        points: [pos.x, pos.y]
      });
    }
  };
  
  const handleMouseMove = (e) => {
    if (!currentLine || isReadOnly) return;
    
    const pos = e.target.getStage().getPointerPosition();
    
    setCurrentLine(prevLine => ({
      ...prevLine,
      points: [...prevLine.points, pos.x, pos.y]
    }));
  };
  
  const handleMouseUp = () => {
    if (!currentLine || isReadOnly) return;
    
    // Add the current line to the lines array
    setLines(prevLines => [...prevLines, currentLine]);
    
    // Send the new line to the server
    if (connected && socketRef.current) {
      socketRef.current.emit('line-added', {
        whiteboardId: activeSessionId,
        userId: currentUser.id,
        line: currentLine
      });
    }
    
    // Save to local draft
    saveDraft(activeSessionId, {
      title: whiteboardTitle,
      content: JSON.stringify([...lines, currentLine]),
      mode: 'whiteboard',
      lastEdited: new Date().toISOString()
    });
    
    // Reset current line
    setCurrentLine(null);
  };
  
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setWhiteboardTitle(newTitle);
    
    // Send title change to server if connected
    if (connected && socketRef.current && !isReadOnly) {
      socketRef.current.emit('title-change', {
        whiteboardId: activeSessionId,
        userId: currentUser.id,
        title: newTitle
      });
      
      // Update draft with new title
      const draftData = getDraft(activeSessionId, 'whiteboard');
      if (draftData) {
        saveDraft(activeSessionId, {
          ...draftData,
          title: newTitle,
          lastEdited: new Date().toISOString()
        });
      }
    }
  };
  
  const handleClearWhiteboard = () => {
    if (isReadOnly) return;
    
    if (window.confirm('Are you sure you want to clear the whiteboard? This action cannot be undone.')) {
      setLines([]);
      
      // Send clear command to server
      if (connected && socketRef.current) {
        socketRef.current.emit('clear-whiteboard', {
          whiteboardId: activeSessionId,
          userId: currentUser.id,
          userName: currentUser.name
        });
      }
      
      // Update draft
      saveDraft(activeSessionId, {
        title: whiteboardTitle,
        content: JSON.stringify([]),
        mode: 'whiteboard',
        lastEdited: new Date().toISOString()
      });
    }
  };
  
  const handleSave = async (isAutoSave = false) => {
    if (isReadOnly) return;
    
    try {
      setIsSaving(true);
      
      const saveData = {
        title: whiteboardTitle,
        content: JSON.stringify(lines),
        courseId: courseId || null,
        mode: 'whiteboard'
      };
      
      let response;
      
      if (whiteboardId) {
        response = await axios.put(`/api/whiteboards/${whiteboardId}`, saveData);
      } else {
        response = await axios.post('/api/whiteboards', saveData);
        setWhiteboardId(response.data.id);
        
        // Update URL without reloading if this is a new whiteboard
        if (!activeSessionId) {
          navigate(`/whiteboard/${response.data.id}`, { replace: true });
        }
      }
      
      setLastSaved(new Date());
      
      // Delete draft after successful save to server
      deleteDraft(activeSessionId || response.data.id, 'whiteboard');
      
      if (!isAutoSave) {
        toast.success('Whiteboard saved successfully');
      }
    } catch (err) {
      console.error('Error saving whiteboard:', err);
      
      if (!isAutoSave) {
        toast.error('Failed to save whiteboard. Changes saved as draft.');
      }
      
      // Ensure draft is saved
      saveDraft(activeSessionId || 'new-whiteboard', {
        title: whiteboardTitle,
        content: JSON.stringify(lines),
        mode: 'whiteboard',
        lastEdited: new Date().toISOString()
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleExport = () => {
    // Export as PNG
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = `${whiteboardTitle.replace(/\s+/g, '_')}.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleExportJSON = () => {
    // Export as JSON
    const jsonString = JSON.stringify(lines);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${whiteboardTitle.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedLines = JSON.parse(event.target.result);
        setLines(importedLines);
        toast.success('Whiteboard imported successfully');
      } catch (err) {
        console.error('Error importing whiteboard:', err);
        toast.error('Failed to import whiteboard. Invalid format.');
      }
    };
    reader.readAsText(file);
  };
  
  if (loading) {
    return <div className="collaborative-whiteboard-loading">Loading whiteboard...</div>;
  }
  
  if (error) {
    return <div className="collaborative-whiteboard-error">{error}</div>;
  }
  
  return (
    <div className="collaborative-whiteboard" ref={containerRef}>
      <div className="whiteboard-header">
        <div className="whiteboard-title-container">
          <input
            type="text"
            className="whiteboard-title-input"
            value={whiteboardTitle}
            onChange={handleTitleChange}
            placeholder="Untitled Whiteboard"
            disabled={isReadOnly}
          />
          {isReadOnly && <span className="read-only-badge">Read Only</span>}
        </div>
        
        <div className="whiteboard-actions">
          <div className="connection-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <div className="collaborators">
            {collaborators.map(user => (
              <div key={user.id} className="collaborator-avatar" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          
          {!isReadOnly && (
            <div className="drawing-tools">
              <div className="tool-group">
                <button
                  className={`tool-button ${tool === 'pen' ? 'active' : ''}`}
                  onClick={() => setTool('pen')}
                  title="Pen"
                >
                  <i className="fas fa-pen"></i>
                </button>
                <button
                  className={`tool-button ${tool === 'line' ? 'active' : ''}`}
                  onClick={() => setTool('line')}
                  title="Line"
                >
                  <i className="fas fa-slash"></i>
                </button>
                <button
                  className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
                  onClick={() => setTool('eraser')}
                  title="Eraser"
                >
                  <i className="fas fa-eraser"></i>
                </button>
              </div>
              
              <div className="color-picker">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  title="Color"
                />
              </div>
              
              <div className="stroke-width">
                <label htmlFor="stroke-width">Width:</label>
                <input
                  type="range"
                  id="stroke-width"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
          
          <div className="whiteboard-buttons">
            {!isReadOnly && (
              <>
                <button 
                  className="save-button" 
                  onClick={() => handleSave()}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                
                <button 
                  className="clear-button" 
                  onClick={handleClearWhiteboard}
                >
                  Clear
                </button>
                
                <div className="auto-save-toggle">
                  <input
                    type="checkbox"
                    id="auto-save-whiteboard"
                    checked={autoSaveEnabled}
                    onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  />
                  <label htmlFor="auto-save-whiteboard">Auto-save</label>
                </div>
              </>
            )}
            
            <div className="export-import">
              <button className="export-button" onClick={handleExport} title="Export as PNG">
                Export PNG
              </button>
              
              <button className="export-button" onClick={handleExportJSON} title="Export as JSON">
                Export JSON
              </button>
              
              {!isReadOnly && (
                <div className="import-container">
                  <label htmlFor="import-whiteboard-file" className="import-button">
                    Import
                  </label>
                  <input
                    type="file"
                    id="import-whiteboard-file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="whiteboard-container">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
          style={{ backgroundColor: '#ffffff' }}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
            
            {currentLine && (
              <Line
                points={currentLine.points}
                stroke={currentLine.color}
                strokeWidth={currentLine.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  currentLine.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            )}
            
            {isReadOnly && (
              <Text
                text="Read Only Mode"
                x={20}
                y={20}
                fontSize={16}
                fill="#999"
                opacity={0.6}
              />
            )}
          </Layer>
        </Stage>
      </div>
      
      <div className="whiteboard-footer">
        {lastSaved && (
          <div className="last-saved">
            Last saved: {lastSaved.toLocaleString()}
          </div>
        )}
        
        {courseId && (
          <div className="course-badge">
            Course Whiteboard
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard; 