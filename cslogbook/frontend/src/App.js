import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AdminUpload from './components/AdminUpload';
import StudentProfile from './components/StudentProfile';
import InternshipTerms from "./components/internship/InternshipTerms";
import CompanyInfoForm from './components/internship/CompanyInfoForm';
import InternshipDocuments from './components/internship/InternshipDocument';
import InternshipReview from "./components/internship/InternshipReview";
import DocumentDetails from "./components/admin/DocumentDetails";
import DocumentManagement from "./components/admin/DocumentManagement";
import ProjectProposalForm from "./components/project/ProjectProposalForm";


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
            <Route path="/admin/upload" element={<AdminUpload />} />
            <Route path="/student-profile/:id" element={<StudentProfile />} />
            <Route path="/internship-terms" element={<InternshipTerms />} />
            <Route path="/internship-company" element={<CompanyInfoForm />} />
            <Route path="/internship-documents" element={<InternshipDocuments />} />
            <Route path="/internship-review" element={<InternshipReview />} />
            <Route path="/document-management/internship" element={<DocumentManagement type="internship" />} />
            <Route path="/document-management/project" element={<DocumentManagement type="project" />} />
            <Route path="/document-details/:id" element={<DocumentDetails />} />
            <Route path="/project-proposal" element={<ProjectProposalForm />} />

          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;