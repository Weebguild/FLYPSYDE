import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DayZero: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Dummy data for now
  const pendingCount = 3;
  const avatars = [
    { id: '1', filled: true },
    { id: '2', filled: true },
    { id: '3', filled: false },
    { id: '4', filled: false },
    { id: '5', filled: false }
  ];

  const handleReadyUp = () => {
    if (!currentUser) {
      navigate('/onboarding');
    } else {
      // In a real app, maybe navigate to home or check status
      navigate('/home');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '2rem',
      boxSizing: 'border-box',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradients */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'var(--primary-dim)',
        filter: 'blur(100px)',
        opacity: 0.2,
        borderRadius: '50%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'var(--secondary-dim)',
        filter: 'blur(100px)',
        opacity: 0.2,
        borderRadius: '50%',
        zIndex: 0
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: 'var(--primary)', fontStyle: 'italic', fontSize: '1.5rem', marginBottom: 'auto' }}>
          FLYPSYDE
        </h1>

        <div style={{ margin: 'auto 0' }}>
          <h1 className="display" style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '1rem', color: 'var(--on-surface)' }}>
            PREPARE<br/>FOR WAR
          </h1>
          <div style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', color: 'var(--secondary)', fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 20px rgba(0, 227, 253, 0.5)' }}>
            22:14:05
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Your Squad</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            {avatars.map((avatar, idx) => (
              <div key={idx} style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: avatar.filled ? '2px solid var(--primary)' : '2px dashed var(--outline-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: avatar.filled ? 'var(--surface-container-high)' : 'transparent',
                boxShadow: avatar.filled ? '0 0 15px rgba(255, 137, 171, 0.3)' : 'none'
              }}>
                {!avatar.filled && <span style={{ color: 'var(--outline-variant)' }}>+</span>}
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{pendingCount} members pending baseline setup</p>
        </div>

        <div className="glass-card glow-primary" style={{ padding: '1.5rem', marginTop: 'auto' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '1.5rem', fontSize: '1.1rem' }}>THE 100-DAY GRIND STARTS SOON.<br/>NO EXCUSES.</p>
          <button className="button-primary" style={{ width: '100%', padding: '1.2rem', boxShadow: '0 0 20px rgba(136, 255, 113, 0.4)', backgroundImage: 'linear-gradient(135deg, var(--tertiary), var(--tertiary-dim))', color: 'var(--surface-container-lowest)' }} onClick={handleReadyUp}>
            READY UP
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayZero;
