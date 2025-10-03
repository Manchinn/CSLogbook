import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InternshipProvider } from './contexts/InternshipContext';
import { StudentEligibilityProvider } from './contexts/StudentEligibilityContext';
import MainLayout from './components/layout/MainLayout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/dashboards/Dashboard';
import StudentProfile from './components/StudentProfile/index';
import StudentDeadlineCalendar from './components/student/StudentDeadlineCalendar';

// Import Internship Components
import CS05Form from './components/internship/registration/CS05Form';
import TimeSheet from './components/internship/logbook/TimeSheet/index';
import InternshipSummary from './components/internship/summary/Summary';
import CompanyInfoForm from './components/internship/logbook/CompanyInfoForm';
import { EligibilityCheck, InternshipRequirements } from './components/internship/logbook/eligibility';

import { InternshipRegistrationFlow } from './components/internship/register';
// 🆕 เพิ่ม import สำหรับ InternshipCertificateRequest
import InternshipCertificateRequest from './components/internship/certificate/InternshipCertificateRequest';
import InternshipCompanyDashboard from './components/internship/companies/InternshipCompanyDashboard';


// Import Project Components
import { ProjectEligibilityCheck, ProjectRequirements } from './components/project/eligibility';
// Phase1 Dashboard + steps (ยุบ portal เดิมให้เหลือ phase1 dashboard ชั่วคราว)
import Phase1Dashboard from './components/project/phase1/Phase1Dashboard';
import ProjectDraftDetail from './components/project/phase1/ProjectDraftDetail';
import TopicSubmitPage from './components/project/phase1/steps/TopicSubmitPage';
import TopicExamPage from './components/project/phase1/steps/TopicExamPage';
import ProposalRevisionPage from './components/project/phase1/steps/ProposalRevisionPage';
import ExamSubmitPage from './components/project/phase1/steps/ExamSubmitPage';
import ExamDayPage from './components/project/phase1/steps/ExamDayPage';
import MeetingLogbookPage from './components/project/phase1/steps/MeetingLogbookPage';
import { Phase2Dashboard } from './components/project/phase2';

// Import Admin Components
import AdminUpload from './components/AdminUpload';
// Import Admin2 Components - New Structure
import AdminRoutes from './components/admin/AdminRoutes';
import ProjectPairsPage from './components/admin/users/projectPairs';
import SupervisorEvaluation from './components/internship/evaluation/SupervisorEvaluation'; // Added new import
import TimesheetApproval from './components/internship/approval/TimesheetApproval';
import ApproveDocuments from './components/teacher/ApproveDocuments';
import TopicExamOverview from './components/teacher/topicExam/TopicExamOverview';
import MeetingApprovals from './components/teacher/MeetingApprovals';
import AdvisorKP02Queue from './components/teacher/project1/AdvisorKP02Queue';
import StaffKP02Queue from './components/teacher/project1/StaffKP02Queue';

const ProtectedRoute = ({ children, roles, teacherTypes, condition }) => {
  const { isAuthenticated, userData } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // ส่ง state.from เพื่อให้ LoginForm รู้ว่าต้องกลับไปหน้าเดิม (ถ้ามี)
    return <Navigate to="/login" state={{ from: location }} replace />;
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

  if (typeof condition === 'function' && !condition(userData)) {
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
              {/* Add the new public route for supervisor evaluation */}
              <Route path="/evaluate/supervisor/:token" element={<SupervisorEvaluation />} /> 
              <Route path="/approval/timesheet/:token" element={<TimesheetApproval />} />

              <Route element={<MainLayout />}>
                {/* Dashboard Route */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Student Routes */}
                <Route path="/student-profile/:id" element={<StudentProfile />} />
                <Route path="/student-deadlines/calendar" element={
                  <ProtectedRoute roles={['student']}>
                    <StudentDeadlineCalendar />
                  </ProtectedRoute>
                } />
                

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
                
                {/* Project Routes */}
                <Route path="/project" element={
                  <ProtectedRoute roles={['student']}>
                    <Navigate to="/project/phase1" replace />
                  </ProtectedRoute>
                } />
                {/* ปรับโครงสร้าง: /project/phase1 เป็น Phase1Dashboard (single menu) */}
                <Route path="/project/phase1" element={
                  <ProtectedRoute roles={['student']}>
                    <Phase1Dashboard />
                  </ProtectedRoute>
                }>
                  <Route path="topic-submit" element={<TopicSubmitPage />} />
                  <Route path="topic-exam" element={<TopicExamPage />} />
                  <Route path="meeting-logbook" element={<MeetingLogbookPage />} />
                  <Route path="proposal-revision" element={<ProposalRevisionPage />} />
                  <Route path="exam-submit" element={<ExamSubmitPage />} />
                  <Route path="exam-day" element={<ExamDayPage />} />
                </Route>
                <Route path="/project/phase1/draft/:id" element={
                  <ProtectedRoute roles={['student']}>
                    <ProjectDraftDetail />
                  </ProtectedRoute>
                } />
                <Route path="/project/phase2" element={
                  <ProtectedRoute roles={['student']}>
                    <Phase2Dashboard />
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
                <Route path="/project-pairs" element={
                  <ProtectedRoute roles={['admin', 'teacher']} teacherTypes={['support']}>
                    <ProjectPairsPage />
                  </ProtectedRoute>
                } />

                {/* Teacher Academic Routes */}
                <Route path="/teacher/deadlines/calendar" element={
                  <ProtectedRoute roles={['teacher']} teacherTypes={['academic']}>
                    <StudentDeadlineCalendar audience="teacher" />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/meeting-approvals" element={
                  <ProtectedRoute roles={['teacher']} teacherTypes={['academic']}>
                    <MeetingApprovals />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/project1/advisor-queue" element={
                  <ProtectedRoute roles={['teacher']} teacherTypes={['academic']}>
                    <AdvisorKP02Queue />
                  </ProtectedRoute>
                } />
                <Route path="/approve-documents" element={
                  <ProtectedRoute roles={['teacher']} teacherTypes={['academic']}>
                    <ApproveDocuments />
                  </ProtectedRoute>
                } />

                {/* Topic Exam Overview (Teacher/Admin) */}
                <Route path="/teacher/topic-exam/overview" element={
                  <ProtectedRoute
                    roles={['teacher','admin']}
                    condition={(user) => user.role === 'admin' || Boolean(user.canAccessTopicExam)}
                  >
                    <TopicExamOverview />
                  </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                  <ProtectedRoute roles={['admin', 'teacher']} teacherTypes={['support']}>
                    <AdminRoutes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/project1/kp02-queue" element={
                  <ProtectedRoute
                    roles={['admin', 'teacher']}
                    condition={(user) =>
                      user.role === 'admin' ||
                      user.teacherType === 'support' ||
                      Boolean(user.canExportProject1)
                    }
                  >
                    <StaffKP02Queue />
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