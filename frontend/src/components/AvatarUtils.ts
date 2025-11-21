export const AVATAR_SEEDS = Array.from(
  { length: 30 },
  (_, i) => `adventurer-${i + 1}`
);

export const generateAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
};
