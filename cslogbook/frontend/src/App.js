import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import buddhistLocale from './utils/buddhistLocale';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InternshipProvider } from './contexts/InternshipContext';
import { StudentEligibilityProvider } from './contexts/StudentEligibilityContext';
import MainLayout from './components/common/Layout/MainLayout';
import { routes } from './routes';

// ตั้งค่า dayjs plugin
dayjs.extend(buddhistEra);
dayjs.locale('th');

const {
  Login,
  SSOCallback,
  Dashboard,
  StudentProfile,
  StudentDeadlineCalendar,
  InternshipCompanyDashboard,
  InternshipRegistrationFlow,
  InternshipEligibilityCheck,
  InternshipRequirements,
  InternshipTimeSheet,
  CompanyInfoForm,
  InternshipSummary,
  InternshipCertificateRequest,
  ProjectManagement,
  ProjectEligibilityCheck,
  ProjectRequirements,
  Phase1Dashboard,
  ProjectDraftDetail,
  TopicSubmitPage,
  TopicExamPage,
  ProposalRevisionPage,
  SystemTestRequestPage,
  ExamSubmitPage,
  ExamDayPage,
  MeetingLogbookPage,
  Phase2Dashboard,
  ThesisDefenseRequestPage,
  ProjectPairs,
  SupervisorEvaluation,
  TimesheetApproval,
  TopicExamOverview,
  AdvisorKP02Queue,
  StaffKP02Queue,
  AdvisorThesisQueue,
  StaffThesisQueue,
  AdvisorSystemTestQueue,
  StaffSystemTestQueue,
  AdminUpload,
  AdminRoutes,
  ApproveDocuments,
  MeetingApprovals,
} = routes;

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
    <ConfigProvider locale={buddhistLocale}>
      <BrowserRouter>
        <AuthProvider>
          <StudentEligibilityProvider>
            <InternshipProvider>
              <Suspense
                fallback={
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                    <Spin size="large" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/sso/callback" element={<SSOCallback />} />
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
                    <InternshipEligibilityCheck />
                  </ProtectedRoute>
                } />
                <Route path="/internship-requirements" element={
                  <ProtectedRoute roles={['student']}>
                    <InternshipRequirements />
                  </ProtectedRoute>
                } />
                
                <Route path="/internship-logbook/timesheet" element={
                  <ProtectedRoute roles={['student']}>
                    <InternshipTimeSheet />
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
                <Route path="/project/phase2/system-test" element={
                  <ProtectedRoute roles={['student']}>
                    <SystemTestRequestPage />
                  </ProtectedRoute>
                } />
                <Route path="/project/phase2/thesis-defense" element={
                  <ProtectedRoute roles={['student']}>
                    <ThesisDefenseRequestPage />
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

                {/* เพิ่มเส้นทางสำหรับจัดการโครงงานพิเศษของนักศึกษา */}
                <Route path="/student/projects" element={
                  <ProtectedRoute roles={['student']}>
                    <ProjectManagement />
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
                    <ProjectPairs />
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
                <Route path="/teacher/thesis/advisor-queue" element={
                  <ProtectedRoute roles={['teacher']} teacherTypes={['academic']}>
                    <AdvisorThesisQueue />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/system-test/advisor-queue" element={
                  <ProtectedRoute roles={['teacher']} teacherTypes={['academic']}>
                    <AdvisorSystemTestQueue />
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
                <Route path="/admin/thesis/staff-queue" element={
                  <ProtectedRoute
                    roles={['admin', 'teacher']}
                    condition={(user) =>
                      user.role === 'admin' ||
                      user.teacherType === 'support' ||
                      Boolean(user.canExportThesis ?? user.canExportProject1)
                    }
                  >
                    <StaffThesisQueue />
                  </ProtectedRoute>
                } />
                <Route path="/admin/thesis/kp02-queue" element={<Navigate to="/admin/thesis/staff-queue" replace />} />
                    <Route path="/admin/system-test/staff-queue" element={
                      <ProtectedRoute
                        roles={['admin', 'teacher']}
                        condition={(user) =>
                          user.role === 'admin' ||
                          user.teacherType === 'support' ||
                          Boolean(user.canExportProject1)
                        }
                      >
                        <StaffSystemTestQueue />
                      </ProtectedRoute>
                    } />
                  </Route>

                  {/* Default Route */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
          </InternshipProvider>
        </StudentEligibilityProvider>
      </AuthProvider>
    </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;