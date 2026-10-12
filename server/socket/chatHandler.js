const roomUsers = new Map();

function registerChatHandlers(io, socket) {
  // Join study room live chat
  socket.on('chat-join', ({ roomId, user }) => {
    socket.join(`chat:${roomId}`);
    socket.data.user = user;
    socket.data.roomId = roomId;

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    const currentUsers = roomUsers.get(roomId);
    currentUsers.set(socket.id, user);

    // Notify room of user list
    io.to(`chat:${roomId}`).emit('chat-users-update', Array.from(currentUsers.values()));

    // Broadcast system message that user joined
    socket.to(`chat:${roomId}`).emit('chat-message', {
      id: `sys-${Date.now()}-${Math.random()}`,
      sender: { name: 'StudySync Bot', avatar: '' },
      text: `${user.name} joined the study room.`,
      isSystem: true,
      timestamp: new Date().toISOString(),
    });
  });

  // User sends a new message
  socket.on('chat-send-message', ({ roomId, message }) => {
    if (!roomId || !message) return;

    const formattedMessage = {
      id: message.id || `msg-${Date.now()}-${Math.random()}`,
      sender: socket.data.user || message.sender || { name: 'Student' },
      text: message.text,
      timestamp: new Date().toISOString(),
    };

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
};
