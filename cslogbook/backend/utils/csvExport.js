// utils/csvExport.js
// Lightweight JSON → CSV converter (ไม่ต้อง external dependency)

/**
 * แปลง array of objects เป็น CSV string
 * @param {Array<Object>} rows - ข้อมูล
 * @param {Array<string>} columns - ชื่อ column ที่ต้องการ (ถ้าไม่ส่ง ใช้ keys จาก row แรก)
 * @param {Object} [options]
 * @param {Object} [options.headers] - map column name → display header เช่น { studentCount: 'จำนวนนักศึกษา' }
 * @returns {string} CSV content
 */
function jsonToCsv(rows, columns, options = {}) {
  if (!rows || rows.length === 0) return '';

  const cols = columns || Object.keys(rows[0]);
  const headerMap = options.headers || {};

  // Header row
  const headerLine = cols.map(c => escapeCsv(headerMap[c] || c)).join(',');

  // Data rows
  const dataLines = rows.map(row =>
    cols.map(c => escapeCsv(row[c] ?? '')).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

function escapeCsv(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = { jsonToCsv };
