import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InternshipProvider } from './contexts/InternshipContext';
import MainLayout from './components/layout/MainLayout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/dashboards/Dashboard';
import StudentList from './components/StudentList';
import TeacherList from './components/TeacherList';
import StudentProfile from './components/StudentProfile/index';

// Import Internship Components
import CS05Form from './components/internship/registration/CS05Form';
import TimeSheet from './components/internship/logbook/TimeSheet';
import InternshipSummary from './components/internship/summary/Summary';
import StatusCheck from './components/internship/shared/StatusCheck';
import CompanyInfoForm from './components/internship/logbook/CompanyInfoForm';
// Import Project Components
import ProjectProposalForm from './components/project/ProjectProposalForm';
import LogbookForm from './components/project/LogbookForm';

// Import Admin Components
import AdminUpload from './components/AdminUpload';
import DocumentDetails from './components/admin/DocumentDetails';
import InternshipDocumentManagement from './components/admin/InternshipDocumentManagement';
import ProjectDocumentManagement from './components/admin/ProjectDocumentManagement';

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

              {/* Internship Routes - Now wrapped with InternshipProvider */}
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

              {/* <Route path="/status-check">
                <Route 
                  path="internship" 
                  element={
                    <ProtectedRoute>
                      <InternshipStatusCheck />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="project" 
                  element={
                    <ProtectedRoute>
                      <ProjectStatusCheck />
                    </ProtectedRoute>
                  } 
                />
              </Route> */}

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
                  <StudentList />
                </ProtectedRoute>
              } />
              <Route path="/teachers" element={
                <ProtectedRoute roles={['admin']}>
                  <TeacherList />
                </ProtectedRoute>
              } />
              <Route path="/admin/upload" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminUpload />
                </ProtectedRoute>
              } />
              <Route path="/document-management/internship" element={
                <ProtectedRoute roles={['admin']}>
                  <InternshipDocumentManagement />
                </ProtectedRoute>
              } />
              <Route path="/document-management/project" element={
                <ProtectedRoute roles={['admin']}>
                  <ProjectDocumentManagement />
                </ProtectedRoute>
              } />
              <Route path="/document-details/:id" element={
                <ProtectedRoute roles={['admin']}>
                  <DocumentDetails />
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