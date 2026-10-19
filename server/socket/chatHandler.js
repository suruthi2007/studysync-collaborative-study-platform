// In-memory chat message history per room (keeps last 200 messages for instant sync)
const roomUsers = new Map();
const roomMessages = new Map();

/**
 * Helper to record and broadcast system or chat messages
 */
function addChatMessage(roomId, message) {
  if (!roomId || !message) return;
  if (!roomMessages.has(roomId)) {
    roomMessages.set(roomId, []);
  }
  const history = roomMessages.get(roomId);
  history.push(message);
  if (history.length > 200) {
    history.shift();
  }
}

function registerChatHandlers(io, socket) {
  // Join study room live chat
  socket.on('chat-join', ({ roomId, user }) => {
    if (!roomId) return;
    socket.join(`chat:${roomId}`);
    
    const safeUser = user || { 
      id: socket.id, 
      name: 'Student', 
      avatar: '' 
    };
    socket.data.user = safeUser;
    socket.data.roomId = roomId;

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    const currentUsers = roomUsers.get(roomId);
    currentUsers.set(socket.id, safeUser);

    // 1. Send existing room chat history to newly joined client
    const currentHistory = roomMessages.get(roomId) || [];
    socket.emit('chat-init-messages', { messages: currentHistory });

    // 2. Notify room of active user list
    io.to(`chat:${roomId}`).emit('chat-users-update', Array.from(currentUsers.values()));

    // 3. Broadcast system message that user joined
    const joinMsg = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: { name: 'StudySync Bot', avatar: '' },
      text: `${safeUser.name || 'A student'} joined the study room.`,
      isSystem: true,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(roomId, joinMsg);
    socket.to(`chat:${roomId}`).emit('chat-message', joinMsg);
  });

  // User sends a new message
  socket.on('chat-send-message', ({ roomId, message }) => {
    if (!roomId || !message) return;

    const sender = message.sender || socket.data.user || { name: 'Student' };
    const formattedMessage = {
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sender: {
        id: sender.id || sender._id || socket.id,
        name: sender.name || 'Student',
        avatar: sender.avatar || '',
      },
      text: String(message.text || '').trim(),
      timestamp: message.timestamp || new Date().toISOString(),
    };

    addChatMessage(roomId, formattedMessage);

    // Broadcast to everyone in the room (including sender)
    io.to(`chat:${roomId}`).emit('chat-message', formattedMessage);
  });

  // Typing indicator
  socket.on('chat-typing', ({ roomId, isTyping }) => {
    if (!roomId || !socket.data.user) return;
    socket.to(`chat:${roomId}`).emit('chat-user-typing', {
      user: socket.data.user,
      isTyping,
    });
  });

  // Disconnect cleanup for chat
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId && roomUsers.has(roomId)) {
      const users = roomUsers.get(roomId);
      users.delete(socket.id);
      io.to(`chat:${roomId}`).emit('chat-users-update', Array.from(users.values()));
    }
  });
}

module.exports = {
  registerChatHandlers,
  addChatMessage,
  roomMessages,
};

