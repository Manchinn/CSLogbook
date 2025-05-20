import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/auth/AuthContext'; // Updated path
import { InternshipProvider } from './context/internship/InternshipContext'; // Updated path
import { StudentEligibilityProvider } from './context/student/StudentEligibilityContext'; // Updated path
import MainLayout from './components/layout/MainLayout/MainLayout'; // Updated path
import LoginForm from './components/forms/LoginForm/LoginForm'; // Updated path
import Dashboard from './pages/student/Dashboard'; // Updated path, assuming Dashboard is a page now
import StudentProfile from './pages/student/StudentProfilePage'; // Updated path, assuming StudentProfile is a page now

// Import Internship Components - these will likely become pages or be part of page components
import CS05Form from './pages/student/Internship/CS05Page'; // Updated path
import TimeSheet from './pages/student/Internship/TimeSheetPage'; // Updated path
import InternshipSummary from './pages/student/Internship/InternshipSummaryPage'; // Updated path
import StatusCheck from './components/internship/shared/StatusCheck'; // Path might need further review based on its usage
import CompanyInfoForm from './pages/student/Internship/CompanyInfoPage'; // Updated path
import { EligibilityCheck, InternshipRequirements } from './pages/student/Internship/EligibilityPage'; // Updated path

// Import Project Components - these will likely become pages or be part of page components
import ProjectProposalForm from './pages/student/Project/ProjectProposalPage'; // Updated path
import LogbookForm from './pages/student/Project/LogbookPage'; // Updated path
import { ProjectEligibilityCheck, ProjectRequirements } from './pages/student/Project/ProjectEligibilityPage'; // Updated path

// Import Admin Components
import AdminUpload from './pages/admin/AdminUploadPage'; // Updated path
// Import Admin2 Components - New Structure
import AdminRoutes from './pages/admin/AdminRoutes'; // Updated path

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
        <StudentEligibilityProvider>
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
                
                <Route path="/internship-eligibility" element={
                  <ProtectedRoute roles={['student']}>
                    <EligibilityCheck />
                  </ProtectedRoute>
                } />
                <Route path="/internship-requirements" element={
                  <ProtectedRoute roles={['student']}>
                    <InternshipRequirements />
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
                
                <Route path="/project-eligibility" element={
                  <ProtectedRoute roles={['student']}>
                    <ProjectEligibilityCheck />
                  </ProtectedRoute>
                } />
                <Route path="/project-requirements" element={
                  <ProtectedRoute roles={['student']}>
                    <ProjectRequirements />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/students" element={
                  <ProtectedRoute roles={['admin']}>
                    {/* Placeholder for Admin Student Management Page */}
                  </ProtectedRoute>
                } />
                <Route path="/teachers" element={
                  <ProtectedRoute roles={['admin']}>
                    {/* Placeholder for Admin Teacher Management Page */}
                  </ProtectedRoute>
                } />
                <Route path="/admin/upload" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminUpload />
                  </ProtectedRoute>
                } />

                <Route path="/admin/*" element={ // Changed from /admin2/* to /admin/* to match new structure
                  <ProtectedRoute roles={['admin']}>
                    <AdminRoutes />
                  </ProtectedRoute>
                } />
              
              </Route>
              

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </InternshipProvider>
        </StudentEligibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
