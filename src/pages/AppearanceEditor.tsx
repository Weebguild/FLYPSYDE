import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Type, FileText, Zap, RotateCcw, Eye, EyeOff, 
  ChevronDown, ChevronUp, Wifi, WifiOff, Smartphone
} from 'lucide-react';
import { useUIConfig, UI_DEFAULTS, UIConfig } from '../contexts/UIConfigContext';
import toast from 'react-hot-toast';
import Home from './Home';
import CheckIn from './CheckIn';
import Profile from './Profile';

// --- Font Options ---
const FONTS = [
  { name: 'Manrope', preview: 'FLYPSYDE' },
  { name: 'Space Grotesk', preview: 'FLYPSYDE' },
  { name: 'Inter', preview: 'FLYPSYDE' },
  { name: 'Outfit', preview: 'FLYPSYDE' },
  { name: 'Rajdhani', preview: 'FLYPSYDE' },
];

// --- Collapsible Section ---
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', marginBottom: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.2rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span style={{ color: 'var(--primary)' }}>{icon}</span>
          {title}
        </div>
        {open ? <ChevronUp size={18} color="var(--on-surface-variant)" /> : <ChevronDown size={18} color="var(--on-surface-variant)" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 1.2rem 1.2rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Premium Toggle ---
const Toggle: React.FC<{ label: string; sub: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, sub, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{sub}</div>
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{ flexShrink: 0, width: '48px', height: '26px', borderRadius: '13px', background: value ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s' }}
    >
      <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: value ? '25px' : '3px', transition: 'left 0.22s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
    </button>
  </div>
);

// --- Copy Field ---
const CopyField: React.FC<{ label: string; value: string; onChange: (v: string) => void; multiline?: boolean }> = ({ label, value, onChange, multiline }) => (
  <div style={{ marginTop: '1rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
      />
    )}
  </div>
);

// --- Preview Sheet ---
const PREVIEW_SCREENS: { id: 'home' | 'checkin' | 'profile'; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'profile', label: 'Profile' },
];

const PreviewSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeScreen, setActiveScreen] = useState<'home' | 'checkin' | 'profile'>('home');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{ marginTop: 'auto', background: '#09090b', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', height: '90vh', display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Sheet header */}
        <div style={{ padding: '1rem 1.25rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Smartphone size={16} /> Live Preview
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}>CLOSE</button>
        </div>

        {/* Screen tab switcher */}
        <div style={{ display: 'flex', gap: '8px', padding: '0.5rem 1.25rem' }}>
          {PREVIEW_SCREENS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveScreen(s.id)}
              style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${activeScreen === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, background: activeScreen === s.id ? 'rgba(255,137,171,0.15)' : 'transparent', color: activeScreen === s.id ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Preview content — real components, CSS vars already applied globally */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeScreen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {activeScreen === 'home' && <Home />}
                {activeScreen === 'checkin' && <CheckIn />}
                {activeScreen === 'profile' && <Profile />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main Editor Page ---
const AppearanceEditor: React.FC = () => {
  const navigate = useNavigate();
  const { uiConfig, updateConfig, resetToDefaults, isSaving } = useUIConfig();
  const [showPreview, setShowPreview] = useState(false);

  const handleReset = () => {
    if (window.confirm('Reset all appearance settings to defaults?')) {
      resetToDefaults();
      toast.success('Restored to defaults', { icon: '🔄' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', paddingBottom: '180px' }}>

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>UI Editor</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appearance Portal</div>
          </div>
        </div>

        {/* Live / Saving indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isSaving ? 'rgba(255,137,171,0.12)' : 'rgba(142,255,113,0.12)', border: `1px solid ${isSaving ? 'var(--primary)' : 'var(--tertiary)'}`, borderRadius: '20px', padding: '5px 12px' }}>
          {isSaving ? <WifiOff size={13} color="var(--primary)" /> : <Wifi size={13} color="var(--tertiary)" />}
          <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: isSaving ? 'var(--primary)' : 'var(--tertiary)' }}>
            {isSaving ? 'SAVING...' : '● LIVE'}
          </span>
        </div>
      </div>

      <div style={{ padding: '1.25rem' }}>

        {/* === TYPOGRAPHY === */}
        <Section title="Typography" icon={<Type size={16} />}>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '10px' }}>Font Family</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FONTS.map(font => (
                <button
                  key={font.name}
                  onClick={() => updateConfig('fontFamily', font.name)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '14px', border: `1px solid ${uiConfig.fontFamily === font.name ? 'var(--primary)' : 'rgba(255,255,255,0.07)'}`,
                    background: uiConfig.fontFamily === font.name ? 'rgba(255,137,171,0.1)' : 'rgba(255,255,255,0.02)',
                    color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontFamily: `'${font.name}', sans-serif`, fontWeight: 600 }}>{font.preview}</span>
                  <span style={{ fontSize: '0.78rem', color: uiConfig.fontFamily === font.name ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: 700, letterSpacing: '0.04em' }}>{font.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Base Font Size</label>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{uiConfig.fontSize}px</span>
            </div>
            <input
              type="range" min={13} max={20} value={uiConfig.fontSize}
              onChange={e => updateConfig('fontSize', Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
              <span>13px (Compact)</span><span>20px (Large)</span>
            </div>
          </div>
        </Section>

        {/* === APP COPY === */}
        <Section title="App Copy — Day Zero" icon={<FileText size={16} />}>
          <CopyField label="Headline" value={uiConfig.dayZeroHeadline} onChange={v => updateConfig('dayZeroHeadline', v)} multiline />
          <CopyField label="Tagline" value={uiConfig.dayZeroTagline} onChange={v => updateConfig('dayZeroTagline', v)} multiline />
          <CopyField label="Create Squad Button" value={uiConfig.createSquadLabel} onChange={v => updateConfig('createSquadLabel', v)} />
          <CopyField label="Join Squad Button" value={uiConfig.joinSquadLabel} onChange={v => updateConfig('joinSquadLabel', v)} />
        </Section>

        <Section title="App Copy — Check-In" icon={<FileText size={16} />} defaultOpen={false}>
          <CopyField label="Secure Day Button" value={uiConfig.secureButtonText} onChange={v => updateConfig('secureButtonText', v)} />
          <CopyField label="Card Subtitle" value={uiConfig.checkinSubtitle} onChange={v => updateConfig('checkinSubtitle', v)} />
          <CopyField label="Habits Section Label" value={uiConfig.habitsLabel} onChange={v => updateConfig('habitsLabel', v)} />
          <CopyField label="Habits Hint Text" value={uiConfig.habitsHint} onChange={v => updateConfig('habitsHint', v)} multiline />
          <CopyField label="Context Placeholder" value={uiConfig.contextPlaceholder} onChange={v => updateConfig('contextPlaceholder', v)} multiline />
        </Section>

        <Section title="App Copy — Home & Leaderboard" icon={<FileText size={16} />} defaultOpen={false}>
          <CopyField label="Empty Feed Message" value={uiConfig.emptyFeedMessage} onChange={v => updateConfig('emptyFeedMessage', v)} />
          <CopyField label="Weekly Tribunal Title" value={uiConfig.weeklyTribunalTitle} onChange={v => updateConfig('weeklyTribunalTitle', v)} />
          <CopyField label="Weekly Tribunal Subtitle" value={uiConfig.weeklyTribunalSubtitle} onChange={v => updateConfig('weeklyTribunalSubtitle', v)} />
          <CopyField label="Leaderboard Page Title" value={uiConfig.leaderboardTitle} onChange={v => updateConfig('leaderboardTitle', v)} />
        </Section>

        {/* === FEATURE FLAGS === */}
        <Section title="Feature Flags" icon={<Zap size={16} />} defaultOpen={false}>
          <Toggle label="Leaderboard" sub="Show the Leaderboard tab in navigation" value={uiConfig.showLeaderboard} onChange={v => updateConfig('showLeaderboard', v)} />
          <Toggle label="Gossip Vault" sub="Enable anonymous gossip posts" value={uiConfig.showGossipVault} onChange={v => updateConfig('showGossipVault', v)} />
          <Toggle label="Streak Badge" sub="Show group streak counter on Home" value={uiConfig.showStreakBadge} onChange={v => updateConfig('showStreakBadge', v)} />
          <Toggle label="Weekly Tribunal" sub="Show the weekly vote banner" value={uiConfig.showWeeklyTribunal} onChange={v => updateConfig('showWeeklyTribunal', v)} />
        </Section>

        {/* Reset Defaults */}
        <button
          onClick={handleReset}
          style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem' }}
        >
          <RotateCcw size={16} /> Restore Defaults
        </button>
      </div>

      {/* Floating Preview Button */}
      <div style={{ position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }}>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowPreview(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 28px', borderRadius: '50px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dim))',
            border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.9rem',
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(255,137,171,0.45), 0 0 0 1px rgba(255,137,171,0.2)',
          }}
        >
          <Eye size={18} /> PREVIEW
        </motion.button>
      </div>

      {/* Preview Bottom Sheet */}
      <AnimatePresence>
        {showPreview && <PreviewSheet onClose={() => setShowPreview(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default AppearanceEditor;
