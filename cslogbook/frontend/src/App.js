import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InternshipProvider } from './contexts/InternshipContext';
import MainLayout from './components/layout/MainLayout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/dashboards/Dashboard';
import StudentProfile from './components/StudentProfile/index';

// Import Internship Components
import CS05Form from './components/internship/registration/CS05Form';
import TimeSheet from './components/internship/logbook/TimeSheet/index';
import InternshipSummary from './components/internship/summary/Summary';
import StatusCheck from './components/internship/shared/StatusCheck';
import CompanyInfoForm from './components/internship/logbook/CompanyInfoForm';
// Import Project Components
import ProjectProposalForm from './components/project/ProjectProposalForm';
import LogbookForm from './components/project/LogbookForm';

// Import Admin Components
import AdminUpload from './components/AdminUpload';
// Import Admin2 Components - New Structure
import AdminRoutes from './components/admin2/AdminRoutes';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, userData } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(userData.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InternshipProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route element={<MainLayout />}>
              {/* Dashboard Route */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Student Routes */}
              <Route path="/student-profile/:id" element={<StudentProfile />} />

              {/* Internship Routes */}
              <Route path="/internship-registration/cs05" element={
                <ProtectedRoute roles={['student']}>
                  <CS05Form />
                </ProtectedRoute>
              } />
              
              <Route path="/internship-logbook/timesheet" element={
                <ProtectedRoute roles={['student']}>
                  <TimeSheet />
                </ProtectedRoute>
              } />
              <Route path="/internship-logbook/companyinfo" element={
                <ProtectedRoute roles={['student']}>
                  <CompanyInfoForm />
                </ProtectedRoute>
              } />
              <Route path="/internship-summary" element={
                <ProtectedRoute roles={['student']}>
                  <InternshipSummary />
                </ProtectedRoute>
              } />
              <Route path="/status-check" element={
                <ProtectedRoute roles={['student']}>
                  <StatusCheck />
                </ProtectedRoute>
              } />

              {/* Project Routes */}
              <Route path="/project-proposal" element={
                <ProtectedRoute roles={['student']}>
                  <ProjectProposalForm />
                </ProtectedRoute>
              } />
              <Route path="/project-logbook" element={
                <ProtectedRoute roles={['student']}>
                  <LogbookForm />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/students" element={
                <ProtectedRoute roles={['admin']}>
                </ProtectedRoute>
              } />
              <Route path="/teachers" element={
                <ProtectedRoute roles={['admin']}>
                </ProtectedRoute>
              } />
              <Route path="/admin/upload" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminUpload />
                </ProtectedRoute>
              } />

              <Route path="/admin2/*" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminRoutes />
                </ProtectedRoute>
              } />
            
            </Route>
            

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </InternshipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;