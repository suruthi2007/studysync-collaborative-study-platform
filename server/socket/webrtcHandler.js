const roomPeers = new Map();
// Stores active callers per room: Map<roomId, Map<socketId, { socketId, userId, userName }>>
const roomCallers = new Map();
const { addChatMessage } = require('./chatHandler');

/**
 * WebRTC Signaling Handler for multi-user peer-to-peer video/audio calling.
 * Handles peer discovery, offer/answer exchange, ICE candidates, and real-time room notifications.
 */
function registerWebRTCHandlers(io, socket) {
  // Check active video callers for a room
  socket.on('video-get-status', ({ roomId }) => {
    if (!roomId) return;
    const callersMap = roomCallers.get(roomId);
    const callers = callersMap ? Array.from(callersMap.values()) : [];
    socket.emit('video-room-status', {
      roomId,
      callers,
      isCallActive: callers.length > 0,
    });
  });

  // Join video mesh room
  socket.on('video-join-room', ({ roomId, userId, userName }) => {
    socket.join(`video:${roomId}`);
    socket.data.videoRoomId = roomId;
    socket.data.userId = userId;
    socket.data.userName = userName;

    if (!roomPeers.has(roomId)) {
      roomPeers.set(roomId, new Set());
    }

    if (!roomCallers.has(roomId)) {
      roomCallers.set(roomId, new Map());
    }

    const peersInRoom = Array.from(roomPeers.get(roomId)).filter(id => id !== socket.id);
    roomPeers.get(roomId).add(socket.id);

    const callersMap = roomCallers.get(roomId);
    callersMap.set(socket.id, {
      socketId: socket.id,
      userId,
      userName: userName || 'Student',
      joinedAt: new Date().toISOString(),
    });

    const currentCallers = Array.from(callersMap.values());

    // 1. Send existing video peers to the newly joined peer for WebRTC mesh handshake
    socket.emit('video-all-peers', {
      peers: peersInRoom,
    });

    // 2. Notify other active video peers so they establish a peer connection
    socket.to(`video:${roomId}`).emit('video-user-joined', {
      callerId: socket.id,
      userId,
      userName,
    });

    // 3. Broadcast to EVERYONE in the study room (chat channel) that a call is active & who is in it!
    io.to(`chat:${roomId}`).emit('video-room-status', {
      roomId,
      callers: currentCallers,
      isCallActive: true,
    });

    // 4. Send an incoming call notification / alert to peers who haven't joined the call yet
    socket.to(`chat:${roomId}`).emit('video-incoming-call-alert', {
      callerName: userName || 'A study partner',
      callerId: socket.id,
      roomId,
      timestamp: new Date().toISOString(),
    });

    // 5. Post an automated system message into the chat room
    const callNotice = {
      id: `call-start-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: { name: 'StudySync Live', avatar: '' },
      text: `📹 ${userName || 'A student'} started a video study call.`,
      isSystem: true,
      isCallNotification: true,
      callerName: userName,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(roomId, callNotice);
    io.to(`chat:${roomId}`).emit('chat-message', callNotice);
  });


  // Relay WebRTC signal offer
  socket.on('video-signal-offer', ({ targetSocketId, offer, callerId, userName }) => {
    io.to(targetSocketId).emit('video-receive-offer', {
      offer,
      callerId: callerId || socket.id,
      userName: userName || socket.data.userName,
    });
  });

  // Relay WebRTC signal answer
  socket.on('video-signal-answer', ({ targetSocketId, answer, callerId }) => {
    io.to(targetSocketId).emit('video-receive-answer', {
      answer,
      callerId: callerId || socket.id,
    });
  });

  // Relay ICE Candidates
  socket.on('video-ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('video-receive-ice-candidate', {
      candidate,
      senderSocketId: socket.id,
    });
  });

  // Participant leaves or toggles media
  socket.on('video-leave-room', () => {
    handleVideoLeave(socket, io);
  });

  socket.on('disconnect', () => {
    handleVideoLeave(socket, io);
  });
}

function handleVideoLeave(socket, io) {
  const roomId = socket.data.videoRoomId;
  const userName = socket.data.userName;

  if (roomId && roomPeers.has(roomId)) {
    roomPeers.get(roomId).delete(socket.id);
    io.to(`video:${roomId}`).emit('video-user-left', {
      socketId: socket.id,
      userId: socket.data.userId,
    });
  }

  if (roomId && roomCallers.has(roomId)) {
    const callersMap = roomCallers.get(roomId);
    callersMap.delete(socket.id);
    const currentCallers = Array.from(callersMap.values());

    // Broadcast updated call status to room
    io.to(`chat:${roomId}`).emit('video-room-status', {
      roomId,
      callers: currentCallers,
      isCallActive: currentCallers.length > 0,
    });

    if (userName) {
      io.to(`chat:${roomId}`).emit('chat-message', {
        id: `call-leave-${Date.now()}-${Math.random()}`,
        sender: { name: 'StudySync Live', avatar: '' },
        text: currentCallers.length === 0 
          ? `📞 The video call has ended.` 
          : `📞 ${userName} left the video call (${currentCallers.length} remaining).`,
        isSystem: true,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = {
  registerWebRTCHandlers,
};
