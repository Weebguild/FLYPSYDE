import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, query, orderByChild, onValue, limitToLast, runTransaction } from 'firebase/database';
import { FeedPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import WeeklyVoteModal from '../components/WeeklyVoteModal';
import { requestNotificationPermission } from '../utils/notifications';
import PageTransition from '../components/PageTransition';
import ExpandableComments from '../components/ExpandableComments';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const { currentUser, userProfile } = useAuth();

  const handleReaction = async (postId: string, emoji: string) => {
    if (!currentUser || !userProfile?.groupCode) return;
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(20);

    const reactionRef = ref(db, `feeds/${userProfile.groupCode}/${postId}/reactions/${emoji}`);
    
    try {
      await runTransaction(reactionRef, (currentData: string[] | null) => {
        if (!currentData) {
          return [currentUser.uid]; // First reaction of this type
        }
        const index = currentData.indexOf(currentUser.uid);
        if (index > -1) {
          // Remove if they already reacted
          const newData = [...currentData];
          newData.splice(index, 1);
          return newData; 
        } else {
          // Add reaction
          return [...currentData, currentUser.uid];
        }
      });
    } catch (e) {
      console.error('Transaction failed', e);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  useEffect(() => {
    // Ask for FCM push notification permissions
    if (currentUser) {
      requestNotificationPermission(currentUser.uid).then(granted => {
        if (granted && !localStorage.getItem('notified_fcm_active')) {
          console.log("FCM Push Notifications enabled!");
          localStorage.setItem('notified_fcm_active', 'true');
        }
      });
    }

    if (!userProfile || !userProfile.groupCode) return;

    // Listen to feed collection ordered by timestamp
    const feedRef = ref(db, `feeds/${userProfile.groupCode}`);
    const q = query(
      feedRef, 
      orderByChild('timestamp'),
      limitToLast(50)
    );

    const unsubscribe = onValue(q, (snapshot) => {
      const feedData: FeedPost[] = [];
      snapshot.forEach(childSnap => {
        const data = childSnap.val();
        feedData.push({
          id: childSnap.key as string,
          ...data,
          timestamp: new Date(data.timestamp || Date.now())
        });
      });
      
      // RTDB returns ascending order, reverse for descending
      setPosts(feedData.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const timeAgo = (date: Date) => {
    // Simple fallback if date-fns not installed
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <PageTransition className="home-container" style={{ padding: '1rem', minHeight: '100vh', paddingBottom: '80px' }}>
      <WeeklyVoteModal isOpen={isVoteModalOpen} onClose={() => setIsVoteModalOpen(false)} />

      {/* Epic Sticky Header */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        background: 'rgba(255, 255, 255, 0.03)', // Extremely sheer frosted glass
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 10, 
        padding: '1.5rem 1rem', 
        margin: '-1rem -1rem 1.5rem -1rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="text-gradient-primary" style={{ margin: 0, fontSize: '1.8rem' }}>FLYPSYD</h1>
          <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid var(--tertiary)' }}>
            <span style={{ color: 'var(--tertiary)' }}>DAY 1</span> / 100
          </div>
        </div>
        
        {/* Progress Bar Container */}
        <div style={{ width: '100%', height: '6px', background: 'var(--surface-container-high)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' }}>
          <div style={{ width: '1%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--tertiary))', borderRadius: '3px' }}></div>
        </div>
      </div>
      
      {/* Weekly Vote Action Banner */}
      <div 
        onClick={() => setIsVoteModalOpen(true)}
        className="glass-card glow-primary" 
        style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid var(--tertiary)' }}
      >
        <div>
          <h3 style={{ margin: 0, color: 'var(--on-surface)' }}>🗳️ WEEKLY TRIBUNAL</h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Vote for the MVP and Slacker</p>
        </div>
        <div style={{ background: 'var(--tertiary)', color: 'var(--background)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem' }}>
          VOTE NOW
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="glass-card" style={{ padding: '1.2rem', opacity: 0.6, animation: 'pulse 1.5s infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container-highest)', marginRight: '1rem' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '40%', height: '14px', background: 'var(--surface-container-highest)', borderRadius: '4px', marginBottom: '0.5rem' }} />
                  <div style={{ width: '20%', height: '10px', background: 'var(--surface-container-high)', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ width: '100%', height: '200px', background: 'var(--surface-container-highest)', borderRadius: '8px' }} />
            </div>
          ))}
          <style>{`
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 0.3; }
              100% { opacity: 0.6; }
            }
          `}</style>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', marginTop: '2rem', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.8 }}>🌪️</div>
          <h3 style={{ margin: 0, color: 'var(--on-surface)' }}>The Feed is Empty</h3>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Be the spark. Check in to start the streak!</p>
        </div>
      )}

      {posts.map(post => (
        <div key={post.id} className="glass-card glow-primary" style={{ margin: '1rem 0', padding: '1.2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <img 
              src={post.userPhotoURL || `https://ui-avatars.com/api/?name=${post.userName}&background=random`} 
              alt={post.userName} 
              style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '1rem', border: '2px solid var(--secondary)' }} 
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--on-surface)' }}>{post.userName}</h3>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>Day {post.dayNumber} • {timeAgo(post.timestamp)}</span>
            </div>
          </div>

          {/* Post Content based on type */}
          {post.type === 'photo' && post.imageURL && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Daily Photo</p>
              <img src={post.imageURL} alt="Daily" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--outline-variant)' }} />
            </div>
          )}

          {post.type === 'slip' && (
            <div style={{ padding: '1rem', background: 'var(--error-container)', borderRadius: '8px', border: '1px solid var(--error-dim)', marginBottom: '1rem' }}>
              <p style={{ color: 'var(--on-error-container)', fontWeight: 'bold', margin: 0 }}>🚨 BROKE STREAK: {post.habitId?.replace(/-/g, ' ').toUpperCase()}</p>
            </div>
          )}

          {post.type === 'weight' && (
            <div style={{ padding: '1rem', background: 'var(--surface-container-high)', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid var(--secondary)' }}>
              <p style={{ color: 'var(--secondary)', fontWeight: 'bold', margin: 0 }}>⚖️ WEIGHT UPDATE: {post.weight} kg</p>
            </div>
          )}

          {post.type === 'war' && (
            <div style={{ padding: '1rem', background: 'var(--error-dim)', borderRadius: '8px', border: '1px solid var(--error)', marginBottom: '1rem', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--error)', margin: '0 0 0.5rem 0' }}>⚔️ WAR DECLARED ⚔️</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: 0 }}>
                Challenging <strong style={{ color: 'white' }}>{post.targetName}</strong> over <span style={{ color: 'var(--primary)' }}>{post.habitId?.replace(/-/g, ' ').toUpperCase()}</span>
              </p>
              <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--error)', marginTop: '0.5rem' }}>3 DAYS TO PROVE YOURSELF</p>
            </div>
          )}

          {/* Reactions and Comments Thread */}
          <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {['🔥', '💪', '🚨', '🤡'].map(emoji => {
               const uids = post.reactions?.[emoji] || [];
               const hasReacted = currentUser && uids.includes(currentUser.uid);
               
               if (uids.length === 0 && !hasReacted && emoji !== '🔥' && emoji !== '💪') return null; // Only show fire/muscle by default to save space
               
               return (
                 <button 
                   key={emoji}
                   onClick={() => handleReaction(post.id, emoji)}
                   style={{ 
                     background: hasReacted ? 'var(--primary-container)' : 'var(--surface-container-low)', 
                     border: `1px solid ${hasReacted ? 'var(--primary)' : 'var(--outline-variant)'}`, 
                     color: hasReacted ? 'var(--on-primary-container)' : 'var(--on-surface)', 
                     padding: '0.4rem 0.8rem', 
                     borderRadius: '20px', 
                     cursor: 'pointer', 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '0.5rem',
                     transition: 'all 0.2s',
                     fontWeight: 'bold'
                   }}>
                   {emoji} {uids.length > 0 && <span style={{ fontSize: '0.9rem' }}>{uids.length}</span>}
                 </button>
               )
            })}
            
            <div style={{ flex: 1 }} />
            
            <button 
              onClick={() => toggleComments(post.id)}
              style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              💬 Reply
            </button>
          </div>

          {expandedComments[post.id] && userProfile?.groupCode && (
             <ExpandableComments postId={post.id} groupCode={userProfile.groupCode} />
          )}
        </div>
      ))}
    </PageTransition>
  );
};

export default Home;
