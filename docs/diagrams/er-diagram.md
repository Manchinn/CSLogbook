# CSLogbook — ER Diagrams (Mermaid)

> เปิดใน Mermaid Live Editor: https://mermaid.live หรือ VSCode extension "Markdown Preview Mermaid Support"

---

## 1. ภาพรวมทั้งระบบ (Overview — Relationships Only)

```mermaid
erDiagram
    User ||--o| Student : "has profile"
    User ||--o| Teacher : "has profile"
    User ||--o| Admin : "has profile"
    Student }o--|| Curriculum : "belongs to"
    Student }o--o| Teacher : "has advisor"
    Academic }o--|| Curriculum : "active curriculum"

    User ||--o{ Document : "owns"
    Document ||--o| ProjectDocument : "is project"
    Document ||--o| InternshipDocument : "is internship"
    Document ||--o{ DocumentLog : "has logs"

    ProjectDocument ||--o{ ProjectMember : "has members"
    ProjectMember }o--|| Student : "is student"
    ProjectDocument }o--o| Teacher : "advisor"
    ProjectDocument }o--o| Teacher : "co-advisor"
    ProjectDocument ||--o{ ProjectTrack : "has tracks"
    ProjectDocument ||--o{ ProjectDefenseRequest : "has defense"
    ProjectDocument ||--o{ ProjectExamResult : "has results"
    ProjectDocument ||--o| ProjectWorkflowState : "has state"
    ProjectDocument ||--o{ ProjectTestRequest : "has tests"
    ProjectDocument ||--o{ ProjectMilestone : "has milestones"
    ProjectDocument ||--o{ ProjectArtifact : "has artifacts"
    ProjectDocument ||--o{ ProjectEvent : "has events"
    ProjectDocument ||--o{ Meeting : "has meetings"

    ProjectDefenseRequest ||--o{ ProjectDefenseRequestAdvisorApproval : "has approvals"

    InternshipDocument ||--o{ InternshipLogbook : "has logbooks"
    InternshipLogbook ||--o{ InternshipLogbookAttachment : "has files"
    InternshipLogbook ||--o{ InternshipLogbookRevision : "has revisions"
    InternshipDocument ||--o{ InternshipEvaluation : "has evaluations"
    InternshipDocument ||--o{ InternshipCertificateRequest : "has certificates"

    Meeting ||--o{ MeetingParticipant : "has participants"
    Meeting ||--o{ MeetingLog : "has logs"
    MeetingLog ||--o{ MeetingAttachment : "has files"
    MeetingLog ||--o{ MeetingActionItem : "has actions"

    Student ||--o{ TimelineStep : "has timeline"
    Student ||--o{ StudentProgress : "has progress"
    Student ||--o{ StudentWorkflowActivity : "has workflow"
    Student ||--o{ StudentAcademicHistory : "has history"

    ImportantDeadline ||--o{ DeadlineWorkflowMapping : "maps to"
    ProjectWorkflowState }o--o| WorkflowStepDefinition : "current step"

    User ||--o{ ApprovalToken : "receives"
    User ||--o{ PasswordResetToken : "requests"
    User ||--o{ SystemLog : "generates"
    User ||--o{ UploadHistory : "uploads"
```

---

## 2. User & Authentication Module

```mermaid
erDiagram
    User {
        int user_id PK
        string username UK
        string password "nullable (SSO)"
        string email UK
        enum role "student|teacher|admin"
        string first_name
        string last_name
        boolean active_status "default: true"
        datetime last_login
        string sso_provider
        string sso_id
        datetime created_at
        datetime updated_at
    }

    Student {
        int student_id PK
        int user_id FK
        int curriculum_id FK
        string student_code UK
        string classroom
        string phone_number
        decimal total_credits
        decimal major_credits
        decimal gpa
        enum study_type "regular|special"
        boolean is_eligible_internship
        boolean is_eligible_project
        int advisor_id FK
        string internship_status
        string project_status
        boolean is_enrolled_internship
        boolean is_enrolled_project
    }

    Teacher {
        int teacher_id PK
        string teacher_code UK
        int user_id FK
        string contact_extension
        enum teacher_type "academic|support"
        string position
        boolean can_access_topic_exam
        boolean can_export_project1
    }

    Admin {
        int admin_id PK
        string admin_code UK
        int user_id FK
        text responsibilities
        string contact_extension
    }

    PasswordResetToken {
        int id PK
        int user_id FK
        enum purpose "PASSWORD_CHANGE"
        string otp_hash
        string temp_new_password_hash
        int attempt_count
        datetime expires_at
        datetime used_at
    }

    User ||--o| Student : "has"
    User ||--o| Teacher : "has"
    User ||--o| Admin : "has"
    User ||--o{ PasswordResetToken : "requests"
    Student }o--o| Teacher : "advisor"
```

