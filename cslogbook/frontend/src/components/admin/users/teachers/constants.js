export const TEACHER_POSITION_OPTIONS = [
  {
    value: 'หัวหน้าภาควิชา',
    label: 'หัวหน้าภาควิชา',
    teacherType: 'academic'
  },
  {
    value: 'คณาจารย์',
    label: 'คณาจารย์',
    teacherType: 'academic'
  },
  {
    value: 'เจ้าหน้าที่ภาควิชา',
    label: 'เจ้าหน้าที่ภาควิชา',
    teacherType: 'support'
  }
];

export const getTeacherTypeByPosition = (position) => {
  const matched = TEACHER_POSITION_OPTIONS.find((option) => option.value === position);
  return matched ? matched.teacherType : 'academic';
};

export const TEACHER_TYPE_OPTIONS = [
  { label: 'สายวิชาการ', value: 'academic' },
  { label: 'เจ้าหน้าที่ภาควิชา', value: 'support' }
];
