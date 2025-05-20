import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { userService } from '../../../services/admin/userService'; // Updated path

const UserManagementContext = createContext();

const initialState = {
    users: [],
    loading: true,
    error: null
};

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_USERS_SUCCESS':
            return { ...state, users: action.payload, loading: false };
        case 'FETCH_USERS_ERROR':
            return { ...state, error: action.payload, loading: false };
        default:
            return state;
    }
}

export function UserManagementProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        let isMounted = true;
        userService.getUsers()
            .then(users => {
                if (isMounted) {
                    dispatch({ type: 'FETCH_USERS_SUCCESS', payload: users });
                }
            })
            .catch(error => {
                if (isMounted) {
                    dispatch({ type: 'FETCH_USERS_ERROR', payload: error });
                }
            });
        return () => { isMounted = false; };
    }, []);

    return (
        <UserManagementContext.Provider value={{ state, dispatch }}>
            {children}
        </UserManagementContext.Provider>
    );
}

export function useUserManagement() {
    return useContext(UserManagementContext);
}