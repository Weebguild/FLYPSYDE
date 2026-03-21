// User Types
export interface User {
  id: string; // from Firebase Auth
  displayName: string;
  photoURL: string;
  email: string;
  isAdmin: boolean;
  startingWeight: number;
  currentWeight: number;
  weightUnit: 'kg' | 'lbs';
  height: number;
  heightUnit: 'cm' | 'in';
  waistMeasurement: number;
  baselinePhotoURL: string; // Cloudinary URL
  latestDailyPhotoURL?: string;
  notificationTone: 'motivational' | 'trash-talk';
  joinedAt: Date | number;
  rankTitle: string;
  groupCode?: string;
}

// Habit & Streak Types
export type HabitId = 'no-junk-food' | 'no-smoking' | 'daily-study' | 'daily-workout';

export interface HabitStreak {
  currentStreak: number;
  personalBest: number;
  lastSlipDate: Date | null;
  habitName: string;
  slipLog: { date: string; privateNote: string; dayNumber: number }[];
}

// Feed Types
export type FeedPostType = 'photo' | 'slip' | 'weight' | 'milestone' | 'comeback' | 'war' | 'vote';

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  type: FeedPostType;
  imageURL?: string; // Daily photo or slip contextual image
  habitId?: HabitId; // Relevent if type === 'slip'
  weight?: number; // Relevent if type === 'weight'
  targetId?: string;
  targetName?: string;
  dayNumber: number;
  timestamp: Date;
  reactions: Record<string, string[]>; // { 'fire': ['userId1', 'userId2'] }
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  parentCommentId?: string;
}

// Group State
export interface Group {
  id: string;
  groupCode: string;
  adminUserId: string;
  challengeStartDate: Date | null;
  challengeEndDate: Date | null;
  memberIds: string[]; // max 5
  status: 'waiting' | 'active' | 'completed';
  groupStreak: {
    currentStreak: number;
    lastBrokenDate: Date | null;
    lastBrokenByUserId: string | null;
  };
}

// War Mode
export interface WarModeChallenge {
  id: string;
  challengerId: string;
  opponentId: string;
  habitId: HabitId;
  startDate: Date | null; // Null until accepted
  endDate: Date | null;
  status: 'pending' | 'active' | 'completed';
  winnerId: string | null; // Null if active
}

// Weight Log
export interface WeightEntry {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  timestamp: Date;
  challengeDay: number;
}
