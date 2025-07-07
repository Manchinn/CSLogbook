// Export ทุกอย่างให้สามารถ import แบบ named และ default ได้

// Import templates
import CS05PDFTemplate from './CS05PDFTemplate';
import OfficialLetterTemplate from './OfficialLetterTemplate';
import AcceptanceLetterTemplate from './AcceptanceLetterTemplate'; // 🆕 เพิ่มใหม่
import StudentSummaryTemplate from './StudentSummaryTemplate';
import CompanyInfoTemplate from './CompanyInfoTemplate';
import ReferralLetterTemplate from './ReferralLetterTemplate'; // 🆕
import InternshipLogbookTemplate from './InternshipLogbookTemplate'; // 🆕
import CertificateTemplate from './CertificateTemplate'; // ✅ เพิ่มใหม่

// Import styles
import { PDFStyles } from './styles';

// Export แบบ named exports สำหรับแต่ละ template
export { default as CS05PDFTemplate } from './CS05PDFTemplate';
export { default as OfficialLetterTemplate } from './OfficialLetterTemplate';
export { default as AcceptanceLetterTemplate } from './AcceptanceLetterTemplate';
export { default as ReferralLetterTemplate } from './ReferralLetterTemplate';
export { default as InternshipLogbookTemplate } from './InternshipLogbookTemplate';
export { default as StudentSummaryTemplate } from './StudentSummaryTemplate';
export { default as CompanyInfoTemplate } from './CompanyInfoTemplate';
export { default as CertificateTemplate } from './CertificateTemplate'; // ✅ เพิ่มใหม่

// Export styles
export * from './styles';

// Export แบบ grouped object
export const PDFTemplates = {
  CS05: CS05PDFTemplate,
  OfficialLetter: OfficialLetterTemplate,
  AcceptanceLetter: AcceptanceLetterTemplate,
  ReferralLetter: ReferralLetterTemplate,
  InternshipLogbook: InternshipLogbookTemplate,
  StudentSummary: StudentSummaryTemplate,
  CompanyInfo: CompanyInfoTemplate,
  Certificate: CertificateTemplate, // ✅ เพิ่มใหม่
};

// Export default สำหรับการใช้งานทั่วไป
export default {
  // Templates แบบ named
  CS05PDFTemplate,
  OfficialLetterTemplate,
  AcceptanceLetterTemplate, // 🆕 เพิ่มใหม่
  ReferralLetterTemplate, // 🆕
  InternshipLogbookTemplate, // 🆕
  StudentSummaryTemplate,
  CompanyInfoTemplate,
  CertificateTemplate, // ✅ เพิ่มใหม่

  // Templates แบบ grouped
  Templates: PDFTemplates,

  // Styles
  Styles: PDFStyles
};