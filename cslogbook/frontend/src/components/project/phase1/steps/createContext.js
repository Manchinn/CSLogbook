import React, { createContext, useReducer, useContext, useCallback } from 'react';

// Context สำหรับ Draft การสร้าง/เสนอหัวข้อโครงงาน (Phase1) เวอร์ชันใหม่
// NOTE: ยังไม่เชื่อม API จริง จะเพิ่ม integration ในรอบถัดไป

const initialState = {
  projectId: null, // จะถูกกำหนดหลังสร้างครั้งแรก (Step 1)
  basic: { projectNameTh: '', projectNameEn: '', projectType: undefined },
  classification: {
    tracks: [],
    advisorId: null, // เก็บ teacherId เพื่อใช้แสดงผล/เทียบใน state เดิม
    advisorUserId: undefined, // เก็บ userId ของอาจารย์ (ใช้ส่งให้ backend ซึ่งล็อก FK กับ users)
    coAdvisorId: null,
    coAdvisorUserId: undefined
  },
  members: { secondMemberCode: '', syncing: false, synced: false, error: null },
  projectStatus: 'draft',
  projectMembers: [], // จาก backend (leader + member พร้อม name, code)
  details: { problem: '', objective: '', background: '', scope: '', expectedOutcome: '', benefit: '', tools: '', methodology: '', timelineNote: '', risk: '', constraints: '' },
  advisors: [], // เก็บรายการอาจารย์ล่าสุดที่โหลดมา (ใช้ map id->name ใน review)
  status: { creating: false, saving: false, created: false },
  errors: {}
};

function reducer(state, action) {
  switch(action.type) {
    case 'SET_BASIC': return { ...state, basic: { ...state.basic, ...action.payload } };
    case 'SET_CLASS': return { ...state, classification: { ...state.classification, ...action.payload } };
  case 'SET_MEMBERS': return { ...state, members: { ...state.members, ...action.payload } };
  case 'SET_MEMBERS_STATUS': return { ...state, members: { ...state.members, ...action.payload } };
    case 'SET_DETAILS': return { ...state, details: { ...state.details, ...action.payload } };
  case 'SET_PROJECT_ID': return { ...state, projectId: action.id, status: { ...state.status, created: true } };
  case 'SET_ADVISORS': return { ...state, advisors: action.list };
  case 'SET_STATUS': return { ...state, status: { ...state.status, ...action.payload } };
  case 'SET_PROJECT_STATUS': return { ...state, projectStatus: action.status };
  case 'SET_PROJECT_MEMBERS': return { ...state, projectMembers: action.list };
    case 'SET_ERRORS': return { ...state, errors: { ...state.errors, ...action.payload } };
    case 'RESET': return initialState;
    default: return state;
  }
}

const CreateContext = createContext(null);

export const CreateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setBasic = useCallback(p => dispatch({ type: 'SET_BASIC', payload: p }), []);
  const setClassification = useCallback(p => dispatch({ type: 'SET_CLASS', payload: p }), []);
  const setMembers = useCallback(p => dispatch({ type: 'SET_MEMBERS', payload: p }), []);
  const setMembersStatus = useCallback(p => dispatch({ type: 'SET_MEMBERS_STATUS', payload: p }), []);
  const setDetails = useCallback(p => dispatch({ type: 'SET_DETAILS', payload: p }), []);
  const setProjectId = useCallback(id => dispatch({ type: 'SET_PROJECT_ID', id }), []);
  const setProjectStatus = useCallback(status => dispatch({ type: 'SET_PROJECT_STATUS', status }), []);
  const setProjectMembers = useCallback(list => dispatch({ type: 'SET_PROJECT_MEMBERS', list }), []);
  const setStatus = useCallback(p => dispatch({ type: 'SET_STATUS', payload: p }), []);
  const setErrors = useCallback(p => dispatch({ type: 'SET_ERRORS', payload: p }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setAdvisors = useCallback(list => dispatch({ type: 'SET_ADVISORS', list }), []);

  const computeDraftReadiness = useCallback(() => {
    const { basic, classification, members, details, projectMembers } = state;
    const member2Filled = !!(members.secondMemberCode||'').trim();
    const member2Valid = /^[0-9]{5,13}$/.test((members.secondMemberCode||'').trim());
    const backendMemberExists = projectMembers.some(m => m.role === 'member');
    return [
      { key: 'name_th', label: 'ชื่อโครงงานพิเศษภาษาไทย', pass: !!basic.projectNameTh.trim() },
      { key: 'name_en', label: 'ชื่อโครงงานพิเศษภาษาอังกฤษ', pass: !!basic.projectNameEn.trim() },
      { key: 'type', label: 'ประเภทโครงงานพิเศษ', pass: !!basic.projectType },
      { key: 'tracks', label: 'หมวด', pass: classification.tracks.length > 0 },
      { key: 'advisor', label: 'อาจารย์ที่ปรึกษา', pass: !!classification.advisorId },
      { key: 'details', label: 'รายละเอียด (อย่างน้อย 1)', pass: !!(details.objective || details.problem || details.background) },
      { key: 'member2', label: 'สมาชิกคนที่สอง', pass: backendMemberExists || (!member2Filled) || (member2Valid && members.synced) }
    ];
  }, [state]);

  return (
  <CreateContext.Provider value={{ state, setBasic, setClassification, setMembers, setMembersStatus, setDetails, setProjectId, setStatus, setErrors, setAdvisors, setProjectStatus, setProjectMembers, computeDraftReadiness, reset }}>
      {children}
    </CreateContext.Provider>
  );
};

export const useCreateProjectDraft = () => {
  const ctx = useContext(CreateContext);
  if (!ctx) throw new Error('useCreateProjectDraft ต้องอยู่ภายใต้ <CreateProvider>');
  return ctx;
};
