/**
 * CSV Export Utility
 * สร้างไฟล์ CSV จากข้อมูล array พร้อม BOM สำหรับรองรับภาษาไทยใน Excel
 */

type Column<T> = {
  key: keyof T;
  header: string;
  /** แปลงค่าก่อน export (optional) */
  format?: (value: T[keyof T], row: T) => string;
};

export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  filename: string
) {
  const BOM = "\uFEFF";
  const separator = ",";

  // Header row
  const headerRow = columns.map((col) => escapeCSV(col.header)).join(separator);

  // Data rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key];
        const value = col.format ? col.format(raw, row) : String(raw ?? "");
        return escapeCSV(value);
      })
      .join(separator)
  );

  const csv = BOM + [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
