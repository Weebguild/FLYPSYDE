import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIConfig } from '../contexts/UIConfigContext';

const Leaderboard = lazy(() => import('./Leaderboard'));
const AnalyticsWitness = lazy(() => import('../components/AnalyticsWitness'));

const tabs = [
  { id: 'rankings', label: 'Rankings' },
  { id: 'witness', label: 'Witness' },
] as const;

type TabId = typeof tabs[number]['id'];

const SectionLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
    <div style={{
      width: '32px', height: '32px',
      border: '2px solid var(--surface-container-highest)',
      borderTopColor: 'var(--primary)',
      borderRadius: '50%',
      animation: 'spin 0.9s linear infinite'
    }} />
  </div>
);

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('rankings');
  const { uiConfig } = useUIConfig();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      paddingBottom: '120px',
    }}>
      {/* Header */}
      <div style={{
        padding: '3.5rem 1.5rem 0',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          margin: 0,
          lineHeight: 1,
          color: 'var(--on-background)',
        }}>
          {/* The "ANAL" typo easter egg - purely frontend */}
          <span style={{ fontSize: '2.8rem', color: 'var(--primary)' }}>ANAL</span>
          <span>ytics</span>
        </h1>
        <p style={{
          color: 'var(--on-surface-variant)',
          fontSize: '0.78rem',
          marginTop: '0.35rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Track everything. Witness everyone.
        </p>
      </div>

      {/* Segmented Control */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '1.5rem 1.5rem 0',
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          background: 'var(--surface-container)',
          borderRadius: '14px',
          padding: '4px',
          gap: '2px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: 'relative',
                padding: '0.6rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '10px',
                zIndex: 1,
                color: activeTab === tab.id ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.88rem',
                letterSpacing: '0.04em',
                transition: 'color 0.25s ease',
                fontFamily: 'inherit',
              }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="analytics-tab-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--primary)',
                    borderRadius: '10px',
                    zIndex: -1,
                    boxShadow: '0 2px 16px rgba(var(--primary-rgb, 220,38,38), 0.35)',
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          <Suspense fallback={<SectionLoader />}>
            {activeTab === 'rankings' && <Leaderboard />}
            {activeTab === 'witness' && <AnalyticsWitness />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Analytics;
