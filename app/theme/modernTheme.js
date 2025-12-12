// Modern Theme Configuration
export const modernColors = {
  // Primary Colors
  primary: '#0066FF',
  primaryDark: '#0052CC',
  primaryLight: '#E6F0FF',

  // Secondary Colors
  secondary: '#00D4AA',
  secondaryDark: '#00A583',
  secondaryLight: '#E6FBF7',

  // Accent Colors
  accent: '#8B5CF6',
  accentDark: '#7C3AED',
  accentLight: '#F3E8FF',

  // Neutral Colors
  dark: '#0F172A',
  darkSecondary: '#1E293B',
  gray: '#64748B',
  grayLight: '#94A3B8',
  grayLighter: '#CBD5E1',
  lightBg: '#F8FAFC',
  white: '#FFFFFF',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Gradient Combinations
  gradients: {
    primary: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    secondary: 'linear-gradient(135deg, #00D4AA 0%, #0066FF 100%)',
    dark: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    light: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
    vibrant: 'linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)',
    sunset: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
    ocean: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)',
    purple: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  }
};

export const modernTheme = {
  token: {
    // Colors
    colorPrimary: modernColors.primary,
    colorSuccess: modernColors.success,
    colorWarning: modernColors.warning,
    colorError: modernColors.error,
    colorInfo: modernColors.info,

    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 48,
    fontSizeHeading2: 36,
    fontSizeHeading3: 28,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // Spacing
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    marginXXL: 48,

    // Border Radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    borderRadiusXS: 4,

    // Shadows
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

    // Line Height
    lineHeight: 1.6,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.25,
    lineHeightHeading3: 1.3,

    // Control Heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },

  components: {
    Button: {
      borderRadius: 10,
      fontWeight: 600,
      controlHeight: 42,
      fontSize: 15,
      paddingContentHorizontal: 24,
    },
    Card: {
      borderRadiusLG: 16,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: 24,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 42,
      fontSize: 15,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 42,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Tag: {
      borderRadius: 6,
      fontSizeSM: 12,
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 8,
    },
    Tabs: {
      itemActiveColor: modernColors.primary,
      itemHoverColor: modernColors.primary,
      inkBarColor: modernColors.primary,
    },
  }
};

// Utility function for responsive spacing
export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Animation configs
export const animations = {
  fadeIn: {
    animation: 'fadeIn 0.5s ease-in',
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  },
  slideUp: {
    animation: 'slideUp 0.5s ease-out',
    '@keyframes slideUp': {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  },
  slideIn: {
    animation: 'slideIn 0.3s ease-out',
    '@keyframes slideIn': {
      from: { transform: 'translateX(-10px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
  },
  pulse: {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(0, 102, 255, 0.7)' },
      '70%': { boxShadow: '0 0 0 10px rgba(0, 102, 255, 0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(0, 102, 255, 0)' },
    },
  },
};

// Glass morphism effect
export const glassEffect = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
};

// Neumorphism effect
export const neumorphism = {
  light: {
    background: '#F8FAFC',
    boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
  },
  dark: {
    background: '#1E293B',
    boxShadow: '8px 8px 16px #0F172A, -8px -8px 16px #2D3748',
  },
};