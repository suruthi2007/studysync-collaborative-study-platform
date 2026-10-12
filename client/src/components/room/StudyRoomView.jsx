import React from 'react';
import Whiteboard from './Whiteboard';
import LiveChat from './LiveChat';
import VideoCall from './VideoCall';
import { Video, Share2, ArrowLeft, Sparkles, Users } from 'lucide-react';

export default function StudyRoomView({ group, onBack }) {
  const roomId = group ? group._id : 'default-study-room';

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Room Bar */}
      <div className="glass-panel" style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        borderLeft: `4px solid ${group?.color || '#6366f1'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <ArrowLeft size={16} /> All Groups
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.3rem' }}>{group?.name || 'Virtual Study Room'}</h2>
              <span className="badge badge-indigo">{group?.subject || 'STEM'}</span>
              <span className="badge badge-emerald">Live Study Session</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Room ID: {roomId} • Real-time whiteboard & synchronized group chat
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(group?.inviteCode || roomId);
              alert(`Copied Invite Code: ${group?.inviteCode || roomId}`);
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            <Share2 size={15} /> Invite Code: {group?.inviteCode || 'calc-101'}
          </button>
        </div>
      </div>

      {/* Main Study Stage: Whiteboard + Video (Left/Center) & Chat (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.5fr) minmax(320px, 1fr)',
        gap: '1.25rem',
        alignItems: 'start',
      }}>
        {/* Left / Center Column: Video Strip + Collaborative Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Real-time Video Call */}
          <VideoCall roomId={roomId} />

          {/* HTML5 Collaborative Whiteboard */}
          <Whiteboard roomId={roomId} />
        </div>

        {/* Right Column: Live Chat & Presence */}
        <div>
          <LiveChat roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
