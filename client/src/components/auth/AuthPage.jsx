import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  GraduationCap, 
  BookOpen, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AuthPage() {
  const { login, register, switchPersona } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('student'); // 'student' | 'tutor'
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [slowServerWarning, setSlowServerWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Show warning if backend takes more than 2.5 seconds to respond (Render cold sleep)
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setSlowServerWarning(true);
      }, 2500);
    } else {
      setSlowServerWarning(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      console.error('Login error:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setErrorMsg('Cannot connect to backend server. Render instance may be booting up; please wait a moment and try again.');
      } else {
        setErrorMsg(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!registerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await register(registerName.trim(), registerEmail.trim(), registerPassword, registerRole);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setErrorMsg('Cannot connect to backend server. Render instance may be booting up; please wait a moment and try again.');
      } else {
        setErrorMsg(err.message || 'Registration failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (persona) => {
    setErrorMsg('');
    try {
      setLoading(true);
      await switchPersona(persona);
    } catch (err) {
      console.error('Demo login error:', err);
      setErrorMsg(err.message || 'Demo login failed. Server might be spinning up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem',
      position: 'relative',
    }}>
      {/* Background Decorative Glow */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 80%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: '460px', zIndex: 1 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            padding: '0.75rem',
            borderRadius: '16px',
            marginBottom: '0.85rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
          }}>
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #ffffff 0%, #c7d2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            StudySync
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Real-Time Collaborative Study Platform
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel" style={{ padding: '2rem', backdropFilter: 'blur(20px)' }}>
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-md)',
            padding: '0.3rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)',
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'login' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
                color: activeTab === 'login' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
              }}
            >
              <LogIn size={15} /> Log in
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'register' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
                color: activeTab === 'register' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
              }}
            >
              <UserPlus size={15} /> Create account
            </button>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4,
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Slow Render Server Wake-up Notice */}
          {slowServerWarning && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fcd34d',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4,
            }}>
              <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Connecting to cloud server... On free-tier hosts like Render, instances spin down after inactivity and may take 30–50 seconds to wake up.
              </div>
            </div>
          )}

          {/* TAB 1: Log in Form */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="student@example.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '0.92rem',
                  marginTop: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: Create Account Form */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="alex@student.edu"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Password (min 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Joining As
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setRegisterRole('student')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: registerRole === 'student' ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                      background: registerRole === 'student' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      color: registerRole === 'student' ? '#c7d2fe' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <BookOpen size={16} color={registerRole === 'student' ? '#818cf8' : 'currentColor'} />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('tutor')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: registerRole === 'tutor' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                      background: registerRole === 'tutor' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      color: registerRole === 'tutor' ? '#a7f3d0' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <GraduationCap size={16} color={registerRole === 'tutor' ? '#34d399' : 'currentColor'} />
                    <span>Tutor</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-emerald"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '0.92rem',
                  marginTop: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.75rem 0 1.25rem 0',
            gap: '0.75rem',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Or quick demo sign-in
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {/* Quick Demo Switcher Section */}
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
              One-click instant login with seeded capstone personas:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('alice')}
                disabled={loading}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
              >
                <span>👩 Alice</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('bob')}
                disabled={loading}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
              >
                <span>👨 Bob</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('tutor')}
                disabled={loading}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fcd34d',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
              >
                <span>🎓 Sarah</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tutor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.25rem',
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck size={14} color="#10b981" /> Private S3 Drive
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={14} color="#6366f1" /> Canvas Whiteboard
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <BookOpen size={14} color="#f59e0b" /> Peer Quizzes
          </span>
        </div>
      </div>
    </div>
  );
}
