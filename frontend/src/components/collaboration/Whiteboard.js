import React, { useEffect, useRef, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import socketService from '../../services/socketService';
import './Whiteboard.css';

// Create a fallback toast implementation
const createToastFallback = () => ({
  success: (message) => console.log('Success:', message),
  error: (message) => console.error('Error:', message),
  dismiss: () => {}
});

// Try to import toast from react-hot-toast
let toast;
try {
  const toastModule = require('react-hot-toast');
  toast = {
    success: toastModule.toast.success,
    error: toastModule.toast.error,
    dismiss: toastModule.toast.dismiss
  };
} catch (error) {
  console.warn('react-hot-toast not available, using fallback', error);
  toast = createToastFallback();
}

const tools = {
  PEN: 'pen',
  ERASER: 'eraser',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  TEXT: 'text'
};

const Whiteboard = ({ workspaceId, userId, username, readOnly = false, sessionId }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const containerRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState(null);
  const [tool, setTool] = useState(tools.PEN);
  const [selectedElement, setSelectedElement] = useState(null);
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(5);
  const [text, setText] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const initialStateRequested = useRef(false);
  const initializationAttempts = useRef(0);
  const maxInitAttempts = 3;
  const initTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const textAreaRef = useRef(null);

  // Add predefined colors for the color palette
  const predefinedColors = [
    '#000000', // Black
    '#4285F4', // Blue
    '#34A853', // Green
    '#FBBC05', // Yellow
    '#EA4335', // Red
    '#9C27B0', // Purple
    '#00ACC1', // Cyan
    '#FF5722', // Orange
    '#795548', // Brown
    '#607D8B'  // Gray
  ];
  
  // Add state for UI mode - 'floating' is more like AutoDraw
  const [uiMode, setUiMode] = useState('floating'); // 'floating' or 'toolbar'

  // Use sessionId if provided, otherwise use workspaceId
  const effectiveWorkspaceId = sessionId || workspaceId;

  // Add new state variables for zoom and pan
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((x, y) => {
    return {
      x: (x - offset.x) / scale,
      y: (y - offset.y) / scale
    };
  }, [offset, scale]);

  // Helper function to get pointer position from mouse or touch event
  const getPointerPosition = useCallback((e) => {
    if (!e) {
      console.error('Event is undefined in getPointerPosition');
      return { offsetX: 0, offsetY: 0 };
    }
    
    // Get the target
    const target = e.target;
    if (!target) {
      console.error('Event target is undefined in getPointerPosition');
      return { offsetX: 0, offsetY: 0 };
    }
    
    // Get the bounding rectangle of target
    const rect = target.getBoundingClientRect();
    
    // Mouse event
    if (e.type && e.type.startsWith('mouse')) {
      if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        return {
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top
        };
      }
    }
    
    // Touch event
    if (e.type && e.type.startsWith('touch')) {
      const touch = e.touches && e.touches[0] ? e.touches[0] : 
                   (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : null);
      
      if (touch && typeof touch.clientX === 'number' && typeof touch.clientY === 'number') {
        return {
          offsetX: touch.clientX - rect.left,
          offsetY: touch.clientY - rect.top
        };
      }
    }
    
    // Fallback to native offsetX/offsetY if they exist
    if (e.nativeEvent && typeof e.nativeEvent.offsetX === 'number' && typeof e.nativeEvent.offsetY === 'number') {
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      };
    }
    
    // Last resort fallback
    console.warn('Could not determine pointer position, using fallback values');
    return { offsetX: 0, offsetY: 0 };
  }, []);
  
  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Use the improved getPointerPosition function
    const { offsetX, offsetY } = getPointerPosition(e);
    
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(0.5, scale * delta), 5);
    
    // Calculate new offset to zoom toward cursor position
    const mouseX = offsetX;
    const mouseY = offsetY;
    
    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);
    
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
    
  }, [scale, offset, getPointerPosition]);
  
  // Add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  // Handle space key for panning mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isPanning) {
        document.body.style.cursor = 'grab';
        setIsPanning(true);
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        document.body.style.cursor = 'default';
        setIsPanning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = 'default';
    };
  }, [isPanning]);
  
  // Update mouse event handlers for zoom and pan
  const handleMouseDown = (e) => {
    if (isPanning) {
      document.body.style.cursor = 'grabbing';
      const { offsetX, offsetY } = getPointerPosition(e);
      setStartPanPoint({ x: offsetX, y: offsetY });
      return;
    }
    
    if (readOnly) return;

    const { offsetX, offsetY } = getPointerPosition(e);
    const canvasPoint = screenToCanvas(offsetX, offsetY);
    console.log('Pointer down at:', canvasPoint.x, canvasPoint.y, 'with tool:', tool);
    
    if (tool === tools.TEXT) {
      // Check if clicking on existing text element
      const element = getElementAtPosition(canvasPoint.x, canvasPoint.y);
      
      if (element && element.type === tools.TEXT) {
        // Edit existing text element
        setSelectedElement(element);
        setAction('writing');
        setText(element.text || '');
        setTextPosition({ x: element.x1, y: element.y1 });
        
        // Apply the text formatting from the existing element
        if (element.fontFamily) setTextFormat(prev => ({ ...prev, fontFamily: element.fontFamily }));
        if (element.fontSize) setTextFormat(prev => ({ ...prev, fontSize: element.fontSize }));
        if (element.bold !== undefined) setTextFormat(prev => ({ ...prev, bold: element.bold }));
        if (element.italic !== undefined) setTextFormat(prev => ({ ...prev, italic: element.italic }));
        if (element.underline !== undefined) setTextFormat(prev => ({ ...prev, underline: element.underline }));
        
        // Set color to match the text
        if (element.color) setColor(element.color);
        
        // Focus the text area after a short delay
        setTimeout(() => {
          if (textAreaRef.current) {
            textAreaRef.current.focus();
          }
        }, 50);
        
        return;
      }
      
      // Create new text element
      const newId = nanoid();
      const newElement = createElement(newId, canvasPoint.x, canvasPoint.y, null, null, tools.TEXT);
      setElements(prevElements => [...prevElements, newElement]);
      setSelectedElement(newElement);
      setAction('writing');
      setText('');
      setTextPosition({ x: canvasPoint.x, y: canvasPoint.y });
      
      // Focus the text area after a short delay to ensure it's rendered
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }, 50);
      
      return;
    }
    
    if (tool === tools.ERASER) {
      const element = getElementAtPosition(canvasPoint.x, canvasPoint.y);
      
      if (element) {
        setElements(prevElements => {
          const filteredElements = prevElements.filter(el => el.id !== element.id);
          socketService.deleteWhiteboardElement(element.id);
          return filteredElements;
        });
      }
      return;
    }
    
    setAction(tool === tools.PEN ? 'drawing' : 'resizing');
    
    const newId = nanoid();
    const element = createElement(newId, canvasPoint.x, canvasPoint.y, canvasPoint.x, canvasPoint.y, tool);
    setElements(prevElements => [...prevElements, element]);
    setSelectedElement(element);
  };

  const handleMouseMove = (e) => {
    if (isPanning && e.buttons === 1) {
      const { offsetX, offsetY } = getPointerPosition(e);
      const dx = offsetX - startPanPoint.x;
      const dy = offsetY - startPanPoint.y;
      
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setStartPanPoint({ x: offsetX, y: offsetY });
      return;
    }
    
    if (readOnly || !action) return;

    const { offsetX, offsetY } = getPointerPosition(e);
    const canvasPoint = screenToCanvas(offsetX, offsetY);
    
    if (action === 'drawing') {
      const index = elements.length - 1;
      if (index < 0 || !elements[index] || !elements[index].points) return;
      
      const { points } = elements[index];
      
      // Add throttling to avoid too many points
      const lastPoint = points[points.length - 1];
      const dx = canvasPoint.x - lastPoint.x;
      const dy = canvasPoint.y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only add points if they're far enough apart
      if (distance > 2) {
        const newPoints = [...points, { x: canvasPoint.x, y: canvasPoint.y }];
        const updatedElement = { ...elements[index], points: newPoints };
        
        setElements(prevElements => 
          prevElements.map((el, i) => (i === index ? updatedElement : el))
        );
      }
    } else if (action === 'resizing') {
      const index = elements.length - 1;
      if (index < 0) return;
      
      const updatedElement = { ...elements[index], x2: canvasPoint.x, y2: canvasPoint.y };
      
      setElements(prevElements => 
        prevElements.map((el, i) => (i === index ? updatedElement : el))
      );
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      document.body.style.cursor = 'grab';
      return;
    }
    
    if (readOnly || !action) return;

    if (action === 'drawing' || action === 'resizing') {
      const index = elements.length - 1;
      if (index < 0) return;
      
      const element = elements[index];
      
      // Send element to server if connected
      console.log('Sending element to server:', element.id);
      socketService.addWhiteboardElement(element);
    }
    
    setAction(null);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    if (selectedElement && selectedElement.type === tools.TEXT) {
      const index = elements.findIndex(el => el.id === selectedElement.id);
      
      if (index !== -1) {
        const updatedElement = { 
          ...elements[index], 
          text: e.target.value,
          // Apply current text formatting
          fontFamily: textFormat.fontFamily,
          fontSize: textFormat.fontSize || width * 2,
          bold: textFormat.bold,
          italic: textFormat.italic,
          underline: textFormat.underline
        };
        
        setElements(prevElements => 
          prevElements.map((el, i) => (i === index ? updatedElement : el))
        );
        
        // Send update to server
        socketService.updateWhiteboardElement(selectedElement.id, { 
          text: e.target.value,
          fontFamily: textFormat.fontFamily,
          fontSize: textFormat.fontSize || width * 2,
          bold: textFormat.bold,
          italic: textFormat.italic,
          underline: textFormat.underline
        });
      }
    }
  };

  const handleTextBlur = () => {
    if (selectedElement && selectedElement.type === tools.TEXT) {
      // Only save if there's actual text content
      if (text.trim() !== '') {
        const index = elements.findIndex(el => el.id === selectedElement.id);
        
        if (index !== -1) {
          const updatedElement = { 
            ...elements[index], 
            text: text,
            fontFamily: textFormat.fontFamily,
            fontSize: textFormat.fontSize || width * 2,
            bold: textFormat.bold,
            italic: textFormat.italic,
            underline: textFormat.underline
          };
          
          // Send final update to server
          socketService.updateWhiteboardElement(selectedElement.id, updatedElement);
        }
      } else {
        // If text is empty, remove the element
        setElements(prevElements => 
          prevElements.filter(el => el.id !== selectedElement.id)
        );
        socketService.deleteWhiteboardElement(selectedElement.id);
      }
    }
    
    setAction(null);
    setSelectedElement(null);
    setTextPosition(null);
  };

  const handleClearCanvas = () => {
    if (readOnly) return;
    
    setElements([]);
    socketService.clearWhiteboard();
  };

  // Helper functions to draw different shapes
  const drawPen = (context, element) => {
    const { points, color, width } = element;
    
    if (points.length < 2) return;
    
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.moveTo(points[0].x, points[0].y);
    
    // Use quadratic curves for smoother lines
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    // For the last point
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      context.lineTo(lastPoint.x, lastPoint.y);
    }
    
    context.stroke();
  };

  const drawLine = (context, element) => {
    const { x1, y1, x2, y2, color, width } = element;
    
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  };

  const drawRectangle = (context, element) => {
    const { x1, y1, x2, y2, color, width } = element;
    
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.rect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1)
    );
    context.stroke();
  };

  const drawCircle = (context, element) => {
    const { x1, y1, x2, y2, color, width } = element;
    
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
    
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.stroke();
  };

  const drawText = (context, element) => {
    const { x1, y1, text, color, fontSize, fontFamily = 'Arial', bold = false, italic = false, underline = false } = element;
    
    if (!text) return;
    
    // Set font style with formatting
    let fontStyle = '';
    if (bold) fontStyle += 'bold ';
    if (italic) fontStyle += 'italic ';
    
    context.font = `${fontStyle}${fontSize}px ${fontFamily}`;
    context.fillStyle = color;
    context.fillText(text, x1, y1);
    
    // Add underline if needed
    if (underline) {
      const textWidth = context.measureText(text).width;
      context.beginPath();
      context.strokeStyle = color;
      context.lineWidth = Math.max(1, fontSize / 16);
      context.moveTo(x1, y1 + 3);
      context.lineTo(x1 + textWidth, y1 + 3);
      context.stroke();
    }
  };

  // Draw an element based on its type
  const drawElement = (context, element) => {
    switch (element.type) {
      case tools.PEN:
        drawPen(context, element);
        break;
      case tools.LINE:
        drawLine(context, element);
        break;
      case tools.RECTANGLE:
        drawRectangle(context, element);
        break;
      case tools.CIRCLE:
        drawCircle(context, element);
        break;
      case tools.TEXT:
        drawText(context, element);
        break;
      default:
        console.error('Unknown element type:', element.type);
    }
  };

  // Redraw the entire canvas
  const redrawCanvas = useCallback((elements) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transform
    context.save();
    context.translate(offset.x, offset.y);
    context.scale(scale, scale);
    
    elements.forEach(element => {
      drawElement(context, element);
    });
    
    // Restore transform
    context.restore();
  }, [offset, scale]);

  // Set up canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        if (container) {
          const { offsetWidth, offsetHeight } = container;
          // Use default size if container dimensions are not available
          const width = offsetWidth || 800;
          const height = offsetHeight || 600;
          setCanvasSize({ width, height });
          canvas.width = width;
          canvas.height = height;
          redrawCanvas(elements);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [elements, redrawCanvas]);
  
  // Force initialization after a timeout
  useEffect(() => {
    const forceInitTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Forcing whiteboard to be ready after timeout');
        setIsLoading(false);
      }
    }, 3000); // Force ready after 3 seconds
    
    return () => clearTimeout(forceInitTimeout);
  }, [isLoading]);

  // Toggle UI mode between floating and toolbar
  const toggleUIMode = () => {
    setUiMode(uiMode === 'floating' ? 'toolbar' : 'floating');
  };

  // Helper function to create a new element
  const createElement = (id, x1, y1, x2, y2, type) => {
    switch (type) {
      case tools.PEN:
        return { id, type, points: [{ x: x1, y: y1 }], color, width };
      case tools.LINE:
        return { id, type, x1, y1, x2: x2 || x1, y2: y2 || y1, color, width };
      case tools.RECTANGLE:
        return { id, type, x1, y1, x2: x2 || x1, y2: y2 || y1, color, width };
      case tools.CIRCLE:
        return { id, type, x1, y1, x2: x2 || x1, y2: y2 || y1, color, width };
      case tools.TEXT:
        return { 
          id, 
          type, 
          x1, 
          y1, 
          text: '', 
          color, 
          fontSize: textFormat.fontSize || width * 2,
          fontFamily: textFormat.fontFamily,
          bold: textFormat.bold,
          italic: textFormat.italic,
          underline: textFormat.underline
        };
      default:
        console.error('Unknown tool type:', type);
        return null;
    }
  };

  // Initialize canvas immediately to prevent blank screen
  useEffect(() => {
    // Force initialization after a short timeout
    const initTimeout = setTimeout(() => {
      setIsInitialized(true);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(initTimeout);
  }, []);

  // Initialize canvas with zoom and pan support
  useEffect(() => {
    console.log('Initializing canvas');
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Set high-DPI canvas for better rendering on retina displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);
        
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = width;
        contextRef.current = context;
        
        // Redraw elements after resize
        redrawCanvas(elements);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [color, width, elements, redrawCanvas]);

  // Get element at position (for eraser and text editing)
  const getElementAtPosition = (x, y) => {
    // Check from newest to oldest (top to bottom in z-index)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      
      switch (element.type) {
        case tools.PEN: {
          // Check if close to any point in the path
          for (const point of element.points) {
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            if (distance <= 5 + element.width / 2) {
              return element;
            }
          }
          break;
        }
        case tools.LINE: {
          // Distance from point to line formula
          const { x1, y1, x2, y2 } = element;
          const A = x - x1;
          const B = y - y1;
          const C = x2 - x1;
          const D = y2 - y1;
          
          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;
          
          if (lenSq !== 0) param = dot / lenSq;
          
          let xx, yy;
          
          if (param < 0) {
            xx = x1;
            yy = y1;
          } else if (param > 1) {
            xx = x2;
            yy = y2;
          } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
          }
          
          const distance = Math.sqrt(Math.pow(x - xx, 2) + Math.pow(y - yy, 2));
          if (distance <= 5 + element.width / 2) {
            return element;
          }
          break;
        }
        case tools.RECTANGLE: {
          const { x1, y1, x2, y2 } = element;
          const minX = Math.min(x1, x2);
          const maxX = Math.max(x1, x2);
          const minY = Math.min(y1, y2);
          const maxY = Math.max(y1, y2);
          
          // Check if near the border
          if (
            (Math.abs(x - minX) <= 5 || Math.abs(x - maxX) <= 5) && y >= minY && y <= maxY ||
            (Math.abs(y - minY) <= 5 || Math.abs(y - maxY) <= 5) && x >= minX && x <= maxX
          ) {
            return element;
          }
          break;
        }
        case tools.CIRCLE: {
          const { x1, y1, x2, y2 } = element;
          const centerX = (x1 + x2) / 2;
          const centerY = (y1 + y2) / 2;
          const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
          
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          if (Math.abs(distance - radius) <= 5 + element.width / 2) {
            return element;
          }
          break;
        }
        case tools.TEXT: {
          const { x1, y1, text, fontSize } = element;
          if (!text) break;
          
          // Approximate text dimensions
          const textWidth = text.length * fontSize * 0.6;
          const textHeight = fontSize;
          
          if (
            x >= x1 && x <= x1 + textWidth &&
            y >= y1 - textHeight && y <= y1
          ) {
            return element;
          }
          break;
        }
      }
    }
    
    return null;
  };

  // Helper function to get element position
  const getElementPosition = (element, x, y) => {
    if (element.type === tools.RECTANGLE) {
      const minX = Math.min(element.x1, element.x2);
      const maxX = Math.max(element.x1, element.x2);
      const minY = Math.min(element.y1, element.y2);
      const maxY = Math.max(element.y1, element.y2);
      
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return { x, y };
      }
    } else if (element.type === tools.CIRCLE) {
      const radius = Math.sqrt(
        Math.pow(element.x2 - element.x1, 2) + Math.pow(element.y2 - element.y1, 2)
      );
      const distance = Math.sqrt(
        Math.pow(x - element.x1, 2) + Math.pow(y - element.y1, 2)
      );
      
      if (distance <= radius) {
        return { x, y };
      }
    } else if (element.type === tools.LINE) {
      const a = { x: element.x1, y: element.y1 };
      const b = { x: element.x2, y: element.y2 };
      const c = { x, y };
      const offset = distance(a, b) - (distance(a, c) + distance(b, c));
      
      if (Math.abs(offset) < 1) {
        return { x, y };
      }
    } else if (element.type === tools.PEN) {
      const betweenAnyPoint = element.points.some((point, index) => {
        if (index === 0) return false;
        
        const a = { x: point.x, y: point.y };
        const b = { x: element.points[index - 1].x, y: element.points[index - 1].y };
        const c = { x, y };
        const offset = distance(a, b) - (distance(a, c) + distance(b, c));
        
        return Math.abs(offset) < 5;
      });
      
      if (betweenAnyPoint) {
        return { x, y };
      }
    } else if (element.type === tools.TEXT) {
      const context = contextRef.current;
      if (!context) return null;
      
      context.font = '16px Arial';
      const textWidth = context.measureText(element.text).width;
      
      if (
        x >= element.x1 &&
        x <= element.x1 + textWidth &&
        y >= element.y1 - 16 &&
        y <= element.y1
      ) {
        return { x, y };
      }
    }
    
    return null;
  };

  // Helper function to calculate distance between points
  const distance = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  };

  // Function to save the canvas as an image
  const saveAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      
      // Set the download attribute with a filename
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
      
      // Convert the canvas to a data URL
      link.href = canvas.toDataURL('image/png');
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      toast.success('Whiteboard saved as image');
    } catch (error) {
      console.error('Error saving whiteboard as image:', error);
      toast.error('Failed to save whiteboard as image');
    }
  };

  // Add zoom controls to the UI
  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 5);
    setScale(newScale);
  };
  
  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.5);
    setScale(newScale);
  };
  
  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Add state for document title
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Add state for text formatting
  const [textFormat, setTextFormat] = useState({
    fontFamily: 'Arial',
    fontSize: 16,
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'left',
    textColor: '#000000',
    backgroundColor: 'transparent'
  });

  // Handle document title change
  const handleTitleChange = (e) => {
    setDocumentTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    // Save title to server if needed
    // socketService.updateDocumentTitle(documentTitle);
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  // Handle text format changes
  const toggleTextFormat = (format) => {
    setTextFormat(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const changeTextFormat = (format, value) => {
    setTextFormat(prev => ({
      ...prev,
      [format]: value
    }));
  };

  // Add touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      handleMouseDown(e);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      handleMouseMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp(e);
  };

  // Add a function to get text input style based on current formatting
  const getTextInputStyle = () => {
    return {
      color: color,
      fontSize: `${textFormat.fontSize}px`,
      fontFamily: textFormat.fontFamily,
      fontWeight: textFormat.bold ? 'bold' : 'normal',
      fontStyle: textFormat.italic ? 'italic' : 'normal',
      textDecoration: textFormat.underline ? 'underline' : 'none',
    };
  };

  // Update the TextFormatToolbar component to work in both UI modes
  const TextFormatToolbar = ({ textFormat, setTextFormat, color, setColor, uiMode }) => {
    const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'];
    const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
    
    const toolbarContent = (
      <>
        <div className="format-group">
          <button 
            className={`format-button ${textFormat.bold ? 'active' : ''}`}
            onClick={() => setTextFormat(prev => ({ ...prev, bold: !prev.bold }))}
            title="Bold"
          >
            <i className="fas fa-bold"></i>
          </button>
          <button 
            className={`format-button ${textFormat.italic ? 'active' : ''}`}
            onClick={() => setTextFormat(prev => ({ ...prev, italic: !prev.italic }))}
            title="Italic"
          >
            <i className="fas fa-italic"></i>
          </button>
          <button 
            className={`format-button ${textFormat.underline ? 'active' : ''}`}
            onClick={() => setTextFormat(prev => ({ ...prev, underline: !prev.underline }))}
            title="Underline"
          >
            <i className="fas fa-underline"></i>
          </button>
        </div>
        
        <div className="format-group">
          <select 
            className="format-select"
            value={textFormat.fontFamily}
            onChange={(e) => setTextFormat(prev => ({ ...prev, fontFamily: e.target.value }))}
            title="Font Family"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
          
          <select 
            className="format-select"
            value={textFormat.fontSize}
            onChange={(e) => setTextFormat(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
            title="Font Size"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>
        
        <div className="format-group">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            title="Text Color"
          />
        </div>
      </>
    );
    
    return uiMode === 'floating' ? (
      <div className="floating-text-format-toolbar">
        {toolbarContent}
      </div>
    ) : (
      <div className="text-format-toolbar">
        {toolbarContent}
      </div>
    );
  };

  // If not initialized yet, show a loading message
  if (!isInitialized) {
    return <div className="loading">Initializing whiteboard...</div>;
  }

  return (
    <div className="whiteboard-container">
      {uiMode === 'toolbar' && (
        <div className="whiteboard-toolbar">
          {/* Drawing tools */}
          <div className="tool-group">
            <button
              className={`tool-button ${tool === tools.PEN ? 'active' : ''}`}
              onClick={() => setTool(tools.PEN)}
              title="Pencil"
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button
              className={`tool-button ${tool === tools.LINE ? 'active' : ''}`}
              onClick={() => setTool(tools.LINE)}
              title="Line"
            >
              <i className="fas fa-slash"></i>
            </button>
            <button
              className={`tool-button ${tool === tools.RECTANGLE ? 'active' : ''}`}
              onClick={() => setTool(tools.RECTANGLE)}
              title="Rectangle"
            >
              <i className="far fa-square"></i>
            </button>
            <button
              className={`tool-button ${tool === tools.CIRCLE ? 'active' : ''}`}
              onClick={() => setTool(tools.CIRCLE)}
              title="Circle"
            >
              <i className="far fa-circle"></i>
            </button>
            <button
              className={`tool-button ${tool === tools.TEXT ? 'active' : ''}`}
              onClick={() => setTool(tools.TEXT)}
              title="Text"
            >
              <i className="fas fa-font"></i>
            </button>
            <button
              className={`tool-button ${tool === tools.ERASER ? 'active' : ''}`}
              onClick={() => setTool(tools.ERASER)}
              title="Eraser"
            >
              <i className="fas fa-eraser"></i>
            </button>
          </div>

          {/* Color selection */}
          <div className="color-group">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              title="Select Color"
            />
            <div className="color-presets">
              {predefinedColors.map((presetColor) => (
                <div
                  key={presetColor}
                  className={`color-preset ${color === presetColor ? 'active' : ''}`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                />
              ))}
            </div>
          </div>

          {/* Line width selection */}
          <div className="width-group">
            <label>Width:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              title="Line Width"
            />
            <span>{width}px</span>
          </div>

          {/* Canvas actions */}
          <div className="action-group">
            <button
              className="action-button"
              onClick={handleClearCanvas}
              title="Clear Canvas"
            >
              <i className="fas fa-trash-alt"></i> Clear
            </button>
            <button
              className="action-button"
              onClick={saveAsImage}
              title="Save as Image"
            >
              <i className="fas fa-download"></i> Save
            </button>
            <button
              className="action-button"
              onClick={() => setUiMode('floating')}
              title="Switch to Floating UI"
            >
              <i className="fas fa-expand-arrows-alt"></i>
            </button>
          </div>

          {/* Connection status */}
          <div className="connection-status">
            {isConnected ? (
              <span className="status connected">Connected</span>
            ) : (
              <span className="status disconnected">Offline Mode</span>
            )}
          </div>
        </div>
      )}

      {/* Add text formatting toolbar when text tool is active */}
      {tool === tools.TEXT && (
        <TextFormatToolbar 
          textFormat={textFormat}
          setTextFormat={setTextFormat}
          color={color}
          setColor={setColor}
          uiMode={uiMode}
        />
      )}

      <div className="canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          width={canvasSize.width}
          height={canvasSize.height}
        />
        
        {/* AutoDraw-like floating tools panel */}
        {uiMode === 'floating' && (
          <>
            <div className="floating-tools-panel">
              <button
                className={`floating-tool-button ${tool === tools.PEN ? 'active' : ''}`}
                onClick={() => setTool(tools.PEN)}
                title="Pencil"
              >
                <i className="fas fa-pencil-alt"></i>
              </button>
              <button
                className={`floating-tool-button ${tool === tools.LINE ? 'active' : ''}`}
                onClick={() => setTool(tools.LINE)}
                title="Line"
              >
                <i className="fas fa-slash"></i>
              </button>
              <button
                className={`floating-tool-button ${tool === tools.RECTANGLE ? 'active' : ''}`}
                onClick={() => setTool(tools.RECTANGLE)}
                title="Rectangle"
              >
                <i className="far fa-square"></i>
              </button>
              <button
                className={`floating-tool-button ${tool === tools.CIRCLE ? 'active' : ''}`}
                onClick={() => setTool(tools.CIRCLE)}
                title="Circle"
              >
                <i className="far fa-circle"></i>
              </button>
              <button
                className={`floating-tool-button ${tool === tools.TEXT ? 'active' : ''}`}
                onClick={() => setTool(tools.TEXT)}
                title="Text"
              >
                <i className="fas fa-font"></i>
              </button>
              <button
                className={`floating-tool-button ${tool === tools.ERASER ? 'active' : ''}`}
                onClick={() => setTool(tools.ERASER)}
                title="Eraser"
              >
                <i className="fas fa-eraser"></i>
              </button>
              <button
                className="floating-tool-button"
                onClick={handleClearCanvas}
                title="Clear Canvas"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
              <button
                className="floating-tool-button"
                onClick={saveAsImage}
                title="Save as Image"
              >
                <i className="fas fa-download"></i>
              </button>
              <button
                className="floating-tool-button"
                onClick={() => setUiMode('toolbar')}
                title="Switch to Toolbar UI"
              >
                <i className="fas fa-compress-arrows-alt"></i>
              </button>
            </div>
            
            {/* Color palette at the bottom */}
            <div className="color-palette">
              {predefinedColors.map((presetColor) => (
                <div
                  key={presetColor}
                  className={`color-option ${color === presetColor ? 'active' : ''}`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                  title={presetColor}
                />
              ))}
              <input
                type="range"
                min="1"
                max="20"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                title="Line Width"
                style={{ marginLeft: '8px', width: '100px' }}
              />
            </div>
          </>
        )}
        
        {tool === tools.TEXT && action === 'writing' && textPosition && (
          <div
            className="text-input-container"
            style={{
              position: 'absolute',
              left: textPosition.x,
              top: textPosition.y - 16,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              zIndex: 1000, // Ensure it's above everything else
            }}
          >
            <textarea
              ref={textAreaRef}
              className="text-input"
              autoFocus
              value={text}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              onKeyDown={(e) => {
                // Submit on Enter (without shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextBlur();
                }
              }}
              style={getTextInputStyle()}
              placeholder="Type your text here..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Whiteboard; 