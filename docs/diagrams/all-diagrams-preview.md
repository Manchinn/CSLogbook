# CSLogbook — All Diagrams Preview

> เปิด Markdown Preview ด้วย **Ctrl+Shift+V** เพื่อดู diagrams ทั้งหมด

---

## 1. ภาพรวมความสัมพันธ์ทั้งระบบ (Overview)

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

## 2. User & Authentication

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
        boolean active_status
        datetime last_login
        string sso_provider
        string sso_id
    }

    Student {
        int student_id PK
        int user_id FK
        int curriculum_id FK
        string student_code UK
        string classroom
        decimal total_credits
        decimal major_credits
        decimal gpa
        enum study_type "regular|special"
        boolean is_eligible_internship
        boolean is_eligible_project
        int advisor_id FK
    }

    Teacher {
        int teacher_id PK
        string teacher_code UK
        int user_id FK
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
    }

    PasswordResetToken {
        int id PK
        int user_id FK
        enum purpose "PASSWORD_CHANGE"
        string otp_hash
        datetime expires_at
    }

    User ||--o| Student : "has"
    User ||--o| Teacher : "has"
    User ||--o| Admin : "has"
    User ||--o{ PasswordResetToken : "requests"
    Student }o--o| Teacher : "advisor"
```

---

## 3. Academic & Curriculum

```mermaid
erDiagram
    Academic {
        int id PK
        int academic_year
        int current_semester
        int active_curriculum_id FK
        boolean is_current
        string status
        json semester1_range
        json semester2_range
        json semester3_range
        json internship_registration
        json project_registration
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
    }

    StudentAcademicHistory {
        int id PK
        int student_id FK
        int academic_year
        int semester
        string status
        string note
    }

    Academic }o--|| Curriculum : "active curriculum"
    Student }o--|| Curriculum : "enrolled in"
    Student ||--o{ StudentAcademicHistory : "has"
```

---

## 4. Document Management

```mermaid
erDiagram
    Document {
        int document_id PK
        int user_id FK
        int reviewer_id FK
        enum document_type "INTERNSHIP|PROJECT"
        string document_name
        string file_path
        enum status "draft|pending|approved|rejected|completed|cancelled"
        text review_comment
        enum category "proposal|progress|final|acceptance"
        datetime submitted_at
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
    }

    Document ||--o{ DocumentLog : "has logs"
    Document ||--o| ProjectDocument : "extends to"
    Document ||--o| InternshipDocument : "extends to"
    User ||--o{ Document : "owns"
    User ||--o{ Document : "reviews"
```

---

## 5. Project Core

```mermaid
erDiagram
    ProjectDocument {
        int project_id PK
        int document_id FK
        string project_name_th
        string project_name_en
        enum project_type "govern|private|research"
        int advisor_id FK
        int co_advisor_id FK
        enum status "draft|advisor_assigned|in_progress|completed|archived|cancelled"
        int academic_year
        int semester
        text objective
        text methodology
        string project_code UK
    }

    ProjectMember {
        int project_id PK_FK
        int student_id PK_FK
        enum role "leader|member"
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
    }

    ProjectArtifact {
        int artifact_id PK
        int project_id FK
        string type
        string file_path
        string original_name
        int version
    }

    ProjectDocument ||--o{ ProjectMember : "has members"
    ProjectDocument ||--o{ ProjectTrack : "has tracks"
    ProjectDocument ||--o{ ProjectMilestone : "has milestones"
    ProjectDocument ||--o{ ProjectArtifact : "has artifacts"
    ProjectMember }o--|| Student : "is student"
    ProjectDocument }o--|| Teacher : "advisor"
    ProjectDocument }o--o| Teacher : "co-advisor"
```

---

## 6. Project Exam & Defense

```mermaid
erDiagram
    ProjectDefenseRequest {
        int request_id PK
        int project_id FK
        enum defense_type "PROJECT1|THESIS"
        enum status "draft|submitted|advisor_in_review|advisor_approved|staff_verified|scheduled|completed|cancelled"
        json form_payload
        int submitted_by_student_id FK
        datetime defense_scheduled_at
        string defense_location
    }

    ProjectDefenseRequestAdvisorApproval {
        int approval_id PK
        int request_id FK
        int teacher_id FK
        string teacher_role
        enum status "pending|approved|rejected"
        text note
    }

    ProjectExamResult {
        int exam_result_id PK
        int project_id FK
        enum exam_type "PROJECT1|THESIS"
        enum result "PASS|FAIL"
        decimal score
        text notes
        int recorded_by_user_id FK
    }

    ProjectTestRequest {
        int request_id PK
        int project_id FK
        int submitted_by_student_id FK
        string status
        string request_file_path
        date test_start_date
        date test_due_date
    }

    ProjectDocument ||--o{ ProjectDefenseRequest : "requests defense"
    ProjectDocument ||--o{ ProjectExamResult : "has results"
    ProjectDocument ||--o{ ProjectTestRequest : "requests test"
    ProjectDefenseRequest ||--o{ ProjectDefenseRequestAdvisorApproval : "needs approvals"
```

---

## 7. Project Workflow

```mermaid
erDiagram
    ProjectWorkflowState {
        int id PK
        int project_id FK_UK
        enum current_phase "DRAFT|ADVISOR_ASSIGNED|TOPIC_SUBMISSION|IN_PROGRESS|THESIS_SUBMISSION|COMPLETED|CANCELLED"
        int workflow_step_id FK
        boolean is_blocked
        text block_reason
        boolean is_overdue
        datetime last_activity_at
    }

    WorkflowStepDefinition {
        int step_id PK
        enum workflow_type "internship|project1|project2"
        string step_key UK
        int step_order
        string title
        string phase_key
    }

    StudentWorkflowActivity {
        int activity_id PK
        int student_id FK
        enum workflow_type "internship|project1|project2"
        string current_step_key
        enum current_step_status "pending|in_progress|completed|rejected|blocked"
        enum overall_workflow_status "not_started|eligible|enrolled|in_progress|completed|failed"
        json data_payload
    }

    ProjectWorkflowState }o--|| ProjectDocument : "state of"
    ProjectWorkflowState }o--o| WorkflowStepDefinition : "current step"
    StudentWorkflowActivity }o--|| Student : "activity of"
```

---

## 8. Internship System

```mermaid
erDiagram
    InternshipDocument {
        int internship_id PK
        int document_id FK
        string company_name
        text company_address
        string internship_position
        string supervisor_name
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
        date work_date
        string log_title
        text work_description
        text learning_outcome
        text problems
        decimal work_hours
        string time_in
        string time_out
        int supervisor_approved
        boolean advisor_approved
    }

    InternshipLogbookAttachment {
        int attachment_id PK
        int log_id FK
        string file_name
        string file_path
        int file_size
    }

    InternshipLogbookRevision {
        int revision_id PK
        int log_id FK
        text work_description
        text learning_outcome
        datetime revision_date
    }

    InternshipEvaluation {
        int evaluation_id PK
        int internship_id FK
        int student_id FK
        string evaluator_name
        decimal overall_score
        decimal discipline_score
        decimal behavior_score
        decimal performance_score
        enum status "submitted_by_supervisor|completed"
        string pass_fail
    }

    InternshipCertificateRequest {
        int id PK
        int internship_id FK
        enum status "pending|approved|rejected"
        decimal total_hours
        string certificate_number
    }

    InternshipDocument }o--|| Document : "base document"
    InternshipDocument ||--o{ InternshipLogbook : "has logbooks"
    InternshipDocument ||--o{ InternshipEvaluation : "has evaluations"
    InternshipDocument ||--o{ InternshipCertificateRequest : "has certificates"
    InternshipLogbook ||--o{ InternshipLogbookAttachment : "has files"
    InternshipLogbook ||--o{ InternshipLogbookRevision : "has revisions"
    InternshipLogbook }o--|| Student : "written by"
```

---

## 9. Meeting Management

```mermaid
erDiagram
    Meeting {
        int meeting_id PK
        string meeting_title
        datetime meeting_date
        enum meeting_method "onsite|online|hybrid"
        string meeting_location
        enum status "scheduled|in_progress|completed|cancelled"
        enum phase "phase1|phase2"
        int project_id FK
    }

    MeetingParticipant {
        int meeting_id PK_FK
        int user_id PK_FK
        enum role "advisor|co_advisor|student|guest"
        enum attendance_status "present|absent|late"
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
    }

    MeetingAttachment {
        int attachment_id PK
        int log_id FK
        string file_name
        string file_path
    }

    MeetingActionItem {
        int item_id PK
        int log_id FK
        text action_description
        int assigned_to FK
        date due_date
        enum status "pending|in_progress|completed|delayed"
    }

    Meeting ||--o{ MeetingParticipant : "has participants"
    Meeting ||--o{ MeetingLog : "has logs"
    MeetingLog ||--o{ MeetingAttachment : "has files"
    MeetingLog ||--o{ MeetingActionItem : "has actions"
    Meeting }o--|| ProjectDocument : "for project"
```

---

## 10. Deadline & Timeline

```mermaid
erDiagram
    ImportantDeadline {
        int id PK
        string name
        date date
        enum related_to "internship|project|general"
        string academic_year
        int semester
        boolean is_critical
        boolean accepting_submissions
        boolean allow_late
        int grace_period_minutes
        enum deadline_type "SUBMISSION|ANNOUNCEMENT|MANUAL|MILESTONE"
    }

    DeadlineWorkflowMapping {
        int id PK
        int important_deadline_id FK
        enum workflow_type "internship|project1|project2"
        string step_key
        enum auto_assign "on_create|on_submit|on_approve|on_generate"
    }

    TimelineStep {
        int timestamps_id PK
        int student_id FK
        enum type "internship|project"
        int step_order
        string name
        enum status "waiting|in_progress|completed|blocked"
        date deadline
    }

    StudentProgress {
        int student_progress_id PK
        int student_id FK
        enum progress_type "internship|project"
        int progress_percent
        boolean is_blocked
        string next_action
    }

    ImportantDeadline ||--o{ DeadlineWorkflowMapping : "maps to steps"
    Student ||--o{ TimelineStep : "has timeline"
    Student ||--o{ StudentProgress : "has progress"
```

---

## 11. Token & Notification

```mermaid
erDiagram
    ApprovalToken {
        int token_id PK
        string token UK
        string email
        int document_id FK
        enum type "single|weekly|monthly|full|supervisor_evaluation"
        enum status "pending|approved|rejected|used"
        datetime expires_at
    }

    NotificationSetting {
        int setting_id PK
        enum notification_type UK "LOGIN|DOCUMENT|LOGBOOK|EVALUATION|APPROVAL|MEETING"
        boolean is_enabled
        text description
    }

    SystemLog {
        int log_id PK
        string action_type
        text action_description
        string ip_address
        int user_id FK
    }

    UploadHistory {
        int history_id PK
        int uploaded_by FK
        string file_name
        int total_records
        enum upload_type "students|grades"
    }

    ApprovalToken }o--o| Document : "for document"
    SystemLog }o--|| User : "by user"
    UploadHistory }o--|| User : "uploaded by"
```

---

## 12. System Architecture

```mermaid
graph TB
    subgraph Client
        Browser["Web Browser"]
    end

    subgraph Proxy
        Nginx["Nginx :80/:443"]
    end

    subgraph Application
        Frontend["Next.js 16 :3000"]
        Backend["Express.js :5000"]
        SocketIO["Socket.io"]
        Agents["Background Agents x11"]
    end

    subgraph Data
        MySQL["MySQL 8.0 - 43 Tables"]
        Files["uploads/"]
    end

    subgraph External
        Gmail["Gmail API"]
        SSO["KMUTNB SSO"]
    end

    Browser -->|HTTPS| Nginx
    Nginx -->|/| Frontend
    Nginx -->|/api/| Backend
    Nginx -->|/socket.io/| SocketIO
    Frontend -->|API| Backend
    Backend --> MySQL
    Backend --> Files
    Backend --> Gmail
    Backend --> SSO
    Agents --> MySQL
    Agents --> SocketIO
    SocketIO -->|WebSocket| Browser
```

---

## 13. Project Workflow State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT

    state "Phase 1" as P1 {
        DRAFT --> PENDING_ADVISOR
        PENDING_ADVISOR --> ADVISOR_ASSIGNED
        ADVISOR_ASSIGNED --> TOPIC_SUBMISSION
        TOPIC_SUBMISSION --> TOPIC_EXAM_PENDING
        TOPIC_EXAM_PENDING --> TOPIC_EXAM_SCHEDULED
        TOPIC_EXAM_SCHEDULED --> IN_PROGRESS : PASS
        TOPIC_EXAM_SCHEDULED --> TOPIC_FAILED : FAIL
        TOPIC_FAILED --> TOPIC_SUBMISSION
    }

    state "Phase 2" as P2 {
        IN_PROGRESS --> THESIS_SUBMISSION
        THESIS_SUBMISSION --> THESIS_EXAM_PENDING
        THESIS_EXAM_PENDING --> THESIS_EXAM_SCHEDULED
        THESIS_EXAM_SCHEDULED --> COMPLETED : PASS
        THESIS_EXAM_SCHEDULED --> THESIS_FAILED : FAIL
        THESIS_FAILED --> THESIS_SUBMISSION
    }

    COMPLETED --> ARCHIVED
    DRAFT --> CANCELLED

    COMPLETED --> [*]
    ARCHIVED --> [*]
    CANCELLED --> [*]
```

---

## 14. Defense Request Flow

```mermaid
stateDiagram-v2
    [*] --> draft

    draft --> submitted
    submitted --> advisor_in_review
    advisor_in_review --> advisor_approved
    advisor_in_review --> submitted : reject
    advisor_approved --> staff_verified
    advisor_approved --> submitted : reject
    staff_verified --> scheduled
    scheduled --> completed

    draft --> cancelled
    submitted --> cancelled

    completed --> [*]
    cancelled --> [*]
```

---

## 15. CI/CD & Deployment

```mermaid
graph TB
    Dev["git push master"] --> GA["GitHub Actions"]
    GA -->|build| GHCR["Container Registry"]
    GA -->|SSH deploy| VPS

    subgraph VPS["VPS Server"]
        NGX["Nginx :80/:443"]
        FE["Frontend :3000"]
        BE["Backend :5000"]
        DB["MySQL :3306"]
        VOL["Volumes"]
    end

    GHCR --> FE
    GHCR --> BE
    NGX --> FE
    NGX --> BE
    BE --> DB
    BE --> VOL
    DB --> VOL

    SSL["Let's Encrypt"] --> NGX
    BE --> GMAIL2["Gmail API"]
    BE --> SSO2["KMUTNB SSO"]
```
