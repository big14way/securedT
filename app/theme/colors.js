// SecuredTransfer Cyberpunk Theme - Neon Future Aesthetic
export const colors = {
  // Primary neon colors
  primary: '#00f0ff',         // Cyan neon
  primaryLight: '#5ff5ff',
  primaryDark: '#00b8c4',

  // Secondary neon (Magenta/Pink)
  secondary: '#ff00ff',
  secondaryLight: '#ff66ff',
  secondaryDark: '#cc00cc',

  // Accent colors
  accent: {
    purple: '#a855f7',
    pink: '#ec4899',
    yellow: '#fbbf24',
    green: '#00ff88',
    orange: '#ff6b35',
    red: '#ff0055',
  },

  // Neutral colors - Dark mode focused
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f8fafc',
    100: '#e2e8f0',
    200: '#cbd5e1',
    300: '#94a3b8',
    400: '#64748b',
    500: '#475569',
    600: '#334155',
    700: '#1e293b',
    800: '#0f172a',
    900: '#020617',
  },

  // Status colors - Neon variants
  success: '#00ff88',
  warning: '#fbbf24',
  error: '#ff0055',
  info: '#00f0ff',

  // Background colors - Dark cyberpunk
  background: {
    primary: '#0a0a0f',       // Near black with blue tint
    secondary: '#0f0f1a',     // Slightly lighter dark
    tertiary: '#1a1a2e',      // Card backgrounds
    card: '#16162a',          // Card surfaces
    elevated: '#1e1e3f',      // Elevated elements
    gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16162a 100%)',
    gradientPrimary: 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 50%, #a855f7 100%)',
    gradientSubtle: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a0f 100%)',
    glass: 'rgba(22, 22, 42, 0.8)',
  },

  // Neon glow effects
  glow: {
    cyan: '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3), 0 0 60px rgba(0, 240, 255, 0.1)',
    magenta: '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3), 0 0 60px rgba(255, 0, 255, 0.1)',
    purple: '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
    green: '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
    yellow: '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)',
  },

  // Border colors
  border: {
    primary: 'rgba(0, 240, 255, 0.3)',
    secondary: 'rgba(255, 0, 255, 0.3)',
    subtle: 'rgba(100, 116, 139, 0.3)',
    glow: 'rgba(0, 240, 255, 0.5)',
  },

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    muted: '#64748b',
    accent: '#00f0ff',
    glow: '#5ff5ff',
  },

  // Brand specific
  brand: {
    cyber: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 100%)',
    neonBlue: '#00f0ff',
    neonPink: '#ff00ff',
    neonPurple: '#a855f7',
  }
};

