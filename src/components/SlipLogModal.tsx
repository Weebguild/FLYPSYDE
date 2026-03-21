import React, { useState } from 'react';
import { db } from '../firebase';
import { ref, push, serverTimestamp } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { HabitId } from '../types';

interface SlipLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const habits: { id: HabitId, label: string }[] = [
  { id: 'no-junk-food', label: 'No Junk Food' },
  { id: 'no-smoking', label: 'No Smoking' },
  { id: 'daily-study', label: 'Daily Study' },
  { id: 'daily-workout', label: 'Daily Workout' }
];

const SlipLogModal: React.FC<SlipLogModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [selectedHabit, setSelectedHabit] = useState<HabitId | ''>('');
  const [privateNote, setPrivateNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedHabit || !currentUser || !userProfile || !userProfile.groupCode) return;
    setLoading(true);

    try {
      // 1. Post to Feed
      const feedRef = ref(db, `feeds/${userProfile.groupCode}`);
      await push(feedRef, {
        userId: currentUser.uid,
        userName: userProfile.displayName,
        userPhotoURL: userProfile.photoURL,
        type: 'slip',
        habitId: selectedHabit,
        dayNumber: 1, // dummy for now
        timestamp: serverTimestamp(),
        reactions: {}
      });

      // 2. Mocking streak reset in streaks/{userId}/habits/{habitId} subcollection

      alert('Slip confessed to the squad.');
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error logging slip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card glow-primary" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--error-dim)', boxSizing: 'border-box' }}>
        <h2 style={{ color: 'var(--error)', marginBottom: '1rem', marginTop: 0 }}>CONFESS A SLIP</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
          {habits.map(h => (
            <button
              key={h.id}
              onClick={() => setSelectedHabit(h.id)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${selectedHabit === h.id ? 'var(--error)' : 'rgba(255,255,255,0.1)'}`,
                background: selectedHabit === h.id ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255,255,255,0.05)',
                color: selectedHabit === h.id ? 'var(--error)' : 'var(--on-surface-variant)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.85rem'
              }}
            >
              {h.label}
            </button>
          ))}
        </div>
        
        <textarea 
          placeholder="Private note to self (optional, hidden from feed)"
          value={privateNote}
          onChange={e => setPrivateNote(e.target.value)}
          style={{ width: '100%', padding: '1rem', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)', marginBottom: '1.5rem', minHeight: '100px', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="button-secondary" style={{ flex: 1, borderColor: 'var(--outline-variant)', color: 'var(--outline-variant)', padding: '1rem 0' }} onClick={onClose} disabled={loading}>CANCEL</button>
          <button className="button-primary" style={{ flex: 1, background: 'var(--error)', border: 'none', color: 'white', padding: '1rem 0' }} onClick={handleSubmit} disabled={loading || !selectedHabit}>
            {loading ? 'LOGGING...' : 'CONFESS'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlipLogModal;
