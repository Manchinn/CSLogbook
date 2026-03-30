// cslogbook/backend/utils/excelExportBuilder.js
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
require('dayjs/locale/th');
const buddhistEra = require('dayjs/plugin/buddhistEra');
dayjs.extend(buddhistEra);

/**
 * Format date to Thai Buddhist era: "30 มี.ค. 2569"
 */
function formatThaiDate(value) {
  if (!value) return '-';
  const d = dayjs(value);
  if (!d.isValid()) return '-';
  return d.locale('th').format('D MMM BBBB');
}

class ExcelExportBuilder {
  constructor(filenamePrefix) {
    this.workbook = new ExcelJS.Workbook();
    this.filenamePrefix = filenamePrefix;
    this.headerStyle = { font: { bold: true } };
    this._filename = null;
  }

  get filename() {
    if (!this._filename) {
      this._filename = `${this.filenamePrefix}_${Date.now()}.xlsx`;
    }
    return this._filename;
  }

  addSheet(name, columns, rows) {
    const ws = this.workbook.addWorksheet(name);
    ws.columns = columns;
    ws.addRows(rows);
    const headerRow = ws.getRow(1);
    Object.assign(headerRow.font, this.headerStyle.font);
    if (this.headerStyle.fill) headerRow.fill = this.headerStyle.fill;
    headerRow.alignment = { vertical: 'middle', wrapText: true };
    return this;
  }

  setHeaderStyle({ bold, fill }) {
    this.headerStyle = {
      font: { bold: bold ?? true },
      fill: fill
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
        : undefined,
    };
    return this;
  }

  async sendResponse(res) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(this.filename)}`
    );
    await this.workbook.xlsx.write(res);
    res.end();
  }

  async toBuffer() {
    return this.workbook.xlsx.writeBuffer();
  }
}

module.exports = { ExcelExportBuilder, formatThaiDate };
