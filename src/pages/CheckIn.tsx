import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import { calculateCurrentDay } from '../utils/dateUtils';
import { db } from '../firebase';
import { ref, push, serverTimestamp, update } from 'firebase/database';

import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import PageTransition from '../components/PageTransition';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, Circle, Clock, XCircle, Image as ImageIcon } from 'lucide-react';
import { useUIConfig } from '../contexts/UIConfigContext';

const HABITS = [
  { id: 'no-junk-food', label: 'No Junk Food' },
  { id: 'no-smoking', label: 'No Smoking' },
  { id: 'daily-study', label: 'Daily Study' },
  { id: 'daily-workout', label: 'Daily Workout' }
];

const CheckIn = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { currentGroup } = useGroup();
  const { uiConfig } = useUIConfig();
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // New UI states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [slippedHabits, setSlippedHabits] = useState<string[]>([]);
  const [contextText, setContextText] = useState('');
  const [isComplete, setIsComplete] = useState(false); // Controls the polaroid view
  const [timeLeft, setTimeLeft] = useState('');
  const [greeting, setGreeting] = useState('Welcome');
  const [timeGradient, setTimeGradient] = useState('linear-gradient(135deg, var(--primary), var(--primary-container))');

  // Parallax — low damping = visible spring overshoot on release
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 8, mass: 0.6 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const rotateX = useTransform(springY, [-120, 120], [18, -18]);
  const rotateY = useTransform(springX, [-120, 120], [-18, 18]);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const tapStartTime = React.useRef(0);
  const tapStartPos = React.useRef({ x: 0, y: 0 });

  const setTiltFromPoint = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(clientX - (rect.left + rect.width / 2));
    y.set(clientY - (rect.top + rect.height / 2));
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setTiltFromPoint(event.clientX, event.clientY);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const t = event.touches[0];
    tapStartTime.current = Date.now();
    tapStartPos.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const t = event.touches[0];
    if (t) setTiltFromPoint(t.clientX, t.clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const duration = Date.now() - tapStartTime.current;
    const end = event.changedTouches[0];
    const dx = Math.abs(end.clientX - tapStartPos.current.x);
    const dy = Math.abs(end.clientY - tapStartPos.current.y);

    if (duration < 180 && dx < 12 && dy < 12) {
      // Quick tap — flick toward the tap point, then spring back
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const offsetX = end.clientX - (rect.left + rect.width / 2);
        const offsetY = end.clientY - (rect.top + rect.height / 2);
        x.set(offsetX * 1.6);
        y.set(offsetY * 1.6);
        // Short delay so the tilt is visible, then spring snaps back
        setTimeout(() => { x.set(0); y.set(0); }, 80);
      }
    } else {
      // Hold/drag release — normal spring-back
      x.set(0);
      y.set(0);
    }
  };

  const resetTilt = () => {
    x.set(0);
    y.set(0);
  };

  // Restore today's check-in from localStorage
  useEffect(() => {
    if (currentUser) {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(`checkIn_${currentUser.uid}_${today}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setPreviewURL(data.imageURL);
          setCompletedHabits(data.habits || []);
          setSlippedHabits(data.slippedHabits || []);
          setContextText(data.contextText || '');
          setIsComplete(true);
        } catch(e){}
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // Determine Greeting & Gradient based on local time
    const updateTimeBasedUI = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
        setTimeGradient('linear-gradient(135deg, #FFB75E, #ED8F03)');
      } else if (hour < 18) {
        setGreeting('Good Afternoon');
        setTimeGradient('linear-gradient(135deg, #00C9FF, #92FE9D)');
      } else {
        setGreeting('Good Evening');
        setTimeGradient('linear-gradient(135deg, #667EEA, #764BA2)');
      }

      // Midnight Countdown
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimeBasedUI();
    const interval = setInterval(updateTimeBasedUI, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (navigator.vibrate) navigator.vibrate(50);
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
    }
  };

  const cycleHabit = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(20);
    const isWon = completedHabits.includes(id);
    const isSlipped = slippedHabits.includes(id);
    if (!isWon && !isSlipped) {
      // empty → win
      setCompletedHabits(prev => [...prev, id]);
    } else if (isWon) {
      // win → slip
      setCompletedHabits(prev => prev.filter(h => h !== id));
      setSlippedHabits(prev => [...prev, id]);
    } else {
      // slip → empty
      setSlippedHabits(prev => prev.filter(h => h !== id));
    }
  };

  const handlePost = async () => {
    if (!selectedFile || !currentUser || !userProfile || !userProfile.groupCode) return;

    if (navigator.vibrate) navigator.vibrate(50);
    setLoading(true);
    
    const toastId = toast.loading('Securing your progress...');

    try {
      // 1. Upload to Cloudinary
      const photoURL = await uploadToCloudinary(selectedFile);

      // Calculate Day Number based on challenge start date
      const dayNumber = calculateCurrentDay(userProfile.joinedAt); 

      // 2. Post to Feed (now including habits)
      const feedRef = ref(db, `feeds/${userProfile.groupCode}`);
      await push(feedRef, {
        userId: currentUser.uid,
        userName: userProfile.displayName,
        userPhotoURL: userProfile.photoURL,
        type: 'photo',
        imageURL: photoURL,
        contextText: contextText,
        dayNumber: dayNumber,
        completedHabits: completedHabits,
        slippedHabits: slippedHabits,
        timestamp: serverTimestamp(),
        reactions: {}
      });

      // 3. Update User Profile with the latest photo for transformation slider
      await update(ref(db, `users/${currentUser.uid}`), { latestDailyPhotoURL: photoURL });

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      toast.success("Check-in secured!", { id: toastId, duration: 4000 });
      
      localStorage.setItem(`checkIn_${currentUser.uid}_${new Date().toDateString()}`, JSON.stringify({
        imageURL: photoURL,
        habits: completedHabits,
        slippedHabits: slippedHabits,
        contextText: contextText
      }));

      setShowConfetti(true);
      setIsComplete(true);
      
      // We don't auto-redirect, we let them view the polaroid.

    } catch (error) {
      console.error(error);
      if (navigator.vibrate) navigator.vibrate(200);
      toast.error("Failed to post check-in.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isComplete && previewURL) {
    return (
      <PageTransition style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={600} gravity={0.15} />}
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, rotateZ: -5 }}
          animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            background: '#ffffff',
            padding: '1rem',
            paddingBottom: '3rem',
            borderRadius: '4px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            width: '100%',
            maxWidth: '350px',
            color: '#1a1a1a',
            position: 'relative'
          }}
        >
          <img 
            src={previewURL} 
            alt="Day check in" 
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} 
          />
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
            <h2 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.5rem', fontWeight: 800 }}>DAY {calculateCurrentDay(userProfile?.joinedAt)} COMPLETE</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem', fontWeight: 600 }}>{userProfile?.displayName}</p>
            {completedHabits.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                {completedHabits.map(id => {
                  const habit = HABITS.find(h => h.id === id);
                  return (
                    <span key={id} style={{ background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      ✓ {habit?.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          style={{ marginTop: '3rem', textAlign: 'center', paddingBottom: '100px' }}
        >
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1rem', fontSize: '0.9rem' }}>Take a screenshot to share on your socials!</p>
          <button className="button-primary" onClick={() => navigate('/home')}>
            BACK TO HOME
          </button>
          
          {import.meta.env.DEV && (
            <button 
              onClick={() => {
                if (currentUser) {
                  localStorage.removeItem(`checkIn_${currentUser.uid}_${new Date().toDateString()}`);
                  setIsComplete(false);
                  setPreviewURL(null);
                  setSelectedFile(null);
                  setCompletedHabits([]);
                }
              }}
              style={{
                display: 'block', margin: '1.5rem auto 0', background: 'transparent', 
                border: '1px solid var(--error-dim)', color: 'var(--error)', 
                borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 'bold'
              }}
            >
              [DEV] RESET CHECK-IN
            </button>
          )}
        </motion.div>
      </PageTransition>
    );
  }

  return (
    <PageTransition style={{ padding: '2rem', minHeight: '100vh', paddingBottom: '100px' }}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: '400px', margin: '0 auto' }}
      >
        {/* Dynamic Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--on-surface-variant)', marginBottom: '0.2rem', fontWeight: 600 }}>
            {greeting}, {userProfile?.displayName?.split(' ')[0] || 'Challenger'}
          </h2>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: 0, 
            background: timeGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            DAY {calculateCurrentDay(userProfile?.joinedAt)} <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>/ 100</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface-variant)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <Clock size={14} />
            <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{timeLeft} LEFT TODAY</span>
          </div>
        </motion.div>

        {/* 3D Interactive Card */}
        <motion.div 
          ref={cardRef}
          variants={itemVariants}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 800,
            zIndex: 10
          }}
        >
          <div className="glass-card" style={{ 
            padding: '0', 
            overflow: 'hidden',
            border: `1px solid rgba(255,255,255,0.1)`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {previewURL ? (
              <div style={{ position: 'relative' }}>
                <img src={previewURL} alt="Preview" style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }} />
                <button 
                  onClick={() => { setSelectedFile(null); setPreviewURL(null); }}
                  style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none',
                    color: 'white', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.8rem'
                  }}
                >
                  Retake
                </button>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                aspectRatio: '4/5', background: 'rgba(255,255,255,0.02)', width: '100%',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Capture Your Day</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>Choose a source</p>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Camera size={32} color="var(--primary)" strokeWidth={1.5} />
                    </motion.div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Camera</span>
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} disabled={loading} />
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <ImageIcon size={32} color="var(--secondary)" strokeWidth={1.5} />
                    </motion.div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Gallery</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} disabled={loading} />
                  </label>
                </div>
              </div>
            )}
            
            {/* Checklist Section inside the card */}
            <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700 }}>{uiConfig.habitsLabel}</p>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>{uiConfig.habitsHint}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {HABITS.map(habit => {
                  const isWon = completedHabits.includes(habit.id);
                  const isSlipped = slippedHabits.includes(habit.id);
                  return (
                    <motion.div
                      key={habit.id}
                      onClick={() => cycleHabit(habit.id)}
                      whileTap={{ scale: 0.93 }}
                      animate={{
                        background: isWon ? 'rgba(142,255,113,0.12)' : isSlipped ? 'rgba(255,59,48,0.12)' : 'rgba(255,255,255,0.03)',
                        borderColor: isWon ? 'var(--tertiary)' : isSlipped ? 'var(--error)' : 'rgba(255,255,255,0.08)',
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        padding: '18px 12px', borderRadius: '16px',
                        borderWidth: '1px', borderStyle: 'solid',
                        cursor: 'pointer', userSelect: 'none'
                      }}
                    >
                      {isWon ? (
                        <CheckCircle2 color="var(--tertiary)" size={28} style={{ filter: 'drop-shadow(0 0 10px rgba(142,255,113,0.6))' }} />
                      ) : isSlipped ? (
                        <XCircle color="var(--error)" size={28} style={{ filter: 'drop-shadow(0 0 10px rgba(255,59,48,0.6))' }} />
                      ) : (
                        <Circle color="rgba(255,255,255,0.25)" size={28} />
                      )}
                      <span style={{
                        fontSize: '0.85rem', fontWeight: 600, textAlign: 'center',
                        color: isWon ? 'var(--tertiary)' : isSlipped ? 'var(--error)' : 'var(--on-surface-variant)'
                      }}>
                        {habit.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {previewURL && (
                <div style={{ marginTop: '1.5rem' }}>
                  <input
                    type="text"
                    placeholder={uiConfig.contextPlaceholder}
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'var(--on-surface)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="button-primary glow-primary"
                    onClick={handlePost}
                    disabled={loading}
                    style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                     {loading ? 'SECURING...' : `${uiConfig.secureButtonText} ${calculateCurrentDay(userProfile?.joinedAt)}`}
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </motion.div>

    </PageTransition>
  );
};

export default CheckIn;
