// SecuredTransfer Brand Color Palette - Based on Logo Colors
export const colors = {
  // Primary brand colors (Blue from logo)
  primary: '#00aef2',
  primaryLight: '#33bef4',
  primaryDark: '#0098d4',
  
  // Secondary colors (Gray from logo)
  secondary: '#4f4d4c',
  secondaryLight: '#6b6968',
  secondaryDark: '#3a3938',
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Status colors
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    tertiary: '#fafafa',
    gradient: 'linear-gradient(135deg, #e6f7ff 0%, #d6f1ff 100%)', // Light blue gradient
    gradientPrimary: 'linear-gradient(135deg, #00aef2 0%, #4f4d4c 100%)', // Logo colors gradient
  },
  
  // Brand specific colors
  brand: {
    blue: '#e6f7ff', // Light blue background
    gray: '#f5f5f4', // Light gray background  
    green: '#f6ffed', // Light green background (keep for success states)
  }
};

// Ant Design theme configuration
export const antdTheme = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    colorLink: colors.primary,
    colorLinkHover: colors.primaryLight,
    colorLinkActive: colors.primaryDark,
    borderRadius: 6,
    colorBgContainer: colors.white,
    colorBgLayout: colors.background.secondary,
  },
  components: {
    Button: {
      colorPrimary: colors.primary,
      colorPrimaryHover: colors.primaryLight,
      colorPrimaryActive: colors.primaryDark,
      borderRadius: 6,
      fontWeight: 600,
    },
    Input: {
      borderRadius: 6,
      colorPrimary: colors.primary,
    },
    Card: {
      borderRadius: 12,
    },
    Steps: {
      colorPrimary: colors.primary,
    },
    Select: {
      colorPrimary: colors.primary,
      borderRadius: 6,
    },
    Form: {
      labelColor: colors.gray[700],
    },
  },
};

export default colors;