---

## 3. Academic & Curriculum Module

```mermaid
erDiagram
    Academic {
        int id PK
        int academic_year
        int current_semester
        int active_curriculum_id FK
        boolean is_current
        string status "draft|active"
        json semester1_range
        json semester2_range
        json semester3_range
        json internship_registration
        json project_registration
        json internship_semesters
        json project_semesters
    }

    Curriculum {
        int curriculum_id PK
        string code UK
        string name
        string short_name
        int start_year
        int end_year
        boolean active
        int total_credits
        int major_credits
        int internship_base_credits
        int project_base_credits
        int project_major_base_credits
        int internship_major_base_credits
        boolean require_internship_before_project
    }

    Academic }o--|| Curriculum : "active curriculum"
    Student }o--|| Curriculum : "enrolled in"
    Student ||--o{ StudentAcademicHistory : "has"

    StudentAcademicHistory {
        int id PK
        int student_id FK
        int academic_year
        int semester
        string status
        string note
    }
```

---

## 4. Document Management Module

```mermaid
erDiagram
    Document {
        int document_id PK
        int user_id FK
        int reviewer_id FK
        enum document_type "INTERNSHIP|PROJECT"
        string document_name
        string file_path
        enum status "draft|pending|approved|rejected|supervisor_evaluated|acceptance_approved|referral_ready|referral_downloaded|completed|cancelled"
        datetime review_date
        text review_comment
        enum category "proposal|progress|final|acceptance"
        date due_date
        int file_size
        string mime_type
        datetime submitted_at
        boolean is_late
        int late_minutes
        string late_reason
        boolean submitted_late
        int submission_delay_minutes
        int important_deadline_id FK
    }

    DocumentLog {
        int log_id PK
        int document_id FK
        int user_id FK
        enum action_type "create|update|delete|approve|reject"
        string previous_status
        string new_status
        text comment
        datetime created_at
    }

    Document ||--o{ DocumentLog : "has logs"
    Document ||--o| ProjectDocument : "extends to"
    Document ||--o| InternshipDocument : "extends to"
    User ||--o{ Document : "owns"
    User ||--o{ Document : "reviews"
    ImportantDeadline ||--o{ Document : "deadline for"
```

---

## 5. Project Management Module

```mermaid
erDiagram
    ProjectDocument {
        int project_id PK
        int document_id FK
        string project_name_th
        string project_name_en
        enum project_type "govern|private|research"
        string track
        int advisor_id FK
        int co_advisor_id FK
        enum status "draft|advisor_assigned|in_progress|completed|archived|cancelled"
        int academic_year
        int semester
        text objective
        text background
        text scope
        text expected_outcome
        text methodology
        text tools
        string project_code UK "PRJ-YYYY-NNNN"
        enum exam_result "passed|failed"
        boolean submitted_late
        int submission_delay_minutes
        int important_deadline_id FK
    }

    ProjectMember {
        int project_id PK_FK
        int student_id PK_FK
        enum role "leader|member"
        datetime joined_at
    }

    ProjectTrack {
        int project_track_id PK
        int project_id FK
        enum track_code "NETSEC|WEBMOBILE|SMART|AI|GAMEMEDIA"
    }

    ProjectMilestone {
        int milestone_id PK
        int project_id FK
        string title
        date due_date
        int progress "0-100"
        enum status "pending|submitted|accepted|rejected"
        text feedback
        datetime submitted_at
    }

    ProjectArtifact {
        int artifact_id PK
        int project_id FK
        string type
        string file_path
        string original_name
        string mime_type
        int size
        int version
        int uploaded_by_student_id FK
        string checksum
    }

    ProjectEvent {
        int event_id PK
        int project_id FK
        string event_type
        string actor_role
        int actor_user_id
        json meta_json
        datetime created_at
    }

    ProjectDocument ||--o{ ProjectMember : "has members"
    ProjectDocument ||--o{ ProjectTrack : "has tracks"
    ProjectDocument ||--o{ ProjectMilestone : "has milestones"
    ProjectDocument ||--o{ ProjectArtifact : "has artifacts"
    ProjectDocument ||--o{ ProjectEvent : "has events"
    ProjectMember }o--|| Student : "is student"
    ProjectDocument }o--|| Teacher : "advisor"
    ProjectDocument }o--o| Teacher : "co-advisor"
    ProjectDocument }o--|| Document : "base document"
```

