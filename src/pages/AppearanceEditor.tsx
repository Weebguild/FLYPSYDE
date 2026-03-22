import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Type, FileText, Zap, RotateCcw, Eye, EyeOff, 
  ChevronDown, ChevronUp, Wifi, WifiOff, Smartphone
} from 'lucide-react';
import { useUIConfig, UI_DEFAULTS, UIConfig } from '../contexts/UIConfigContext';
import toast from 'react-hot-toast';

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
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.2rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span style={{ color: 'var(--primary)' }}>{icon}</span>{title}
        </div>
        {open ? <ChevronUp size={18} color="var(--on-surface-variant)" /> : <ChevronDown size={18} color="var(--on-surface-variant)" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 1.2rem 1.2rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>{children}</div>
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
    <button onClick={() => onChange(!value)} style={{ flexShrink: 0, width: '48px', height: '26px', borderRadius: '13px', background: value ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s' }}>
      <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: value ? '25px' : '3px', transition: 'left 0.22s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
    </button>
  </div>
);

// --- Copy Field ---
const CopyField: React.FC<{ label: string; value: string; onChange: (v: string) => void; multiline?: boolean }> = ({ label, value, onChange, multiline }) => (
  <div style={{ marginTop: '1rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
    ) : (
      <input type="text" value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
    )}
  </div>
);

// ─── Static Screen Mockups ────────────────────────────────────────────────────
const mockBg = { background: '#0e0e0e', minHeight: '100%', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 'var(--font-size-base, 16px)', padding: '1.5rem', boxSizing: 'border-box' as const };

const MockDayZero: React.FC = () => {
  const { uiConfig } = useUIConfig();
  return (
    <div style={{ ...mockBg, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '600px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: '70%', height: '70%', background: 'var(--primary-dim)', filter: 'blur(80px)', opacity: 0.25, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-20%', width: '60%', height: '60%', background: 'var(--secondary-dim)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingTop: '2rem' }}>
        <h2 style={{ color: 'var(--primary)', fontStyle: 'italic', fontSize: '1.3rem', margin: 0 }}>FLYPSYDE</h2>
        <div style={{ margin: '2rem 0' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, margin: '0 0 1rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {uiConfig.dayZeroHeadline.split('\n').map((l, i) => <div key={i}>{l}</div>)}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', maxWidth: '260px', lineHeight: 1.4, margin: '0 auto' }}>{uiConfig.dayZeroTagline}</p>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px' }}>
          <div style={{ padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--primary)', color: '#fff', fontWeight: 700, textAlign: 'center', background: 'rgba(255,137,171,0.08)', fontSize: '0.95rem' }}>{uiConfig.createSquadLabel}</div>
          <div style={{ padding: '1.1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, textAlign: 'center', fontSize: '0.95rem' }}>{uiConfig.joinSquadLabel}</div>
        </div>
      </div>
    </div>
  );
};

const MockHome: React.FC = () => {
  const { uiConfig } = useUIConfig();
  return (
    <div style={{ ...mockBg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)', fontStyle: 'italic' }}>FLYPSYDE</h2>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
      </div>
      {/* Streak badge */}
      {uiConfig.showStreakBadge && (
        <div style={{ background: 'rgba(255,137,171,0.1)', border: '1px solid rgba(255,137,171,0.2)', borderRadius: '16px', padding: '0.8rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>🔥 GROUP STREAK</span>
          <span style={{ color: '#fff', fontWeight: 800 }}>14 days</span>
        </div>
      )}
      {/* Tribunal banner */}
      {uiConfig.showWeeklyTribunal && (
        <div style={{ background: 'rgba(142,255,113,0.08)', border: '1px solid rgba(142,255,113,0.2)', borderRadius: '16px', padding: '0.8rem 1rem', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--tertiary)', fontWeight: 700, fontSize: '0.85rem' }}>{uiConfig.weeklyTribunalTitle}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '2px' }}>{uiConfig.weeklyTribunalSubtitle}</div>
        </div>
      )}
      {/* Feed cards */}
      {[1].map(i => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Alex R.</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Day 23 · 2h ago</div>
            </div>
          </div>
          <div style={{ height: 120, borderRadius: '12px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ background: 'rgba(142,255,113,0.15)', color: 'var(--tertiary)', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>✓ Workout</span>
            <span style={{ background: 'rgba(255,59,48,0.15)', color: 'var(--error)', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>✗ Diet</span>
          </div>
        </div>
      ))}
      <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{uiConfig.emptyFeedMessage}</div>
    </div>
  );
};

const MockCheckIn: React.FC = () => {
  const { uiConfig } = useUIConfig();
  return (
    <div style={{ ...mockBg }}>
      <h2 style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '0.25rem' }}>Good Morning, Challenger</h2>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.25rem', background: 'linear-gradient(135deg, #FFB75E, #ED8F03)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DAY 23</h1>
      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>⏱ 10:32:14 LEFT TODAY</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '1.25rem' }}>{uiConfig.checkinSubtitle}</div>
      <div style={{ background: 'rgba(10,10,10,0.55)', border: '1px solid rgba(73,72,71,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Photo area */}
        <div style={{ height: 140, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '2rem' }}>📷</span>
        </div>
        {/* Habits */}
        <div style={{ padding: '1rem' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{uiConfig.habitsLabel}</p>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{uiConfig.habitsHint}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['No Junk Food','No Smoking','Daily Study','Daily Workout'].map((h, i) => (
              <div key={h} style={{ padding: '12px 8px', borderRadius: '12px', border: `1px solid ${i === 0 ? 'rgba(142,255,113,0.4)' : i === 1 ? 'rgba(255,59,48,0.4)' : 'rgba(255,255,255,0.08)'}`, background: i === 0 ? 'rgba(142,255,113,0.08)' : i === 1 ? 'rgba(255,59,48,0.08)' : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.1rem' }}>{i === 0 ? '✅' : i === 1 ? '❌' : '○'}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', color: i === 0 ? 'var(--tertiary)' : i === 1 ? 'var(--error)' : 'rgba(255,255,255,0.5)' }}>{h}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>{uiConfig.contextPlaceholder}</div>
          <div style={{ marginTop: '0.75rem', padding: '0.9rem', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--primary-container))', color: '#fff', fontWeight: 800, textAlign: 'center', fontSize: '0.9rem', letterSpacing: '0.05em' }}>{uiConfig.secureButtonText} 23</div>
        </div>
      </div>
    </div>
  );
};

const MockProfile: React.FC = () => (
  <div style={{ ...mockBg }}>
    <div style={{ textAlign: 'center', paddingTop: '1.5rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>👤</div>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', fontWeight: 800 }}>Alex Reyes</h2>
      <p style={{ margin: '0 0 0.25rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>Sergeant · Day 23</p>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>Squad: ALPHA-3</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
      {[['23', 'Days In'], ['18', 'Wins'], ['5', 'Slips']].map(([val, label]) => (
        <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.9rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{val}</div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{label}</div>
        </div>
      ))}
    </div>
  </div>
);

const MockLeaderboard: React.FC = () => {
  const { uiConfig } = useUIConfig();
  return (
    <div style={{ ...mockBg }}>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', textAlign: 'center' }}>{uiConfig.leaderboardTitle}</h1>
      {[['🥇', 'Alex R.', '23 wins'], ['🥈', 'Jordan M.', '20 wins'], ['🥉', 'Sam K.', '18 wins']].map(([medal, name, wins], i) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', background: i === 0 ? 'rgba(255,137,171,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(255,137,171,0.25)' : 'rgba(255,255,255,0.07)'}`, marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{medal}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{name}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Day 23 · {wins}</div>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--tertiary)' }}>🔥 14</div>
        </div>
      ))}
    </div>
  );
};

// --- Preview Sheet ---
type PreviewScreen = 'dayzero' | 'home' | 'checkin' | 'leaderboard' | 'profile';
const PREVIEW_SCREENS: { id: PreviewScreen; label: string }[] = [
  { id: 'dayzero', label: 'Day Zero' },
  { id: 'home', label: 'Home' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'leaderboard', label: 'Rankings' },
  { id: 'profile', label: 'Profile' },
];

const PreviewSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeScreen, setActiveScreen] = useState<PreviewScreen>('dayzero');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{ marginTop: 'auto', background: '#09090b', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', height: '92vh', display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Sheet header */}
        <div style={{ padding: '1rem 1.25rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Smartphone size={16} /> Live Preview
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
        </div>

        {/* Screen tab switcher — scrollable so all 4 fit */}
        <div style={{ display: 'flex', gap: '8px', padding: '0.5rem 1.25rem', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
          {PREVIEW_SCREENS.map(s => (
            <button key={s.id} onClick={() => setActiveScreen(s.id)} style={{ flexShrink: 0, padding: '6px 16px', borderRadius: '20px', border: `1px solid ${activeScreen === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, background: activeScreen === s.id ? 'rgba(255,137,171,0.15)' : 'transparent', color: activeScreen === s.id ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Mockup content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeScreen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {activeScreen === 'dayzero' && <MockDayZero />}
              {activeScreen === 'home' && <MockHome />}
              {activeScreen === 'checkin' && <MockCheckIn />}
              {activeScreen === 'leaderboard' && <MockLeaderboard />}
              {activeScreen === 'profile' && <MockProfile />}
            </motion.div>
          </AnimatePresence>
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
