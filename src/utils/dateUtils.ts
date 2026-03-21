export const calculateCurrentDay = (joinedAt: Date | number | string | undefined | null): number => {
  if (!joinedAt) return 1;
  const start = new Date(joinedAt);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // Day 1 is the 0th diff day. Handles future dates gracefully.
};
