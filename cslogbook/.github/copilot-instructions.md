# CSLogbook AI Coding Agent Instructions

## Project Overview
CSLogbook is a Thai university internship and capstone project management system with a React frontend, Node.js/Express backend, and MySQL database. The system manages document workflows, logbooks, meetings, and evaluations for Computer Science students.

## Architecture & Tech Stack

### Backend (`backend/`)
- **Framework**: Express.js with Sequelize ORM
- **Database**: MySQL 8.0 with UTF-8MB4 (Thai language support)
- **Auth**: JWT tokens (`middleware/authMiddleware.js`)
- **Key Pattern**: Service layer architecture - Controllers call Services for business logic
  - Controllers: Handle HTTP requests/responses (`controllers/`)
  - Services: Business logic and database operations (`services/`)
  - Models: Sequelize models with associations (`models/index.js`)

### Frontend (`frontend/`)
- **Framework**: React 18 with Ant Design 5
- **Routing**: React Router v6
- **State**: Context API (`contexts/`) + custom hooks (`hooks/`)
- **API**: Axios services (`services/`) with token interceptors
- **Build**: Custom webpack config (`scripts/start.js`, `scripts/build.js`)

### Key Database Tables
- **Users & Auth**: `User`, `Student`, `Teacher`, `Admin`
- **Internship**: `InternshipDocument`, `InternshipLogbook`, `Document`
- **Project/Capstone**: `ProjectDocument`, `ProjectMember`, `Meeting`, `MeetingLog`
- **Workflow**: `StudentWorkflowActivity`, `WorkflowStepDefinition`, `TimelineStep`
- **Academic**: `Academic`, `Curriculum`, `ImportantDeadline`

## Critical Development Workflows

### Running the Application

**Backend (dev)**:
```bash
cd backend
npm run dev  # Runs with nodemon, uses .env.development
```

**Frontend (dev)**:
```bash
cd frontend
npm start    # Runs webpack dev server on port 3000
```

**Database migrations**:
```bash
cd backend
npm run migrate              # Run pending migrations
npm run migrate:undo         # Rollback last migration
npm run seed                 # Run all seeders
npm run db:check:all         # Verify DB connection & models
```

**Testing**:
```bash
cd backend
npm run test                 # Run Jest tests with SQLite in-memory
npm run test:cov             # Run with coverage
```

### Environment Configuration

**Required backend env vars** (`.env.development`, `.env.production`):
- `NODE_ENV`: development | production | test
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL connection
- `JWT_SECRET`: Must be ≥32 chars
- `FRONTEND_URL`: For CORS (comma-separated for multiple origins)
- `SENDGRID_API_KEY`, `EMAIL_SENDER`: Email notifications

**Frontend env vars** (`.env.development`):
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
```

## Project-Specific Conventions

### Naming & Structure
1. **File naming**: camelCase for JS files, PascalCase for React components
2. **Model associations**: Defined in `models/index.js` - ALWAYS check here for relationships
3. **Route mounting**: `app.js` mounts routes, `server.js` starts the server (enables supertest)
4. **Timezone**: Asia/Bangkok (+07:00) - set in database config and dayjs

### Database Patterns
1. **Sequelize config**: Use `config/database.js` - switches to SQLite in-memory for tests
2. **Migrations**: Prefix with timestamp `YYYYMMDDHHMMSS-description.js`
3. **Foreign keys**: Use `underscored: true` convention (e.g., `student_id`, `project_id`)
4. **Charset**: All tables use `utf8mb4_unicode_ci` for Thai language

### API Response Format
```javascript
// Success
{ success: true, data: {...}, message: "..." }

