import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, get, set } from 'firebase/database';
import { uploadToCloudinary } from '../utils/cloudinary';
import AvatarPicker from '../components/AvatarPicker';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [groupCode, setGroupCode] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [customAvatar, setCustomAvatar] = useState<File | null>(null);

  const [isCreator, setIsCreator] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user already has a profile that's fully set up
      const userRef = ref(db, `users/${result.user.uid}`);
      const userSnap = await get(userRef);
      if (userSnap.exists() && userSnap.val().baselinePhotoURL) {
        navigate('/home');
      } else {
        setStep(2);
      }
    } catch (error: any) {
      console.error('Error signing in', error);
      alert(`Sign in failed. Error: ${error.message || 'Unknown error. Check console and Firestore rules.'}`);
    }
  };

  const handleGroupCodeSubmit = () => {
    if (groupCode.length === 6) {
      setIsCreator(false);
      setStep(3);
    } else {
      alert('Code must be 6 characters.');
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser) return;
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      // Initialize the new group in Firebase RTDB
      const groupRef = ref(db, `groups/${newCode}`); // Store group by code as key for easy lookup
      await set(groupRef, {
        groupCode: newCode,
        adminId: currentUser.uid,
        createdAt: new Date().getTime(),
        status: 'assembling' // squad is forming
      });

      setGroupCode(newCode);
      setIsCreator(true);
      setStep(3);
    } catch (error) {
      console.error(error);
      alert("Failed to create a new squad. Check database rules.");
    }
  };

  const handleProfileSubmit = () => {
    if (height && weight && waist) {
      setStep(4);
    }
  };

  const handleTakePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) {
      alert("You must be signed in to complete this step.");
      return;
    }

    try {
      // 1. Upload baseline photo to Cloudinary
      const photoURL = await uploadToCloudinary(file);
      
      // Upload avatar to Cloudinary if provided
      let finalAvatarURL = currentUser.photoURL || '';
      if (customAvatar) {
        finalAvatarURL = await uploadToCloudinary(customAvatar);
      }
      
      // 2. Save profile to Realtime DB
      const userRef = ref(db, `users/${currentUser.uid}`);
      await set(userRef, {
        id: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        photoURL: finalAvatarURL,
        email: currentUser.email || '',
        isAdmin: isCreator, // First user to create squad is Admin
        startingWeight: parseFloat(weight),
        currentWeight: parseFloat(weight),
        weightUnit: 'kg', 
        height: parseFloat(height),
        heightUnit: 'cm', 
        waistMeasurement: parseFloat(waist),
        baselinePhotoURL: photoURL,
        notificationTone: 'motivational',
        joinedAt: new Date().getTime(),
        rankTitle: isCreator ? 'Commander' : 'Rookie',
        groupCode: groupCode 
      });

      alert("Day 1 baseline saved!");
      navigate('/day-zero');
    } catch (error: any) {
      console.error("Error saving profile", error);
      alert("Failed to upload photo and save profile. Check console.");
    }
  };

  const inputStyle = {
    background: 'var(--surface-container-low)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '1.2rem',
    width: '100%',
    boxSizing: 'border-box' as const
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1 className="text-gradient-primary" style={{ textAlign: 'center', marginBottom: '2rem' }}>JOIN SQUAD</h1>

      {step === 1 && (
        <div className="glass-card glow-primary" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Step 1: Authenticate</h2>
          <button className="button-primary" onClick={handleGoogleSignIn} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="24" />
            SIGN IN WITH GOOGLE
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card glow-primary">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Step 2: Enter Group Code</h2>
          <input 
            type="text" 
            placeholder="6-DIGIT CODE"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ 
              background: 'var(--surface-container-lowest)', 
              border: 'none', 
              borderBottom: '2px solid var(--secondary)',
              color: 'var(--secondary)',
              padding: '1rem',
              fontSize: '1.5rem',
              fontFamily: 'var(--font-display)',
              width: '100%',
              marginBottom: '2rem',
              textAlign: 'center',
              outline: 'none',
              letterSpacing: '5px',
              boxSizing: 'border-box'
            }} 
          />
          <button className="button-secondary" onClick={handleGroupCodeSubmit} style={{ width: '100%', marginBottom: '1rem' }}>JOIN SQUAD</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
            <div style={{ height: '1px', background: 'var(--outline-variant)', flex: 1 }} />
            <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>OR</span>
            <div style={{ height: '1px', background: 'var(--outline-variant)', flex: 1 }} />
          </div>

          <button className="button-primary" onClick={handleCreateGroup} style={{ width: '100%', borderColor: 'transparent' }}>
            CREATE NEW SQUAD
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="glass-card glow-primary">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Step 3: Profile & Baseline</h2>
          
          <AvatarPicker 
            onImageSelected={(file) => setCustomAvatar(file)} 
            currentImage={currentUser?.photoURL || undefined}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <input placeholder="Current Weight (kg)" type="number" value={weight} onChange={e => setWeight(e.target.value)}
              style={inputStyle} />
            <input placeholder="Height (cm)" type="number" value={height} onChange={e => setHeight(e.target.value)}
              style={inputStyle} />
            <input placeholder="Waist (cm)" type="number" value={waist} onChange={e => setWaist(e.target.value)}
              style={inputStyle} />
          </div>

          <button className="button-secondary" onClick={handleProfileSubmit} style={{ width: '100%' }}>NEXT</button>
        </div>
      )}

      {step === 4 && (
        <div className="glass-card glow-primary" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Step 4: The Commitment</h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>
            Your Day 1 photo is permanent. No skipping. Shirtless. Front-facing.<br/><br/>
            This is the baseline you will beat.
          </p>
          <label style={{ display: 'block', width: '100%' }}>
            <input 
              type="file" 
              accept="image/*" 
              capture="user" 
              style={{ display: 'none' }} 
              onChange={handleTakePhoto}
            />
            <div className="button-primary" style={{ background: 'var(--error-dim)', color: 'white', border: '1px solid var(--error)', padding: '1.5rem', cursor: 'pointer' }}>
              TAKE DAY 1 PHOTO
            </div>
          </label>
        </div>
      )}

    </div>
  );
};

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-container-lowest)',
  border: 'none',
  borderBottom: '2px solid var(--outline-variant)',
  color: 'var(--on-surface)',
  padding: '1rem',
  fontSize: '1rem',
  fontFamily: 'var(--font-body)',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box'
};

export default Onboarding;
