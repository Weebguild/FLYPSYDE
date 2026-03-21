import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../firebase';
import { ref, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import toast from 'react-hot-toast';
import { X, Camera, LogOut, Bell, Vibrate, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AvatarCropper } from './AvatarCropper';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [currentWeight, setCurrentWeight] = useState<number | ''>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBaseline, setUploadingBaseline] = useState(false);
  const [avatarFileToCrop, setAvatarFileToCrop] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setCurrentWeight(userProfile.currentWeight || '');
      setWeightUnit(userProfile.weightUnit || 'kg');
    }
    const storedHaptics = localStorage.getItem('hapticsEnabled');
    if (storedHaptics !== null) setHaptics(storedHaptics === 'true');
    
    const storedNotifs = localStorage.getItem('notificationsEnabled');
    if (storedNotifs !== null) setNotifications(storedNotifs === 'true');
  }, [userProfile, isOpen]);

  const handleToggleHaptics = () => {
    setHaptics(!haptics);
    localStorage.setItem('hapticsEnabled', String(!haptics));
    if (!haptics && navigator.vibrate) navigator.vibrate(50);
  };

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
    localStorage.setItem('notificationsEnabled', String(!notifications));
    if (haptics && navigator.vibrate) navigator.vibrate(50);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    const toastId = toast.loading('Saving changes...');

    try {
      const userRef = ref(db, `users/${currentUser.uid}`);
      await update(userRef, {
        displayName: displayName,
        currentWeight: currentWeight === '' ? null : Number(currentWeight),
        weightUnit: weightUnit
      });
      toast.success('Settings updated', { id: toastId });
      if (haptics && navigator.vibrate) navigator.vibrate(50);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarFileToCrop(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processCroppedAvatar = async (croppedFile: File) => {
    if (!currentUser) return;
    setAvatarFileToCrop(null);
    setUploadingAvatar(true);
    const toastId = toast.loading('Uploading perfectly framed avatar...');
    try {
      const url = await uploadToCloudinary(croppedFile);
      await update(ref(db, `users/${currentUser.uid}`), { photoURL: url });
      toast.success('Avatar updated dynamically!', { id: toastId });
    } catch (err) {
      toast.error('Failed to upload', { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadBaseline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setUploadingBaseline(true);
    const toastId = toast.loading('Uploading baseline photo...');
    try {
      const url = await uploadToCloudinary(file);
      await update(ref(db, `users/${currentUser.uid}`), { baselinePhotoURL: url });
      toast.success('Baseline photo updated', { id: toastId });
    } catch (err) {
      toast.error('Failed to upload', { id: toastId });
    } finally {
      setUploadingBaseline(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
        navigate('/');
      } catch (error) {
        toast.error('Failed to log out');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '1rem'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--surface-container)',
              borderRadius: '24px 24px 0 0',
              padding: '2rem',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid var(--surface-variant)',
              borderBottom: 'none'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Settings</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Profile Sec */}
              <section>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Profile Customization</h3>
                
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '4px', display: 'block' }}>Display Name</span>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', color: 'white' }}
                  />
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div style={{ padding: '1rem', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--on-surface)', textAlign: 'center' }}>
                      {uploadingAvatar ? 'Uploading Avatar...' : 'Update Avatar'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label style={{ flex: 1, padding: '0.6rem', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--outline-variant)' }}>
                        <Camera size={18} color="var(--primary)" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Camera</div>
                        <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFileSelect} disabled={uploadingAvatar} />
                      </label>
                      <label style={{ flex: 1, padding: '0.6rem', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--outline-variant)' }}>
                        <ImageIcon size={18} color="var(--secondary)" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Gallery</div>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} disabled={uploadingAvatar} />
                      </label>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--on-surface)', textAlign: 'center' }}>
                      {uploadingBaseline ? 'Uploading Baseline...' : 'Update Baseline Photo'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label style={{ flex: 1, padding: '0.6rem', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--outline-variant)' }}>
                        <Camera size={18} color="var(--primary)" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Camera</div>
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleUploadBaseline} disabled={uploadingBaseline} />
                      </label>
                      <label style={{ flex: 1, padding: '0.6rem', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--outline-variant)' }}>
                        <ImageIcon size={18} color="var(--secondary)" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Gallery</div>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadBaseline} disabled={uploadingBaseline} />
                      </label>
                    </div>
                  </div>

                </div>
              </section>

              {/* Metrics Sec */}
              <section>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Body Metrics</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <label style={{ flex: 2 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '4px', display: 'block' }}>Current Weight</span>
                    <input 
                      type="number" 
                      value={currentWeight} 
                      onChange={e => setCurrentWeight(e.target.value ? Number(e.target.value) : '')}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', color: 'white' }}
                    />
                  </label>
                  <div style={{ flex: 1, display: 'flex', background: 'var(--surface)', borderRadius: '8px', padding: '4px', border: '1px solid var(--outline-variant)' }}>
                    <button 
                      onClick={() => setWeightUnit('kg')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: weightUnit === 'kg' ? 'var(--secondary)' : 'transparent', color: weightUnit === 'kg' ? '#000' : 'var(--on-surface-variant)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    >KG</button>
                    <button 
                      onClick={() => setWeightUnit('lbs')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: weightUnit === 'lbs' ? 'var(--secondary)' : 'transparent', color: weightUnit === 'lbs' ? '#000' : 'var(--on-surface-variant)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    >LBS</button>
                  </div>
                </div>
              </section>

              {/* Preferences Sec */}
              <section>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--tertiary)', marginBottom: '1rem', textTransform: 'uppercase' }}>App Experience</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-container-low)', borderRadius: '12px', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bell size={20} color="var(--tertiary)" />
                    <span style={{ fontWeight: 600 }}>Daily Reminders</span>
                  </div>
                  <button 
                    onClick={handleToggleNotifications}
                    style={{ width: '48px', height: '26px', borderRadius: '13px', background: notifications ? 'var(--tertiary)' : 'var(--surface-variant)', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: notifications ? '24px' : '2px', transition: 'all 0.2s' }}></div>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-container-low)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Vibrate size={20} color="var(--tertiary)" />
                    <span style={{ fontWeight: 600 }}>Haptic Feedback</span>
                  </div>
                  <button 
                    onClick={handleToggleHaptics}
                    style={{ width: '48px', height: '26px', borderRadius: '13px', background: haptics ? 'var(--tertiary)' : 'var(--surface-variant)', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: haptics ? '24px' : '2px', transition: 'all 0.2s' }}></div>
                  </button>
                </div>
              </section>

              {/* Admin Zone */}
              {userProfile?.isAdmin && (
                <section style={{ marginTop: '1rem' }}>
                  <button 
                    onClick={() => { onClose(); navigate('/admin'); }}
                    style={{ width: '100%', padding: '1rem', background: 'var(--error-dim)', border: '1px solid var(--error)', color: '#fff', borderRadius: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 59, 48, 0.3)', textTransform: 'uppercase' }}
                  >
                    <ShieldAlert size={18} /> ENTER COMMAND CENTER
                  </button>
                </section>
              )}

              {/* Danger Zone */}
              <section style={{ marginTop: '1rem' }}>
                <button 
                  onClick={handleLogout}
                  style={{ width: '100%', padding: '1rem', background: 'var(--surface-container-low)', border: '1px solid var(--error-dim)', color: 'var(--error)', borderRadius: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <LogOut size={18} /> LOG OUT
                </button>
              </section>

            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={handleSave} disabled={saving} className="button-primary glow-primary" style={{ flex: 2 }}>
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </motion.div>
          
          <AvatarCropper 
            imageFile={avatarFileToCrop} 
            onClose={() => setAvatarFileToCrop(null)} 
            onCrop={processCroppedAvatar} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