// Error
{ success: false, error: "Error message", details: {...} }
```

### Workflow System (Critical Pattern)
The system uses a **state machine pattern** for tracking student progress:

1. **WorkflowStepDefinition**: Master data for workflow steps (internship, project1, etc.)
2. **StudentWorkflowActivity**: Current state per student per workflow type
3. **Key service**: `workflowService.updateStudentWorkflowActivity(studentId, workflowType, stepKey, stepStatus, overallStatus, payload)`

**Status values**:
- Step status: `not_started`, `awaiting_student_action`, `awaiting_admin_action`, `pending`, `in_progress`, `completed`, `blocked`
- Overall status: `not_started`, `pending`, `in_progress`, `completed`, `failed`

**Example** (from `internshipService.js`):
```javascript
await workflowService.updateStudentWorkflowActivity(
  studentId,
  'internship',
  'INTERNSHIP_CS05_APPROVED',
  'completed',
  'in_progress',
  { approvedAt: new Date(), approvedBy: adminId }
);
```

### Background Agents (`backend/agents/`)
**Agent system** runs scheduled tasks and monitors:
- `deadlineReminderAgent`: Sends deadline notifications
- `eligibilityUpdater`: Recalculates student eligibility (credits, year level)
- `academicSemesterScheduler`: Auto-updates current semester
- **Start agents**: Set `ENABLE_AGENTS=true` in production or use `ACADEMIC_AUTO_UPDATE_ENABLED=true` for specific agent

**Critical**: Agents start in `server.js` after server initialization

### Email & Notifications
- **SendGrid integration**: `services/emailService.js`
- **Feature flags**: `EMAIL_*_ENABLED` env vars to toggle email types
- **Approval tokens**: One-click approval via `ApprovalToken` model + `/api/email-approval` routes

## Integration Points

### Authentication Flow
1. Client calls `/api/auth/login` or SSO endpoint
2. `authService` validates credentials, generates JWT
3. Frontend stores token, adds to Axios interceptor (`services/api.js`)
4. Protected routes use `authenticateToken` middleware

### Document Upload Flow
1. Frontend uploads via `/api/upload` with multer middleware
2. Files saved to `uploads/` directory
3. Document metadata saved to `Document` or `InternshipDocument` table
4. File URL: `http://localhost:5000/uploads/{filename}`

### Project Meeting Approval
1. Student creates meeting log via `/api/projects/:projectId/meetings/:meetingId/logs`
2. Advisor approves/rejects via `/api/projects/.../logs/:logId/approval`
3. System tracks approved meeting count per student
4. Used for defense request eligibility (`PROJECT1_READINESS_REVIEW` step)

## Common Gotchas

1. **CORS errors**: Check `FRONTEND_URL` includes correct origin in `allowedOrigins` array (supports comma-separated)
2. **UTF-8 issues**: Ensure client charset is `utf8mb4` - set in DB connection and before queries
3. **Timezone mismatches**: Always use `dayjs.tz(date, 'Asia/Bangkok')` for date operations
4. **Test failures**: Tests use SQLite in-memory - some MySQL-specific features may not work
5. **Association errors**: If relation not found, check `models/index.js` for missing associations
6. **Agent not running**: Verify `ENABLE_AGENTS=true` or specific agent flags in production
7. **Missing deadline enforcement**: Currently `submitCS05()` and `createProject()` check eligibility but NOT ImportantDeadline - this is a known gap that needs addressing

## Testing Practices

1. **Unit tests**: Mock external dependencies (DB, email) using Jest
2. **Integration tests**: Use supertest with in-memory SQLite DB
3. **Setup/Teardown**: See `tests/jest.setup.js` and `tests/jest.teardown.js`
4. **Coverage target**: Lines 35%, Functions 30%, Branches 20%

## Key Files to Reference

- **API routes overview**: `backend/app.js` (route mounting)
- **Model associations**: `backend/models/index.js`
- **Frontend routes**: `frontend/src/App.js`
- **Workflow definitions**: `backend/seeders/*-initial-*-steps.js`
- **System architecture**: `knowledge/system_flow_overview.md`
- **Database schema**: `knowledge/database-tables-summary.md`

## When Adding Features

1. **New API endpoint**:
   - Add route in `routes/` folder
   - Create controller method
   - Implement service layer logic
   - Update Swagger docs with JSDoc comments
   - Mount route in `app.js`

2. **New database table**:
   - Create migration with `npm run migrate:create`
   - Add Sequelize model in `models/`
   - Define associations in `models/index.js`
   - Run `npm run migrate` and verify with `npm run db:check:all`

3. **New React component**:
   - Place in appropriate subdirectory under `components/` (admin/, student/, teacher/, common/)
   - Use Ant Design components for consistency
   - Create corresponding service method if API call needed
   - Follow existing patterns for error handling and loading states

## Docker Deployment

Use `docker-compose.yml` for local development or `docker-compose.production.yml` for production:

```bash
docker-compose up -d          # Start all services
docker-compose logs -f backend  # View backend logs
```

**Volumes**: `mysql-data`, `backend-uploads`, `backend-logs` are persisted

---

**For detailed workflows**, see `knowledge/workflow_overview.md` and `knowledge/api_data_flow_summary_complete.md`
