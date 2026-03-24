import { Platform } from 'react-native';

const theme = {
  // Colors - Apple iOS HIG with rose accent
  primary: '#FF2D6B', // Rose
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#FFFFFF',
  backgroundGrouped: '#F2F2F7',
  labelPrimary: '#000000',
  labelSecondary: 'rgba(60,60,67,0.6)',
  labelTertiary: 'rgba(60,60,67,0.3)',
  separator: 'rgba(60,60,67,0.29)',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  destructive: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',

  // Typography
  fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  typography: {
    largeTitle: {
      fontSize: 34,
      fontWeight: '700',
    },
    title1: {
      fontSize: 28,
      fontWeight: '700',
    },
    title2: {
      fontSize: 22,
      fontWeight: '700',
    },
    title3: {
      fontSize: 20,
      fontWeight: '600',
    },
    headline: {
      fontSize: 17,
      fontWeight: '600',
    },
    body: {
      fontSize: 17,
      fontWeight: '400',
    },
    callout: {
      fontSize: 16,
      fontWeight: '400',
    },
    subhead: {
      fontSize: 15,
      fontWeight: '400',
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400',
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400',
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400',
    },
  },

  // Spacing (8pt base grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 44,
  },

  // Border Radius
  borderRadius: {
    sm: 10,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 20,
    round: 999,
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    floating: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export default theme;
