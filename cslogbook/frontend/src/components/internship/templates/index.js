// สำหรับการใช้งานแบบ import ทั้งหมด
import CS05PDFTemplate from './CS05PDFTemplate';
import OfficialLetterTemplate from './OfficialLetterTemplate';
import StudentSummaryTemplate from './StudentSummaryTemplate';
import CompanyInfoTemplate from './CompanyInfoTemplate';
import { PDFStyles } from './styles';

// Styles exports
export * from './styles';

export const PDFTemplates = {
  CS05: CS05PDFTemplate,
  OfficialLetter: OfficialLetterTemplate,
  StudentSummary: StudentSummaryTemplate,
  CompanyInfo: CompanyInfoTemplate
};

export { PDFStyles };

export default {
  Templates: PDFTemplates,
  Styles: PDFStyles
};