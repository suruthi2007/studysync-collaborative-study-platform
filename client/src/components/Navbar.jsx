import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Users, 
  Video, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeGroup }) {
  const { user, switchPersona } = useAuth();
  const { isConnected } = useSocket();

  const navItems = [
    { id: 'groups', label: 'Study Groups', icon: Users },
    { id: 'room', label: 'Virtual Study Room', icon: Video, badge: activeGroup ? activeGroup.name : 'Join Room' },
    { id: 'quizzes', label: 'Quizzes & Rank', icon: BookOpen },
    { id: 'tutors', label: 'Tutor Marketplace', icon: GraduationCap },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(10, 14, 23, 0.92)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.4rem 1rem',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem',
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('groups')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            padding: '0.4rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.15rem',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #ffffff 0%, #c7d2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                StudySync
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                Collab Hub
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span className={isConnected ? "online-pulse" : ""} style={{ backgroundColor: isConnected ? '#10b981' : '#ef4444' }} />
              <span>{isConnected ? 'Real-Time Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                  color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.62rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '999px',
                    background: isActive ? '#4f46e5' : 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Multi-Window Demo Persona Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.2rem 0.4rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Demo Switch:</span>
            <button
              onClick={() => switchPersona('alice')}
              title="Test as Alice (Student)"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: user?.name?.includes('Alice') ? '#6366f1' : 'transparent',
                color: user?.name?.includes('Alice') ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              👩 Alice
            </button>
            <button
              onClick={() => switchPersona('bob')}
              title="Test as Bob in second browser window"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: user?.name?.includes('Bob') ? '#10b981' : 'transparent',
                color: user?.name?.includes('Bob') ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              👨 Bob
            </button>
            <button
              onClick={() => switchPersona('tutor')}
              title="Test as Dr. Sarah (Verified Tutor)"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: user?.name?.includes('Sarah') ? '#f59e0b' : 'transparent',
                color: user?.name?.includes('Sarah') ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              🎓 Tutor
            </button>
          </div>

          {/* Active User Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img 
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`} 
              alt={user?.name || 'User'} 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '2px solid var(--accent-primary)',
                background: '#1e293b',
              }}
            />
            <div style={{ display: 'none', sm: 'block' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{user?.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
