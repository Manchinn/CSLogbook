# Teacher Module Enhancement Roadmap

## Current Status
✅ All 7 pages implemented with basic APPROVE table pattern
✅ Functional approve/reject workflows
✅ Proper status badges and color coding
✅ Modal confirmations with required notes

## Enhancement Opportunities

### Phase 1: Core Improvements (Recommended)

#### 1. Advisor Queues - Add Expandable Rows
**Files to modify:**
- `frontend-next/src/components/teacher/AdvisorQueueTable.tsx`
- `frontend-next/src/components/teacher/AdvisorQueue.module.css`

**Features to add:**
- Expandable row details (click to expand)
- Show approval timeline
- Display meeting metrics (for KP02/Thesis)
- Show staff verification notes
- Two-tier status display:
  - Overall request status
  - User's personal approval status

**Implementation:**
```tsx
// Add expanded state
const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

// Add expand toggle in table row
<td>
  <button onClick={() => toggleExpand(item.id)}>
    {expandedRows.has(item.id) ? '▼' : '▶'}
  </button>
</td>

// Add expandable detail row
{expandedRows.has(item.id) && (
  <tr className={styles.expandedRow}>
    <td colSpan={columns.length}>
      <div className={styles.detailsContainer}>
        {/* Timeline, metrics, notes */}
      </div>
    </td>
  </tr>
)}
```

#### 2. System Test - Timeline Visualization
**Files to modify:**
- `frontend-next/src/app/(app)/teacher/system-test/advisor-queue/page.tsx`
- Create new component: `TimelineProgress.tsx`

**Features:**
- Visual timeline with dots/lines
- Color-coded progress (blue submitted, green approved, gray pending)
- Show each advisor's status
- Show staff verification status

#### 3. Meeting Approvals - Enhanced Info Display
**Files to modify:**
- `frontend-next/src/app/(app)/teacher/meeting-approvals/page.tsx`
- `frontend-next/src/lib/services/teacherService.ts` (update type)

**Add fields:**
- Project code (display as tag)
- Meeting topic
- Meeting date (separate from submission date)

### Phase 2: Advanced Features (Optional)

#### 1. PDF Preview Modal
- Add PDF viewer component
- Show document preview before approval
- Implement for System Test documents
- Implement for Document Approvals (CS05/Acceptance Letter)

#### 2. Batch Operations
- Select multiple items (checkboxes)
- Bulk approve/reject
- Batch status updates

#### 3. Search & Advanced Filters
- Full-text search across project titles
- Student name search
- Date range filters
- Multi-select status filters

#### 4. Export Functionality
- Export table data to CSV/Excel
- Print-friendly view
- Report generation

### Phase 3: Performance Optimizations

#### 1. Virtual Scrolling
- For large datasets (100+ items)
- Use react-window or react-virtualized
- Lazy load expanded row details

#### 2. Optimistic Updates
- Show immediate UI feedback
- Revert on error
- Improve perceived performance

#### 3. Caching Strategy
- Use React Query staleTim​e
- Background refetch
- Cache persistence

## Files Structure Summary

### Current Implementation
```
frontend-next/src/
├── app/(app)/
│   ├── teacher/
│   │   ├── meeting-approvals/         ✅ Basic APPROVE table
│   │   ├── project1/advisor-queue/    ✅ Basic queue + modal
│   │   ├── thesis/advisor-queue/      ✅ Basic queue + modal
│   │   ├── system-test/advisor-queue/ ✅ Basic queue + test dates
│   │   ├── topic-exam/overview/       ✅ READ-ONLY table
│   │   └── deadlines/calendar/        ✅ Card layout view
│   └── approve-documents/              ✅ Tabs + filters + APPROVE
├── components/teacher/
│   ├── AdvisorQueueTable.tsx          ✅ Reusable generic table
│   ├── AdvisorQueue.module.css        ✅ Shared styles
│   └── TeacherPageScaffold.tsx        ✅ Layout component
└── lib/services/teacherService.ts     ✅ API layer

```

### Recommended New Components
```
frontend-next/src/components/teacher/
├── ApprovalTimeline.tsx               🆕 Visual timeline
├── MeetingMetrics.tsx                 🆕 Meeting stats card
├── StaffNotes.tsx                     🆕 Verification notes display
├── PDFPreviewModal.tsx                🆕 Document viewer
└── ExpandableTableRow.tsx             🆕 Generic expandable row
```

## Priority Recommendations

### High Priority (Do First)
1. ✅ **Current implementation is production-ready**
2. Add expandable rows to Advisor Queues (most impactful)
3. Enhance System Test with timeline
4. Update Meeting Approvals with full info

### Medium Priority
1. PDF preview functionality
2. Search and advanced filters
3. Batch operations

### Low Priority (Nice to Have)
1. Virtual scrolling
2. Export features
3. Advanced caching

## Decision Checkpoint

**Question for stakeholder:**
Should we proceed with enhancements now, or deploy current implementation first and gather user feedback?

**Current state:** Fully functional APPROVE tables matching core user needs
**Enhancement time:** ~2-3 additional days for Phase 1 improvements
**User impact:** Better information density, matches legacy exactly

## Timeline Estimate (if proceeding)

- Phase 1 Core Improvements: 2-3 days
- Phase 2 Advanced Features: 3-4 days
- Phase 3 Performance: 2 days

**Total:** 7-9 days for full legacy feature parity
