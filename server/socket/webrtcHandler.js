const roomPeers = new Map();

/**
 * WebRTC Signaling Handler for multi-user peer-to-peer video/audio calling.
 * Handles peer discovery, offer/answer exchange, ICE candidates, and clean disconnects.
 */
function registerWebRTCHandlers(io, socket) {
  // Join video mesh room
  socket.on('video-join-room', ({ roomId, userId, userName }) => {
    socket.join(`video:${roomId}`);
    socket.data.videoRoomId = roomId;
    socket.data.userId = userId;
    socket.data.userName = userName;

    if (!roomPeers.has(roomId)) {
      roomPeers.set(roomId, new Set());
    }

    const peersInRoom = Array.from(roomPeers.get(roomId)).filter(id => id !== socket.id);
    roomPeers.get(roomId).add(socket.id);

    // Send the list of existing peers in the room to the new peer
    socket.emit('video-all-peers', {
      peers: peersInRoom,
    });

    // Notify others that a new user joined the call
    socket.to(`video:${roomId}`).emit('video-user-joined', {
      callerId: socket.id,
      userId,
      userName,
    });
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
  if (roomId && roomPeers.has(roomId)) {
    roomPeers.get(roomId).delete(socket.id);
    io.to(`video:${roomId}`).emit('video-user-left', {
      socketId: socket.id,
      userId: socket.data.userId,
    });
  }
}

module.exports = {
  registerWebRTCHandlers,
};
