// Design tokens — LimpioGO v2 (Blue & White — el diseño original del repo)
// "Blue / white / green — clean, fresh, trustworthy"

// Gradientes de marca — mantienen el DNA azul/navy/sky
export const Gradients = {
  // Hero principal — navy profundo a azul primario a sky
  heroPrimary: ['#0C4A6E', '#1D4ED8', '#0EA5E9'] as const,
  // Wallet card — confianza financiera
  wallet:      ['#0C4A6E', '#2563EB', '#38BDF8'] as const,
  // Urgente — acción inmediata (cálido pero on-brand)
  urgent:      ['#DC2626', '#F97316'] as const,
  // Calidad platinum — diferenciador premium
  platinum:    ['#6366F1', '#8B5CF6'] as const,
  // Gold badge
  gold:        ['#D97706', '#F59E0B'] as const,
  // Surface sutil para cards premium
  surfaceBlue: ['#EFF6FF', '#DBEAFE'] as const,
  // Pro earnings
  proHero:     ['#0C4A6E', '#0369A1'] as const,
  // Referidos — verde éxito
  referral:    ['#065F46', '#16A34A'] as const,
};

export const Colors = {
  // Primary — azul cielo limpio
  primary: '#2563EB',        // blue-600 — CTA principal
  primaryHover: '#1D4ED8',   // blue-700
  primaryLight: '#EFF6FF',   // blue-50
  primarySoft: '#DBEAFE',    // blue-100
  sky500: '#0EA5E9',
  sky400: '#38BDF8',
  sky300: '#7DD3FC',
  sky200: '#BAE6FD',
  sky100: '#E0F2FE',
  sky50:  '#F0F9FF',

  // Backgrounds
  paper:      '#EFF6FF',     // app bg — light sky blue
  bg:         '#EFF6FF',
  surface:    '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  tint:       '#EFF6FF',

  // Texto
  ink:    '#0F172A',
  ink2:   '#475569',
  ink3:   '#94A3B8',
  ink4:   '#CBD5E1',
  navy:   '#0C4A6E',
  dark:   '#1E293B',

  // Bordes
  border:      '#E2E8F0',
  borderBlue:  '#BAE6FD',

  // Semánticos
  ok:          '#16A34A',
  okLight:     '#DCFCE7',
  okSoft:      '#F0FDF4',
  danger:      '#DC2626',
  dangerLight: '#FEE2E2',
  warn:        '#F59E0B',
  warnLight:   '#FEF9C3',

  // Pro role — deep navy
  proAccent: '#0C4A6E',
  proLight:  '#E0F2FE',

  // Wallet
  walletGreen:      '#059669',
  walletGreenLight: '#D1FAE5',
  walletDebit:      '#DC2626',
  walletDebitLight: '#FEE2E2',

  // Premium badges
  urgent:          '#DC2626',
  urgentLight:     '#FEF2F2',
  premium:         '#6366F1',
  premiumLight:    '#EEF2FF',
  goldBadge:       '#D97706',
  goldBadgeLight:  '#FEF3C7',
  platinumBadge:   '#8B5CF6',
  platinumLight:   '#F5F3FF',

  // Tipografía display (pantallas hero)
};

export const Typography = {
  display: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -2 },
  hero:    { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.5 },
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  h4: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMed: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  smallBold: { fontSize: 13, fontWeight: '700' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
  micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.8 },
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 26, full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  md: {
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  lg: {
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 10,
  },
  card: {
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 3,
  },
  cta: {
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
  },
};
