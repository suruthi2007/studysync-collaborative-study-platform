import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Users, MessageSquare } from 'lucide-react';

export default function LiveChat({ roomId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
    if (!socket || !roomId || !user) return;

    // Join room chat
    socket.emit('chat-join', {
      roomId,
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
    });

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleUsersUpdate = (usersList) => {
      setActiveUsers(usersList);
    };

    const handleUserTyping = ({ user: typingUser, isTyping }) => {
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

    socket.on('chat-message', handleMessage);
    socket.on('chat-users-update', handleUsersUpdate);
    socket.on('chat-user-typing', handleUserTyping);

    return () => {
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !roomId) return;

    socket.emit('chat-send-message', {
      roomId,
      message: {
        text: inputText.trim(),
        sender: {
          id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
      },
    });

    socket.emit('chat-typing', { roomId, isTyping: false });
    setInputText('');
  };

  const typingNames = Object.keys(typingUsers);

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
          <span>{activeUsers.length || 1} online</span>
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
        {activeUsers.map((u, i) => (
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
        ))}
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
            No messages yet. Say hello to your study peers!
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
                  <span>{m.sender?.name}</span>
                  <span>•</span>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} style={{
        padding: '0.75rem',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        gap: '0.5rem',
      }}>
        <input
          type="text"
          className="input-field"
          placeholder="Type a question or message..."
          value={inputText}
          onChange={handleInputChange}
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 0.85rem' }}>
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
