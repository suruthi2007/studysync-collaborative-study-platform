import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import GroupsView from './components/groups/GroupsView';
import StudyRoomView from './components/room/StudyRoomView';
import QuizHub from './components/quiz/QuizHub';
import TutorMarketplace from './components/tutors/TutorMarketplace';
import MyBookings from './components/tutors/MyBookings';
import AuthPage from './components/auth/AuthPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'room' | 'quizzes' | 'tutors' | 'bookings'
  const [activeGroup, setActiveGroup] = useState(null);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Initializing StudySync Real-Time Platform...
        </p>
      </div>
    );
  }

  // Show authentication page if no user is logged in
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeGroup={activeGroup}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'groups' && (
          <GroupsView
            activeGroup={activeGroup}
            setActiveGroup={setActiveGroup}
            onSelectRoom={(group) => {
              setActiveGroup(group);
              setActiveTab('room');
            }}
            onSelectQuiz={(group) => {
              setActiveGroup(group);
              setActiveTab('quizzes');
            }}
          />
        )}

        {activeTab === 'room' && (
          <StudyRoomView
            group={activeGroup}
            onBack={() => setActiveTab('groups')}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizHub group={activeGroup} />
        )}

        {activeTab === 'tutors' && (
          <TutorMarketplace
            onBookingsClick={() => setActiveTab('bookings')}
            onEnterRoom={(roomData) => {
              setActiveGroup(roomData);
              setActiveTab('room');
            }}
          />
        )}

        {activeTab === 'bookings' && (
          <MyBookings
            onBack={() => setActiveTab('tutors')}
            onEnterRoom={(roomData) => {
              setActiveGroup(roomData);
              setActiveTab('room');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.25rem 2rem',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <strong>StudySync</strong> — Real-Time Collaborative Study Platform
          <span>•</span>
          <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
            Full-Stack Internship Capstone
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Phase 1: Groups & S3 Drive</span>
          <span>Phase 2: Whiteboard & Chat</span>
          <span>Phase 3: Quizzing</span>
          <span>Phase 4: Marketplace</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
