import React, { createContext, useContext, useReducer } from 'react';

const InternshipContext = createContext();

const initialState = {
  registration: {
    cs05: {
      status: 'pending',
      data: null,
      errors: null
    },
    company: {
      status: 'pending',
      data: null,
      errors: null
    },
    documents: []
  },
  logbook: {
    entries: [],
    totalHours: 0,
    totalDays: 0,
    lastEntry: null
  },
  approval: {
    status: 'pending',
    step: 0,
    history: [],
    lastUpdate: null
  }
};

// Actions
const internshipReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CS05_DATA':
      return {
        ...state,
        registration: {
          ...state.registration,
          cs05: {
            ...state.registration.cs05,
            data: action.payload,
            status: 'completed'
          }
        }
      };

    case 'SET_COMPANY_INFO':
      return {
        ...state,
        registration: {
          ...state.registration,
          company: {
            ...state.registration.company,
            data: action.payload,
            status: 'completed'
          }
        }
      };

    case 'ADD_LOGBOOK_ENTRY':
      const newEntry = action.payload;
      const hours = calculateHours(newEntry.timeIn, newEntry.timeOut);
      return {
        ...state,
        logbook: {
          ...state.logbook,
          entries: [...state.logbook.entries, newEntry],
          totalHours: state.logbook.totalHours + hours,
          totalDays: state.logbook.totalDays + 1,
          lastEntry: newEntry
        }
      };

    case 'UPDATE_APPROVAL_STATUS':
      return {
        ...state,
        approval: {
          ...state.approval,
          status: action.payload.status,
          step: action.payload.step,
          lastUpdate: new Date().toISOString(),
          history: [
            ...state.approval.history,
            {
              status: action.payload.status,
              timestamp: new Date().toISOString(),
              message: action.payload.message
            }
          ]
        }
      };

    default:
      return state;
  }
};

// Helper functions
const calculateHours = (timeIn, timeOut) => {
  // Logic to calculate hours between timeIn and timeOut
  return 0; // Placeholder
};

// Provider Component
export const InternshipProvider = ({ children }) => {
  const [state, dispatch] = useReducer(internshipReducer, initialState);

  // Actions creators
  const actions = {
    setCS05Data: (data) => {
      dispatch({ type: 'SET_CS05_DATA', payload: data });
    },
    addLogbookEntry: (entry) => {
      dispatch({ type: 'ADD_LOGBOOK_ENTRY', payload: entry });
    },
    updateApprovalStatus: (statusUpdate) => {
      dispatch({ type: 'UPDATE_APPROVAL_STATUS', payload: statusUpdate });
    }
  };

  return (
    <InternshipContext.Provider value={{ state, ...actions }}>
      {children}
    </InternshipContext.Provider>
  );
};

// Custom Hook
export const useInternship = () => {
  const context = useContext(InternshipContext);
  if (!context) {
    throw new Error('useInternship must be used within InternshipProvider');
  }
  return context;
};