import { lazy } from 'react';

export const routes = {
  Login: lazy(() => import('features/auth/components/LoginForm')),
  Dashboard: lazy(() => import('features/admin-dashboard/pages/AdminDashboard')),
  StudentProfile: lazy(() => import('features/user-management/components/StudentProfile')),
  StudentDeadlineCalendar: lazy(() => import('components/student/StudentDeadlineCalendar')),
  InternshipCompanyDashboard: lazy(
    () => import('features/internship/components/shared/CompanyDashboard/InternshipCompanyDashboard')
  ),
  InternshipRegistrationFlow: lazy(
    () => import('features/internship/components/student-view/RegistrationFlow/InternshipRegistrationFlow')
  ),
  InternshipEligibilityCheck: lazy(
    () => import('features/internship/components/student-view/EligibilityCheck/EligibilityCheck')
  ),
  InternshipRequirements: lazy(
    () => import('features/internship/components/student-view/EligibilityCheck/InternshipRequirements')
  ),
  InternshipTimeSheet: lazy(() => import('features/internship/components/student-view/TimeSheet')),
  CompanyInfoForm: lazy(() => import('features/internship/components/shared/CompanyInfoForm')),
  InternshipSummary: lazy(() => import('features/internship/components/student-view/Summary/Summary')),
  InternshipCertificateRequest: lazy(
    () => import('features/internship/components/student-view/CertificateRequest/InternshipCertificateRequest')
  ),
  ProjectManagement: lazy(() => import('features/project/components/student-view/ProjectManagement')),
  ProjectEligibilityCheck: lazy(
    () => import('features/project/components/shared/EligibilityCheck/ProjectEligibilityCheck')
  ),
  ProjectRequirements: lazy(
    () => import('features/project/components/shared/EligibilityCheck/ProjectRequirements')
  ),
  Phase1Dashboard: lazy(() => import('features/project/components/student-view/Phase1Dashboard/Phase1Dashboard')),
  ProjectDraftDetail: lazy(() => import('features/project/components/student-view/Phase1Dashboard/ProjectDraftDetail')),
  TopicSubmitPage: lazy(() => import('features/project/components/student-view/Phase1Dashboard/steps/TopicSubmitPage')),
  TopicExamPage: lazy(() => import('features/project/components/student-view/Phase1Dashboard/steps/TopicExamPage')),
  ProposalRevisionPage: lazy(
    () => import('features/project/components/student-view/Phase1Dashboard/steps/ProposalRevisionPage')
  ),
  SystemTestRequestPage: lazy(
    () => import('features/project/components/student-view/Phase1Dashboard/steps/SystemTestRequestPage')
  ),
  ExamSubmitPage: lazy(() => import('features/project/components/student-view/Phase1Dashboard/steps/ExamSubmitPage')),
  ExamDayPage: lazy(() => import('features/project/components/student-view/Phase1Dashboard/steps/ExamDayPage')),
  MeetingLogbookPage: lazy(() => import('features/project/components/student-view/Phase1Dashboard/steps/MeetingLogbookPage')),
  Phase2Dashboard: lazy(() => import('features/project/components/student-view/Phase2Dashboard/Phase2Dashboard')),
  ThesisDefenseRequestPage: lazy(
    () => import('features/project/components/student-view/Phase2Dashboard/ThesisDefenseRequestPage')
  ),
  ProjectPairs: lazy(() => import('features/user-management/components/ProjectPairs')),
  SupervisorEvaluation: lazy(
    () => import('features/internship/components/teacher-view/SupervisorEvaluation/SupervisorEvaluation')
  ),
  TimesheetApproval: lazy(
    () => import('features/internship/components/teacher-view/TimesheetApproval/TimesheetApproval')
  ),
  TopicExamOverview: lazy(
    () => import('features/project/components/teacher-view/TopicExamOverview/TopicExamOverview')
  ),
  AdvisorKP02Queue: lazy(
    () => import('features/project/components/teacher-view/AdvisorQueue/AdvisorKP02Queue')
  ),
  StaffKP02Queue: lazy(
    () => import('features/project/components/teacher-view/AdvisorQueue/StaffKP02Queue')
  ),
  AdvisorThesisQueue: lazy(
    () => import('features/project/components/teacher-view/ThesisQueue/AdvisorThesisQueue')
  ),
  StaffThesisQueue: lazy(
    () => import('features/project/components/teacher-view/ThesisQueue/StaffThesisQueue')
  ),
  AdvisorSystemTestQueue: lazy(
    () => import('features/project/components/teacher-view/SystemTestQueue/AdvisorQueue')
  ),
  StaffSystemTestQueue: lazy(
    () => import('features/project/components/teacher-view/SystemTestQueue/StaffQueue')
  ),
  AdminUpload: lazy(() => import('components/AdminUpload')),
  AdminRoutes: lazy(() => import('components/admin/AdminRoutes')),
  ApproveDocuments: lazy(() => import('components/teacher/ApproveDocuments')),
  MeetingApprovals: lazy(() => import('components/teacher/MeetingApprovals')),
};

