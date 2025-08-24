import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InternshipProvider } from './contexts/InternshipContext';
import { StudentEligibilityProvider } from './contexts/StudentEligibilityContext';
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
import { EligibilityCheck, InternshipRequirements } from './components/internship/logbook/eligibility';

import { InternshipRegistrationFlow } from './components/internship/register';
// 🆕 เพิ่ม import สำหรับ InternshipCertificateRequest
import InternshipCertificateRequest from './components/internship/certificate/InternshipCertificateRequest';
import InternshipCompanyDashboard from './components/internship/companies/InternshipCompanyDashboard';


// Import Project Components
import ProjectProposalForm from './components/project/ProjectProposalForm';
import LogbookForm from './components/project/LogbookForm';
import { ProjectEligibilityCheck, ProjectRequirements } from './components/project/eligibility';

// Import Admin Components
import AdminUpload from './components/AdminUpload';
// Import Admin2 Components - New Structure
import AdminRoutes from './components/admin/AdminRoutes';
import SupervisorEvaluation from './components/internship/evaluation/SupervisorEvaluation'; // Added new import
import TimesheetApproval from './components/internship/approval/TimesheetApproval';
import ApproveDocuments from './components/teacher/ApproveDocuments';

const ProtectedRoute = ({ children, roles, teacherTypes }) => {
  const { isAuthenticated, userData } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // ตรวจสอบ roles
  if (roles && !roles.includes(userData.role)) {
    return <Navigate to="/dashboard" />;
  }

  // ตรวจสอบ teacherTypes (สำหรับ teacher role)
  if (teacherTypes && userData.role === 'teacher') {
    if (!teacherTypes.includes(userData.teacherType)) {
      return <Navigate to="/dashboard" />;
    }
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
              {/* Add the new public route for supervisor evaluation */}
              <Route path="/evaluate/supervisor/:token" element={<SupervisorEvaluation />} /> 
              <Route path="/approval/timesheet/:token" element={<TimesheetApproval />} />

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

                {/* Dashboard บริษัทที่รับนักศึกษาฝึกงาน (ใหม่) */}
                <Route path="/internship-companies" element={
                  <ProtectedRoute roles={['student','teacher','admin']}>
                    <InternshipCompanyDashboard />
                  </ProtectedRoute>
                } />

                                {/* Internship Routes */}
                {/* เปลี่ยนจาก CS05Form เดิม เป็น InternshipRegistrationFlow ใหม่ */}
                {/* <Route path="/internship-registration/cs05new" element={
                  <ProtectedRoute roles={['student']}>
                    <InternshipRegistrationFlow />
                  </ProtectedRoute>
                } /> */}
                
                {/* หรือถ้าต้องการใช้ทั้งสองแบบ สามารถเพิ่ม route ใหม่ */}
                <Route path="/internship-registration/flow" element={
                  <ProtectedRoute roles={['student']}>
                    <InternshipRegistrationFlow />
                  </ProtectedRoute>
                } />
                
                
                {/* เพิ่มเส้นทางสำหรับตรวจสอบคุณสมบัติและข้อกำหนดฝึกงาน */}
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

                {/* 🆕 เพิ่ม route สำหรับขอหนังสือรับรองการฝึกงาน */}
                <Route path="/internship-certificate" element={
                  <ProtectedRoute roles={['student']}>
                    <InternshipCertificateRequest />
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
                
                {/* เพิ่มเส้นทางสำหรับตรวจสอบคุณสมบัติและข้อกำหนดโครงงานพิเศษ */}
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

                {/* Admin Routes - สำหรับ admin และ teacher support */}
                <Route path="/students" element={
                  <ProtectedRoute roles={['admin', 'teacher']} teacherTypes={['support']}>
                  </ProtectedRoute>
                } />
                <Route path="/teachers" element={
                  <ProtectedRoute roles={['admin', 'teacher']} teacherTypes={['support']}>
                  </ProtectedRoute>
                } />
                <Route path="/admin/upload" element={
                  <ProtectedRoute roles={['admin', 'teacher']} teacherTypes={['support']}>
                    <AdminUpload />
                  </ProtectedRoute>
                } />

                {/* Teacher Academic Routes */}
                <Route path="/approve-documents" element={
                  <ProtectedRoute roles={['teacher']} teacherTypes={['academic']}>
                    <ApproveDocuments />
                  </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                  <ProtectedRoute roles={['admin', 'teacher']} teacherTypes={['support']}>
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