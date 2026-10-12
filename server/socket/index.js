const { registerWhiteboardHandlers } = require('./whiteboardHandler');
const { registerChatHandlers } = require('./chatHandler');
const { registerWebRTCHandlers } = require('./webrtcHandler');

/**
 * Main Socket.io entry point.
 * Initializes real-time channels: Live Chat, Collaborative Whiteboard, WebRTC Signaling.
 */
function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Register all modular socket handlers
    registerWhiteboardHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerWebRTCHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });
}

module.exports = {
  initSocket,
};
