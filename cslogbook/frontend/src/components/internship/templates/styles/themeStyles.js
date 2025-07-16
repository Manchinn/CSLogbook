import { StyleSheet } from '@react-pdf/renderer';

// ธีมสีสำหรับ PDF Templates
export const themeColors = {
  // สีหลัก
  primary: '#1890FF',
  primaryLight: '#40A9FF', 
  primaryDark: '#096DD9',
  
  // สีเสริม
  secondary: '#52C41A',
  secondaryLight: '#73D13D',
  secondaryDark: '#389E0D',
  
  // สีสถานะ
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  info: '#1890FF',
  
  // สีเทา
  gray100: '#F5F5F5',
  gray200: '#E8E8E8',
  gray300: '#D9D9D9',
  gray400: '#BFBFBF',
  gray500: '#8C8C8C',
  gray600: '#595959',
  gray700: '#434343',
  gray800: '#262626',
  gray900: '#1F1F1F',
  
  // สีพื้นฐาน
  white: '#FFFFFF',
  black: '#000000',
  background: '#FAFAFA',
  
  // สีเฉพาะสำหรับมหาวิทยาลัย
  university: {
    primary: '#2E5BBA',     // น้ำเงินมหาวิทยาลัย
    secondary: '#FFD700',   // ทองคำ
    accent: '#8B4513',      // น้ำตาลทอง
    light: '#E6F3FF'       // น้ำเงินอ่อน
  }
};

// ตัวแปรขนาดตัวอักษร
export const fontSizes = {
  xs: 8,
  sm: 10,
  base: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  
  // ขนาดเฉพาะสำหรับเอกสารไทย
  thai: {
    small: 12,
    normal: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
    title: 22,
    heading: 24
  }
};

// ระยะห่าง
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64
};

// ธีมสำหรับเอกสารประเภทต่างๆ
export const documentThemes = {
  // ธีมสำหรับเอกสารทางการ
  official: StyleSheet.create({
    primaryColor: themeColors.university.primary,
    secondaryColor: themeColors.university.secondary,
    backgroundColor: themeColors.white,
    textColor: themeColors.black,
    borderColor: themeColors.gray300,
    headerBackground: themeColors.university.light,
    
    title: {
      fontSize: fontSizes.thai.title,
      fontWeight: 'bold',
      color: themeColors.university.primary,
      textAlign: 'center'
    },
    
    subtitle: {
      fontSize: fontSizes.thai.medium,
      color: themeColors.gray700,
      textAlign: 'center'
    },
    
    sectionHeader: {
      fontSize: fontSizes.thai.medium,
      fontWeight: 'bold',
      backgroundColor: themeColors.university.light,
      padding: spacing.sm,
      borderRadius: 4
    }
  }),
  
  // ธีมสำหรับรายงาน
  report: StyleSheet.create({
    primaryColor: themeColors.primary,
    backgroundColor: themeColors.white,
    alternateBackground: themeColors.gray100,
    
    statBox: {
      backgroundColor: themeColors.gray100,
      borderLeft: `3 solid ${themeColors.primary}`,
      padding: spacing.md,
      borderRadius: 4
    },
    
    highlight: {
      backgroundColor: themeColors.warning + '20',
      borderLeft: `3 solid ${themeColors.warning}`,
      padding: spacing.sm
    }
  }),
  
  // ธีมสำหรับแบบฟอร์ม
  form: StyleSheet.create({
    fieldBackground: themeColors.gray100,
    borderColor: themeColors.gray300,
    focusColor: themeColors.primary,
    
    inputBox: {
      backgroundColor: themeColors.gray100,
      border: `1 solid ${themeColors.gray300}`,
      borderRadius: 4,
      padding: spacing.sm,
      minHeight: 25
    },
    
    requiredField: {
      color: themeColors.error
    },
    
    sectionBox: {
      border: `1 solid ${themeColors.gray300}`,
      borderRadius: 5,
      padding: spacing.md,
      marginVertical: spacing.sm
    }
  })
};

// ฟังก์ชันช่วยสำหรับการใช้งานธีม
export const getThemeStyle = (themeName, styleName) => {
  return documentThemes[themeName]?.[styleName] || {};
};

// Shadow effects สำหรับ PDF (จำลอง)
export const shadows = {
  sm: {
    borderBottom: `1 solid ${themeColors.gray200}`,
    borderRight: `1 solid ${themeColors.gray200}`
  },
  md: {
    borderBottom: `2 solid ${themeColors.gray300}`,
    borderRight: `1 solid ${themeColors.gray300}`
  },
  lg: {
    borderBottom: `3 solid ${themeColors.gray400}`,
    borderRight: `2 solid ${themeColors.gray400}`
  }
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
  full: 9999
};

export default {
  themeColors,
  fontSizes,
  spacing,
  documentThemes,
  getThemeStyle,
  shadows,
  borderRadius
};