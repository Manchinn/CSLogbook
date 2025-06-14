// Re-export เป็น object เพื่อใช้งานแบบ namespace
import { commonStyles, safeText, formatThaiDate } from './commonStyles';
import { officialStyles } from './officialStyles';
import { letterStyles, letterHelpers } from './letterStyles';
import { 
  themeColors, 
  fontSizes, 
  spacing, 
  documentThemes, 
  getThemeStyle, 
  shadows, 
  borderRadius 
} from './themeStyles';

export const PDFStyles = {
  common: commonStyles,
  official: officialStyles,
  letter: letterStyles,
  theme: {
    colors: themeColors,
    fonts: fontSizes,
    spacing,
    themes: documentThemes,
    shadows,
    borderRadius
  },
  helpers: {
    safeText,
    formatThaiDate,
    letterHelpers,
    getThemeStyle
  }
};

// Export ทุก styles เพื่อใช้งานง่าย
export { commonStyles, safeText, formatThaiDate } from './commonStyles';
export { officialStyles } from './officialStyles';
export { letterStyles, letterHelpers } from './letterStyles';
export { 
  themeColors, 
  fontSizes, 
  spacing, 
  documentThemes, 
  getThemeStyle, 
  shadows, 
  borderRadius 
} from './themeStyles';

// Default export สำหรับการใช้งานทั่วไป
export default PDFStyles;