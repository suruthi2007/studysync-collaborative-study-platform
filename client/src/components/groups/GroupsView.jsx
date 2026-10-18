import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import ResourceDrive from './ResourceDrive';
import { 
  Users, 
  Plus, 
  KeyRound, 
  Share2, 
  Video, 
  BookOpen, 
  FolderGit2, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function GroupsView({ onSelectRoom, onSelectQuiz, activeGroup, setActiveGroup }) {
  const { token, user, switchPersona } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedGroupTab, setSelectedGroupTab] = useState('drive'); // 'drive' or 'info'

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('Mathematics');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366f1');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      let activeToken = token || localStorage.getItem('studysync_token');
      const res = await fetch(`${API_BASE_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
        if (!activeGroup && data.groups.length > 0) {
          setActiveGroup(data.groups[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [token]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setIsCreating(true);
      let activeToken = token || localStorage.getItem('studysync_token');

      let res = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          subject: newGroupSubject,
          description: newGroupDesc.trim(),
          color: newGroupColor,
        }),
      });

      // If token expired / invalid after server restart, recover automatically
      if (res.status === 401 && switchPersona) {
        await switchPersona(user?.name?.toLowerCase().includes('bob') ? 'bob' : 'alice');
        activeToken = localStorage.getItem('studysync_token');
        res = await fetch(`${API_BASE_URL}/api/groups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            name: newGroupName.trim(),
            subject: newGroupSubject,
            description: newGroupDesc.trim(),
            color: newGroupColor,
          }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
        await fetchGroups();
        if (data.group) {
          setActiveGroup(data.group);
        }
      } else {
        alert(data.message || 'Could not create group.');
      }
    } catch (err) {
      alert('Failed to create group: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCodeInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowJoinModal(false);
        setInviteCodeInput('');
        fetchGroups();
        setActiveGroup(data.group);
      } else {
        alert(data.message || 'Could not join group');
      }
    } catch (err) {
      alert('Failed to join group: ' + err.message);
    }
  };

  const copyInviteLink = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '650px' }}>
            <div className="badge badge-indigo" style={{ marginBottom: '0.75rem' }}>
              <Sparkles size={13} /> Phase 1: Study Groups & Resource Hub
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Library Study Group, Recreated Digitally
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Form peer groups, share lecture notes and PDFs in a secure repository, and jump into real-time collaborative rooms with one click.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowJoinModal(true)} className="btn btn-secondary">
              <KeyRound size={16} /> Join via Invite Code
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} /> Create Study Group
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Groups List (Left) & Active Group Hub (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Study Groups List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#6366f1" /> Your Study Groups ({groups.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading study groups...</div>
          ) : groups.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Users size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>You haven't joined any study groups yet.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Create Your First Group
              </button>
            </div>
          ) : (
            groups.map((group) => {
              const isSelected = activeGroup?._id === group._id;
              return (
                <div
                  key={group._id}
                  onClick={() => setActiveGroup(group)}
                  className="glass-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: isSelected ? 'rgba(30, 41, 59, 0.85)' : 'rgba(30, 41, 59, 0.45)',
                    borderLeft: `4px solid ${group.color || '#6366f1'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span className="badge badge-indigo" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>
                        {group.subject}
                      </span>
                      <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{group.name}</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteLink(group.inviteCode);
                      }}
                      className="btn btn-secondary"
                      title="Copy group invite code"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      {copiedCode === group.inviteCode ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={12} /> Copied!
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Share2 size={12} /> {group.inviteCode}
                        </span>
                      )}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {group.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Users size={14} />
                      <span>{group.members?.length || 1} members</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGroup(group);
                          onSelectRoom(group);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Video size={13} /> Join Room
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Group Hub (Details & Resource Hub) */}
        <div style={{ flex: 2 }}>
          {activeGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Group Banner & Fast Actions */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderTop: `4px solid ${activeGroup.color || '#6366f1'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.5rem' }}>{activeGroup.name}</h2>
                      <span className="badge badge-indigo">{activeGroup.subject}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {activeGroup.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => onSelectRoom(activeGroup)}
                      className="btn btn-emerald"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <Video size={16} /> Enter Live Room
                    </button>
                    <button
                      onClick={() => onSelectQuiz(activeGroup)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <BookOpen size={16} /> Group Quizzes
                    </button>
                  </div>
                </div>
              </div>

              {/* Resource Hub for this Group */}
              <ResourceDrive group={activeGroup} />
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Select a study group on the left to view its resource drive and collaborative features.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Study Group */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: '#111827' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Create New Study Group</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Create a group and invite peers via link to study, draw, and test together.
            </p>

            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus 101 or Bio Chemistry Prep"
                  className="input-field"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                    Subject
                  </label>
                  <select
                    className="input-field"
                    value={newGroupSubject}
                    onChange={(e) => setNewGroupSubject(e.target.value)}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                    Theme Accent
                  </label>
                  <select
                    className="input-field"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                  >
                    <option value="#6366f1">Indigo</option>
                    <option value="#059669">Emerald</option>
                    <option value="#d97706">Amber</option>
                    <option value="#e11d48">Rose</option>
                    <option value="#0284c7">Sky Blue</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Description / Study Goals
                </label>
                <textarea
                  rows={3}
                  placeholder="Weekly problem solving, exam review, and whiteboard sessions..."
                  className="input-field"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creating Group...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join via Invite Code */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#111827' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Join Study Group</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Enter the unique invite code or link provided by your classmate.
            </p>

            <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Invite Code (e.g. calc-101 or cs50-algo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste invite code here..."
                  className="input-field"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
