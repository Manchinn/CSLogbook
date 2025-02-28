import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/dashboards/Dashboard';
import StudentList from './components/StudentList';
import TeacherList from './components/TeacherList';
import StudentPairsList from './components/StudentPairsList';
import AdminUpload from './components/AdminUpload';
import StudentProfile from './components/StudentProfile';
import InternshipTerms from "./components/internship/InternshipTerms";
import CompanyInfoForm from './components/internship/CompanyInfoForm';
import InternshipDocuments from './components/internship/InternshipDocumentForm'; // แก้ไขเส้นทางให้ถูกต้อง
import InternshipReview from "./components/internship/InternshipReview";
import DocumentDetails from "./components/admin/DocumentDetails";
import InternshipDocumentManagement from "./components/admin/InternshipDocumentManagement";
import ProjectDocumentManagement from "./components/admin/ProjectDocumentManagement";
import ProjectProposalForm from "./components/project/ProjectProposalForm";
import LogbookForm from "./components/project/LogbookForm";
import StatusCheck from "./components/project/StatusCheck";
import InternshipDocumentForm from "./components/internship/InternshipDocumentForm"; // นำเข้า InternshipDocumentForm
import InternshipStatusCheck from "./components/internship/InternshipStatusCheck"; // นำเข้า internshipStatusCheck

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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginForm />} />
          
          {/* Protected routes wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/teachers" element={<TeacherList />} />
            <Route path="/project-pairs" element={<StudentPairsList />} />
            <Route path="/admin/upload" element={
              <ProtectedRoute roles={['admin']}>
                <AdminUpload />
              </ProtectedRoute>
            } />
            <Route path="/student-profile/:id" element={<StudentProfile />} />
            <Route path="/internship-terms" element={<InternshipTerms />} />
            <Route path="/internship-company" element={<CompanyInfoForm />} />
            <Route path="/internship-documents" element={<InternshipDocuments />} />
            <Route path="/internship-review" element={<InternshipReview />} />
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
            <Route path="/document-details/:id" element={<DocumentDetails />} />
            <Route path="/project-proposal" element={<ProjectProposalForm />} />
            <Route path="/project-logbook" element={<LogbookForm />} />
            <Route path="/status-check" element={<StatusCheck />} />
            <Route path="/internship-status-check" element={<InternshipStatusCheck />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;