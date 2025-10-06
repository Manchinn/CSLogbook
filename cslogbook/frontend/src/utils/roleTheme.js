// รวม theme สำหรับ role + teacherType เพื่อลด duplication ใน component ต่างๆ
// ใช้คู่กับ roleColors.js (ที่เน้น Tag/Particles)

const BASE_THEMES = {
  student: {
    gradient: 'linear-gradient(135deg, #e6f7ff 0%, #91d5ff 100%)',
    primary: '#1890ff',
    text: '#000000d9',
    badge: '#1890ff',
    buttonHover: '#bae7ff'
  },
  teacher_academic: {
    gradient: 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)',
    primary: '#faad14',
    text: '#000000d9',
    badge: '#d48806',
    buttonHover: '#ffe7ba'
  },
  teacher_support: {
    gradient: 'linear-gradient(135deg, #e6fffb 0%, #87e8de 100%)',
    primary: '#13c2c2',
    text: '#000000d9',
    badge: '#08979C',
    buttonHover: '#b5f5ec'
  },
  admin: {
    gradient: 'linear-gradient(135deg, #fff1f0 0%, #ffa39e 100%)',
    primary: '#f5222d',
    text: '#000000d9',
    badge: '#cf1322',
    buttonHover: '#ffccc7'
  }
};

export const resolveThemeKey = (role, teacherType) => {
  if (role === 'teacher') {
    return teacherType === 'support' ? 'teacher_support' : 'teacher_academic';
  }
  return role || 'student';
};

export const getRoleTheme = (role, teacherType) => {
  const key = resolveThemeKey(role, teacherType);
  return BASE_THEMES[key] || BASE_THEMES.student;
};

export default getRoleTheme;
