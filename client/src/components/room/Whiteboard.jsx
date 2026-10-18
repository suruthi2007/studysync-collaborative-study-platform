import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Download, 
  Square, 
  Circle, 
  Minus, 
  MousePointer, 
  Palette,
  Sparkles
} from 'lucide-react';

export default function Whiteboard({ roomId }) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'line' | 'rect' | 'circle'
  const [color, setColor] = useState('#6366f1');
  const [lineWidth, setLineWidth] = useState(3);
  const [remoteCursors, setRemoteCursors] = useState({});

  // Coordinate tracking
  const prevCoordRef = useRef({ x: 0, y: 0 });
  const startShapeCoordRef = useRef({ x: 0, y: 0 });
  const canvasSnapshotRef = useRef(null);

  // Color options
  const colors = [
    '#ffffff', // White
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f43f5e', // Rose
    '#06b6d4', // Cyan
    '#a855f7', // Purple
  ];

  // Draw segment helper using HTML5 Canvas API (moveTo, lineTo)
  const drawSegment = useCallback((ctx, segment) => {
    if (!ctx) return;
    const { prevX, prevY, currX, currY, color, width, tool, shapeType } = segment;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = width * 3;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(currX, currY);
      ctx.stroke();
    } else if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(currX, currY);
      ctx.stroke();
    } else if (shapeType === 'rect') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.strokeRect(prevX, prevY, currX - prevX, currY - prevY);
    } else if (shapeType === 'circle') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      const radius = Math.sqrt(Math.pow(currX - prevX, 2) + Math.pow(currY - prevY, 2));
      ctx.arc(prevX, prevY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shapeType === 'line') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(currX, currY);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Setup canvas size
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Preserve existing drawing before resize
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 460; // Clean balanced height for room whiteboard

    const ctx = canvas.getContext('2d');
    ctx.drawImage(tempCanvas, 0, 0);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Socket listeners for real-time collaboration
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room whiteboard channel
    socket.emit('wb-join', { roomId });

    // Initial state upon entering room
    const handleInitState = ({ actions }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (actions && actions.length > 0) {
        actions.forEach((seg) => drawSegment(ctx, seg));
      }
    };

    // Receive live drawn segment from peer
    const handleDrawSegment = (segment) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawSegment(ctx, segment);
    };

    // Clear event
    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Remote peer cursor
    const handleCursorMoved = ({ socketId, x, y, userName }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, userName, lastUpdated: Date.now() },
      }));
    };

    socket.on('wb-init-state', handleInitState);
    socket.on('wb-draw-segment', handleDrawSegment);
    socket.on('wb-clear', handleClear);
    socket.on('wb-cursor-moved', handleCursorMoved);

    return () => {
      socket.off('wb-init-state', handleInitState);
      socket.off('wb-draw-segment', handleDrawSegment);
      socket.off('wb-clear', handleClear);
      socket.off('wb-cursor-moved', handleCursorMoved);
    };
  }, [socket, roomId, drawSegment]);

  // Mouse / Touch drawing handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    prevCoordRef.current = { x, y };
    startShapeCoordRef.current = { x, y };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Take snapshot for previewing shapes (rect/circle/line)
    if (tool !== 'brush' && tool !== 'eraser') {
      canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e) => {
    const { x, y } = getCanvasCoords(e);

    // Broadcast cursor position to room
    if (socket && roomId) {
      socket.emit('wb-cursor', {
        roomId,
        x,
        y,
        userName: user?.name || 'Peer',
      });
    }

    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (tool === 'brush' || tool === 'eraser') {
      const segment = {
        type: 'stroke',
        prevX: prevCoordRef.current.x,
        prevY: prevCoordRef.current.y,
        currX: x,
        currY: y,
        color: tool === 'eraser' ? '#000000' : color,
        width: lineWidth,
        tool,
      };

      // Draw locally
      drawSegment(ctx, segment);

      // Broadcast coordinates to room clients via Socket.io
      if (socket && roomId) {
        socket.emit('wb-draw-segment', { roomId, segment });
      }

      prevCoordRef.current = { x, y };
    } else {
      // For shapes: restore snapshot then draw preview
      if (canvasSnapshotRef.current) {
        ctx.putImageData(canvasSnapshotRef.current, 0, 0);
      }
      const segment = {
        type: 'shape',
        prevX: startShapeCoordRef.current.x,
        prevY: startShapeCoordRef.current.y,
        currX: x,
        currY: y,
        color,
        width: lineWidth,
        shapeType: tool,
      };
      drawSegment(ctx, segment);
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool !== 'brush' && tool !== 'eraser') {
      const { x, y } = getCanvasCoords(e);
      const segment = {
        type: 'shape',
        prevX: startShapeCoordRef.current.x,
        prevY: startShapeCoordRef.current.y,
        currX: x,
        currY: y,
        color,
        width: lineWidth,
        shapeType: tool,
      };

      // Broadcast completed shape
      if (socket && roomId) {
        socket.emit('wb-draw-segment', { roomId, segment });
      }
    }
  };

  const clearCanvas = () => {
    if (!confirm('Clear whiteboard for all connected peers?')) return;
    if (socket && roomId) {
      socket.emit('wb-clear', { roomId });
    }
  };

  const undoLast = () => {
    if (socket && roomId) {
      socket.emit('wb-undo', { roomId });
    }
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `StudySync_Whiteboard_${roomId}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top Whiteboard Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.7)',
        flexWrap: 'wrap',
        gap: '0.4rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge badge-indigo">
            <Sparkles size={12} /> HTML5 Canvas + Socket.io Live Sync
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Coordinates broadcasted in real-time across all connected clients
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={undoLast}
            className="btn btn-secondary"
            title="Undo stroke"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <RotateCcw size={14} /> Undo
          </button>
          <button
            onClick={clearCanvas}
            className="btn btn-danger"
            title="Clear board"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Trash2 size={14} /> Clear
          </button>
          <button
            onClick={downloadWhiteboard}
            className="btn btn-secondary"
            title="Save drawing as PNG"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Download size={14} /> Export PNG
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef} 
        className="whiteboard-canvas-container"
        style={{ position: 'relative', width: '100%', height: '460px', userSelect: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {/* Remote Cursors Overlay */}
        {Object.entries(remoteCursors).map(([peerId, cursor]) => {
          if (Date.now() - cursor.lastUpdated > 4000) return null; // Fade inactive cursor
          return (
            <div
              key={peerId}
              style={{
                position: 'absolute',
                left: cursor.x,
                top: cursor.y,
                pointerEvents: 'none',
                transition: 'left 0.08s linear, top 0.08s linear',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transform: 'translate(-2px, -2px)',
                zIndex: 10,
              }}
            >
              <MousePointer size={18} color="#10b981" style={{ fill: '#10b981' }} />
              <span style={{
                background: '#10b981',
                color: '#fff',
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>
                {cursor.userName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Canvas Floating Toolbar */}
      <div className="canvas-toolbar">
        {/* Tool Selector */}
        <div style={{ display: 'flex', gap: '0.35rem', paddingRight: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setTool('brush')}
            className={`btn ${tool === 'brush' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.7rem' }}
            title="Brush Pen"
          >
            <PenTool size={16} /> Brush
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`btn ${tool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.7rem' }}
            title="Eraser"
          >
            <Eraser size={16} /> Eraser
          </button>
          <button
            onClick={() => setTool('line')}
            className={`btn ${tool === 'line' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.7rem' }}
            title="Line Tool"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`btn ${tool === 'rect' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.7rem' }}
            title="Rectangle"
          >
            <Square size={16} />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`btn ${tool === 'circle' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.7rem' }}
            title="Circle"
          >
            <Circle size={16} />
          </button>
        </div>

        {/* Color Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingRight: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('brush');
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: c,
                border: color === c && tool !== 'eraser' ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transform: color === c && tool !== 'eraser' ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              title={c}
            />
          ))}
        </div>

        {/* Brush Size Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          <span>Size:</span>
          <input
            type="range"
            min="2"
            max="25"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ width: '80px', accentColor: '#6366f1' }}
          />
          <span>{lineWidth}px</span>
        </div>
      </div>
    </div>
  );
}
