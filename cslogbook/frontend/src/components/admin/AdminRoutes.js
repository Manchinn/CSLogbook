import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Spin } from "antd";
import { SystemProvider } from "../../contexts/adminContext/SystemContext";
import { UserManagementProvider } from "../../contexts/adminContext/UserManagementContext";
import { DocumentProvider } from "../../contexts/adminContext/DocumentContext";
import DocumentManagement from "./documents";
import CertificateManagement from "features/internship/components/admin-view/CertificateManagement";

// Lazy loading components
const Dashboard = lazy(() => import("features/admin-dashboard/components/dashboard"));
const StudentList = lazy(() =>
  import("features/user-management/components/StudentList")
);
const TeacherList = lazy(() =>
  import("features/user-management/components/TeacherList")
);
const AdminUpload = lazy(() => import("../AdminUpload"));
const ConstantsSettings = lazy(() =>
  import("features/settings/components/settings/constants")
);

// เพิ่ม imports สำหรับหน้าตั้งค่าใหม่
const Settings = lazy(() => import("features/settings/components/settings")); // หน้าหลักการตั้งค่า
const AcademicSettingsPage = lazy(() =>
  import("features/settings/components/settings/AcademicSettingsPage")
);
const StatusSettingsPage = lazy(() =>
  import("features/settings/components/settings/StatusSettingsPage")
);
const CurriculumSettingsPage = lazy(() =>
  import("features/settings/components/settings/CurriculumSettingsPage")
);
// เพิ่ม import สำหรับ Notification Settings
const NotificationSettingsPage = lazy(() =>
  import("features/settings/components/settings/NotificationSettingsPage")
);
const WorkflowStepManagementPage = lazy(() =>
  import("features/settings/components/settings/WorkflowStepsSettingsPage")
);
const InternshipReport = lazy(() => import('features/reports/components/reports/InternshipReport'));
const ProjectReport = lazy(() => import('features/reports/components/reports/ProjectReport'));
const TopicExamResultPage = lazy(() => import('./topicExam/TopicExamResultPage'));
const Project1ExamResultPage = lazy(() => import('features/project/components/admin-view/Project1ExamResultPage'));
const ThesisExamResultPage = lazy(() => import('features/project/components/admin-view/ThesisExamResultPage'));

// New Reports - 3 หน้ารายงานใหม่
const WorkflowProgressReport = lazy(() => import('features/reports/components/reports/WorkflowProgressReport'));
// const DeadlineComplianceReport = lazy(() => import('features/reports/components/reports/DeadlineComplianceReport'));
const DeadlineComplianceReport = lazy(() => import('features/reports/components/reports/DeadlineComplianceReportRecharts')); // ใช้ Recharts แทน
const AdvisorWorkloadDetailReport = lazy(() => import('features/reports/components/reports/AdvisorWorkloadDetailReport'));
// ProjectManagement ถูกลบแล้ว - ใช้ ProjectPairsPage แทน

// Loading component
const LoadingComponent = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
    <Spin size="large" spinning={true} tip="กำลังโหลด...">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
  </div>
);

const AdminRoutes = () => {
  return (
    <SystemProvider>
      <UserManagementProvider>
        <Suspense fallback={<LoadingComponent />}>
          <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports/internship" element={<InternshipReport />} />
              <Route path="/reports/project" element={<ProjectReport />} />
              
              {/* New Reports - 3 หน้ารายงานใหม่ */}
              <Route path="/reports/workflow-progress" element={<WorkflowProgressReport />} />
              <Route path="/reports/deadline-compliance" element={<DeadlineComplianceReport />} />
              <Route path="/reports/advisor-workload" element={<AdvisorWorkloadDetailReport />} />
              
              <Route path="/topic-exam/results" element={<TopicExamResultPage />} />
              <Route path="/project-exam/results" element={<Project1ExamResultPage />} />
              <Route path="/thesis/exam-results" element={<ThesisExamResultPage />} />

              {/* ใช้ DocumentManagement สำหรับจัดการเอกสาร */}
              <Route
                path="documents/internship"
                element={
                  <DocumentProvider type="internship">
                    <DocumentManagement type="internship" />
                  </DocumentProvider>
                }
              />

              <Route
                path="documents/certificates"
                element={
                  <DocumentProvider type="certificate">
                    <CertificateManagement />
                  </DocumentProvider>
                }
              />
              <Route
                path="documents/project"
                element={
                  <DocumentProvider type="project">
                    <DocumentManagement type="project" />
                  </DocumentProvider>
                }
              />

              <Route path="/users">
                <Route path="students" element={<StudentList />} />
                <Route path="teachers" element={<TeacherList />} />
              </Route>
              
              {/* ใช้ ProjectPairsPage สำหรับการจัดการโครงงานพิเศษ */}
              <Route path="/projects" element={<Navigate to="/admin/users/project-pairs" replace />} />
              
              <Route path="/upload" element={<AdminUpload />} />
              <Route path="/settings">
                <Route index element={<Settings />} />
                <Route path="constants" element={<ConstantsSettings />} />
                <Route path="academic" element={<AcademicSettingsPage />} />
                <Route path="status" element={<StatusSettingsPage />} />
                <Route path="curriculum" element={<CurriculumSettingsPage />} />
                <Route
                  path="notification-settings"
                  element={<NotificationSettingsPage />}
                />
                <Route
                  path="workflow-steps"
                  element={<WorkflowStepManagementPage />}
                />
              </Route>
            </Routes>
          </Suspense>
      </UserManagementProvider>
    </SystemProvider>
  );
};

export default AdminRoutes;
