// Export ทุกอย่างให้สามารถ import แบบ named และ default ได้

// Import templates
import CS05PDFTemplate from './CS05PDFTemplate';
import OfficialLetterTemplate from './OfficialLetterTemplate';
import StudentSummaryTemplate from './StudentSummaryTemplate';
import CompanyInfoTemplate from './CompanyInfoTemplate';

// Import styles
import { PDFStyles } from './styles';

// Export แบบ named exports สำหรับแต่ละ template
export { CS05PDFTemplate };
export { OfficialLetterTemplate };
export { StudentSummaryTemplate };
export { CompanyInfoTemplate };

// Export styles
export * from './styles';
export { PDFStyles };

// Export แบบ grouped object
export const PDFTemplates = {
  CS05: CS05PDFTemplate,
  OfficialLetter: OfficialLetterTemplate,
  StudentSummary: StudentSummaryTemplate,
  CompanyInfo: CompanyInfoTemplate
};

// Export default สำหรับการใช้งานทั่วไป
export default {
  // Templates แบบ named
  CS05PDFTemplate,
  OfficialLetterTemplate,
  StudentSummaryTemplate,
  CompanyInfoTemplate,
  
  // Templates แบบ grouped
  Templates: PDFTemplates,
  
  // Styles
  Styles: PDFStyles
};