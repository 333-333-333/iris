/**
 * Catppuccin Mocha color palette
 * 
 * A soothing pastel theme with warm, muted colors.
 * Designed for comfortable viewing and accessibility.
 * 
 * @see https://catppuccin.com/palette
 * @public
 */

export const catppuccinMocha = {
  // Base colors
  base: '#1e1e2e',      // Background
  mantle: '#181825',    // Darker background
  crust: '#11111b',     // Darkest background
  
  // Surface colors
  surface0: '#313244',  // Surface
  surface1: '#45475a',  // Surface variant
  surface2: '#585b70',  // Surface highlight

  // Text colors
  text: '#cdd6f4',      // Primary text
  subtext1: '#bac2de',  // Secondary text
  subtext0: '#a6adc8',  // Tertiary text
  
  // Overlay colors
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',

  // Accent colors
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',     // Purple - primary accent
  red: '#f38ba8',       // Error
  maroon: '#eba0ac',
  peach: '#fab387',     // Warning/Processing
  yellow: '#f9e2af',
  green: '#a6e3a1',     // Success/Listening
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',      // Speaking/Info
  lavender: '#b4befe',
} as const;

/**
 * Semantic color tokens for Iris app
 * 
 * Maps Catppuccin colors to semantic meanings in the app.
 */
export const colors = {
  // Backgrounds
  background: {
    primary: catppuccinMocha.base,
    secondary: catppuccinMocha.mantle,
    tertiary: catppuccinMocha.crust,
    surface: catppuccinMocha.surface0,
    surfaceHover: catppuccinMocha.surface1,
    surfaceActive: catppuccinMocha.surface2,
  },

  // Text
  text: {
    primary: catppuccinMocha.text,
    secondary: catppuccinMocha.subtext1,
    tertiary: catppuccinMocha.subtext0,
    muted: catppuccinMocha.overlay0,
  },

  // Status colors
  status: {
    idle: catppuccinMocha.overlay1,
    listening: catppuccinMocha.green,
    processing: catppuccinMocha.peach,
    speaking: catppuccinMocha.blue,
    error: catppuccinMocha.red,
    success: catppuccinMocha.green,
    warning: catppuccinMocha.yellow,
  },

  // Interactive elements
  interactive: {
    primary: catppuccinMocha.mauve,
    primaryHover: catppuccinMocha.lavender,
    secondary: catppuccinMocha.surface1,
    secondaryHover: catppuccinMocha.surface2,
    danger: catppuccinMocha.red,
    dangerHover: catppuccinMocha.maroon,
  },

  // Accent colors for highlights
  accent: {
    purple: catppuccinMocha.mauve,
    blue: catppuccinMocha.blue,
    green: catppuccinMocha.green,
    peach: catppuccinMocha.peach,
    pink: catppuccinMocha.pink,
    teal: catppuccinMocha.teal,
  },

  // Borders
  border: {
    default: catppuccinMocha.surface1,
    subtle: catppuccinMocha.surface0,
    strong: catppuccinMocha.surface2,
  },
} as const;

/**
 * Type for color tokens
 */
export type Colors = typeof colors;
export type CatppuccinMocha = typeof catppuccinMocha;
