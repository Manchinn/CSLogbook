const PROJECT_RELATED = new Set(['project', 'project1', 'project2']);

export const DEADLINE_CATEGORY_DEFINITIONS = [
  {
    key: 'project_sem1',
    label: 'โครงงานพิเศษและปริญญานิพนธ์ ภาคการเรียนที่ 1',
    matcher: (deadline) => PROJECT_RELATED.has(deadline?.relatedTo) && Number(deadline?.semester) === 1
  },
  {
    key: 'project_sem2',
    label: 'โครงงานพิเศษและปริญญานิพนธ์ ภาคการเรียนที่ 2',
    matcher: (deadline) => PROJECT_RELATED.has(deadline?.relatedTo) && Number(deadline?.semester) === 2
  },
  {
    key: 'internship',
    label: 'การฝึกงานประจำปี',
    matcher: (deadline) => deadline?.relatedTo === 'internship'
  }
];

export const DEADLINE_CATEGORY_OTHERS_KEY = 'others';
export const DEADLINE_CATEGORY_OTHERS_LABEL = 'กำหนดการอื่นๆ';

export const DEADLINE_CATEGORY_OPTIONS = [
  ...DEADLINE_CATEGORY_DEFINITIONS.map((definition) => ({
    value: definition.key,
    label: definition.label
  })),
  {
    value: DEADLINE_CATEGORY_OTHERS_KEY,
    label: DEADLINE_CATEGORY_OTHERS_LABEL
  }
];

export const ALL_DEADLINE_CATEGORY_KEYS = DEADLINE_CATEGORY_OPTIONS.map((option) => option.value);

export const mapDeadlineToCategory = (deadline) => {
  for (const definition of DEADLINE_CATEGORY_DEFINITIONS) {
    if (definition.matcher(deadline)) {
      return definition.key;
    }
  }
  return DEADLINE_CATEGORY_OTHERS_KEY;
};

export const getCategoryLabel = (key) => {
  if (key === DEADLINE_CATEGORY_OTHERS_KEY) {
    return DEADLINE_CATEGORY_OTHERS_LABEL;
  }
  const definition = DEADLINE_CATEGORY_DEFINITIONS.find((item) => item.key === key);
  return definition ? definition.label : DEADLINE_CATEGORY_OTHERS_LABEL;
};
