import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import PageTransition from '../components/PageTransition';
import { calculateCurrentDay } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overall' | 'habits'>('overall');
  
  // War logic state
  const [warTarget, setWarTarget] = useState<User | null>(null);
  const [warHabit, setWarHabit] = useState('');
  const [isWagingWar, setIsWagingWar] = useState(false);

  const handleWarSubmit = async () => {
    if (!warTarget || !warHabit || !currentUser || !userProfile || !userProfile.groupCode) return;
    setIsWagingWar(true);
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      // Announce war in feed
      const feedRef = ref(db, `feeds/${userProfile.groupCode}`);
      await push(feedRef, {
        userId: currentUser.uid,
        userName: userProfile.displayName,
        userPhotoURL: userProfile.photoURL,
        type: 'war',
        targetId: warTarget.id,
        targetName: warTarget.displayName,
        habitId: warHabit,
        timestamp: serverTimestamp(),
        reactions: {}
      });

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Success pattern
      toast.success(`War declared on ${warTarget.displayName} for 3 days!`, { icon: '⚔️' });
      setWarTarget(null);
    } catch (err) {
      console.error(err);
      if (navigator.vibrate) navigator.vibrate(200);
      toast.error('Failed to declare war.');
    } finally {
      setIsWagingWar(false);
    }
  };

  useEffect(() => {
    if (!userProfile || !userProfile.groupCode) return;

    // Fetch all members in the squad
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const squadMembers: User[] = [];
        snapshot.forEach((childSnap) => {
          const u = childSnap.val() as User;
          if (u.groupCode === userProfile.groupCode) {
            squadMembers.push(u);
          }
        });
        
        // Mocking an overall score for ranking since we don't have real streaks stored yet
        // In reality, this would sort by a computed score based on days survived without slips
        setMembers(squadMembers.sort((a, b) => {
          // just pseudo-sorting by joined time for now if no score exists
          return (a.joinedAt as number) - (b.joinedAt as number);
        }));
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userProfile]);

  return (
    <PageTransition className="leaderboard-container" style={{ padding: '2rem', paddingBottom: '100px' }}>
      <h1 className="text-gradient-primary" style={{ textAlign: 'center', marginBottom: '2rem' }}>SQUAD RANKINGS</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--surface-container)', padding: '0.5rem', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('overall')}
          style={{ 
            flex: 1, 
            padding: '0.8rem', 
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'overall' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'overall' ? 'var(--background)' : 'var(--on-surface)',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          OVERALL
        </button>
        <button 
          onClick={() => setActiveTab('habits')}
          style={{ 
            flex: 1, 
            padding: '0.8rem', 
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'habits' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'habits' ? 'var(--background)' : 'var(--on-surface)',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          PER-HABIT
        </button>
      </div>

      <div className="glass-card glow-primary" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--secondary)' }}>GROUP STREAK</h3>
        <h1 style={{ fontSize: '3rem', margin: '0.5rem 0', color: 'var(--on-surface)' }}>Day {calculateCurrentDay(userProfile?.joinedAt)}</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: 0 }}>Surviving together</p>
      </div>

      {loading && activeTab === 'overall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container-low)', padding: '1rem', borderRadius: '12px', opacity: 0.6, animation: 'pulse 1.5s infinite' }}>
              <div style={{ width: '30px', height: '20px', background: 'var(--surface-container-highest)', borderRadius: '4px' }} />
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container-highest)', margin: '0 1rem' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '50%', height: '16px', background: 'var(--surface-container-highest)', borderRadius: '4px', marginBottom: '0.4rem' }} />
                <div style={{ width: '30%', height: '12px', background: 'var(--surface-container-high)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && members.length === 0 && activeTab === 'overall' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👻</div>
          <h3 style={{ margin: 0, color: 'var(--on-surface)' }}>No Squad Members Yet</h3>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>Invite your friends to start the competition.</p>
        </div>
      )}

      {!loading && activeTab === 'overall' && members.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {members.map((member, idx) => (
            <div key={member.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'var(--surface-container-low)', 
              padding: '1rem', 
              borderRadius: '12px',
              border: idx === 0 ? '2px solid var(--tertiary)' : '1px solid var(--outline-variant)'
            }}>
              <h2 style={{ width: '30px', margin: 0, color: idx === 0 ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}>
                #{idx + 1}
              </h2>
              <img 
                src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}`} 
                alt="Avatar" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 1rem', border: '2px solid var(--primary)' }} 
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{member.displayName}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{member.rankTitle}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ fontWeight: 'bold' }}>100 pts</div>
                {currentUser?.uid !== member.id && (
                  <button 
                    onClick={() => setWarTarget(member)}
                    style={{ 
                      background: 'var(--error-dim)', 
                      color: 'var(--error)', 
                      border: '1px solid var(--error)', 
                      borderRadius: '4px', 
                      padding: '0.3rem 0.5rem', 
                      fontSize: '0.7rem', 
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ⚔️ WAR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'habits' && (
        <div className="glass-card glow-primary">
          <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            Per-habit tracking breakdown coming soon...
          </p>
        </div>
      )}

      {/* War Declaration Modal */}
      {warTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="glass-card glow-error" style={{ width: '90%', maxWidth: '400px', padding: '2rem' }}>
            <h2 style={{ color: 'var(--error)', margin: '0 0 1rem 0', textAlign: 'center' }}>DECLARE WAR</h2>
            <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              Challenge <strong style={{ color: 'white' }}>{warTarget.displayName}</strong> to a 3-day consistency battle. Loser drops rank!
            </p>
            
            <div style={{ margin: '1.5rem 0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>
                Select Struggling Habit:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                 {[
                   { id: 'no-junk-food', label: '🍔 No Junk Food' },
                   { id: 'no-smoking', label: '🚬 No Smoking' },
                   { id: 'daily-study', label: '📚 Daily Study' },
                   { id: 'daily-workout', label: '💪 Workout' }
                 ].map(opt => (
                   <button
                     key={opt.id}
                     onClick={() => setWarHabit(opt.id)}
                     style={{
                       padding: '12px 8px',
                       borderRadius: '12px',
                       border: `1px solid ${warHabit === opt.id ? 'var(--error)' : 'rgba(255,255,255,0.1)'}`,
                       background: warHabit === opt.id ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255,255,255,0.05)',
                       color: warHabit === opt.id ? 'var(--error)' : 'var(--on-surface-variant)',
                       fontWeight: 'bold',
                       cursor: 'pointer',
                       transition: 'all 0.2s',
                       fontSize: '0.8rem'
                     }}
                   >
                     {opt.label}
                   </button>
                 ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setWarTarget(null)}
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '1rem', borderRadius: '8px', fontWeight: 'bold' }}
              >
                CANCEL
              </button>
              <button 
                onClick={handleWarSubmit}
                disabled={isWagingWar || !warHabit}
                style={{ flex: 1, background: 'var(--error)', border: 'none', color: 'var(--background)', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', cursor: isWagingWar || !warHabit ? 'not-allowed' : 'pointer', opacity: isWagingWar || !warHabit ? 0.5 : 1 }}
              >
                {isWagingWar ? 'DECLARING...' : 'ATTACK!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default Leaderboard;
