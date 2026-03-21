import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, push, serverTimestamp } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface WeeklyVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WeeklyVoteModal: React.FC<WeeklyVoteModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [mvpId, setMvpId] = useState('');
  const [slackerId, setSlackerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Mock week number for now
  const currentWeek = "week_1";

  useEffect(() => {
    if (!userProfile?.groupCode || !isOpen) return;

    // Fetch squad
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const squadMembers: User[] = [];
        snapshot.forEach((childSnap) => {
          const u = childSnap.val() as User;
          if (u.groupCode === userProfile.groupCode) {
            squadMembers.push(u);
          }
        });
        setMembers(squadMembers);
      }
    });

    // Check if user already voted this week
    if (currentUser) {
      const voteRef = ref(db, `votes/${userProfile.groupCode}/${currentWeek}/${currentUser.uid}`);
      onValue(voteRef, (snap) => {
        if (snap.exists()) setHasVoted(true);
      });
    }
  }, [userProfile, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!mvpId || !slackerId || mvpId === slackerId || !currentUser || !userProfile?.groupCode) return;
    setIsSubmitting(true);

    try {
      const voteRef = ref(db, `votes/${userProfile.groupCode}/${currentWeek}/${currentUser.uid}`);
      await set(voteRef, {
        voterId: currentUser.uid,
        mvpId,
        slackerId,
        timestamp: serverTimestamp()
      });

      alert("Vote cast anonymously!");
      onClose();
    } catch (err) {
      alert("Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherMembers = members.filter(m => m.id !== currentUser?.uid);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
    }}>
      <div className="glass-card glow-primary" style={{ width: '90%', maxWidth: '400px', padding: '2rem' }}>
        <h2 className="text-gradient-primary" style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>WEEKLY TRIBUNAL</h2>
        
        {hasVoted ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--on-surface-variant)' }}>Your anonymous vote has been submitted for this week.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Results will be posted in the Feed when everyone completes their vote.</p>
            <button onClick={onClose} className="button-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>CLOSE</button>
          </div>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>
              Cast your anonymous vote for who pushed the hardest and who slacked off.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--on-surface)' }}>
                🏆 MVP (Hardest Worker)
              </label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {otherMembers.map(m => (
                   <div 
                     key={`mvp-${m.id}`} 
                     onClick={() => setMvpId(m.id)}
                     style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', minWidth: '64px' }}
                   >
                     <img src={m.photoURL || `https://ui-avatars.com/api/?name=${m.displayName}&background=random`} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${mvpId === m.id ? 'var(--primary)' : 'transparent'}`, opacity: mvpId ? (mvpId === m.id ? 1 : 0.4) : 1, transition: 'all 0.2s' }} alt={m.displayName} />
                     <span style={{ fontSize: '0.75rem', color: mvpId === m.id ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: mvpId === m.id ? 'bold' : 'normal', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px' }}>{m.displayName.split(' ')[0]}</span>
                   </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--error)' }}>
                👎 THE SLACKER
              </label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {otherMembers.map(m => (
                   <div 
                     key={`slacker-${m.id}`} 
                     onClick={() => setSlackerId(m.id)}
                     style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', minWidth: '64px' }}
                   >
                     <img src={m.photoURL || `https://ui-avatars.com/api/?name=${m.displayName}&background=random`} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${slackerId === m.id ? 'var(--error)' : 'transparent'}`, opacity: slackerId ? (slackerId === m.id ? 1 : 0.4) : 1, transition: 'all 0.2s' }} alt={m.displayName} />
                     <span style={{ fontSize: '0.75rem', color: slackerId === m.id ? 'var(--error)' : 'var(--on-surface-variant)', fontWeight: slackerId === m.id ? 'bold' : 'normal', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px' }}>{m.displayName.split(' ')[0]}</span>
                   </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !mvpId || !slackerId || mvpId === slackerId}
              className="button-primary" 
              style={{ width: '100%', opacity: (!mvpId || !slackerId || mvpId === slackerId) ? 0.5 : 1 }}
            >
              {isSubmitting ? 'SUBMITTING...' : 'CAST VOTE'}
            </button>
            <button 
              onClick={onClose} 
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', padding: '1rem', marginTop: '0.5rem', cursor: 'pointer' }}
            >
              CANCEL
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklyVoteModal;
