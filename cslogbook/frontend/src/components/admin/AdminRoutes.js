import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Spin, Layout } from "antd";
import { SystemProvider } from "../../contexts/adminContext/SystemContext";
import { UserManagementProvider } from "../../contexts/adminContext/UserManagementContext";
import { DocumentProvider } from "../../contexts/adminContext/DocumentContext";
import DocumentManagement from "./documents";
import CertificateManagement from "./documents/CertificateManagement";

// Lazy loading components
const Dashboard = lazy(() => import("./dashboard"));
const StudentList = lazy(() => import("./users/students"));
const TeacherList = lazy(() => import("./users/teachers"));
const AdminUpload = lazy(() => import("../AdminUpload"));
const ConstantsSettings = lazy(() => import("./settings/constants"));

// เพิ่ม imports สำหรับหน้าตั้งค่าใหม่
const Settings = lazy(() => import("./settings")); // หน้าหลักการตั้งค่า
const AcademicSettingsPage = lazy(() =>
  import("./settings/AcademicSettingsPage")
);
const StatusSettingsPage = lazy(() => import("./settings/StatusSettingsPage"));
const CurriculumSettingsPage = lazy(() =>
  import("./settings/CurriculumSettingsPage")
);
// เพิ่ม import สำหรับ Notification Settings
const NotificationSettingsPage = lazy(() =>
  import("./settings/NotificationSettingsPage")
);
const WorkflowStepManagementPage = lazy(() =>
  import("./settings/WorkflowStepsSettingsPage")
);
const SupportStaffDashboard = lazy(() => import('./reports/SupportStaffDashboard.js'));
const InternshipReport = lazy(() => import('./reports/InternshipReport.js'));
const ProjectReport = lazy(() => import('./reports/ProjectReport.js'));
const TopicExamResultPage = lazy(() => import('./topicExam/TopicExamResultPage'));

// Loading component
const LoadingComponent = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
    <Spin size="large" tip="กำลังโหลด..." />
  </div>
);

const AdminRoutes = () => {
  return (
    <SystemProvider>
      <UserManagementProvider>
        <Layout.Content
          style={{ padding: "20px", minHeight: "calc(100vh - 64px)" }}
        >
          <Suspense fallback={<LoadingComponent />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports/support" element={<SupportStaffDashboard />} />
              <Route path="/reports/internship" element={<InternshipReport />} />
              <Route path="/reports/project" element={<ProjectReport />} />
              <Route path="/topic-exam/results" element={<TopicExamResultPage />} />

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
        </Layout.Content>
      </UserManagementProvider>
    </SystemProvider>
  );
};

export default AdminRoutes;
