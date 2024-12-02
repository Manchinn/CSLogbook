import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AdminUpload from './components/AdminUpload';
import StudentProfile from './components/StudentProfile';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginForm />} />
        
        {/* Protected routes wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/admin/upload" element={<AdminUpload />} />
          <Route path="/student-profile/:id" element={<StudentProfile />} />
          {/* Add other routes here */}
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;