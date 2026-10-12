import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Star, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Search, 
  DollarSign, 
  BookOpen, 
  AlertCircle, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function TutorMarketplace({ onBookingsClick, onEnterRoom }) {
  const { token, user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Booking Modal State (Calendly Style)
  const [bookingTutor, setBookingTutor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null); // { type: 'success' | 'error', message, booking }
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const subjects = ['All', 'Calculus', 'Linear Algebra', 'Algorithms', 'Data Structures', 'JavaScript / React', 'Physics'];

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_BASE_URL}/api/tutors`);
      if (selectedSubject !== 'All') url.searchParams.append('subject', selectedSubject);
      if (searchQuery) url.searchParams.append('search', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setTutors(data.tutors);
      }
    } catch (err) {
      console.error('Failed to fetch tutors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [selectedSubject, searchQuery]);

  // Fetch booked slots for the selected tutor and date to prevent double-booking visually
  const fetchBookedSlots = async (tutorId, date) => {
    if (!tutorId || !date) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/booked-slots?tutorId=${tutorId}&date=${date}`);
      const data = await res.json();
      if (data.success) {
        setBookedSlots(data.bookedSlots);
      }
    } catch (e) {
      console.error('Error fetching booked slots:', e);
    }
  };

  useEffect(() => {
    if (bookingTutor && selectedDate) {
      fetchBookedSlots(bookingTutor._id, selectedDate);
    }
  }, [bookingTutor, selectedDate]);

  const handleOpenBooking = (tutor) => {
    setBookingTutor(tutor);
    setSelectedSlot('');
    setBookingStatus(null);
    setBookingNotes('');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setBookingStatus({ type: 'error', message: 'Please select an available time slot.' });
      return;
    }

    try {
      setSubmittingBooking(true);
      setBookingStatus(null);

      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tutorId: bookingTutor._id,
          date: selectedDate,
          timeSlot: selectedSlot,
          subject: bookingTutor.subjects[0] || 'Tutoring Session',
          notes: bookingNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBookingStatus({
          type: 'success',
          message: data.message,
          booking: data.booking,
        });
        fetchBookedSlots(bookingTutor._id, selectedDate);
      } else {
        setBookingStatus({
          type: 'error',
          message: data.message || 'Booking failed: slot unavailable.',
        });
      }
    } catch (err) {
      setBookingStatus({ type: 'error', message: err.message });
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Generate next 7 dates for easy selection
  const upcomingDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() + (i + 1) * 86400000);
    return {
      iso: d.toISOString().split('T')[0],
      display: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>
            <Sparkles size={13} /> Phase 4: The Tutor Marketplace & Booking Engine
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            1-on-1 Academic Mentorship & Tutoring
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Book verified peer tutors with anti-double-booking calendar reservations. Enter scheduled study rooms directly with WebRTC video & collaborative canvas.
          </p>
        </div>

        <button onClick={onBookingsClick} className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
          <Calendar size={18} /> View My Scheduled Sessions
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search tutors by name, bio, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Subject Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`btn ${selectedSubject === sub ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tutors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading marketplace tutors...
        </div>
      ) : tutors.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <GraduationCap size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h3>No tutors match your search criteria.</h3>
          <p style={{ fontSize: '0.85rem' }}>Try choosing "All" subjects or clear your search term.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {tutors.map((tutor) => (
            <div
              key={tutor._id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
              }}
            >
              <div>
                {/* Tutor Profile Header */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <img
                    src={tutor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.name}`}
                    alt={tutor.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      border: '2px solid var(--accent-emerald)',
                      background: '#1e293b',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>{tutor.name}</h3>
                      {tutor.isVerified && (
                        <CheckCircle size={16} color="#10b981" title="Verified Expert Tutor" />
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '0.25rem' }}>
                      {tutor.headline}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#fcd34d' }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <strong>{tutor.rating.toFixed(1)}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>({tutor.reviewsCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {tutor.bio}
                </p>

                {/* Subjects Badges */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {tutor.subjects?.map((sub, i) => (
                    <span key={i} className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Book Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rate</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
                    ${tutor.hourlyRate}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/hr</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking(tutor)}
                  className="btn btn-emerald"
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  <Calendar size={15} /> Book Slot (Calendly)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDLY-STYLE BOOKING MODAL */}
      {bookingTutor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '2rem', background: '#0f172a' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '0.35rem' }}>
                  Calendly Booking • Double-Booking Guard
                </span>
                <h3 style={{ fontSize: '1.3rem' }}>Book 1-on-1 Session with {bookingTutor.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Rate: ${bookingTutor.hourlyRate}/hour • Protected by backend concurrency lock
                </p>
              </div>
              <button onClick={() => setBookingTutor(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }}>
                ✕
              </button>
            </div>

            {bookingStatus && (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: bookingStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${bookingStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: bookingStatus.type === 'success' ? '#6ee7b7' : '#fda4af',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  {bookingStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <strong>{bookingStatus.message}</strong>
                </div>
                {bookingStatus.type === 'success' && bookingStatus.booking && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.8rem' }}>
                      Reserved Meeting Room: <strong>{bookingStatus.booking.meetingRoomId}</strong>
                    </p>
                    <button
                      onClick={() => {
                        setBookingTutor(null);
                        onEnterRoom({
                          _id: bookingStatus.booking.meetingRoomId,
                          name: `Tutoring: ${bookingTutor.name}`,
                          subject: bookingStatus.booking.subject,
                          inviteCode: bookingStatus.booking.meetingRoomId,
                        });
                      }}
                      className="btn btn-emerald"
                      style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      🚀 Enter Reserved Study Room Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {(!bookingStatus || bookingStatus.type !== 'success') && (
              <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Step 1: Date Selector (Next 7 Days) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    1. Select Date
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '0.5rem' }}>
                    {upcomingDates.map((item) => {
                      const isSelected = selectedDate === item.iso;
                      return (
                        <div
                          key={item.iso}
                          onClick={() => { setSelectedDate(item.iso); setSelectedSlot(''); }}
                          style={{
                            padding: '0.5rem 0.25rem',
                            textAlign: 'center',
                            borderRadius: 'var(--radius-md)',
                            background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            border: isSelected ? '2px solid #10b981' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: isSelected ? '#10b981' : '#fff' }}>
                            {item.display}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Time Slot Selector (Double-Booking Validation) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      2. Select Time Slot (Calendly)
                    </label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Greyed slots are already reserved
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {(bookingTutor.availableSlots || ['09:00 - 10:00', '11:00 - 12:00', '14:00 - 15:00', '16:00 - 17:00']).map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '0.6rem 0.5rem',
                            borderRadius: 'var(--radius-md)',
                            background: isBooked
                              ? 'rgba(255, 255, 255, 0.02)'
                              : isSelected
                              ? '#10b981'
                              : 'rgba(255, 255, 255, 0.05)',
                            color: isBooked ? '#6b7280' : isSelected ? '#ffffff' : '#f9fafb',
                            border: isSelected ? '2px solid #10b981' : '1px solid var(--border-color)',
                            cursor: isBooked ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            textDecoration: isBooked ? 'line-through' : 'none',
                          }}
                        >
                          <Clock size={13} />
                          <span>{slot}</span>
                          {isBooked && <span style={{ fontSize: '0.65rem', color: '#f43f5e' }}>(Booked)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Session Topic / Questions */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    3. Study Notes / Questions for Tutor
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="e.g. Please help review Integration by Parts and preparation for Friday exam."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setBookingTutor(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-emerald"
                    disabled={submittingBooking || !selectedSlot}
                    style={{ padding: '0.65rem 1.5rem' }}
                  >
                    {submittingBooking ? 'Securing Slot...' : `Confirm Booking ($${bookingTutor.hourlyRate})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
