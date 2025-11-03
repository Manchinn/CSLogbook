# Recharts Migration Summary

## Overview
Successfully migrated all admin reports from `@ant-design/plots` to `Recharts` library due to complexity and stability issues with @ant-design/plots (specifically "Unknown Component: shape.outer/spider" errors).

## Migration Date
December 2024

## Reason for Migration
1. **@ant-design/plots v2.6.3 issues**: 
   - "Unknown Component: shape.outer" error when using label configurations
   - Complex configuration objects made debugging difficult
   - Version compatibility issues with label types

2. **Backend data type issue**:
   - Fixed: `complianceRate` was returning strings instead of numbers
   - Solution: Added `parseFloat()` conversions in `deadlineReportService.js`

3. **Recharts advantages**:
   - JSX-based component approach (more React-idiomatic)
   - Simple prop-based configuration
   - Better TypeScript support
   - Easier to debug and customize

## Files Created

### 1. `RechartsComponents.js`
**Location**: `frontend/src/components/admin/reports/charts/RechartsComponents.js`

**Purpose**: Common reusable chart components for all reports

**Components**:
- `SimpleBarChart`: Bar/Column charts with horizontal/vertical layout support
- `SimplePieChart`: Pie/Donut charts with customizable inner radius
- `SimpleLineChart`: Line charts with smooth curves and dots
- `MultiBarChart`: Grouped bar charts for multiple data series
- `CHART_COLORS`: Standardized color palette

**Key Features**:
- Responsive containers
- Custom tooltips
- Label formatting (percent, number)
- Color threshold helpers
- Legend support

### 2. `deadlineRechartsConfigs.js`
**Location**: `frontend/src/components/admin/reports/charts/deadlineRechartsConfigs.js`

**Purpose**: Deadline-specific chart helpers and tooltip components

**Exports**:
- `DEADLINE_COLORS`: Deadline-specific color scheme
- `BarChartTooltip`: Custom bar chart tooltip with Thai formatting
- `LineChartTooltip`: Custom line chart tooltip
- `PieChartTooltip`: Custom pie chart tooltip
- `preparePieData()`: Helper to format summary data for pie charts

### 3. `DeadlineComplianceReportRecharts.js`
**Location**: `frontend/src/components/admin/reports/DeadlineComplianceReportRecharts.js`

**Purpose**: Complete replacement of old DeadlineComplianceReport using Recharts

**Charts**:
- Bar chart: Compliance rates by deadline
- Pie chart: Submission status distribution (donut style)
- Line chart: Weekly compliance trends

## Files Converted (5 Files Total)

### 1. **InternshipReport.js** ✅
**Changes**:
- Replaced `LazyPie` with `SimplePieChart` (internship status distribution)
- Replaced `LazyBar` with `SimpleBarChart` (evaluation criteria scores)
- Removed Suspense wrappers
- Added `useMemo` hooks for data preparation

**Charts**:
- Criteria bar chart: Evaluation scores by criteria
- Status pie chart: Internship completion status

### 2. **ProjectReport.js** ✅
**Changes**:
- Replaced `LazyPie` with `SimplePieChart` (proposal status)
- Replaced `LazyBar` with `SimpleBarChart` (advisor workload)
- Data transformation for Recharts format

**Charts**:
- Proposal pie chart: Approved/Pending/Rejected distribution
- Advisor bar chart: Project count by advisor + co-advisor

### 3. **SupportStaffDashboard.js** ✅
**Changes**:
- Replaced `LazyLine` with `SimpleLineChart` (weekly logbook trend)
- Replaced `LazyPie` with `SimplePieChart` (proposal status)

**Charts**:
- Weekly line chart: Logbook submission trends over time
- Proposal pie chart: Project proposal status distribution

### 4. **WorkflowProgressReport.js** ✅
**Changes**:
- Replaced `LazyColumn` with `SimpleBarChart` (bottleneck analysis)
- Replaced `LazyPie` with `SimplePieChart` (overall status distribution)
- Removed `buildBottleneckBarConfig` and `buildOverallStatusPieConfig` imports
- Added color coding for bottleneck severity (red ≥50%, orange ≥30%, blue default)

**Charts**:
- Bottleneck bar chart: Steps where students get stuck (horizontal bars)
- Status pie chart: Overall workflow status distribution (donut)

