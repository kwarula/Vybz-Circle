import { Platform } from "react-native";
import { ms, s, fs } from "@/utils/responsive";

// ============================================
// NAIROBI POP PALETTE - HIGH ENERGY
// ============================================
const sunsetOrange = "#FF5F00";      // Primary Accent
const electricBerry = "#FF007A";     // Secondary Accent
const brightTurquoise = "#00F0FF";   // Vibrant Accent
const midnightTeal = "#0A1A1A";      // Deep Background
const clay = "#F4F1EA";               // Warm Light Background

const textPrimary = "#FFFFFF";
const textSecondary = "#B3B3B3";
const textMuted = "#737373";

export const Colors = {
  light: {
    text: "#0A1A1A",
    textSecondary: "#525252",
    textMuted: "#A3A3A3",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A3A3A3",
    tabIconSelected: sunsetOrange,
    link: sunsetOrange,
    primary: sunsetOrange,
    primaryLight: "#FF8A4D",
    primaryMuted: "rgba(255, 95, 0, 0.15)",
    backgroundRoot: clay,
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#EAE7E0",
    backgroundTertiary: "#DEDBCF",
    border: "#DEDBCF",
    borderLight: "#F0EFEB",
    success: "#22C55E",
    warning: "#EAB308",
    error: "#EF4444",
    sos: "#DC2626",
    cardShadow: "rgba(0, 0, 0, 0.08)",
    overlay: "rgba(0, 0, 0, 0.6)",
    going: "#22C55E",
    goingBg: "#DCFCE7",
    glass: "rgba(255, 255, 255, 0.9)",
    glassBorder: "rgba(255, 255, 255, 0.3)",
  },
  dark: {
    text: textPrimary,
    textSecondary: textSecondary,
    textMuted: textMuted,
    buttonText: "#FFFFFF",
    tabIconDefault: textMuted,
    tabIconSelected: sunsetOrange,
    link: brightTurquoise,
    primary: sunsetOrange,
    primaryLight: "#FF8A4D",
    primaryMuted: "rgba(255, 95, 0, 0.15)",
    backgroundRoot: midnightTeal,
    backgroundDefault: "#122525",
    backgroundSecondary: "#1A2E2E",
    backgroundTertiary: "#233939",
    border: "#1A2E2E",
    borderLight: "#233939",
    success: "#22C55E",
    warning: "#EAB308",
    error: "#EF4444",
    sos: "#DC2626",
    cardShadow: "rgba(0, 0, 0, 0.5)",
    overlay: "rgba(0, 0, 0, 0.85)",
    going: "#4ADE80",
    goingBg: "rgba(34, 197, 94, 0.15)",
    glass: "rgba(10, 26, 26, 0.8)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    accentSecondary: electricBerry,
    accentTertiary: brightTurquoise,
  },
};

// ============================================
// SPACING - RESPONSIVE SCALING
// ============================================
export const Spacing = {
  xs: ms(4),
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(24),
  "2xl": ms(32),
  "3xl": ms(40),
  "4xl": ms(48),
  "5xl": ms(64),
  section: ms(48),
  inputHeight: ms(52, 0.2),
  buttonHeight: ms(56, 0.2),
};

export const BorderRadius = {
  xs: ms(4),
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(24),
  "2xl": ms(32),
  "3xl": ms(40),
  full: 9999,
};

// ============================================
// TYPOGRAPHY - RESPONSIVE FONT SCALING
// ============================================
export const Typography = {
  hero: {
    fontSize: fs(42),
    fontWeight: "900" as const,
    letterSpacing: -2,
    lineHeight: fs(48),
  },
  h1: {
    fontSize: fs(34),
    fontWeight: "800" as const,
    letterSpacing: -1.5,
    lineHeight: fs(40),
  },
  h2: {
    fontSize: fs(28),
    fontWeight: "700" as const,
    letterSpacing: -1,
    lineHeight: fs(34),
  },
  h3: {
    fontSize: fs(22),
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    lineHeight: fs(28),
  },
  h4: {
    fontSize: fs(18),
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    lineHeight: fs(24),
  },
  body: {
    fontSize: fs(16),
    fontWeight: "500" as const,
    lineHeight: fs(24),
  },
  small: {
    fontSize: fs(14),
    fontWeight: "600" as const,
    lineHeight: fs(20),
  },
  tiny: {
    fontSize: fs(12),
    fontWeight: "700" as const,
    lineHeight: fs(16),
  },
  caption: {
    fontSize: fs(11),
    fontWeight: "800" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  link: {
    fontSize: fs(14),
    fontWeight: "700" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "System",
    serif: "ui-serif",
    rounded: "System",
    mono: "ui-monospace",
  },
  default: {
    sans: "sans-serif",
    serif: "serif",
    rounded: "sans-serif",
    mono: "monospace",
  },
  web: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Consolas, 'Liberation Mono', monospace",
  },
});

// ============================================
// SHADOWS - TACTILE & BOLD
// ============================================
export const Shadows = {
  card: Platform.select({
    web: {
      boxShadow: `${s(4)}px ${s(4)}px 0px rgba(0, 0, 0, 0.2)`,
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: s(4), height: s(4) }, // "Off-aligned" look
      shadowOpacity: 0.2,
      shadowRadius: 0, // Hard shadows for sticker look
      elevation: 4,
    },
  }),
  cardHover: Platform.select({
    web: {
      boxShadow: `${s(6)}px ${s(6)}px 0px rgba(0, 0, 0, 0.3)`,
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: s(6), height: s(6) },
      shadowOpacity: 0.3,
      shadowRadius: 0,
      elevation: 8,
    },
  }),
  sticker: Platform.select({
    web: {
      boxShadow: `${s(2)}px ${s(2)}px 0px rgba(0, 0, 0, 0.5)`,
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: s(2), height: s(2) },
      shadowOpacity: 0.5,
      shadowRadius: 0,
      elevation: 2,
    },
  }),
  fab: Platform.select({
    web: {
      boxShadow: `0px ${s(8)}px ${ms(16)}px rgba(255, 95, 0, 0.4)`,
    },
    default: {
      shadowColor: sunsetOrange,
      shadowOffset: { width: 0, height: s(8) },
      shadowOpacity: 0.4,
      shadowRadius: ms(16),
      elevation: 12,
    },
  }),
  subtle: Platform.select({
    web: {
      boxShadow: `0px ${s(2)}px ${ms(4)}px rgba(0, 0, 0, 0.1)`,
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: s(2) },
      shadowOpacity: 0.1,
      shadowRadius: ms(4),
      elevation: 2,
    },
  }),
};

// ============================================
// GRADIENTS - VIBRANT OVERLAYS
// ============================================
export const Gradients = {
  primary: [sunsetOrange, "#FF8A4D"] as const,
  party: [sunsetOrange, electricBerry, brightTurquoise] as const,
  sticker: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)"] as const,

  // Card overlays - Nairobi Pop Style
  cardOverlay: [
    "transparent",
    "rgba(10, 26, 26, 0.4)",
    "rgba(10, 26, 26, 0.95)",
  ] as const,

  darkOverlay: [
    "transparent",
    "rgba(0,0,0,0.4)",
    "rgba(0,0,0,0.9)",
  ] as const,

  // Subtle glass effect
  glass: [
    "rgba(255,255,255,0.05)",
    "rgba(255,255,255,0.02)",
  ] as const,

  // Premium subtle glow
  premiumGlow: [
    "rgba(255, 95, 0, 0.2)",
    "rgba(255, 95, 0, 0.05)",
  ] as const,
};