---

## 6. Project Exam & Defense Module

```mermaid
erDiagram
    ProjectDefenseRequest {
        int request_id PK
        int project_id FK
        enum defense_type "PROJECT1|THESIS"
        enum status "draft|submitted|advisor_in_review|advisor_approved|staff_verified|scheduled|completed|cancelled"
        json form_payload
        int submitted_by_student_id FK
        datetime submitted_at
        datetime advisor_approved_at
        datetime defense_scheduled_at
        string defense_location
        text defense_note
        int scheduled_by_user_id FK
        int staff_verified_by_user_id FK
        boolean submitted_late
        int submission_delay_minutes
        int important_deadline_id FK
    }

    ProjectDefenseRequestAdvisorApproval {
        int approval_id PK
        int request_id FK
        int teacher_id FK
        string teacher_role
        enum status "pending|approved|rejected"
        text note
        datetime approved_at
    }

    ProjectExamResult {
        int exam_result_id PK
        int project_id FK
        enum exam_type "PROJECT1|THESIS"
        enum result "PASS|FAIL"
        decimal score
        text notes
        boolean require_scope_revision
        int recorded_by_user_id FK
        datetime recorded_at
        datetime student_acknowledged_at
    }

    ProjectTestRequest {
        int request_id PK
        int project_id FK
        int submitted_by_student_id FK
        string status
        string request_file_path
        text student_note
        datetime submitted_at
        date test_start_date
        date test_due_date
        int advisor_teacher_id FK
        text advisor_decision_note
        int co_advisor_teacher_id FK
        string evidence_file_path
        boolean submitted_late
        int important_deadline_id FK
    }

    ProjectDocument ||--o{ ProjectDefenseRequest : "requests defense"
    ProjectDocument ||--o{ ProjectExamResult : "has results"
    ProjectDocument ||--o{ ProjectTestRequest : "requests test"
    ProjectDefenseRequest ||--o{ ProjectDefenseRequestAdvisorApproval : "needs approvals"
    ProjectDefenseRequestAdvisorApproval }o--|| Teacher : "by teacher"
    ProjectExamResult }o--|| User : "recorded by"
```

---

## 7. Project Workflow & State Module

```mermaid
erDiagram
    ProjectWorkflowState {
        int id PK
        int project_id FK_UK
        enum current_phase "DRAFT|PENDING_ADVISOR|ADVISOR_ASSIGNED|TOPIC_SUBMISSION|TOPIC_EXAM_PENDING|TOPIC_EXAM_SCHEDULED|TOPIC_FAILED|IN_PROGRESS|THESIS_SUBMISSION|THESIS_EXAM_PENDING|THESIS_EXAM_SCHEDULED|THESIS_FAILED|COMPLETED|ARCHIVED|CANCELLED"
        string current_step
        int workflow_step_id FK
        string project_status
        string topic_exam_result
        date topic_exam_date
        string thesis_exam_result
        date thesis_exam_date
        int topic_defense_request_id FK
        int thesis_defense_request_id FK
        int system_test_request_id FK
        int final_document_id FK
        int meeting_count
        int approved_meeting_count
        boolean is_blocked
        text block_reason
        boolean is_overdue
        datetime last_activity_at
        string last_activity_type
        int last_updated_by FK
    }

    WorkflowStepDefinition {
        int step_id PK
        enum workflow_type "internship|project1|project2"
        string step_key UK
        int step_order
        string title
        text description_template
        string phase_key
        enum phase_variant "default|late|overdue"
    }

    StudentWorkflowActivity {
        int activity_id PK
        int student_id FK
        enum workflow_type "internship|project1|project2"
        string current_step_key
        enum current_step_status "pending|in_progress|awaiting_student_action|awaiting_admin_action|completed|rejected|skipped|blocked|cancelled"
        enum overall_workflow_status "not_started|eligible|enrolled|in_progress|completed|blocked|failed|archived|cancelled"
        json data_payload
        datetime started_at
        datetime completed_at
    }

    ProjectWorkflowState }o--|| ProjectDocument : "state of"
    ProjectWorkflowState }o--o| WorkflowStepDefinition : "current step"
    ProjectWorkflowState }o--o| ProjectDefenseRequest : "topic defense"
    ProjectWorkflowState }o--o| ProjectDefenseRequest : "thesis defense"
    StudentWorkflowActivity }o--|| Student : "activity of"
```

