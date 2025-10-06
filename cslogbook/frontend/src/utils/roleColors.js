// แหล่งรวม mapping สีสำหรับ role และ teacherType (ส่วนกลาง)
// ใช้ทั้งสำหรับ Tag, พื้นหลัง effects (particles) และอื่น ๆ

// สีหลักสำหรับป้าย (Tag) ใช้ชื่อสี Ant Design หรือ hex
export const ROLE_TAG_COLORS = {
  student: 'blue',
  admin: 'red',
  teacher_academic: 'gold',
  teacher_support: 'cyan',
  // default fallback
  default: 'blue'
};

// สีชุดสำหรับ particle พื้นหลัง
export const ROLE_PARTICLE_COLOR_SETS = {
  student: ['#e6f7ff', '#bae7ff', '#91d5ff'],
  teacher_academic: ['#fff7e6', '#ffe7ba', '#ffd591'],
  teacher_support: ['#e6fffb', '#b5f5ec', '#87e8de'],
  admin: ['#fff1f0', '#ffccc7', '#ffa39e'],
  default: ['#e6f7ff', '#bae7ff', '#91d5ff']
};

// ฟังก์ชันดึง key ที่ normalized จาก role + teacherType
export const resolveRoleKey = (role, teacherType) => {
  if (role === 'teacher') {
    return teacherType === 'support' ? 'teacher_support' : 'teacher_academic';
  }
  return role || 'default';
};

export const getTagColor = (role, teacherType) => {
  const key = resolveRoleKey(role, teacherType);
  return ROLE_TAG_COLORS[key] || ROLE_TAG_COLORS.default;
};

export const getParticleColors = (role, teacherType) => {
  const key = resolveRoleKey(role, teacherType);
  return ROLE_PARTICLE_COLOR_SETS[key] || ROLE_PARTICLE_COLOR_SETS.default;
};
