import React from 'react';
import Whiteboard from './Whiteboard';
import LiveChat from './LiveChat';
import VideoCall from './VideoCall';
import { Video, Share2, ArrowLeft, Sparkles, Users } from 'lucide-react';

export default function StudyRoomView({ group, onBack }) {
  const roomId = group ? group._id : 'default-study-room';

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Room Bar */}
      <div className="glass-panel" style={{
        padding: '0.6rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem',
        borderLeft: `4px solid ${group?.color || '#6366f1'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
            <ArrowLeft size={15} /> All Groups
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h2 style={{ fontSize: '1.15rem' }}>{group?.name || 'Virtual Study Room'}</h2>
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{group?.subject || 'STEM'}</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Live Session</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Room ID: {roomId} • Real-time whiteboard & synchronized group chat
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(group?.inviteCode || roomId);
              alert(`Copied Invite Code: ${group?.inviteCode || roomId}`);
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            <Share2 size={14} /> Invite: {group?.inviteCode || 'calc-101'}
          </button>
        </div>
      </div>

      {/* Main Study Stage: Whiteboard + Video (Left/Center) & Chat (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(310px, 1fr)',
        gap: '0.75rem',
        alignItems: 'start',
      }}>
        {/* Left / Center Column: Video Strip + Collaborative Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
