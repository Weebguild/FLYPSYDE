import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { useUIConfig } from '../contexts/UIConfigContext';
import { User, FeedPost } from '../types';

const HABIT_LABELS: Record<string, string> = {
  'no-junk-food': '🍔 No Junk Food',
  'no-smoking': '🚬 No Smoking',
  'daily-study': '📚 Daily Study',
  'daily-workout': '💪 Daily Workout',
};

function timeAgo(ts: Date | number | string): string {
  const now = Date.now();
  const then = typeof ts === 'string' ? new Date(ts).getTime() : new Date(ts as any).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface MemberUserWithCheckin extends User {
  checkedInToday: boolean;
}

const AnalyticsWitness: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { currentGroup } = useGroup();
  const { uiConfig } = useUIConfig();
  const [members, setMembers] = useState<MemberUserWithCheckin[]>([]);
  const [slipFeed, setSlipFeed] = useState<(FeedPost & { userName: string })[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch member profiles
  useEffect(() => {
    if (!currentGroup || !currentGroup.memberIds) {
      setLoadingMembers(false);
      setMembers([]);
      return;
    }
    const memberIds = Object.values(currentGroup.memberIds || {}) as string[];
    if (memberIds.length === 0) { setLoadingMembers(false); setMembers([]); return; }

    setLoadingMembers(true);
    const today = new Date().toISOString().split('T')[0];
    const promises = memberIds.map(
      (id) =>
        new Promise<MemberUserWithCheckin | null>((resolve) => {
          const userRef = ref(db, `users/${id}`);
          onValue(userRef, (snap) => {
            if (snap.exists()) {
              const u = snap.val() as User;
              resolve({ ...u, id, checkedInToday: false });
            } else {
              resolve(null);
            }
          }, { onlyOnce: true });
        })
    );
    Promise.all(promises)
      .then((results) => {
        const defined = results.filter(Boolean) as MemberUserWithCheckin[];
        setMembers(defined);
        setLoadingMembers(false);
      })
      .catch(() => setLoadingMembers(false));
  }, [currentGroup]);

  // Fetch the slip-up feed for the group
  useEffect(() => {
    if (!currentGroup || !currentGroup.memberIds) {
      setSlipFeed([]);
      return;
    }
    const memberIds = Object.values(currentGroup.memberIds || {}) as string[];
    if (memberIds.length === 0) { setSlipFeed([]); return; }
    const groupCode = userProfile?.groupCode;
    if (!groupCode) { setSlipFeed([]); return; }
    const feedRef = ref(db, `feeds/${groupCode}`);
    const unsub = onValue(feedRef, (snap) => {
      if (!snap.exists()) { setSlipFeed([]); return; }
      const slips: (FeedPost & { userName: string })[] = [];
      snap.forEach((child) => {
        const post = child.val() as FeedPost;
        const slippedArr = Object.values((post as any).slippedHabits || {}) as string[];
        const hasSlip = slippedArr.length > 0 || post.type === 'slip';
        if (memberIds.includes(post.userId) && hasSlip) {
          slips.push({ ...post, id: child.key ?? '', userName: post.userName, slippedHabits: slippedArr });
        }
      });
      // Show newest first
      slips.sort((a, b) => {
        const ta = new Date(a.timestamp as any).getTime();
        const tb = new Date(b.timestamp as any).getTime();
        return tb - ta;
      });
      setSlipFeed(slips.slice(0, 30));
    });
    return () => unsub();
  }, [currentGroup]);

  // Show spinner only while actively fetching member data
  if (loadingMembers) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '4rem 1.5rem' }}>
        <div style={{
          width: '32px', height: '32px', margin: '0 auto',
          border: '2px solid var(--surface-container-highest)',
          borderTopColor: 'var(--primary)', borderRadius: '50%',
          animation: 'spin 0.9s linear infinite'
        }} />
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👁️</div>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          You're not in a squad yet.<br /> Join or create one to witness their downfall.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 1.5rem 0' }}>

      {/* Squad Group Streak */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(var(--primary-rgb, 220,38,38), 0.15), rgba(var(--primary-rgb, 220,38,38), 0.05))',
          border: '1px solid rgba(var(--primary-rgb, 220,38,38), 0.25)',
          borderRadius: '18px',
          padding: '1.2rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <div style={{
            fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '4px'
          }}>
            Squad Streak
          </div>
          <div style={{
            fontSize: '2.4rem', fontWeight: 900,
            color: 'var(--primary)',
            lineHeight: 1,
            textShadow: '0 0 20px rgba(var(--primary-rgb, 220,38,38), 0.5)',
          }}>
            {currentGroup.groupStreak?.currentStreak ?? 0}
            <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '4px' }}>days</span>
          </div>
        </div>
        <div style={{
          fontSize: '2.5rem',
          filter: `drop-shadow(0 0 12px rgba(var(--primary-rgb, 220,38,38), 0.6))`,
        }}>
          🔥
        </div>
      </motion.div>

      {/* Member Cards */}
      <h2 style={{
        fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '0.75rem'
      }}>
        Your Squad
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        {members.map((member, i) => {
          const isMe = member.id === currentUser?.uid;
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                padding: '1rem',
                background: isMe ? 'rgba(var(--primary-rgb, 220,38,38), 0.08)' : 'var(--surface-container)',
                border: isMe
                  ? '1px solid rgba(var(--primary-rgb, 220,38,38), 0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                backdropFilter: 'blur(8px)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Status indicator pulse */}
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: member.checkedInToday ? '#22c55e' : 'rgba(255,255,255,0.2)',
                boxShadow: member.checkedInToday ? '0 0 8px rgba(34,197,94,0.7)' : 'none',
              }} />

              {/* Initials circle */}
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(var(--primary-rgb, 220,38,38), 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 800,
                color: 'var(--primary)',
                marginBottom: '0.6rem',
                border: '1.5px solid rgba(var(--primary-rgb, 220,38,38), 0.3)',
              }}>
                {(member.displayName ?? '?').charAt(0).toUpperCase()}
              </div>

              <div style={{
                fontWeight: 700, fontSize: '0.88rem',
                color: 'var(--on-surface)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {isMe ? 'You' : member.displayName}
              </div>
              <div style={{
                fontSize: '0.65rem', color: 'var(--on-surface-variant)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginTop: '2px', marginBottom: '0.5rem',
              }}>
                {member.rankTitle ?? 'Newcomer'}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: member.checkedInToday ? '#22c55e' : 'rgba(255,255,255,0.3)',
                fontWeight: 600,
                letterSpacing: '0.06em',
              }}>
                {member.checkedInToday ? '✓ CHECKED IN' : '⏳ PENDING'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Slip-Up Feed */}
      <h2 style={{
        fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '0.75rem'
      }}>
        Slip Log
      </h2>

      {slipFeed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            textAlign: 'center', padding: '2.5rem 1rem',
            background: 'var(--surface-container)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.88rem', margin: 0 }}>
            {uiConfig.witnessEmptyState}
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {slipFeed.map((slip, i) => {
            const habits = slip.slippedHabits ?? (slip.habitId ? [slip.habitId] : []);
            const habitLabels = habits.map((h) => HABIT_LABELS[h] ?? h).join(', ');
            return (
              <motion.div
                key={slip.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--surface-container)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: '3px solid rgba(var(--primary-rgb, 220,38,38), 0.7)',
                  borderRadius: '12px',
                }}
              >
                {/* Initials */}
                <div style={{
                  minWidth: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(var(--primary-rgb, 220,38,38), 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)',
                  flexShrink: 0,
                }}>
                  {slip.userName?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--on-surface)', fontWeight: 600, lineHeight: 1.3 }}>
                    <span style={{ color: 'var(--primary)' }}>{slip.userName}</span>
                    {' slipped on '}
                    <span style={{ color: 'var(--on-surface)' }}>
                      {habitLabels || 'a habit'}
                    </span>
                  </div>
                  {slip.contextText && (
                    <div style={{
                      fontSize: '0.75rem', color: 'var(--on-surface-variant)',
                      marginTop: '3px', fontStyle: 'italic',
                    }}>
                      "{slip.contextText}"
                    </div>
                  )}
                  <div style={{
                    fontSize: '0.65rem', color: 'var(--on-surface-variant)',
                    marginTop: '4px', letterSpacing: '0.05em',
                  }}>
                    Day {slip.dayNumber} • {timeAgo(slip.timestamp)}
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

export default AnalyticsWitness;
