import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  ExternalLink,
  ShieldCheck, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ResourceDrive({ group }) {
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileTitle, setFileTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchResources = async () => {
    if (!group?._id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/resources/group/${group._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setResources(data.resources);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [group?._id, token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Please select a file to upload.' });
      return;
    }

    try {
      setUploading(true);
      setFeedback(null);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('groupId', group._id);
      formData.append('title', fileTitle || selectedFile.name);

      const res = await fetch(`${API_BASE_URL}/api/resources/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `File "${data.resource.title}" uploaded successfully to group repository!` });
        setSelectedFile(null);
        setFileTitle('');
        fetchResources();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Upload failed' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setResources(resources.filter(r => r._id !== resourceId));
        setFeedback({ type: 'success', message: 'Resource removed.' });
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <ImageIcon size={22} color="#38bdf8" />;
    return <FileText size={22} color="#f43f5e" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Access Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem 1.25rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
      }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📁 {group.name} - Resource Repository
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Shared file drive synced across all group members. Supports PDFs, slides, and diagrams.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
            <ShieldCheck size={14} /> Group-Only Encrypted
          </span>
          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
            AWS S3 / Cloud Drive
          </span>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: feedback.type === 'success' ? '#6ee7b7' : '#fda4af',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
        }}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Upload Zone */}
      <form onSubmit={handleUpload} className="glass-panel" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: '#c7d2fe' }}>
          Upload New Note or Study Material
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Resource Title / Topic
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Chapter 4 Integration Practice Problems"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Select File (PDF, Image, Doc)
            </label>
            <input
              type="file"
              className="input-field"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ padding: '0.5rem' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
            style={{ height: '42px' }}
          >
            <Upload size={16} />
            {uploading ? 'Uploading to S3...' : 'Upload Resource'}
          </button>
        </div>
      </form>

      {/* Files List */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '1rem' }}>Files in Drive ({resources.length})</h4>
          <button onClick={fetchResources} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
            Refresh Drive
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading group files...
          </div>
        ) : resources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <FileText size={42} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No documents uploaded yet in this study group.</p>
            <p style={{ fontSize: '0.8rem' }}>Upload your first PDF or lecture screenshot above!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {resources.map((res) => {
              const fileHref = res.fileUrl.startsWith('http') 
                ? res.fileUrl 
                : `${API_BASE_URL}${res.fileUrl}`;
              
              const isOwner = res.uploadedBy?._id === user?._id || group.createdBy?._id === user?._id;

              return (
                <div key={res._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        padding: '0.6rem',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {getFileIcon(res.fileType)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', wordBreak: 'break-word' }}>
                          {res.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {res.fileName}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      padding: '0.5rem 0',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      marginBottom: '0.75rem',
                    }}>
                      <span>Size: {formatBytes(res.fileSize)}</span>
                      <span>By: {res.uploadedBy?.name || 'Member'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={fileHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                    >
                      <ExternalLink size={14} /> View / Download
                    </a>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(res._id)}
                        className="btn btn-danger"
                        title="Delete resource"
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
