import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/auth/AuthContext'; // Updated import path
import { Spin } from 'antd';

export const ProtectedRoute = ({ children }) => {
    const { authState } = useAuth();
    const location = useLocation();

    if (authState.loading) {
        return <Spin />;
    }

    return authState.isAuthenticated ? (
        children
    ) : (
        <Navigate to="/login" state={{ from: location }} replace />
    );
};

export const DashboardRoute = ({ children }) => {
    const { authState } = useAuth();
    const location = useLocation();

    if (authState.loading) {
        return <Spin />;
    }

    return authState.isAuthenticated && authState.user.role === 'admin' ? (
        children
    ) : (
        <Navigate to="/unauthorized" state={{ from: location }} replace />
    );
};