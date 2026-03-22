import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';

export interface UIConfig {
  fontFamily: string;
  fontSize: number;
  // DayZero copy
  dayZeroTagline: string;
  dayZeroHeadline: string;
  createSquadLabel: string;
  joinSquadLabel: string;
  // CheckIn copy
  secureButtonText: string;
  checkinSubtitle: string;
  habitsLabel: string;
  habitsHint: string;
  contextPlaceholder: string;
  // Home copy
  emptyFeedMessage: string;
  weeklyTribunalTitle: string;
  weeklyTribunalSubtitle: string;
  // Leaderboard copy
  leaderboardTitle: string;
  // Analytics / Witness copy
  analyticsTitle: string;
  witnessTitle: string;
  witnessEmptyState: string;
  // Feature Flags
  showLeaderboard: boolean;
  showGossipVault: boolean;
  showStreakBadge: boolean;
  showWeeklyTribunal: boolean;
  showWitness: boolean;
}

export const UI_DEFAULTS: UIConfig = {
  fontFamily: 'Manrope',
  fontSize: 16,
  dayZeroTagline: 'Survive the gauntlet together, or fail publicly.',
  dayZeroHeadline: '100 DAYS.\nNO EXCUSES.',
  createSquadLabel: 'CREATE SQUAD',
  joinSquadLabel: 'JOIN SQUAD',
  secureButtonText: 'SECURE DAY',
  checkinSubtitle: 'Log your wins and slips',
  habitsLabel: "Today's Habits",
  habitsHint: 'Tap once to complete • Tap twice to mark slip-up • Tap thrice to reset',
  contextPlaceholder: 'Add context to your check-in... (e.g., Crushed workout, slipped on diet 💪😅)',
  emptyFeedMessage: 'Be the spark. Check in to start the streak!',
  weeklyTribunalTitle: '🗳️ WEEKLY TRIBUNAL',
  weeklyTribunalSubtitle: 'Vote for the MVP and Slacker',
  leaderboardTitle: 'HALL OF LEGENDS',
  analyticsTitle: 'ANALYTICS',
  witnessTitle: 'WITNESS',
  witnessEmptyState: 'Your squad is clean. For now.',
  showLeaderboard: true,
  showGossipVault: true,
  showStreakBadge: true,
  showWeeklyTribunal: true,
  showWitness: true,
};

const GOOGLE_FONTS_IMPORT: Record<string, string> = {
  'Manrope': 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap',
  'Rajdhani': 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap',
};

interface UIConfigContextValue {
  uiConfig: UIConfig;
  updateConfig: (key: keyof UIConfig, value: any) => void;
  resetToDefaults: () => void;
  isSaving: boolean;
}

const UIConfigContext = createContext<UIConfigContextValue>({
  uiConfig: UI_DEFAULTS,
  updateConfig: () => {},
  resetToDefaults: () => {},
  isSaving: false,
});

export const useUIConfig = () => useContext(UIConfigContext);

function applyFontToDOM(fontFamily: string, fontSize: number) {
  // Inject Google Font link tag
  const fontUrl = GOOGLE_FONTS_IMPORT[fontFamily];
  if (fontUrl) {
    const existing = document.getElementById('ui-config-font');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.id = 'ui-config-font';
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
  }
  document.documentElement.style.setProperty('--font-body', `'${fontFamily}', sans-serif`);
  document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
  document.body.style.fontSize = `${fontSize}px`;
}

export const UIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiConfig, setUIConfig] = useState<UIConfig>(UI_DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const configRef = ref(db, 'system_settings/ui');
    const unsubscribe = onValue(configRef, (snap) => {
      if (snap.exists()) {
        const data = { ...UI_DEFAULTS, ...snap.val() };
        setUIConfig(data);
        applyFontToDOM(data.fontFamily, data.fontSize);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateConfig = (key: keyof UIConfig, value: any) => {
    const next = { ...uiConfig, [key]: value };
    setUIConfig(next);

    // Apply font changes immediately to DOM
    if (key === 'fontFamily' || key === 'fontSize') {
      applyFontToDOM(next.fontFamily, next.fontSize);
    }

    // Debounce Firebase write
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsSaving(true);
    debounceRef.current = setTimeout(async () => {
      try {
        await update(ref(db, 'system_settings/ui'), { [key]: value });
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const resetToDefaults = async () => {
    setUIConfig(UI_DEFAULTS);
    applyFontToDOM(UI_DEFAULTS.fontFamily, UI_DEFAULTS.fontSize);
    setIsSaving(true);
    try {
      await update(ref(db, 'system_settings/ui'), UI_DEFAULTS as any);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <UIConfigContext.Provider value={{ uiConfig, updateConfig, resetToDefaults, isSaving }}>
      {children}
    </UIConfigContext.Provider>
  );
};
