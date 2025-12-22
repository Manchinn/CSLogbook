# Manual Edit Instructions: projectService.js

## 📍 Location
File: `frontend/src/features/project/services/projectService.js`
Lines: **297-308**

---

## 🔍 Step 1: Find the Code

Search for: `uploadProposal: async (projectId, file)`

You should find this around **line 297**:

```javascript
// Proposal upload (multipart)
uploadProposal: async (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await apiClient.post(`/projects/${projectId}/proposal`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;  // ← This line will change
  } catch (error) {
    throw normalizeError(error, 'อัปโหลด Proposal ไม่สำเร็จ');
  }
},
```

---

## ✏️ Step 2: Replace Line 304

**BEFORE** (line 304):
```javascript
    return res.data;
```

**AFTER** (replace lines 304-305 with this):
```javascript
    // Extract deadline status from backend response
    const { data, isLateSubmission, submissionStatus } = res.data;
    return {
      ...res.data,
      deadlineStatus: {
        isLate: isLateSubmission || false,
        variant: submissionStatus?.variant || 'on-time',
        message: submissionStatus?.message || null
      }
    };
```

---

## ✅ Step 3: Verify

After editing, the complete method should look like:

```javascript
// Proposal upload (multipart)
uploadProposal: async (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await apiClient.post(`/projects/${projectId}/proposal`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Extract deadline status from backend response
    const { data, isLateSubmission, submissionStatus } = res.data;
    return {
      ...res.data,
      deadlineStatus: {
        isLate: isLateSubmission || false,
        variant: submissionStatus?.variant || 'on-time',
        message: submissionStatus?.message || null
      }
    };
  } catch (error) {
    throw normalizeError(error, 'อัปโหลด Proposal ไม่สำเร็จ');
  }
},
```

---

## 🎯 What This Does

**Before**: Returns raw backend response
```javascript
{ success: true, data: {...} }
```

**After**: Returns enhanced response with deadline info
```javascript
{
  success: true,
  data: {...},
  isLateSubmission: true,
  submissionStatus: { variant: 'late', message: '...' },
  deadlineStatus: {           // ← NEW: Normalized structure
    isLate: true,
    variant: 'late',
    message: 'ส่งหลังกำหนด...'
  }
}
```

---

## 💡 Why Manual?

The file is 402 lines - automated tools struggled with precise edits without corrupting surrounding code. This single change is safe to do manually.

---

## ✅ Done?

Once edited:
1. Save file
2. Check for syntax errors (ESLint should be happy)
3. Continue to next step: Dashboard integration

---

**Estimated time**: 2 minutes
