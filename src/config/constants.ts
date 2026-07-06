/**
 * Global Constants for Google Skills Arcade 2026 Discord Bot
 */

export const COLORS = {
  // Brand Colors (Google Palette)
  GOOGLE_BLUE: '#4285F4',
  GOOGLE_RED: '#EA4335',
  GOOGLE_YELLOW: '#FBBC05',
  GOOGLE_GREEN: '#34A853',
  
  // Message Colors
  SUCCESS: '#34A853', // green
  ERROR: '#EA4335',   // red
  INFO: '#4285F4',    // blue
} as const;

export const XP_VALUES = {
  REGISTRATION: 50,          // XP awarded upon registration
  LAB_COMPLETE: 100,         // Base XP for completing a Google Cloud Boost lab
  BADGE_COMPLETE: 300,       // Base XP for earning a skill badge
  TRIVIA_CORRECT: 20,        // Bonus XP for daily trivia/activities
  STREAK_BONUS: 50,          // Bonus XP for multi-day lab submission streaks
} as const;

export const SYSTEM = {
  FOOTER_TEXT: "Google Skills Arcade 2026 • Facilitator Bot",
  BRAND_NAME: "Google Skills Arcade 2026",
} as const;

export const TEMPLATES = {
  INTRO_STICKY: 
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 **TEMPLATE PERKENALAN (INTRODUCTION TEMPLATE)**\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Yuk saling kenal! Silakan salin (copy) template di bawah ini, isi, lalu kirim ke channel ini:\n\n` +
    `\`\`\`\n` +
    `Nama Lengkap : \n` +
    `Asal Kampus  : \n` +
    `Jurusan/Prodi: \n` +
    `Tujuan Ikut  : \n` +
    `Hobi         : \n` +
    `Google Cloud Skills Boost Profile URL : \n` +
    `\`\`\`\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Pesan ini akan otomatis tetap berada di bagian paling bawah.*`
} as const;
