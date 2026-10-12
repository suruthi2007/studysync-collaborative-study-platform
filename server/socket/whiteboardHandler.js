// In-memory canvas stroke history per room to sync newly connected peers
const roomWhiteboardState = new Map();

/**
 * Clean implementation of the real-time drawing broadcasting logic.
 * Handles stroke broadcasting (moveTo, lineTo), shapes, clearing, and state synchronization.
 */
function registerWhiteboardHandlers(io, socket) {
  // Join specific study room whiteboard channel
  socket.on('wb-join', ({ roomId }) => {
    socket.join(`wb:${roomId}`);
    
    // Send existing canvas state to the newly joined client
    const currentActions = roomWhiteboardState.get(roomId) || [];
    socket.emit('wb-init-state', { actions: currentActions });
  });

  // User starts/continues drawing a stroke or shape
  // Emits coordinates (moveTo, lineTo) to all other peers in the room
  socket.on('wb-draw-segment', ({ roomId, segment }) => {
    // segment: { type: 'stroke' | 'shape', prevX, prevY, currX, currY, color, width, tool, shapeType }
    if (!roomId || !segment) return;

    if (!roomWhiteboardState.has(roomId)) {
      roomWhiteboardState.set(roomId, []);
    }

    const history = roomWhiteboardState.get(roomId);
    history.push(segment);

    // Limit in-memory strokes to 5000 per room to prevent memory explosion
    if (history.length > 5000) {
      history.shift();
    }

    // Broadcast coordinate segment to all other participants in the room
    socket.to(`wb:${roomId}`).emit('wb-draw-segment', segment);
  });

  // Clear canvas across all participants
  socket.on('wb-clear', ({ roomId }) => {
    if (!roomId) return;
    roomWhiteboardState.set(roomId, []);
    io.to(`wb:${roomId}`).emit('wb-clear');
  });

  // Undo last action in the room
  socket.on('wb-undo', ({ roomId }) => {
    if (!roomId) return;
    const history = roomWhiteboardState.get(roomId) || [];
    if (history.length > 0) {
      history.pop();
      // Resend fresh canvas state to everyone in room
      io.to(`wb:${roomId}`).emit('wb-init-state', { actions: history });
    }
  });

  // Cursor pointer sync (shows where other users' mouse is hovering on canvas)
  socket.on('wb-cursor', ({ roomId, x, y, userName }) => {
    socket.to(`wb:${roomId}`).emit('wb-cursor-moved', {
      socketId: socket.id,
      x,
      y,
      userName,
    });
  });
}

module.exports = {
  registerWhiteboardHandlers,
  roomWhiteboardState,
};
