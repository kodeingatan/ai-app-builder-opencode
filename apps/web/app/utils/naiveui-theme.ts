import type { GlobalThemeOverrides } from 'naive-ui'

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#0075de',
    primaryColorHover: '#0069c4',
    primaryColorPressed: '#005bab',
    primaryColorSuppl: '#e8f2fd',
    borderRadius: '8px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  },
  Button: {
    borderRadiusLarge: '9999px', // pill CTA
    borderRadiusMedium: '8px',
    borderRadiusSmall: '5px'
  },
  Input: {
    borderRadius: '4px', // tight, not pill
    colorFocus: '#ffffff',
    borderFocus: '1px solid #0075de',
    boxShadowFocus: '0 4px 18px rgba(0,0,0,0.04)'
  },
  Card: {
    borderRadius: '12px',
    color: '#ffffff',
    borderColor: '#e6e6e6'
  },
  DataTable: {
    thColor: '#f6f5f4',
    borderColor: '#e6e6e6',
    thFontWeight: '600'
  }
}
