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
  INTRO_STICKY: `
Let's get to know each other! Please copy the template below, fill it out, and send it to this channel:

\`\`\`
Full Name:
College of Origin:
Major/Study Program:
Purpose of Participation:
Hobby:
Google Cloud Skills Boost Profile URL:
\`\`\`

━━━━━━━━━━━━━━━━━━━━━
*This message will automatically remain at the bottom.*`
} as const;

export const ROLES = {
  GENDER_MALE: '1523667631599521993',
  GENDER_FEMALE: '1523667697970184274',
} as const;
