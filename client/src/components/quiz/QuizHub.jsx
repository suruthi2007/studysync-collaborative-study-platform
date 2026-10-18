import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { 
  Trophy, 
  BookOpen, 
  Plus, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Award,
  Medal,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function QuizHub({ group }) {
  const { token, user, switchPersona } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(group?._id || '');
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' | 'builder' | 'leaderboard'
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // Active Playing State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  
  // Flashcard playing state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz Builder State
  const [builderType, setBuilderType] = useState('quiz'); // 'quiz' | 'flashcard'
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [questionsList, setQuestionsList] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    },
  ]);
  const [flashcardsList, setFlashcardsList] = useState([
    { front: '', back: '', hint: '' },
  ]);

  // Load user groups so quizzes can be built and listed even if accessed directly from the navbar
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        let activeToken = token || localStorage.getItem('studysync_token');
        const res = await fetch(`${API_BASE_URL}/api/groups`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        const data = await res.json();
        if (data.success && data.groups.length > 0) {
          setAvailableGroups(data.groups);
          if (!selectedGroupId && !group?._id) {
            setSelectedGroupId(data.groups[0]._id);
          }
        }
      } catch (e) {
        console.warn('Error fetching groups in QuizHub:', e);
      }
    };
    fetchUserGroups();
  }, [token, group?._id]);

  const effectiveGroupId = group?._id || selectedGroupId || (availableGroups[0] && availableGroups[0]._id);

  const fetchData = async () => {
    if (!effectiveGroupId) return;
    try {
      setLoading(true);
      let activeToken = token || localStorage.getItem('studysync_token');
      const [qRes, lRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/quizzes/group/${effectiveGroupId}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch(`${API_BASE_URL}/api/quizzes/group/${effectiveGroupId}/leaderboard`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
      ]);

      const qData = await qRes.json();
      const lData = await lRes.json();

      if (qData.success) setQuizzes(qData.quizzes);
      if (lData.success) setLeaderboard(lData.leaderboard);
    } catch (err) {
      console.error('Error fetching quiz data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [effectiveGroupId, token]);

  // Handle Question Options change in Builder
  const updateOptionText = (qIdx, optIdx, text) => {
    const nextQuestions = [...questionsList];
    nextQuestions[qIdx].options[optIdx] = text;
    setQuestionsList(nextQuestions);
  };

  const addQuestionField = () => {
    setQuestionsList([
      ...questionsList,
      { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' },
    ]);
  };

  const addFlashcardField = () => {
    setFlashcardsList([...flashcardsList, { front: '', back: '', hint: '' }]);
  };

  // Submit created Quiz / Flashcard deck
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a title for the deck or quiz.');
      return;
    }

    try {
      setIsPublishing(true);
      let activeToken = token || localStorage.getItem('studysync_token');

      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        groupId: effectiveGroupId,
        type: builderType,
        questions: builderType === 'quiz' ? questionsList : [],
        flashcards: builderType === 'flashcard' ? flashcardsList : [],
      };

      let res = await fetch(`${API_BASE_URL}/api/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(payload),
      });

      // Auto-recover if token was stale
      if (res.status === 401 && switchPersona) {
        await switchPersona(user?.name?.toLowerCase().includes('bob') ? 'bob' : 'alice');
        activeToken = localStorage.getItem('studysync_token');
        res = await fetch(`${API_BASE_URL}/api/quizzes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        alert('Learning Deck published successfully!');
        setNewTitle('');
        setNewDesc('');
        setActiveSubTab('list');
        fetchData();
      } else {
        alert(data.message || 'Failed to publish quiz.');
      }
    } catch (err) {
      alert('Error creating quiz: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Submit Quiz Answers
  const handleAnswerSubmit = async () => {
    if (!activeQuiz) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/quizzes/${activeQuiz._id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: userAnswers,
          timeSpentSeconds: 45,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
        if (data.accuracyPercentage >= 70) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        fetchData(); // Refresh leaderboard
      }
    } catch (err) {
      alert('Error grading quiz: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Sub-Navigation */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
      }}>
        <div>
          <div className="badge badge-amber" style={{ marginBottom: '0.4rem' }}>
            <Award size={13} /> Phase 3: Peer-to-Peer Quizzing Engine
          </div>
          <h2 style={{ fontSize: '1.5rem' }}>Group Knowledge & Gamified Leaderboard</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Study group: <strong style={{ color: '#fff' }}>{group?.name}</strong> • Test your memory with flashcards or compete on the leaderboard.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveSubTab('list'); setActiveQuiz(null); }}
            className={`btn ${activeSubTab === 'list' && !activeQuiz ? 'btn-primary' : 'btn-secondary'}`}
          >
            <BookOpen size={15} /> All Quizzes ({quizzes.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('leaderboard'); setActiveQuiz(null); }}
            className={`btn ${activeSubTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Trophy size={15} /> Group Leaderboard
          </button>
          <button
            onClick={() => { setActiveSubTab('builder'); setActiveQuiz(null); }}
            className={`btn ${activeSubTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Plus size={15} /> Create Quiz / Cards
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE QUIZ PLAYER */}
      {activeQuiz && activeQuiz.type === 'quiz' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <button
            onClick={() => { setActiveQuiz(null); setQuizResult(null); setUserAnswers({}); }}
            className="btn btn-secondary"
            style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={16} /> Exit Quiz
          </button>

          {!quizResult ? (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="badge badge-indigo">Multiple Choice Challenge</span>
                <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{activeQuiz.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{activeQuiz.description}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {activeQuiz.questions.map((q, qIndex) => (
                  <div key={qIndex} className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: '#fff' }}>
                      {qIndex + 1}. {q.question}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                      {q.options.map((opt, optIndex) => {
                        const isSelected = userAnswers[qIndex] === optIndex;
                        return (
                          <div
                            key={optIndex}
                            onClick={() => setUserAnswers({ ...userAnswers, [qIndex]: optIndex })}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                              border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              fontSize: '0.9rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isSelected ? '#6366f1' : 'rgba(255,255,255,0.1)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAnswerSubmit}
                  className="btn btn-emerald"
                  style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', fontSize: '1rem' }}
                >
                  Submit Quiz for Grading
                </button>
              </div>
            </div>
          ) : (
            /* Quiz Results Screen */
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{
                display: 'inline-flex',
                padding: '1.5rem',
                borderRadius: '50%',
                background: quizResult.accuracyPercentage >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                marginBottom: '1rem',
              }}>
                <Trophy size={48} color={quizResult.accuracyPercentage >= 70 ? '#10b981' : '#f43f5e'} />
              </div>
              <h2 style={{ fontSize: '2rem' }}>
                You Scored {quizResult.score} / {quizResult.totalQuestions} ({quizResult.accuracyPercentage}%)
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Points added to your group leaderboard rank!
              </p>

              {/* Review Section */}
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {quizResult.review.map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ borderLeft: `4px solid ${item.isCorrect ? '#10b981' : '#f43f5e'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {item.isCorrect ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#f43f5e" />}
                      <span style={{ fontWeight: 700 }}>{item.question}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Correct answer: <strong style={{ color: '#6ee7b7' }}>{item.options[item.correctAnswer]}</strong>
                    </div>
                    {item.explanation && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                        💡 {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setActiveQuiz(null); setQuizResult(null); setUserAnswers({}); }}
                className="btn btn-primary"
              >
                Back to All Quizzes
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ACTIVE FLASHCARD DECK PLAYER */}
      {activeQuiz && activeQuiz.type === 'flashcard' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <button
            onClick={() => { setActiveQuiz(null); }}
            className="btn btn-secondary"
            style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={16} /> Exit Flashcards
          </button>

          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <span className="badge badge-indigo">Interactive 3D Flashcards</span>
            <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{activeQuiz.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Card {flashcardIndex + 1} of {activeQuiz.flashcards.length} • Click card to reveal answer
            </p>

            {/* 3D Flip Card */}
            <div className="flip-card-container" onClick={() => setIsFlipped(!isFlipped)} style={{ marginBottom: '1.5rem' }}>
              <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
                <div className="flip-card-front">
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8', marginBottom: '0.75rem' }}>
                    Question / Term
                  </span>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
                    {activeQuiz.flashcards[flashcardIndex]?.front}
                  </h3>
                  {activeQuiz.flashcards[flashcardIndex]?.hint && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                      Hint: {activeQuiz.flashcards[flashcardIndex]?.hint}
                    </span>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <RotateCw size={12} /> Tap to flip card
                  </div>
                </div>

                <div className="flip-card-back">
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6ee7b7', marginBottom: '0.75rem' }}>
                    Answer & Explanation
                  </span>
                  <p style={{ fontSize: '1.15rem', color: '#fff', lineHeight: 1.5 }}>
                    {activeQuiz.flashcards[flashcardIndex]?.back}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#a5b4fc', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <RotateCw size={12} /> Tap to flip back
                  </div>
                </div>
              </div>
            </div>

            {/* Flip Card Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                disabled={flashcardIndex === 0}
                onClick={() => { setIsFlipped(false); setFlashcardIndex(prev => Math.max(0, prev - 1)); }}
                className="btn btn-secondary"
              >
                <ChevronLeft size={16} /> Previous Card
              </button>
              <button
                disabled={flashcardIndex === activeQuiz.flashcards.length - 1}
                onClick={() => { setIsFlipped(false); setFlashcardIndex(prev => Math.min(activeQuiz.flashcards.length - 1, prev + 1)); }}
                className="btn btn-primary"
              >
                Next Card <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: QUIZ LIST */}
      {activeSubTab === 'list' && !activeQuiz && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {quizzes.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <h3>No quizzes created yet for {group?.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Be the first to build a multiple-choice challenge or flashcard deck!
              </p>
              <button onClick={() => setActiveSubTab('builder')} className="btn btn-primary">
                <Plus size={16} /> Create Quiz Deck
              </button>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={`badge ${quiz.type === 'quiz' ? 'badge-indigo' : 'badge-emerald'}`}>
                      {quiz.type === 'quiz' ? 'Multiple Choice' : 'Flashcard Deck'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {quiz.type === 'quiz' ? `${quiz.questions.length} Questions` : `${quiz.flashcards.length} Cards`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#fff' }}>{quiz.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {quiz.description || 'Practice concepts and reinforce memory.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Created by {quiz.createdBy?.name || 'Classmate'}
                  </span>
                  <button
                    onClick={() => {
                      setActiveQuiz(quiz);
                      setQuizResult(null);
                      setUserAnswers({});
                      setFlashcardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {quiz.type === 'quiz' ? 'Take Quiz' : 'Flip Cards'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 4: GROUP LEADERBOARD */}
      {activeSubTab === 'leaderboard' && !activeQuiz && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Trophy size={28} color="#f59e0b" />
            <div>
              <h3 style={{ fontSize: '1.3rem' }}>Gamified Study Leaderboard</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Rankings determined by total quiz questions answered correctly and accuracy.
              </p>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No quiz attempts recorded yet. Take a quiz to appear on the leaderboard!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {leaderboard.map((item, index) => {
                const isTop3 = index < 3;
                const medalColors = ['#f59e0b', '#94a3b8', '#b45309'];

                return (
                  <div
                    key={item._id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: index === 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(30, 41, 59, 0.5)',
                      borderColor: index === 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isTop3 ? medalColors[index] : 'rgba(255,255,255,0.08)',
                        color: isTop3 ? '#000' : '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        #{index + 1}
                      </div>

                      <img
                        src={item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`}
                        alt={item.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
                      />

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.quizzesTaken} quiz session{item.quizzesTaken > 1 ? 's' : ''} completed
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accuracy</div>
                        <div style={{ fontWeight: 700, color: '#6ee7b7' }}>{item.avgAccuracy}%</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Points</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{item.totalPoints} pts</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: QUIZ / FLASHCARD BUILDER */}
      {activeSubTab === 'builder' && !activeQuiz && (
        <form onSubmit={handleCreateQuiz} className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Create Learning Material</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Author interactive multiple-choice tests or flip flashcards for your classmates.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setBuilderType('quiz')}
              className={`btn ${builderType === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Multiple Choice Quiz
            </button>
            <button
              type="button"
              onClick={() => setBuilderType('flashcard')}
              className={`btn ${builderType === 'flashcard' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Flashcard Deck
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: availableGroups.length > 0 ? '1.2fr 1fr 1.2fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Deck / Quiz Title *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Midterm 1 Practice Quiz"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            {availableGroups.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Study Group *
                </label>
                <select
                  className="input-field"
                  value={effectiveGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  {availableGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.subject})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Description
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Covers Limits, Continuity and Derivative tests."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>

          {/* Builder Type 1: Questions */}
          {builderType === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {questionsList.map((q, qIdx) => (
                <div key={qIdx} className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Question #{qIdx + 1}</div>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Enter question text..."
                    value={q.question}
                    onChange={(e) => {
                      const next = [...questionsList];
                      next[qIdx].question = e.target.value;
                      setQuestionsList(next);
                    }}
                    style={{ marginBottom: '1rem' }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          Option {String.fromCharCode(65 + optIdx)} {q.correctAnswer === optIdx && '✓ (Correct Answer)'}
                        </label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          value={opt}
                          onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Correct Option
                      </label>
                      <select
                        className="input-field"
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const next = [...questionsList];
                          next[qIdx].correctAnswer = Number(e.target.value);
                          setQuestionsList(next);
                        }}
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Explanation
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Why is this answer correct?"
                        value={q.explanation}
                        onChange={(e) => {
                          const next = [...questionsList];
                          next[qIdx].explanation = e.target.value;
                          setQuestionsList(next);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addQuestionField} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                <Plus size={16} /> Add Another Question
              </button>
            </div>
          )}

          {/* Builder Type 2: Flashcards */}
          {builderType === 'flashcard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {flashcardsList.map((card, cIdx) => (
                <div key={cIdx} className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Flashcard #{cIdx + 1}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Card Front (Prompt / Question)
                      </label>
                      <textarea
                        rows={2}
                        required
                        className="input-field"
                        placeholder="Front of card..."
                        value={card.front}
                        onChange={(e) => {
                          const next = [...flashcardsList];
                          next[cIdx].front = e.target.value;
                          setFlashcardsList(next);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Card Back (Definition / Solution)
                      </label>
                      <textarea
                        rows={2}
                        required
                        className="input-field"
                        placeholder="Back of card..."
                        value={card.back}
                        onChange={(e) => {
                          const next = [...flashcardsList];
                          next[cIdx].back = e.target.value;
                          setFlashcardsList(next);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addFlashcardField} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                <Plus size={16} /> Add Another Card
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem' }}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing Learning Deck...' : 'Publish Learning Deck'}
            </button>
            <button type="button" onClick={() => setActiveSubTab('list')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
