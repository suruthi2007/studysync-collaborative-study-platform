import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { Calendar, Video, Clock, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function MyBookings({ onBack, onEnterRoom }) {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState({ asStudent: [], asTutor: [] });
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings({
          asStudent: data.asStudent || [],
          asTutor: data.asTutor || [],
        });
      }
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert('Booking cancelled successfully.');
        fetchBookings();
      }
    } catch (e) {
      alert('Error cancelling booking: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Marketplace
        </button>
        <h2 style={{ fontSize: '1.4rem' }}>Scheduled Tutoring Appointments</h2>
        <button onClick={fetchBookings} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading appointments...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* As Student */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#c7d2fe' }}>
              Sessions You Booked ({bookings.asStudent.length})
            </h3>

            {bookings.asStudent.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                You have no scheduled sessions as a student. Book a tutor in the marketplace!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings.asStudent.map((b) => (
                  <div
                    key={b._id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderLeft: b.status === 'confirmed' ? '4px solid #10b981' : '4px solid #f43f5e',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className={`badge ${b.status === 'confirmed' ? 'badge-emerald' : 'badge-amber'}`}>
                          {b.status}
                        </span>
                        <strong style={{ fontSize: '1rem', color: '#fff' }}>
                          Tutor: {b.tutor?.name || 'Verified Mentor'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} /> {b.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} /> {b.timeSlot}
                        </span>
                        <span>Rate: ${b.hourlyRate}/hr</span>
                      </div>
                      {b.notes && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                          Notes: "{b.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {b.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => onEnterRoom({
                              _id: b.meetingRoomId,
                              name: `Tutoring Session: ${b.tutor?.name}`,
                              subject: b.subject,
                              inviteCode: b.meetingRoomId,
                            })}
                            className="btn btn-emerald"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                          >
                            <Video size={14} /> Enter Room ({b.meetingRoomId})
                          </button>
                          <button
                            onClick={() => handleCancel(b._id)}
                            className="btn btn-danger"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* As Tutor (if applicable) */}
          {bookings.asTutor.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#6ee7b7' }}>
                Students Who Booked You ({bookings.asTutor.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings.asTutor.map((b) => (
                  <div key={b._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        Student: {b.student?.name} ({b.student?.email})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Date: {b.date} • Slot: {b.timeSlot}
                      </div>
                    </div>
                    <button
                      onClick={() => onEnterRoom({
                        _id: b.meetingRoomId,
                        name: `Tutoring Student: ${b.student?.name}`,
                        subject: b.subject,
                        inviteCode: b.meetingRoomId,
                      })}
                      className="btn btn-emerald"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    >
                      <Video size={14} /> Join Meeting Room
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
