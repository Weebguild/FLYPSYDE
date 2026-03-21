import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import { db } from '../firebase';
import { ref, push, serverTimestamp, update } from 'firebase/database';
import SlipLogModal from '../components/SlipLogModal';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import PageTransition from '../components/PageTransition';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, Circle, Clock, Check as CheckIcon, Image as ImageIcon } from 'lucide-react';

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
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // New UI states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false); // Controls the polaroid view
  const [timeLeft, setTimeLeft] = useState('');
  const [greeting, setGreeting] = useState('Welcome');
  const [timeGradient, setTimeGradient] = useState('linear-gradient(135deg, var(--primary), var(--primary-container))');

  // Parallax properties
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  useEffect(() => {
    if (currentUser) {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(`checkIn_${currentUser.uid}_${today}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setPreviewURL(data.imageURL);
          setCompletedHabits(data.habits || []);
          setIsComplete(true);
        } catch(e){}
      }
    }
  }, [currentUser]);

  // Handle Parallax
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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

  const toggleHabit = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setCompletedHabits(prev => 
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const handlePost = async () => {
    if (!selectedFile || !currentUser || !userProfile || !userProfile.groupCode) return;

    if (navigator.vibrate) navigator.vibrate(50);
    setLoading(true);
    
    const toastId = toast.loading('Securing your progress...');

    try {
      // 1. Upload to Cloudinary
      const photoURL = await uploadToCloudinary(selectedFile);

      // Calculate Day Number based on challenge start date (mocking for now as Day 1)
      const dayNumber = 1; 

      // 2. Post to Feed (now including habits)
      const feedRef = ref(db, `feeds/${userProfile.groupCode}`);
      await push(feedRef, {
        userId: currentUser.uid,
        userName: userProfile.displayName,
        userPhotoURL: userProfile.photoURL,
        type: 'photo',
        imageURL: photoURL,
        dayNumber: dayNumber,
        completedHabits: completedHabits,
        timestamp: serverTimestamp(),
        reactions: {}
      });

      // 3. Update User Profile with the latest photo for transformation slider
      await update(ref(db, `users/${currentUser.uid}`), { latestDailyPhotoURL: photoURL });

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      toast.success("Check-in secured!", { id: toastId, duration: 4000 });
      
      localStorage.setItem(`checkIn_${currentUser.uid}_${new Date().toDateString()}`, JSON.stringify({
        imageURL: photoURL,
        habits: completedHabits
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
            <h2 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.5rem', fontWeight: 800 }}>DAY 1 COMPLETE</h2>
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
            DAY 1 <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>/ 100</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface-variant)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <Clock size={14} />
            <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{timeLeft} LEFT TODAY</span>
          </div>
        </motion.div>

        {/* 3D Interactive Card */}
        <motion.div 
          variants={itemVariants}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 1000,
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
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700 }}>Daily Wins</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {HABITS.map(habit => {
                  const isChecked = completedHabits.includes(habit.id);
                  return (
                    <motion.div 
                      key={habit.id} 
                      onClick={() => toggleHabit(habit.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        background: isChecked ? 'rgba(142,255,113,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: isChecked ? 'var(--tertiary)' : 'rgba(255,255,255,0.08)',
                        boxShadow: isChecked ? '0 8px 24px rgba(142,255,113,0.15)' : 'none'
                      }}
                      style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                        padding: '16px 12px', borderRadius: '16px',
                        borderWidth: '1px', borderStyle: 'solid'
                      }}
                    >
                      {isChecked ? (
                        <CheckCircle2 color="var(--tertiary)" size={28} style={{ filter: 'drop-shadow(0 0 12px rgba(142,255,113,0.6))' }} />
                      ) : (
                        <Circle color="var(--on-surface-variant)" size={28} />
                      )}
                      <span style={{ 
                        fontSize: '0.85rem', fontWeight: 600, textAlign: 'center',
                        color: isChecked ? 'var(--tertiary)' : 'var(--on-surface)'
                      }}>
                        {habit.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {previewURL && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="button-primary glow-primary"
                  onClick={handlePost}
                  disabled={loading}
                  style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  {loading ? 'SECURING...' : 'SECURE DAY 1'}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Motivational Quote & Slip */}
        <motion.div variants={itemVariants} style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--on-surface-variant)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time."
          </p>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--error-dim)', 
              textDecoration: 'underline', marginTop: '1.5rem', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '0.05em'
            }}
          >
            LOG A SLIP INSTEAD
          </button>
        </motion.div>

      </motion.div>

      <SlipLogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </PageTransition>
  );
};

export default CheckIn;