// Ant Design theme configuration - Cyberpunk
export const antdTheme = {
  token: {
    // Colors
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    colorLink: colors.primary,
    colorLinkHover: colors.primaryLight,
    colorLinkActive: colors.primaryDark,

    // Border
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // Backgrounds - Dark theme
    colorBgContainer: colors.background.tertiary,
    colorBgElevated: colors.background.elevated,
    colorBgLayout: colors.background.primary,
    colorBgSpotlight: colors.background.card,
    colorBgMask: 'rgba(0, 0, 0, 0.75)',

    // Text
    colorText: colors.text.primary,
    colorTextSecondary: colors.text.secondary,
    colorTextTertiary: colors.text.muted,
    colorTextQuaternary: colors.gray[500],

    // Border
    colorBorder: colors.border.subtle,
    colorBorderSecondary: colors.border.primary,

    // Control (inputs, etc.)
    controlOutline: 'rgba(0, 240, 255, 0.2)',
    controlItemBgHover: 'rgba(0, 240, 255, 0.1)',
    controlItemBgActive: 'rgba(0, 240, 255, 0.2)',

    // Font
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    fontSize: 14,

    // Box Shadow
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 240, 255, 0.1)',
    boxShadowSecondary: '0 6px 30px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 240, 255, 0.15)',
  },
  components: {
    Button: {
      colorPrimary: colors.primary,
      colorPrimaryHover: colors.primaryLight,
      colorPrimaryActive: colors.primaryDark,
      borderRadius: 8,
      fontWeight: 600,
      defaultBg: 'transparent',
      defaultBorderColor: colors.primary,
      defaultColor: colors.primary,
      defaultHoverBg: 'rgba(0, 240, 255, 0.1)',
      defaultHoverBorderColor: colors.primaryLight,
      defaultHoverColor: colors.primaryLight,
      primaryShadow: colors.glow.cyan,
    },
    Input: {
      borderRadius: 8,
      colorPrimary: colors.primary,
      colorBgContainer: colors.background.card,
      colorBorder: colors.border.subtle,
      colorText: colors.text.primary,
      colorTextPlaceholder: colors.text.muted,
      activeBorderColor: colors.primary,
      hoverBorderColor: colors.primaryLight,
      activeShadow: '0 0 0 2px rgba(0, 240, 255, 0.2)',
    },
    InputNumber: {
      borderRadius: 8,
      colorBgContainer: colors.background.card,
      colorBorder: colors.border.subtle,
      colorText: colors.text.primary,
      activeBorderColor: colors.primary,
      hoverBorderColor: colors.primaryLight,
    },
    Select: {
      colorPrimary: colors.primary,
      borderRadius: 8,
      colorBgContainer: colors.background.card,
      colorBgElevated: colors.background.elevated,
      colorBorder: colors.border.subtle,
      colorText: colors.text.primary,
      optionSelectedBg: 'rgba(0, 240, 255, 0.15)',
    },
    Card: {
      borderRadius: 16,
      colorBgContainer: colors.background.card,
      colorBorderSecondary: colors.border.primary,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    },
    Steps: {
      colorPrimary: colors.primary,
      colorText: colors.text.primary,
      colorTextDescription: colors.text.secondary,
    },
    Form: {
      labelColor: colors.text.secondary,
      colorText: colors.text.primary,
    },
    Table: {
      colorBgContainer: colors.background.card,
      headerBg: colors.background.elevated,
      headerColor: colors.text.primary,
      colorText: colors.text.primary,
      borderColor: colors.border.subtle,
      rowHoverBg: 'rgba(0, 240, 255, 0.05)',
    },
    Modal: {
      contentBg: colors.background.tertiary,
      headerBg: colors.background.tertiary,
      titleColor: colors.text.primary,
      colorText: colors.text.primary,
    },
    Menu: {
      colorBgContainer: 'transparent',
      colorText: colors.text.secondary,
      colorTextSelected: colors.primary,
      colorItemBgSelected: 'rgba(0, 240, 255, 0.1)',
      colorItemBgHover: 'rgba(0, 240, 255, 0.05)',
    },
    Layout: {
      headerBg: colors.background.secondary,
      bodyBg: colors.background.primary,
      footerBg: colors.background.secondary,
      siderBg: colors.background.secondary,
    },
    Dropdown: {
      colorBgElevated: colors.background.elevated,
      colorText: colors.text.primary,
    },
    Tag: {
      defaultBg: 'rgba(0, 240, 255, 0.1)',
      defaultColor: colors.primary,
    },
    Badge: {
      colorBgContainer: colors.background.card,
    },
    Tooltip: {
      colorBgSpotlight: colors.background.elevated,
      colorTextLightSolid: colors.text.primary,
    },
    Alert: {
      colorInfoBg: 'rgba(0, 240, 255, 0.1)',
      colorInfoBorder: colors.primary,
      colorSuccessBg: 'rgba(0, 255, 136, 0.1)',
      colorSuccessBorder: colors.success,
      colorWarningBg: 'rgba(251, 191, 36, 0.1)',
      colorWarningBorder: colors.warning,
      colorErrorBg: 'rgba(255, 0, 85, 0.1)',
      colorErrorBorder: colors.error,
    },
    Spin: {
      colorPrimary: colors.primary,
    },
    Progress: {
      colorText: colors.text.primary,
      defaultColor: colors.primary,
    },
    Statistic: {
      colorTextHeading: colors.text.primary,
      colorTextDescription: colors.text.secondary,
    },
    Descriptions: {
      colorText: colors.text.primary,
      colorTextSecondary: colors.text.secondary,
      labelBg: colors.background.card,
    },
    Divider: {
      colorSplit: colors.border.subtle,
    },
    Typography: {
      colorText: colors.text.primary,
      colorTextHeading: colors.text.primary,
      colorTextSecondary: colors.text.secondary,
      colorTextDescription: colors.text.muted,
      colorLink: colors.primary,
      colorLinkHover: colors.primaryLight,
    },
  },
};

export default colors;
