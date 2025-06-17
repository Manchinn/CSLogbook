import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { userService } from '../../services/admin/userService';

// สร้าง initial state สำหรับการจัดการผู้ใช้
const initialState = {
  students: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    },
    filters: {
      search: '',
      semester: '',
      status: ''
    }
  },
  teachers: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    },
    filters: {
      search: ''
    }
  },
  selectedUser: null
};

// สร้าง reducer
const userReducer = (state, action) => {
  switch (action.type) {
    // Students actions
    case 'FETCH_STUDENTS_START':
      return { 
        ...state, 
        students: { 
          ...state.students, 
          loading: true, 
          error: null 
        } 
      };
    case 'FETCH_STUDENTS_SUCCESS':
      return { 
        ...state, 
        students: { 
          ...state.students, 
          loading: false, 
          data: action.payload.data,
          pagination: {
            ...state.students.pagination,
            total: action.payload.total
          }
        } 
      };
    case 'FETCH_STUDENTS_ERROR':
      return { 
        ...state, 
        students: { 
          ...state.students, 
          loading: false, 
          error: action.payload 
        } 
      };
    case 'SET_STUDENT_FILTERS':
      return { 
        ...state, 
        students: { 
          ...state.students, 
          filters: { 
            ...state.students.filters, 
            ...action.payload 
          },
          pagination: {
            ...state.students.pagination,
            current: 1 // รีเซ็ตหน้าเมื่อมีการเปลี่ยนฟิลเตอร์
          }
        } 
      };
    case 'SET_STUDENT_PAGINATION':
      return { 
        ...state, 
        students: { 
          ...state.students, 
          pagination: { 
            ...state.students.pagination, 
            ...action.payload 
          } 
        } 
      };
      
    // Teachers actions  
    case 'FETCH_TEACHERS_START':
      return { 
        ...state, 
        teachers: { 
          ...state.teachers, 
          loading: true, 
          error: null 
        } 
      };
    case 'FETCH_TEACHERS_SUCCESS':
      return { 
        ...state, 
        teachers: { 
          ...state.teachers, 
          loading: false, 
          data: action.payload.data,
          pagination: {
            ...state.teachers.pagination,
            total: action.payload.total
          }
        } 
      };
    case 'FETCH_TEACHERS_ERROR':
      return { 
        ...state, 
        teachers: { 
          ...state.teachers, 
          loading: false, 
          error: action.payload 
        } 
      };
    case 'SET_TEACHER_FILTERS':
      return { 
        ...state, 
        teachers: { 
          ...state.teachers, 
          filters: { 
            ...state.teachers.filters, 
            ...action.payload 
          },
          pagination: {
            ...state.teachers.pagination,
            current: 1
          }
        } 
      };
    case 'SET_TEACHER_PAGINATION':
      return { 
        ...state, 
        teachers: { 
          ...state.teachers, 
          pagination: { 
            ...state.teachers.pagination, 
            ...action.payload 
          } 
        } 
      };
      
    // ผู้ใช้ที่เลือก
    case 'SET_SELECTED_USER':
      return { ...state, selectedUser: action.payload };
      
    default:
      return state;
  }
};

// สร้าง Context
const UserManagementContext = createContext();

// สร้าง Provider
export const UserManagementProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  
  // ฟังก์ชันโหลดข้อมูลนักศึกษา
  const loadStudents = async () => {
    dispatch({ type: 'FETCH_STUDENTS_START' });
    try {
      const { current, pageSize } = state.students.pagination;
      const { search, semester, status } = state.students.filters;
      
      const response = await userService.getStudents({
        page: current,
        pageSize,
        search,
        semester,
        status
      });
      
      dispatch({ 
        type: 'FETCH_STUDENTS_SUCCESS', 
        payload: { 
          data: response.data, 
          total: response.total 
        } 
      });
    } catch (error) {
      dispatch({ type: 'FETCH_STUDENTS_ERROR', payload: error.message });
    }
  };
  
  // ฟังก์ชันโหลดข้อมูลอาจารย์
  const loadTeachers = async () => {
    dispatch({ type: 'FETCH_TEACHERS_START' });
    try {
      const { current, pageSize } = state.teachers.pagination;
      const { search } = state.teachers.filters;
      
      const response = await userService.getTeachers({
        page: current,
        pageSize,
        search
      });
      
      dispatch({ 
        type: 'FETCH_TEACHERS_SUCCESS', 
        payload: { 
          data: response.data, 
          total: response.total 
        } 
      });
    } catch (error) {
      dispatch({ type: 'FETCH_TEACHERS_ERROR', payload: error.message });
    }
  };
  
  // value ที่ส่งให้ Consumer
  const value = {
    ...state,
    loadStudents,
    loadTeachers,
    setStudentFilters: (filters) => dispatch({ type: 'SET_STUDENT_FILTERS', payload: filters }),
    setStudentPagination: (pagination) => dispatch({ type: 'SET_STUDENT_PAGINATION', payload: pagination }),
    setTeacherFilters: (filters) => dispatch({ type: 'SET_TEACHER_FILTERS', payload: filters }),
    setTeacherPagination: (pagination) => dispatch({ type: 'SET_TEACHER_PAGINATION', payload: pagination }),
    setSelectedUser: (user) => dispatch({ type: 'SET_SELECTED_USER', payload: user })
  };
  
  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  );
};

// Custom hook
export const useUserManagementContext = () => {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagementContext must be used within a UserManagementProvider');
  }
  return context;
};