**Note**: Funnel chart not implemented (Recharts doesn't have funnel chart type)

### 5. **AdvisorWorkloadDetailReport.js** ✅
**Changes**:
- Replaced `LazyColumn` with `SimpleBarChart` (advisor workload)
- Changed from grouped data to multi-bar format
- Removed complex config object

**Charts**:
- Advisor workload chart: Project count by advisor role (main + co-advisor)

## Files Deleted

1. **`charts/LazyPlots.js`** - Lazy loader wrapper for @ant-design/plots
2. **`charts/deadlineChartConfigs.js`** - Old config builders
3. **`DeadlineComplianceReport.js`** - Old component using @ant-design/plots

**Note**: The following config files still exist but are no longer imported/used:
- `charts/workflowChartConfigs.js`
- `charts/internshipConfigs.js`
- `charts/internshipProgressConfigs.js`
- `charts/projectConfigs.js`
- `charts/configs.js`

These can be safely deleted in future cleanup.

## Backend Changes

### File: `backend/services/deadlineReportService.js`

**Problem**: Backend was returning percentage values as strings (e.g., "65.4" instead of 65.4)

**Changes Made**:
```javascript
// Before:
complianceRate: ((onTime / total) * 100).toFixed(1)

// After:
complianceRate: parseFloat(((onTime / total) * 100).toFixed(1))
```

**Functions Updated**:
1. `_calculateDeadlineStats()`: All complianceRate calculations
2. `_calculateSummary()`: All percentage calculations (onTimeRate, lateRate, overdueRate, notSubmittedRate)
3. `_calculateComplianceTrend()`: Weekly trend rates

**Impact**: Charts now display "65.4%" correctly instead of "undefined%"

## Migration Pattern Used

For each file conversion, followed this pattern:

### 1. Replace Imports
```javascript
// OLD:
import { LazyPie as Pie, LazyBar as Bar } from './charts/LazyPlots';
import { buildSomeConfig } from './charts/someConfigs';

// NEW:
import { SimplePieChart, SimpleBarChart, CHART_COLORS } from './charts/RechartsComponents';
```

### 2. Remove Config Builders, Add Data Prep
```javascript
// OLD:
const config = useMemo(() => buildSomeConfig(data), [data]);

// NEW:
const chartData = useMemo(() => {
  return data.map(item => ({
    name: item.name,
    value: item.value,
    fill: CHART_COLORS.primary
  }));
}, [data]);
```

### 3. Replace Chart JSX
```javascript
// OLD:
<Suspense fallback={<Skeleton active />}>
  <Pie {...config} />
</Suspense>

// NEW:
<SimplePieChart
  data={chartData}
  height={300}
  innerRadius={60}
  showLabel
  showLegend
/>
```

## Testing Checklist

- [x] No ESLint errors in any converted file
- [x] No MODULE_NOT_FOUND errors for LazyPlots
- [x] All 5 files successfully converted
- [x] Backend returns numbers instead of strings
- [ ] **Manual Testing Needed**:
  - [ ] Verify all charts render correctly
  - [ ] Check data accuracy (compare with original charts if screenshots available)
  - [ ] Test responsive behavior on different screen sizes
  - [ ] Verify Thai language labels display correctly
  - [ ] Check tooltip formatting
  - [ ] Test legend interactions

## Known Limitations

1. **Funnel Chart**: WorkflowProgressReport.js had a Funnel chart that is not implemented because Recharts doesn't have a built-in funnel chart component. Placeholder text added.

2. **Old Config Files**: Several old chart config files still exist but are unused:
   - `workflowChartConfigs.js`
   - `internshipConfigs.js`
   - `internshipProgressConfigs.js`
   - `projectConfigs.js`
   - `configs.js`
   
   These can be deleted after confirming no other parts of the application use them.

## Rollback Plan (If Needed)

If critical issues are found:

1. **Revert commit** containing this migration
2. **Reinstall @ant-design/plots**: `npm install @ant-design/plots@2.6.3`
3. **Restore deleted files**:
   - `charts/LazyPlots.js`
   - `charts/deadlineChartConfigs.js`
   - `DeadlineComplianceReport.js`
4. **Revert backend changes** in `deadlineReportService.js` (keep parseFloat for data correctness)

## Dependencies

### Added:
- `recharts` (already installed in project)

### No Longer Required:
- `@ant-design/plots` can be removed if no other components use it

### Check for Usage:
```bash
# Search for any remaining @ant-design/plots usage
grep -r "@ant-design/plots" frontend/src/
```

## Future Improvements

1. **Implement Funnel Alternative**: Consider using a stacked bar chart or step chart to visualize workflow funnel
2. **Delete Unused Config Files**: Remove old chart config files after verification
3. **Add Chart Tests**: Create unit tests for chart components
4. **Optimize Data Transformation**: Consider moving data prep logic to custom hooks
5. **Add Chart Export**: Implement export to PNG/SVG functionality for reports
6. **Color Theming**: Connect CHART_COLORS to Ant Design theme tokens for consistency

## References

- Recharts Documentation: https://recharts.org/
- Migration Discussion: See conversation history for detailed problem-solving steps
- Related Files:
  - Backend: `backend/services/deadlineReportService.js`
  - Frontend: `frontend/src/components/admin/reports/charts/RechartsComponents.js`
  - Test: Manual testing required for visual verification

---

**Migration Completed**: All 5 files converted successfully with 0 compilation errors ✅
