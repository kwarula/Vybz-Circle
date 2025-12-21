import { Platform } from "react-native";

// ============================================
// BRAND COLORS - ONE HERO COLOR ONLY
// ============================================
const vybzViolet = "#8B5CF6";        // Primary brand color
const vybzVioletLight = "#A78BFA";   // Lighter variant for accents
const vybzVioletMuted = "rgba(139, 92, 246, 0.15)"; // Subtle backgrounds

// ============================================
// NEUTRAL PALETTE - MONOCHROME UI
// ============================================
const trueBlack = "#000000";
const richBlack = "#0A0A0A";
const charcoal = "#121212";
const darkGray = "#1A1A1A";
const mediumGray = "#2A2A2A";
const lightGray = "#3A3A3A";

// Text colors for dark theme (high contrast)
const textPrimary = "#FFFFFF";
const textSecondary = "#B3B3B3";    // Brighter than before for accessibility
const textMuted = "#737373";

// Light theme
const snow = "#FFFFFF";
const offWhite = "#FAFAFA";
const lightBg = "#F5F5F5";

export const Colors = {
  light: {
    text: "#0A0A0A",
    textSecondary: "#525252",
    textMuted: "#A3A3A3",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A3A3A3",
    tabIconSelected: vybzViolet,
    link: vybzViolet,
    primary: vybzViolet,
    primaryLight: vybzVioletLight,
    primaryMuted: vybzVioletMuted,
    // NO SECONDARY COLOR - monochrome UI
    backgroundRoot: offWhite,
    backgroundDefault: snow,
    backgroundSecondary: lightBg,
    backgroundTertiary: "#E5E5E5",
    border: "#E5E5E5",
    borderLight: "#F0F0F0",
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
    tabIconSelected: vybzViolet,
    link: vybzVioletLight,
    primary: vybzViolet,
    primaryLight: vybzVioletLight,
    primaryMuted: vybzVioletMuted,
    // TRUE BLACK BACKGROUNDS
    backgroundRoot: trueBlack,
    backgroundDefault: richBlack,
    backgroundSecondary: charcoal,
    backgroundTertiary: darkGray,
    border: darkGray,
    borderLight: mediumGray,
    success: "#22C55E",
    warning: "#EAB308",
    error: "#EF4444",
    sos: "#DC2626",
    cardShadow: "rgba(0, 0, 0, 0.5)",
    overlay: "rgba(0, 0, 0, 0.85)",
    going: "#4ADE80",
    goingBg: "rgba(34, 197, 94, 0.15)",
    glass: "rgba(10, 10, 10, 0.8)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
  },
};

// ============================================
// SPACING - INCREASED FOR BREATHING ROOM
// ============================================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,           // Increased from 20
  "2xl": 32,        // Increased from 24
  "3xl": 40,        // Increased from 32
  "4xl": 48,
  "5xl": 64,
  section: 48,      // NEW: Consistent vertical rhythm between sections
  inputHeight: 52,  // Slightly taller
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

// ============================================
// TYPOGRAPHY - BOLDER HIERARCHY
// ============================================
export const Typography = {
  hero: {
    fontSize: 36,           // Increased from 32
    fontWeight: "800" as const,
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  h1: {
    fontSize: 32,           // Increased from 28
    fontWeight: "700" as const,
    letterSpacing: -1,
    lineHeight: 38,
  },
  h2: {
    fontSize: 26,           // Increased from 24
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  h3: {
    fontSize: 22,           // Increased from 20 - SECTION HEADERS
    fontWeight: "600" as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  tiny: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  link: {
    fontSize: 14,
    fontWeight: "600" as const,
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
// SHADOWS - SUBTLE ON TRUE BLACK
// ============================================
export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  fab: {
    shadowColor: vybzViolet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  glow: {
    shadowColor: vybzViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 0,
  },
};

// ============================================
// GRADIENTS - STRONGER OVERLAYS
// ============================================
export const Gradients = {
  // Single color gradient (no more blue!)
  primary: [vybzViolet, vybzVioletLight] as const,
  primarySolid: [vybzViolet, vybzViolet] as const,

  // Card overlays - MUCH darker for text readability
  cardOverlay: [
    "transparent",
    "rgba(0,0,0,0.2)",
    "rgba(0,0,0,0.6)",
    "rgba(0,0,0,0.95)",
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
    "rgba(139, 92, 246, 0.2)",
    "rgba(139, 92, 246, 0.05)",
  ] as const,
};
