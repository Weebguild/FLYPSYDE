import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Flame, Skull } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Day100Results = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      background: 'rgba(0,0,0,0.5)' // Darkens the fiery background a bit more for dramatic effect
    }}>
      
      <div style={{ marginBottom: '2rem', animation: 'pulse 2s infinite' }}>
        <Trophy size={80} color="var(--tertiary)" />
      </div>

      <h1 className="text-gradient-primary" style={{ fontSize: '3.5rem', margin: '0 0 1rem 0', lineHeight: 1 }}>
        DAY 100
      </h1>
      <h2 style={{ color: 'var(--on-surface)', margin: '0 0 2rem 0', letterSpacing: '4px' }}>
        TRIAL COMPLETE
      </h2>

      <div className="glass-card glow-primary" style={{ width: '100%', maxWidth: '500px', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          The trial is complete. Your squad has braved 100 days of discipline. Here are the final results.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          
          <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--tertiary)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--tertiary)' }}>THE MVP</h4>
            <Flame size={32} color="var(--tertiary)" style={{ margin: '0.5rem 0' }} />
            <h3 style={{ margin: 0, color: 'var(--on-surface)' }}>Iron Man</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>98% Consistent</span>
          </div>

          <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--error)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--error)' }}>THE SLACKER</h4>
            <Skull size={32} color="var(--error)" style={{ margin: '0.5rem 0' }} />
            <h3 style={{ margin: 0, color: 'var(--on-surface)' }}>Ghost Riter</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Dropped out Day 42</span>
          </div>

        </div>

        <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '1.5rem', textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--secondary)' }}>SQUAD STATS</h3>
          <p style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Total Weight Lost:</span>
            <strong>24 kg</strong>
          </p>
          <p style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Total Slips:</span>
            <strong>12</strong>
          </p>
          <p style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Wars Declared:</span>
            <strong>3</strong>
          </p>
        </div>
      </div>

      <button 
        onClick={() => navigate('/profile')}
        className="button-primary"
        style={{ width: '100%', maxWidth: '300px' }}
      >
        VIEW YOUR FOOTPRINT
      </button>

    </div>
  );
};

export default Day100Results;
