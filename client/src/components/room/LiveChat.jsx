import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Users, MessageSquare, Sparkles } from 'lucide-react';

export default function LiveChat({ roomId }) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  // Persistent message state with session fallback
  const [messages, setMessages] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`studysync_chat_${roomId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [inputText, setInputText] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Sync to sessionStorage so refreshing never loses the visual chat log
  useEffect(() => {
    try {
      if (roomId && messages.length > 0) {
        sessionStorage.setItem(`studysync_chat_${roomId}`, JSON.stringify(messages.slice(-100)));
      }
    } catch {
      // Ignore quota error if storage is restricted
    }
  }, [messages, roomId]);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const currentSender = {
      id: user?._id || user?.id || 'demo-user',
      name: user?.name || 'Student',
      avatar: user?.avatar || '',
    };

    const joinChat = () => {
      socket.emit('chat-join', {
        roomId,
        user: currentSender,
      });
    };

    // Join immediately and re-join automatically whenever socket reconnects
    joinChat();
    socket.on('connect', joinChat);

    // Initial message history sent by server
    const handleInitMessages = ({ messages: serverMessages }) => {
      if (Array.isArray(serverMessages) && serverMessages.length > 0) {
        setMessages((prev) => {
          const map = new Map();
          // Insert server history
          serverMessages.forEach((m) => {
            if (m && m.id) map.set(m.id, m);
          });
          // Preserve any local un-synced messages
          prev.forEach((m) => {
            if (m && m.id) map.set(m.id, m);
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    };

    // Live incoming message broadcast
    const handleMessage = (msg) => {
      if (!msg || !msg.id) return;
      setMessages((prev) => {
        // Prevent duplicate if already shown optimistically
        if (prev.some((m) => m.id === msg.id)) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    const handleUsersUpdate = (usersList) => {
      if (Array.isArray(usersList)) {
        setActiveUsers(usersList);
      }
    };

    const handleUserTyping = ({ user: typingUser, isTyping }) => {
      if (!typingUser || !typingUser.name) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) {
          next[typingUser.name] = true;
        } else {
          delete next[typingUser.name];
        }
        return next;
      });
    };

    socket.on('chat-init-messages', handleInitMessages);
    socket.on('chat-message', handleMessage);
    socket.on('chat-users-update', handleUsersUpdate);
    socket.on('chat-user-typing', handleUserTyping);

    return () => {
      socket.off('connect', joinChat);
      socket.off('chat-init-messages', handleInitMessages);
      socket.off('chat-message', handleMessage);
      socket.off('chat-users-update', handleUsersUpdate);
      socket.off('chat-user-typing', handleUserTyping);
    };
  }, [socket, roomId, user]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && roomId) {
      socket.emit('chat-typing', { roomId, isTyping: true });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat-typing', { roomId, isTyping: false });
      }, 1500);
    }
  };

  const handleSendMessage = (e, customText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = (customText !== null ? customText : inputText).trim();
    if (!textToSend || !roomId) return;

    const sender = {
      id: user?._id || user?.id || 'demo-user',
      name: user?.name || 'Student',
      avatar: user?.avatar || '',
    };

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: textToSend,
      sender,
      timestamp: new Date().toISOString(),
    };

    // 1. Optimistic instant display for zero perceivable delay
    setMessages((prev) => [...prev, newMsg]);
    if (customText === null) {
      setInputText('');
    }

    // 2. Broadcast to room via socket
    if (socket) {
      socket.emit('chat-send-message', {
        roomId,
        message: newMsg,
      });
      socket.emit('chat-typing', { roomId, isTyping: false });
    }
  };

  const typingNames = Object.keys(typingUsers);

  // Quick preset chips for rapid demo interaction
  const quickChips = ['👋 Hello!', '💡 Great point!', '❓ Quick question', '👍 Got it'];

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '560px',
      overflow: 'hidden',
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={16} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Room Discussion</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Users size={14} />
          <span>{Math.max(activeUsers.length, 1)} online</span>
        </div>
      </div>

      {/* Online Participants Pills */}
      <div style={{
        padding: '0.4rem 0.75rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
      }}>
        {activeUsers.length > 0 ? (
          activeUsers.map((u, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '999px',
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="online-pulse" style={{ width: '6px', height: '6px' }} />
              <span>{u.name}</span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            🟢 {user?.name || 'You'} (connected)
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div 
        ref={messagesContainerRef}
        style={{
          flex: 1,
          padding: '0.85rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>No messages yet. Say hello to your study peers!</p>
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {quickChips.slice(0, 2).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(null, chip)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            if (m.isSystem) {
              if (m.isCallNotification) {
                return (
                  <div
                    key={m.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(99, 102, 241, 0.16) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '10px',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      color: '#6ee7b7',
                    }}
                  >
                    <span className="online-pulse" style={{ backgroundColor: '#10b981', width: '8px', height: '8px' }} />
                    <span>{m.text}</span>
                  </div>
                );
              }
              return (
                <div key={m.id} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {m.text}
                </div>
              );
            }

            const isMine = m.sender?.name === user?.name;

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>{m.sender?.name || 'Student'}</span>
                  <span>•</span>
                  <span>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                </div>
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    background: isMine ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : 'rgba(30, 41, 59, 0.8)',
                    color: '#ffffff',
                    border: isMine ? 'none' : '1px solid var(--border-color)',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Typing Indicator */}
      {typingNames.length > 0 && (
        <div style={{ padding: '0.2rem 1rem', fontSize: '0.7rem', color: '#a5b4fc', fontStyle: 'italic' }}>
          {typingNames.join(', ')} {typingNames.length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      {/* Quick Reaction Pills */}
      <div style={{
        padding: '0.3rem 0.75rem',
        background: 'rgba(15, 23, 42, 0.5)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: '0.35rem',
        overflowX: 'auto',
      }}>
        {quickChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleSendMessage(null, chip)}
            style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              borderRadius: '999px',
              color: 'var(--text-secondary)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form onSubmit={(e) => handleSendMessage(e)} style={{
        padding: '0.65rem 0.75rem',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
      }}>
        <input
          type="text"
          className="input-field"
          placeholder="Type a question or message..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          style={{
            flex: 1,
            padding: '0.55rem 0.85rem',
            fontSize: '0.85rem',
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!inputText.trim()}
          style={{
            padding: '0.55rem 0.85rem',
            opacity: !inputText.trim() ? 0.6 : 1,
            cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