---

## 8. Internship Module

```mermaid
erDiagram
    InternshipDocument {
        int internship_id PK
        int document_id FK
        string company_name
        text company_address
        string internship_position
        string contact_person_name
        string contact_person_position
        string supervisor_name
        string supervisor_position
        string supervisor_phone
        string supervisor_email
        date start_date
        date end_date
        int academic_year
        int semester
    }

    InternshipLogbook {
        int log_id PK
        int internship_id FK
        int student_id FK
        int academic_year
        int semester
        date work_date
        string log_title
        text work_description
        text learning_outcome
        text problems
        text solutions
        decimal work_hours
        string time_in
        string time_out
        text supervisor_comment
        int supervisor_approved "0|1"
        datetime supervisor_approved_at
        text advisor_comment
        boolean advisor_approved
    }

    InternshipLogbookAttachment {
        int attachment_id PK
        int log_id FK
        string file_name
        string file_path
        string file_type
        int file_size
        datetime upload_date
    }

    InternshipLogbookRevision {
        int revision_id PK
        int log_id FK
        text work_description
        text learning_outcome
        text problems
        text solutions
        datetime revision_date
        int revised_by FK
    }

    InternshipEvaluation {
        int evaluation_id PK
        int approval_token_id FK
        int internship_id FK
        int student_id FK
        string evaluator_name
        datetime evaluation_date
        decimal overall_score
        text strengths
        text weaknesses_to_improve
        enum status "submitted_by_supervisor|completed"
        decimal discipline_score
        decimal behavior_score
        decimal performance_score
        decimal method_score
        decimal relation_score
        string pass_fail
    }

    InternshipCertificateRequest {
        int id PK
        string student_id FK
        int internship_id FK
        int document_id FK
        datetime request_date
        enum status "pending|approved|rejected"
        decimal total_hours
        string certificate_number
        datetime downloaded_at
        int download_count
    }

    InternshipDocument }o--|| Document : "base document"
    InternshipDocument ||--o{ InternshipLogbook : "has logbooks"
    InternshipDocument ||--o{ InternshipEvaluation : "has evaluations"
    InternshipDocument ||--o{ InternshipCertificateRequest : "has certificates"
    InternshipLogbook ||--o{ InternshipLogbookAttachment : "has files"
    InternshipLogbook ||--o{ InternshipLogbookRevision : "has revisions"
    InternshipLogbook }o--|| Student : "written by"
    InternshipEvaluation }o--|| ApprovalToken : "via token"
```

---

## 9. Meeting Module

```mermaid
erDiagram
    Meeting {
        int meeting_id PK
        string meeting_title
        datetime meeting_date
        enum meeting_method "onsite|online|hybrid"
        string meeting_location
        string meeting_link
        enum status "scheduled|in_progress|completed|cancelled"
        enum phase "phase1|phase2"
        int project_id FK
        int created_by FK
    }

    MeetingParticipant {
        int meeting_id PK_FK
        int user_id PK_FK
        enum role "advisor|co_advisor|student|guest"
        enum attendance_status "present|absent|late"
        datetime join_time
        datetime leave_time
    }

    MeetingLog {
        int log_id PK
        int meeting_id FK
        text discussion_topic
        text current_progress
        text problems_issues
        text next_action_items
        text advisor_comment
        enum approval_status "pending|approved|rejected"
        int approved_by FK
        datetime approved_at
        text approval_note
        int recorded_by FK
    }

    MeetingAttachment {
        int attachment_id PK
        int log_id FK
        string file_name
        string file_path
        string file_type
        int file_size
        datetime upload_date
        int uploaded_by FK
    }

    MeetingActionItem {
        int item_id PK
        int log_id FK
        text action_description
        int assigned_to FK
        date due_date
        enum status "pending|in_progress|completed|delayed"
        datetime completion_date
    }

    Meeting ||--o{ MeetingParticipant : "has participants"
    Meeting ||--o{ MeetingLog : "has logs"
    MeetingLog ||--o{ MeetingAttachment : "has files"
    MeetingLog ||--o{ MeetingActionItem : "has actions"
    Meeting }o--|| ProjectDocument : "for project"
    Meeting }o--|| User : "created by"
    MeetingParticipant }o--|| User : "is user"
    MeetingLog }o--|| User : "recorded by"
    MeetingLog }o--o| User : "approved by"
```

