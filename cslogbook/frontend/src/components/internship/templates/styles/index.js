// Re-export เป็น object เพื่อใช้งานแบบ namespace
import { commonStyles, safeText, formatThaiDate } from './commonStyles';
import { officialStyles } from './officialStyles';
import letterStyles from './letterStyles';
import  certificateStyles from './certificateStyles'; // ✅ เพิ่มใหม่
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
  certificate: certificateStyles, // ✅ เพิ่มใหม่
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
    getThemeStyle
  }
};

// Export ทุก styles เพื่อใช้งานง่าย
export { commonStyles, safeText, formatThaiDate } from './commonStyles';
export { officialStyles } from './officialStyles';
export { default as letterStyles } from './letterStyles';
export { default as certificateStyles } from './certificateStyles'; // ✅ เพิ่มใหม่
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