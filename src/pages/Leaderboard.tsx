import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useUIConfig } from '../contexts/UIConfigContext';
import { User } from '../types';

const rankColors: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const Leaderboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { uiConfig } = useUIConfig();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.groupCode) {
      setLoading(false);
      return;
    }
    const usersRef = ref(db, 'users');
    const unsub = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const squadMembers: User[] = [];
        snap.forEach((childSnap) => {
          const u = childSnap.val() as User;
          if (u.groupCode === userProfile.groupCode) {
            squadMembers.push({ ...u, id: childSnap.key! });
          }
        });
        // Sort by joinedAt ascending (longest survivor first) as a placeholder
        squadMembers.sort((a, b) => (a.joinedAt as number) - (b.joinedAt as number));
        setMembers(squadMembers);
      } else {
        setMembers([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [userProfile]);

  return (
    <div style={{ padding: '1.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '0.7rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--on-surface-variant)',
        marginBottom: '1rem',
        marginTop: '1rem',
        fontWeight: 700,
      }}>
        {uiConfig.leaderboardTitle}
      </h2>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{
              height: '64px', borderRadius: '14px',
              background: 'var(--surface-container)',
              opacity: 0.5,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--on-surface-variant)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>No warriors ranked yet.<br />Join a squad to compete.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {members.map((user, index) => {
            const rank = index + 1;
            const isMe = user.id === currentUser?.uid;
            const medalColor = rankColors[rank];

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  background: isMe
                    ? 'rgba(var(--primary-rgb, 220,38,38), 0.1)'
                    : 'var(--surface-container)',
                  border: isMe
                    ? '1px solid rgba(var(--primary-rgb, 220,38,38), 0.35)'
                    : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '14px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {/* Rank */}
                <div style={{
                  minWidth: '28px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: rank <= 3 ? '1.1rem' : '0.85rem',
                  color: medalColor ?? 'var(--on-surface-variant)',
                }}>
                  {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                </div>

                {/* Name and Rank Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: isMe ? 'var(--primary)' : 'var(--on-surface)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {user.displayName ?? 'Unknown'}
                    {isMe && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', opacity: 0.7 }}>• YOU</span>}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--on-surface-variant)',
                    marginTop: '1px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {user.rankTitle ?? 'Newcomer'}
                  </div>
                </div>

                {/* Day marker */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: isMe ? 'var(--primary)' : 'var(--on-surface)',
                  }}>
                    🔥
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