---

## 10. Deadline & Timeline Module

```mermaid
erDiagram
    ImportantDeadline {
        int id PK
        string name
        date date
        enum related_to "internship|project|project1|project2|general"
        string academic_year
        int semester
        boolean is_global
        datetime deadline_at "UTC"
        string timezone
        text description
        boolean is_critical
        boolean accepting_submissions
        boolean allow_late
        boolean lock_after_deadline
        int grace_period_minutes
        datetime window_start_at
        datetime window_end_at
        enum deadline_type "SUBMISSION|ANNOUNCEMENT|MANUAL|MILESTONE"
        boolean is_published
        enum visibility_scope "ALL|INTERNSHIP_ONLY|PROJECT_ONLY|CUSTOM"
    }

    DeadlineWorkflowMapping {
        int id PK
        int important_deadline_id FK
        enum workflow_type "internship|project1|project2"
        string step_key
        string document_subtype
        enum auto_assign "on_create|on_submit|on_approve|on_generate"
        boolean active
    }

    TimelineStep {
        int timestamps_id PK
        int student_id FK
        enum type "internship|project"
        int step_order
        string name
        text description
        enum status "waiting|in_progress|completed|blocked"
        datetime date
        date start_date
        date end_date
        date deadline
        string document_type
        string action_text
        string action_link
    }

    StudentProgress {
        int student_progress_id PK
        int student_id FK
        enum progress_type "internship|project"
        int current_step
        int total_steps
        int progress_percent
        boolean is_blocked
        text block_reason
        string next_action
    }

    ImportantDeadline ||--o{ DeadlineWorkflowMapping : "maps to steps"
    Student ||--o{ TimelineStep : "has timeline"
    Student ||--o{ StudentProgress : "has progress"
```

---

## 11. Token & Notification Module

```mermaid
erDiagram
    ApprovalToken {
        int token_id PK
        string token UK
        string email
        int document_id FK
        string log_id
        string supervisor_id
        string student_id FK
        enum type "single|weekly|monthly|full|supervisor_evaluation"
        enum status "pending|approved|rejected|used"
        datetime expires_at
        text comment
    }

    NotificationSetting {
        int setting_id PK
        enum notification_type UK "LOGIN|DOCUMENT|LOGBOOK|EVALUATION|APPROVAL|MEETING"
        boolean is_enabled
        text description
        int updated_by_admin FK
    }

    SystemLog {
        int log_id PK
        string action_type
        text action_description
        string ip_address
        string user_agent
        int user_id FK
        datetime created_at
    }

    UploadHistory {
        int history_id PK
        int uploaded_by FK
        string file_name
        int total_records
        int successful_updates
        int failed_updates
        json details
        enum upload_type "students|grades"
        datetime created_at
    }

    ApprovalToken }o--o| Document : "for document"
    ApprovalToken }o--o| Student : "for student"
    NotificationSetting }o--o| User : "updated by"
    SystemLog }o--|| User : "by user"
    UploadHistory }o--|| User : "uploaded by"
```

---

## สรุปจำนวน Tables แยกตาม Module

| Module | Tables | รายชื่อ |
|--------|--------|---------|
| User & Auth | 5 | User, Student, Teacher, Admin, PasswordResetToken |
| Academic | 3 | Academic, Curriculum, StudentAcademicHistory |
| Document | 2 | Document, DocumentLog |
| Project Core | 5 | ProjectDocument, ProjectMember, ProjectTrack, ProjectMilestone, ProjectArtifact |
| Project Events | 1 | ProjectEvent |
| Project Exam & Defense | 4 | ProjectDefenseRequest, ProjectDefenseRequestAdvisorApproval, ProjectExamResult, ProjectTestRequest |
| Project Workflow | 3 | ProjectWorkflowState, WorkflowStepDefinition, StudentWorkflowActivity |
| Internship | 6 | InternshipDocument, InternshipLogbook, InternshipLogbookAttachment, InternshipLogbookRevision, InternshipEvaluation, InternshipCertificateRequest |
| Meeting | 5 | Meeting, MeetingParticipant, MeetingLog, MeetingAttachment, MeetingActionItem |
| Deadline & Timeline | 4 | ImportantDeadline, DeadlineWorkflowMapping, TimelineStep, StudentProgress |
| Token & Notification | 2 | ApprovalToken, NotificationSetting |
| Logging | 3 | SystemLog, UploadHistory, TeacherProjectManagement |
| **Total** | **43** | |
