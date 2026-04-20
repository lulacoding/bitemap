export const motion = {
  pinDrop: { duration: 200, spring: { stiffness: 240, damping: 22 } },
  sheetOpen: { duration: 250, easing: 'ease-out' as const },
  offlinePulse: { duration: 1000, easing: 'ease-in-out' as const },
} as const;
