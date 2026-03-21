import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TransformationSlider from '../components/TransformationSlider';
import Heatmap from '../components/Heatmap';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';
import SettingsModal from '../components/SettingsModal';

const Profile = () => {
  const { userProfile } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  if (!userProfile) return <div style={{ padding: '2rem' }}>Loading Profile...</div>;
  // Mocking past streak data for the demonstration
  // 1 = Pass, 2 = Slip. Length indicates days passed in challenge.
  const mockJunkFood = [1, 1, 1, 1, 2, 1, 1]; 
  const mockSmoking = [1, 1, 1, 1, 1, 1, 1];
  const mockStudy = [1, 1, 2, 1, 1, 1, 1];
  const mockWorkout = [1, 1, 1, 1, 1, 2, 1];

  // Use specific transformation photos
  const latestPhoto = userProfile.latestDailyPhotoURL || 'https://placehold.co/400x500/1a1919/FFF?text=No+Check-in+Yet';
  const baselinePhoto = userProfile.baselinePhotoURL || 'https://placehold.co/400x500/1a1919/FFF?text=Baseline+Photo';

  const weightChange = (userProfile.startingWeight || 0) - (userProfile.currentWeight || 0);
  const isLoss = weightChange > 0;

  return (
    <div style={{ padding: '2rem', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-gradient-primary" style={{ margin: 0 }}>PROFILE</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {userProfile.isAdmin && (
            <button 
              onClick={() => window.location.href = '/admin'}
              style={{ background: 'var(--error-dim)', border: '1px solid var(--error)', color: 'var(--error)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              COMMAND CENTER
            </button>
          )}
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--on-surface)', padding: '0.6rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Settings size={28} />
          </button>
        </div>
      </div>

      <div className="glass-card glow-primary" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <img 
          src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName}`} 
          alt="Avatar" 
          style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--primary)', objectFit: 'cover' }} 
        />
        <div>
          <h2 style={{ margin: 0 }}>{userProfile.displayName}</h2>
          <p style={{ color: 'var(--secondary)', margin: '0.2rem 0', fontWeight: 'bold' }}>RANK: {userProfile.rankTitle?.toUpperCase()}</p>
          <span style={{ background: 'var(--surface-container-high)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
            Squad: {userProfile.groupCode}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ flex: 1, textAlign: 'center', padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>CURRENT WEIGHT</span>
          <h3 style={{ margin: '0.5rem 0', fontSize: '1.5rem' }}>{userProfile.currentWeight} {userProfile.weightUnit}</h3>
        </div>
        <div className="glass-card" style={{ flex: 1, textAlign: 'center', padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>PROGRESS</span>
          <h3 style={{ margin: '0.5rem 0', fontSize: '1.5rem', color: isLoss ? 'var(--tertiary)' : 'var(--error)' }}>
            {isLoss ? '↓' : '↑'} {Math.abs(weightChange).toFixed(1)} {userProfile.weightUnit}
          </h3>
        </div>
      </div>

      <TransformationSlider 
        beforeImage={baselinePhoto} 
        afterImage={latestPhoto} 
      />

      <h3 style={{ marginBottom: '1.5rem', color: 'var(--on-surface)' }}>100-DAY CONSISTENCY</h3>
      <Heatmap habitName="No Junk Food" streakData={mockJunkFood} />
      <Heatmap habitName="No Smoking" streakData={mockSmoking} />
      <Heatmap habitName="Daily Study" streakData={mockStudy} />
      <Heatmap habitName="Daily Workout" streakData={mockWorkout} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Profile;
