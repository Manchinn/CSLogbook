import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin, Layout } from 'antd';
import { SystemProvider } from '../../contexts/adminContext/SystemContext';
import { UserManagementProvider } from '../../contexts/adminContext/UserManagementContext';
import { DocumentProvider } from '../../contexts/adminContext/DocumentContext';

// Lazy loading components
const Dashboard = lazy(() => import('./dashboard'));
const InternshipDocs = lazy(() => import('./documents/InternshipDocs'));
const ProjectDocs = lazy(() => import('./documents/ProjectDocs'));
const StudentList = lazy(() => import('./users/students'));
const TeacherList = lazy(() => import('./users/teachers'));
const AdminUpload = lazy(() => import('../AdminUpload')); //
const ConstantsSettings = lazy(() => import('./settings/constants')); // ใช้ lazy loading

// นำเข้าคอมโพเนนต์ settings แบบ lazy loading
const ConstantsOverview = lazy(() => import('./settings/constants'));
const CurriculumSettings = lazy(() => import('./settings/constants/CurriculumSettings'));
const DocumentSettings = lazy(() => import('./settings/constants/DocumentSettings'));
const InternshipProjectSettings = lazy(() => import('./settings/constants/InternshipProjectSettings'));
const AcademicSettings = lazy(() => import('./settings/constants/AcademicSettings'));
const StatusSettings = lazy(() => import('./settings/constants/StatusSettings'));
const NotificationSettings = lazy(() => import('./settings/constants/NotificationSettings'));
const TimelineAdmin = lazy(() => import('./settings/constants/TimelineSettings'));
const TimelineStudent = lazy(() => import('./settings/constants/StudentTimeline'));

// ใช้คอมโพเนนต์เดิมก่อน

// Loading component
const LoadingComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
    <Spin size="large" tip="กำลังโหลด..." />
  </div>
);

const AdminRoutes = () => {
  return (
    <SystemProvider>
      <UserManagementProvider>
        <Layout.Content style={{ padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
          <Suspense fallback={<LoadingComponent />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* ใช้ DocumentProvider สำหรับจัดการเอกสาร */}
              <Route path="/documents">
                <Route 
                  path="internship" 
                  element={
                    <DocumentProvider type="internship">
                      <InternshipDocs />
                    </DocumentProvider>
                  } 
                />
                <Route 
                  path="project" 
                  element={
                    <DocumentProvider type="project">
                      <ProjectDocs />
                    </DocumentProvider>
                  } 
                />
              </Route>

              <Route path="/users">
                <Route path="students" element={<StudentList />} />
                <Route path="teachers" element={<TeacherList />} />
              </Route>
              <Route path="/upload" element={<AdminUpload />} />
              <Route path="/settings">
                <Route path="constants" element={<ConstantsOverview />} />
                <Route path="constants/curriculum" element={<CurriculumSettings />} />
                <Route path="constants/documents" element={<DocumentSettings />} />
                <Route path="constants/eligibility" element={<InternshipProjectSettings />} />
                <Route path="constants/academic" element={<AcademicSettings />} />
                <Route path="constants/status" element={<StatusSettings />} />
                <Route path="constants/notifications" element={<NotificationSettings />} />
                <Route path="constants/timeline-admin" element={<TimelineAdmin />} />
                <Route path="constants/timeline-student" element={<TimelineStudent />} />
              </Route>
            </Routes>
          </Suspense>
        </Layout.Content>
      </UserManagementProvider>
    </SystemProvider>
  );
};

export default AdminRoutes;