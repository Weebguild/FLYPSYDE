import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ref, get, set, push, update, onValue, serverTimestamp } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Users, Plus, LogIn, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DayZero: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { currentGroup } = useGroup();
  
  const [authLoading, setAuthLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [squadMembers, setSquadMembers] = useState<any[]>([]);

  // Calculate pending members in the waiting room
  useEffect(() => {
    if (currentGroup && currentGroup.memberIds) {
      const fetchMembers = async () => {
        const membersData = [];
        for (const uid of currentGroup.memberIds) {
          const snapshot = await get(ref(db, `users/${uid}`));
          if (snapshot.exists()) {
            membersData.push(snapshot.val());
          }
        }
        setSquadMembers(membersData);
      };
      fetchMembers();
      
      // If group is active, someone initiated it. Route to onboarding or home based on profile status.
      if (currentGroup.status === 'active') {
        if (!userProfile?.baselinePhotoURL || !userProfile?.startingWeight) {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      }
    }
  }, [currentGroup, userProfile, navigate]);

  const handleAuth = async (action: 'create' | 'join') => {
    if (!currentUser) {
      setAuthLoading(true);
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        // Ensure user exists in db
        const userRef = ref(db, `users/${result.user.uid}`);
        const snapshot = await get(userRef);
        if (!snapshot.exists()) {
          await set(userRef, {
            id: result.user.uid,
            displayName: result.user.displayName || 'Unknown Soldier',
            photoURL: result.user.photoURL || '',
            email: result.user.email,
            isAdmin: false,
            joinedAt: serverTimestamp(),
            rankTitle: 'Recruit'
          });
        }
      } catch (error: any) {
        toast.error('Authentication failed: ' + error.message);
        setAuthLoading(false);
        return;
      }
      setAuthLoading(false);
    }

    if (action === 'create') {
      await createSquad();
    } else {
      setShowJoinInput(true);
    }
  };

  const createSquad = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
      const groupRef = push(ref(db, 'groups'));
      await set(groupRef, {
        groupCode: code,
        adminUserId: currentUser.uid,
        memberIds: [currentUser.uid],
        status: 'waiting',
        groupStreak: { currentStreak: 0, lastBrokenDate: null, lastBrokenByUserId: null }
      });
      
      await update(ref(db, `users/${currentUser.uid}`), { groupCode: code });
      toast.success('Squad Created! Share the code: ' + code);
    } catch (e) {
      toast.error('Failed to create squad');
    }
    setIsProcessing(false);
  };

  const joinSquad = async () => {
    if (!currentUser || joinCode.length !== 6) return;
    setIsProcessing(true);
    try {
      const snapshot = await get(ref(db, 'groups'));
      let foundGroup: any = null;
      let foundGroupId: string | null = null;

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          if (child.val().groupCode === joinCode) {
            foundGroup = child.val();
            foundGroupId = child.key;
          }
        });
      }

      if (foundGroup && foundGroupId) {
        if (foundGroup.status !== 'waiting') {
          toast.error('This squad has already initiated the 100 days!');
        } else if (foundGroup.memberIds.length >= 5) {
          toast.error('Squad is full (Max 5)');
        } else if (foundGroup.memberIds.includes(currentUser.uid)) {
          toast.success('You are already in this squad');
          await update(ref(db, `users/${currentUser.uid}`), { groupCode: joinCode });
        } else {
          const updatedMembers = [...foundGroup.memberIds, currentUser.uid];
          await update(ref(db, `groups/${foundGroupId}`), { memberIds: updatedMembers });
          await update(ref(db, `users/${currentUser.uid}`), { groupCode: joinCode });
          toast.success('Successfully joined squad!');
        }
      } else {
        toast.error('Invalid group code');
      }
    } catch (e) {
      toast.error('Failed to join squad');
    }
    setIsProcessing(false);
  };

  const initiateProtocol = async () => {
    if (!currentUser || !currentGroup || currentGroup.adminUserId !== currentUser.uid) return;
    setIsProcessing(true);
    try {
      await update(ref(db, `groups/${currentGroup.id}`), {
        status: 'active',
        challengeStartDate: serverTimestamp()
      });
      toast.success('PROTOCOL INITIATED');
      // The useEffect will catch the active status and route to /onboarding
    } catch (e) {
      toast.error('Failed to initiate protocol');
      setIsProcessing(false);
    }
  };

  // State 3: The True Waiting Room
  if (currentGroup && currentGroup.status === 'waiting') {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '100vh', textAlign: 'center', background: 'var(--background)' }}>
        <h1 className="text-gradient-primary" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>WAITING ROOM</h1>
        <p style={{ color: 'var(--tertiary)', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '2px', marginBottom: '2rem' }}>CODE: {currentGroup.groupCode}</p>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Squad Roster ({squadMembers.length}/5)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            {squadMembers.map((member) => (
              <div key={member.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', maxWidth: '300px' }}>
                <img src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&background=random`} alt={member.displayName} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--on-surface)' }}>{member.displayName}</p>
                  {currentGroup.adminUserId === member.id && <span style={{ fontSize: '0.7rem', color: 'var(--tertiary)', fontWeight: 'bold' }}>ADMIN</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card glow-primary" style={{ padding: '1.5rem', marginTop: '2rem' }}>
          {currentGroup.adminUserId === currentUser?.uid ? (
            <>
              <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: 'var(--on-surface)' }}>Everyone ready?</p>
              <button 
                className="button-primary" 
                onClick={initiateProtocol}
                disabled={isProcessing}
                style={{ width: '100%', padding: '1.2rem', background: 'var(--error)', color: 'white', boxShadow: '0 0 20px rgba(255, 59, 48, 0.4)' }}
              >
                {isProcessing ? 'INITIATING...' : 'INITIATE 100-DAY PROTOCOL'}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ width: '30px', height: '30px', border: '3px solid var(--surface-container-highest)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
              <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>Awaiting Admin to initiate protocol...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // States 1 & 2: The Gatekeeper (Unauthenticated or No Group)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '2rem', boxSizing: 'border-box', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background gradients */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw', background: 'var(--primary-dim)', filter: 'blur(100px)', opacity: 0.3, borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60vw', height: '60vw', background: 'var(--secondary-dim)', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: 'var(--primary)', fontStyle: 'italic', fontSize: '1.5rem', marginBottom: 'auto' }}>
          FLYPSYDE
        </h1>

        <div style={{ margin: 'auto 0' }}>
          <h1 className="display" style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '1rem', color: 'var(--on-surface)' }}>
            100 DAYS.<br/>NO EXCUSES.
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', margin: '0 auto 2rem auto', maxWidth: '300px' }}>
            Survive the gauntlet together, or fail publicly.
          </p>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence mode="wait">
            {!showJoinInput ? (
              <motion.div key="buttons" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  className="glass-card glow-primary" 
                  onClick={() => handleAuth('create')}
                  disabled={authLoading || isProcessing}
                  style={{ padding: '1.5rem', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontWeight: 'bold' }}
                >
                  <Plus /> CREATE SQUAD
                </button>
                <button 
                  className="glass-card" 
                  onClick={() => handleAuth('join')}
                  disabled={authLoading || isProcessing}
                  style={{ padding: '1.5rem', background: 'var(--surface-container)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontWeight: 'bold' }}
                >
                  <Users /> JOIN SQUAD
                </button>
              </motion.div>
            ) : (
              <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--on-surface)' }}>Enter Squad Code</h3>
                  <button onClick={() => setShowJoinInput(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)' }}>
                    <X size={24} />
                  </button>
                </div>
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="6-DIGIT CODE"
                  style={{ width: '100%', padding: '1rem', background: 'var(--background)', border: '1px solid var(--outline)', borderRadius: '12px', color: 'var(--on-surface)', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', marginBottom: '1.5rem' }}
                />
                <button 
                  className="button-primary" 
                  onClick={joinSquad}
                  disabled={isProcessing || joinCode.length !== 6}
                  style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  {isProcessing ? 'JOINING...' : 'JOIN NOW'} <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DayZero;
