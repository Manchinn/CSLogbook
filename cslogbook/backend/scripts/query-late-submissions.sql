-- =====================================================
-- SQL Queries for Late Submission Reporting
-- Google Classroom Style Late Tracking
-- =====================================================

-- 1. รายงานเอกสารที่ส่งสาย (Documents)
-- ====================================================

-- 1.1 สรุปจำนวนเอกสารที่ส่งสายแต่ละประเภท
SELECT 
    d.document_type AS 'ประเภทเอกสาร',
    d.category AS 'หมวดหมู่',
    COUNT(*) AS 'จำนวนทั้งหมด',
    SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) AS 'ส่งสาย',
    ROUND(SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS '% ส่งสาย'
FROM documents d
WHERE d.submitted_at IS NOT NULL
GROUP BY d.document_type, d.category
ORDER BY d.document_type, d.category;

-- 1.2 รายการเอกสารที่ส่งสาย พร้อมรายละเอียด
SELECT 
    d.document_id AS 'ID',
    u.first_name_th AS 'ชื่อ',
    u.last_name_th AS 'นามสกุล',
    d.document_type AS 'ประเภท',
    d.document_name AS 'ชื่อเอกสาร',
    DATE_FORMAT(d.submitted_at, '%Y-%m-%d %H:%i') AS 'เวลาที่ส่ง',
    d.submission_delay_minutes AS 'ช้า (นาที)',
    CONCAT(
        FLOOR(d.submission_delay_minutes / 1440), ' วัน ',
        FLOOR((d.submission_delay_minutes % 1440) / 60), ' ชม. ',
        d.submission_delay_minutes % 60, ' นาที'
    ) AS 'ช้า (อ่านง่าย)',
    idl.name AS 'Deadline',
    DATE_FORMAT(idl.deadline_at, '%Y-%m-%d %H:%i') AS 'กำหนดส่ง'
FROM documents d
INNER JOIN users u ON d.user_id = u.id
LEFT JOIN important_deadlines idl ON d.important_deadline_id = idl.id
WHERE d.submitted_late = 1
ORDER BY d.submission_delay_minutes DESC;

-- 1.3 Top 10 นักศึกษาที่ส่งเอกสารสายมากที่สุด
SELECT 
    u.id AS 'รหัส',
    CONCAT(u.first_name_th, ' ', u.last_name_th) AS 'ชื่อ-นามสกุล',
    COUNT(*) AS 'จำนวนครั้ง',
    AVG(d.submission_delay_minutes) AS 'เฉลี่ย (นาที)',
    MAX(d.submission_delay_minutes) AS 'มากสุด (นาที)'
FROM documents d
INNER JOIN users u ON d.user_id = u.id
WHERE d.submitted_late = 1
GROUP BY u.id, u.first_name_th, u.last_name_th
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 1.4 เอกสารที่ส่งช้ามากกว่า 7 วัน (10080 นาที)
SELECT 
    d.document_id,
    CONCAT(u.first_name_th, ' ', u.last_name_th) AS 'นักศึกษา',
    d.document_name,
    d.submission_delay_minutes AS 'ช้า (นาที)',
    FLOOR(d.submission_delay_minutes / 1440) AS 'ช้า (วัน)',
    DATE_FORMAT(d.submitted_at, '%Y-%m-%d') AS 'วันที่ส่ง'
FROM documents d
INNER JOIN users u ON d.user_id = u.id
WHERE d.submitted_late = 1 AND d.submission_delay_minutes > 10080
ORDER BY d.submission_delay_minutes DESC;


-- 2. รายงานโครงงานที่ส่งสาย (Project Documents)
-- ====================================================

-- 2.1 สรุปโครงงานที่ส่งสาย
SELECT 
    pd.status AS 'สถานะ',
    COUNT(*) AS 'จำนวนทั้งหมด',
    SUM(CASE WHEN pd.submitted_late = 1 THEN 1 ELSE 0 END) AS 'ส่งสาย',
    ROUND(SUM(CASE WHEN pd.submitted_late = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS '% ส่งสาย'
FROM project_documents pd
GROUP BY pd.status
ORDER BY pd.status;

-- 2.2 รายการโครงงานที่สร้างล่าช้า
SELECT 
    pd.project_id AS 'Project ID',
    pd.project_name_th AS 'ชื่อโครงงาน (ไทย)',
    pd.project_name_en AS 'ชื่อโครงงาน (EN)',
    CONCAT(u.first_name_th, ' ', u.last_name_th) AS 'ผู้สร้าง',
    DATE_FORMAT(pd.created_at, '%Y-%m-%d') AS 'วันที่สร้าง',
    pd.submission_delay_minutes AS 'ช้า (นาที)',
    FLOOR(pd.submission_delay_minutes / 1440) AS 'ช้า (วัน)',
    idl.name AS 'Deadline'
FROM project_documents pd
LEFT JOIN students s ON pd.created_by_student_id = s.student_id
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN important_deadlines idl ON pd.important_deadline_id = idl.id
WHERE pd.submitted_late = 1
ORDER BY pd.submission_delay_minutes DESC;


-- 3. รายงานตาม Deadline
-- ====================================================

-- 3.1 สถิติการส่งสายแยกตาม deadline
SELECT 
    idl.id AS 'Deadline ID',
    idl.name AS 'ชื่อ Deadline',
    idl.related_to AS 'ประเภท',
    DATE_FORMAT(idl.deadline_at, '%Y-%m-%d %H:%i') AS 'กำหนดส่ง',
    COUNT(d.document_id) AS 'เอกสารทั้งหมด',
    SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) AS 'ส่งสาย',
    ROUND(
        SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(COUNT(d.document_id), 0), 
        2
    ) AS '% ส่งสาย'
FROM important_deadlines idl
LEFT JOIN documents d ON d.important_deadline_id = idl.id
GROUP BY idl.id, idl.name, idl.related_to, idl.deadline_at
HAVING COUNT(d.document_id) > 0
ORDER BY idl.deadline_at DESC;

-- 3.2 Deadline ที่มีการส่งสายมากที่สุด (Top 5)
SELECT 
    idl.name AS 'Deadline',
    DATE_FORMAT(idl.deadline_at, '%Y-%m-%d') AS 'วันที่กำหนด',
    COUNT(*) AS 'จำนวนที่ส่งสาย',
    AVG(d.submission_delay_minutes) AS 'เฉลี่ยช้า (นาที)',
    MAX(d.submission_delay_minutes) AS 'ช้าสุด (นาที)'
FROM documents d
INNER JOIN important_deadlines idl ON d.important_deadline_id = idl.id
WHERE d.submitted_late = 1
GROUP BY idl.id, idl.name, idl.deadline_at
ORDER BY COUNT(*) DESC
LIMIT 5;


-- 4. รายงานตามช่วงเวลา
-- ====================================================

-- 4.1 สถิติการส่งสายรายเดือน (เดือนนี้)
SELECT 
    DATE_FORMAT(d.submitted_at, '%Y-%m-%d') AS 'วันที่',
    COUNT(*) AS 'เอกสารทั้งหมด',
    SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) AS 'ส่งสาย',
    ROUND(
        SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
        2
    ) AS '% ส่งสาย'
FROM documents d
WHERE d.submitted_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY DATE_FORMAT(d.submitted_at, '%Y-%m-%d')
ORDER BY DATE_FORMAT(d.submitted_at, '%Y-%m-%d');

-- 4.2 สถิติการส่งสายรายปี
SELECT 
    YEAR(d.submitted_at) AS 'ปี',
    COUNT(*) AS 'เอกสารทั้งหมด',
    SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) AS 'ส่งสาย',
    ROUND(
        SUM(CASE WHEN d.submitted_late = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
        2
    ) AS '% ส่งสาย',
    AVG(CASE WHEN d.submitted_late = 1 THEN d.submission_delay_minutes ELSE NULL END) AS 'เฉลี่ยช้า (นาที)'
FROM documents d
WHERE d.submitted_at IS NOT NULL
GROUP BY YEAR(d.submitted_at)
ORDER BY YEAR(d.submitted_at) DESC;


-- 5. รายงานสำหรับ Admin Dashboard
-- ====================================================

-- 5.1 สถิติรวม (Overall Statistics)
SELECT 
    'Documents' AS ประเภท,
    COUNT(*) AS จำนวนทั้งหมด,
    SUM(CASE WHEN submitted_late = 1 THEN 1 ELSE 0 END) AS ส่งสาย,
    ROUND(SUM(CASE WHEN submitted_late = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS 'เปอร์เซ็นต์ส่งสาย'
FROM documents
WHERE submitted_at IS NOT NULL

UNION ALL

SELECT 
    'Projects' AS ประเภท,
    COUNT(*) AS จำนวนทั้งหมด,
    SUM(CASE WHEN submitted_late = 1 THEN 1 ELSE 0 END) AS ส่งสาย,
    ROUND(SUM(CASE WHEN submitted_late = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS 'เปอร์เซ็นต์ส่งสาย'
FROM project_documents;

-- 5.2 การส่งงานในสัปดาห์ที่ผ่านมา
SELECT 
    DATE_FORMAT(submitted_at, '%Y-%m-%d') AS วันที่,
    COUNT(*) AS ส่งทั้งหมด,
    SUM(CASE WHEN submitted_late = 1 THEN 1 ELSE 0 END) AS ส่งสาย,
    SUM(CASE WHEN submitted_late = 0 THEN 1 ELSE 0 END) AS ส่งทัน
FROM documents
WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE_FORMAT(submitted_at, '%Y-%m-%d')
ORDER BY วันที่ DESC;


-- 6. รายงานสำหรับนักศึกษาแต่ละคน
-- ====================================================

-- 6.1 ประวัติการส่งงานของนักศึกษา (แทน :student_id ด้วยรหัสจริง)
SELECT 
    d.document_id,
    d.document_name AS เอกสาร,
    DATE_FORMAT(d.submitted_at, '%Y-%m-%d %H:%i') AS เวลาที่ส่ง,
    CASE 
        WHEN d.submitted_late = 0 THEN '✅ ทันเวลา'
        ELSE CONCAT('⚠️ ส่งช้า ', FLOOR(d.submission_delay_minutes / 1440), ' วัน')
    END AS สถานะ,
    d.status AS สถานะเอกสาร
FROM documents d
INNER JOIN users u ON d.user_id = u.id
WHERE u.id = :student_id
ORDER BY d.submitted_at DESC;


-- 7. Export สำหรับ Excel/CSV
-- ====================================================

-- 7.1 Export รายงานเอกสารที่ส่งสายแบบละเอียด
SELECT 
    d.document_id,
    u.id AS student_id,
    CONCAT(u.first_name_th, ' ', u.last_name_th) AS student_name,
    d.document_type,
    d.category,
    d.document_name,
    d.submitted_at,
    d.submission_delay_minutes,
    FLOOR(d.submission_delay_minutes / 1440) AS delay_days,
    idl.name AS deadline_name,
    idl.deadline_at,
    d.status AS document_status
FROM documents d
INNER JOIN users u ON d.user_id = u.id
LEFT JOIN important_deadlines idl ON d.important_deadline_id = idl.id
WHERE d.submitted_late = 1
ORDER BY d.submitted_at DESC;
