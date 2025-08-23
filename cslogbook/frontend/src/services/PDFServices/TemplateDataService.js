import {
  formatThaiDate,
  calculateInternshipDays,
  formatDurationText,
} from "../../utils/dateUtils";
import {
  formatThaiPhoneNumber,
  formatFullName,
  cleanText,
  formatStudentId,
} from "../../utils/thaiFormatter";

class TemplateDataService {
  /**
   * เตรียมข้อมูลสำหรับ CS05 Template
   * @param {Object} formData - ข้อมูลจากฟอร์ม
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  prepareCS05Data(formData, options = {}) {
    try {
      const defaultOptions = {
        showWatermark: true,
        status: "draft",
        ...options,
      };

      // ตรวจสอบข้อมูลพื้นฐาน
      if (!formData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้าง PDF");
      }

      // เตรียมข้อมูลนักศึกษา
      const studentData = this._prepareStudentData(formData.studentData);

      // คำนวณระยะเวลาฝึกงาน
      const internshipDays = this._calculateDurationDays(
        formData.startDate,
        formData.endDate
      );
      const durationText = formatDurationText(
        formData.startDate,
        formData.endDate
      );

      return {
        // ข้อมูลเอกสาร
        documentId: formData.documentId || "DRAFT",
        status: defaultOptions.status,
        createdDate: formData.createdDate || new Date().toISOString(),
        documentDate: formatThaiDate(new Date().toISOString(), "DD MMMM BBBB"),

        // ข้อมูลนักศึกษา
        studentData: studentData,
        hasTwoStudents:
          Array.isArray(formData.studentData) &&
          formData.studentData.length === 2,

        // ข้อมูลบริษัท
        companyName: cleanText(formData.companyName || ""),
        companyAddress: cleanText(formData.companyAddress || ""),
        internshipPosition: cleanText(formData.internshipPosition || ""),
        contactPersonName: cleanText(formData.contactPersonName || ""),
        contactPersonPosition: cleanText(formData.contactPersonPosition || ""),

        // ข้อมูลระยะเวลา (ใช้ utils ใหม่)
        startDate: formData.startDate,
        endDate: formData.endDate,
        startDateThai: formatThaiDate(formData.startDate, "DD MMMM BBBB"),
        endDateThai: formatThaiDate(formData.endDate, "DD MMMM BBBB"),
        internshipDays: internshipDays,
        internshipDuration: durationText,
        durationDisplay: `${internshipDays} วัน`,

        // ข้อมูลเพิ่มเติม
        jobDescription: cleanText(formData.jobDescription || ""),
        additionalRequirements: cleanText(
          formData.additionalRequirements || ""
        ),

        // ข้อมูลมหาวิทยาลัย
        universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        facultyName: "คณะวิทยาศาสตร์ประยุกต์",
        departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",

        // ตัวเลือก
        showWatermark: defaultOptions.showWatermark,
        watermarkText:
          defaultOptions.status === "draft" ? "ร่าง" : "อนุมัติแล้ว",
      };
    } catch (error) {
      console.error("Error preparing CS05 data:", error);
      throw new Error(`ไม่สามารถเตรียมข้อมูล CS05 ได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับ Official Letter Template
   * @param {Object} letterData - ข้อมูลหนังสือ
   */
  prepareOfficialLetterData(letterData) {
    try {
      if (!letterData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างหนังสือ");
      }

      // เตรียมข้อมูลนักศึกษา
      const studentData = this._prepareStudentData(letterData.studentData);

      // คำนวณระยะเวลาฝึกงาน
      const internshipDays = this._calculateDurationDays(
        letterData.startDate,
        letterData.endDate
      );

      return {
        // ข้อมูลเอกสาร
        documentNumber: this._generateDocumentNumber(letterData.documentNumber),
        documentDate: letterData.documentDate || new Date().toISOString(),
        documentDateThai: formatThaiDate(
          letterData.documentDate || new Date().toISOString(),
          "DD MMMM BBBB"
        ),

        // ข้อมูลผู้รับ - เพิ่มการตรวจสอบ defensive
        companyName: cleanText(letterData.companyName || ""),
        companyAddress: cleanText(letterData.companyAddress || ""),
        contactPersonName: cleanText(letterData.contactPersonName || ""),
        contactPersonPosition: cleanText(
          letterData.contactPersonPosition || ""
        ),

        // ข้อมูลนักศึกษา
        studentData: studentData,
        hasTwoStudents: Array.isArray(studentData) && studentData.length === 2,

        // ข้อมูลระยะเวลา
        startDate: letterData.startDate,
        endDate: letterData.endDate,
        startDateThai: formatThaiDate(letterData.startDate, "DD MMMM BBBB"),
        endDateThai: formatThaiDate(letterData.endDate, "DD MMMM BBBB"),
        internshipDays: internshipDays,
        durationText: formatDurationText(
          letterData.startDate,
          letterData.endDate
        ),

        // ข้อมูลอาจารย์
        advisorTitle: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        advisorName: "รองศาสตราจารย์ ดร.ธนภัทร์ อนุศาสน์อมรกุล",

        // ข้อมูลเพิ่มเติม
        internshipPosition: cleanText(letterData.internshipPosition || ""),

        // ข้อมูลมหาวิทยาลัย
        universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        facultyName: "คณะวิทยาศาสตร์ประยุกต์",
        departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        address: "1518 ถ.ประชาราษฎร์ 1 เขตบางซื่อ กทม.10800",
        phone: "02-555-2000",
        website: "http://www.cs.kmutnb.ac.th/",
      };
    } catch (error) {
      console.error("Error preparing Official Letter data:", error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลหนังสือได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับ Student Summary Template
   * @param {Object} summaryData - ข้อมูลสรุปนักศึกษา
   */
  prepareStudentSummaryData(summaryData) {
    try {
      if (!summaryData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างสรุปนักศึกษา");
      }

      const studentData = this._prepareStudentData(summaryData.studentData);
      const timelineData = this.createTimelineData(summaryData);

      return {
        // ข้อมูลเอกสาร
        documentId: summaryData.documentId || "SUMMARY",
        createdDate: summaryData.createdDate || new Date().toISOString(),
        createdDateThai: formatThaiDate(
          summaryData.createdDate || new Date().toISOString(),
          "DD MMMM BBBB"
        ),

        // ข้อมูลนักศึกษา
        studentData: studentData,
        hasTwoStudents: Array.isArray(studentData) && studentData.length === 2,

        // ข้อมูลบริษัท
        companyName: cleanText(summaryData.companyName || ""),
        companyAddress: cleanText(summaryData.companyAddress || ""),
        internshipPosition: cleanText(summaryData.internshipPosition || ""),

        // ข้อมูลระยะเวลา
        startDate: summaryData.startDate,
        endDate: summaryData.endDate,
        startDateThai: formatThaiDate(summaryData.startDate, "DD MMMM BBBB"),
        endDateThai: formatThaiDate(summaryData.endDate, "DD MMMM BBBB"),
        internshipDays: this._calculateDurationDays(
          summaryData.startDate,
          summaryData.endDate
        ),
        durationText: formatDurationText(
          summaryData.startDate,
          summaryData.endDate
        ),

        // ข้อมูล Timeline
        timeline: timelineData,
        completedSteps: timelineData.filter(
          (step) => step.status === "completed"
        ).length,
        totalSteps: timelineData.length,
        progressPercentage: Math.round(
          (timelineData.filter((step) => step.status === "completed").length /
            timelineData.length) *
            100
        ),

        // ข้อมูลมหาวิทยาลัย
        universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        facultyName: "คณะวิทยาศาสตร์ประยุกต์",
        departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
      };
    } catch (error) {
      console.error("Error preparing Student Summary data:", error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลสรุปนักศึกษาได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับ Company Info Template
   * @param {Object} companyData - ข้อมูลบริษัท
   */
  prepareCompanyInfoData(companyData) {
    try {
      if (!companyData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างข้อมูลบริษัท");
      }

      const timelineData = this.createTimelineData(companyData);

      return {
        // ข้อมูลเอกสาร
        documentId: companyData.documentId || "COMPANY_INFO",
        createdDate: companyData.createdDate || new Date().toISOString(),
        createdDateThai: formatThaiDate(
          companyData.createdDate || new Date().toISOString(),
          "DD MMMM BBBB"
        ),

        // สถานะ CS05
        cs05Status: companyData.cs05Status || "unknown",
        cs05StatusText: this._getStatusText(companyData.cs05Status),

        // ข้อมูลบริษัท
        companyName: cleanText(companyData.companyName || ""),
        companyAddress: cleanText(companyData.companyAddress || ""),
        internshipPosition: cleanText(companyData.internshipPosition || ""),
        contactPersonName: cleanText(companyData.contactPersonName || ""),
        contactPersonPosition: cleanText(
          companyData.contactPersonPosition || ""
        ),

        // ข้อมูลผู้ควบคุมงาน (ใช้ utils ใหม่)
        supervisorName: cleanText(companyData.supervisorName || ""),
        supervisorPosition: cleanText(companyData.supervisorPosition || ""),
        supervisorPhone: formatThaiPhoneNumber(
          companyData.supervisorPhone || ""
        ),
        supervisorEmail: cleanText(companyData.supervisorEmail || ""),

        // ข้อมูลระยะเวลา
        startDate: companyData.startDate,
        endDate: companyData.endDate,
        startDateThai: formatThaiDate(companyData.startDate, "DD MMMM BBBB"),
        endDateThai: formatThaiDate(companyData.endDate, "DD MMMM BBBB"),
        internshipDays: this._calculateDurationDays(
          companyData.startDate,
          companyData.endDate
        ),
        durationText: formatDurationText(
          companyData.startDate,
          companyData.endDate
        ),

        // ข้อมูลการดำเนินงาน
        cs05SubmissionDate: companyData.cs05SubmissionDate,
        cs05SubmissionDateThai: formatThaiDate(
          companyData.cs05SubmissionDate,
          "DD MMMM BBBB"
        ),
        cs05ApprovalDate: companyData.cs05ApprovalDate,
        cs05ApprovalDateThai: formatThaiDate(
          companyData.cs05ApprovalDate,
          "DD MMMM BBBB"
        ),
        companyInfoSubmissionDate: companyData.companyInfoSubmissionDate,
        companyInfoSubmissionDateThai: formatThaiDate(
          companyData.companyInfoSubmissionDate,
          "DD MMMM BBBB"
        ),
        internshipStarted: companyData.internshipStarted || false,

        // ข้อมูลนักศึกษา
        studentId: formatStudentId(companyData.studentId || ""),

        // ข้อมูล Timeline
        timeline: timelineData,
        completedSteps: timelineData.filter(
          (step) => step.status === "completed"
        ).length,
        totalSteps: timelineData.length,
        progressPercentage: Math.round(
          (timelineData.filter((step) => step.status === "completed").length /
            timelineData.length) *
            100
        ),

        // ข้อมูลมหาวิทยาลัย
        universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        facultyName: "คณะวิทยาศาสตร์ประยุกต์",
        departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
      };
    } catch (error) {
      console.error("Error preparing Company Info data:", error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลบริษัทได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับแบบฟอร์มหนังสือตอบรับ
   * @param {Object} letterData - ข้อมูลหนังสือ
   */
  prepareAcceptanceFormData(letterData) {
    try {
      if (!letterData) {
        return {
          documentDate: new Date(),
          studentData: [],
        };
      }

      return {
        // ข้อมูลเอกสาร
        documentNumber: letterData.documentNumber || "",
        documentDate: letterData.documentDate || new Date(),
        letterDate: letterData.documentDate || new Date(),

        // ข้อมูลบริษัท
        companyName: letterData.companyName || "",
        companyAddress: letterData.companyAddress || "",
        contactPhone: letterData.contactPhone || "",
        contactPersonPosition: letterData.contactPersonPosition || "",
        internshipPosition: letterData.internshipPosition || "",

        // ข้อมูลนักศึกษา
        studentData: letterData.studentData || [],

        // ข้อมูลระยะเวลา
        startDate: letterData.startDate || "",
        endDate: letterData.endDate || "",
        internshipDays: letterData.internshipDays || 0,
      };
    } catch (error) {
      console.error("Error preparing acceptance form data:", error);
      return {
        documentDate: new Date(),
        studentData: [],
      };
    }
  }

  /**
   * 🆕 เตรียมข้อมูลสำหรับ Referral Letter Template
   * @param {Object} referralData - ข้อมูลหนังสือส่งตัว
   */
  prepareReferralLetterData(referralData) {
    try {
      if (!referralData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างหนังสือส่งตัว");
      }

      // เตรียมข้อมูลนักศึกษา
      const studentData = this._prepareStudentData(referralData.studentData);

      // คำนวณระยะเวลาฝึกงาน
      const internshipDays = this._calculateDurationDays(
        referralData.startDate,
        referralData.endDate
      );

      return {
        // ข้อมูลเอกสาร
        documentNumber: this._generateDocumentNumber(
          referralData.documentNumber
        ),
        documentDate: referralData.documentDate || new Date().toISOString(),
        documentDateThai: formatThaiDate(
          referralData.documentDate || new Date().toISOString(),
          "DD MMMM BBBB"
        ),

        // ข้อมูลบริษัท
        companyName: cleanText(referralData.companyName || ""),
        companyAddress: cleanText(referralData.companyAddress || ""),
        contactPersonName: cleanText(referralData.contactPersonName || ""),
        contactPersonPosition: cleanText(
          referralData.contactPersonPosition || ""
        ),

        // ข้อมูลผู้ควบคุมงาน - สำหรับหนังสือส่งตัว
        supervisorName: cleanText(referralData.supervisorName || ""),
        supervisorPosition: cleanText(referralData.supervisorPosition || ""),
        supervisorPhone: formatThaiPhoneNumber(
          referralData.supervisorPhone || ""
        ),
        supervisorEmail: cleanText(referralData.supervisorEmail || ""),

        // ข้อมูลนักศึกษา
        studentData: studentData,
        hasTwoStudents: Array.isArray(studentData) && studentData.length === 2,

        // ข้อมูลระยะเวลา
        startDate: referralData.startDate,
        endDate: referralData.endDate,
        startDateThai: formatThaiDate(referralData.startDate, "DD MMMM BBBB"),
        endDateThai: formatThaiDate(referralData.endDate, "DD MMMM BBBB"),
        internshipDays: internshipDays,
        durationText: formatDurationText(
          referralData.startDate,
          referralData.endDate
        ),

        // ข้อมูลตำแหน่งฝึกงาน
        internshipPosition: cleanText(referralData.internshipPosition || ""),

        // ข้อมูลอาจารย์
        advisorTitle: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        advisorName: "รองศาสตราจารย์ ดร.ธนภัทร์ อนุศาสน์อมรกุล",

        // ข้อมูลมหาวิทยาลัย
        universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        facultyName: "คณะวิทยาศาสตร์ประยุกต์",
        departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        address: "1518 ถ.ประชาราษฎร์ 1 เขตบางซื่อ กทม.10800",
        phone: "02-555-2000",
      };
    } catch (error) {
      console.error("Error preparing Referral Letter data:", error);
      throw new Error(
        `ไม่สามารถเตรียมข้อมูลหนังสือส่งตัวได้: ${error.message}`
      );
    }
  }

  /**
   * 🆕 เตรียมข้อมูลสำหรับ Internship Logbook Template
   * @param {Object} logbookData - ข้อมูลบันทึกฝึกงาน
   * @param {Object} summaryData - ข้อมูลสรุปการฝึกงาน (optional)
   * @param {Object} userInfo - ข้อมูลผู้ใช้ (optional)
   */
  prepareInternshipLogbookData(logbookData, summaryData = null, userInfo = null) {
    try {
      console.log('🔍 Preparing internship logbook data:', { logbookData, summaryData, userInfo });

      if (!logbookData && !summaryData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างบันทึกฝึกงาน");
      }

      // 🔧 รวมข้อมูลจากแหล่งต่างๆ โดยให้ logbookData เป็นหลัก
      const combinedData = {
        ...summaryData,
        ...logbookData,
      };

      // 🆕 เติม fallback จากโครงสร้างแบบ backend summaryFull (companyInfo, internshipPeriod, studentInfo)
      if (combinedData.companyInfo) {
        combinedData.companyName = combinedData.companyName || combinedData.companyInfo.companyName;
        combinedData.companyAddress = combinedData.companyAddress || combinedData.companyInfo.companyAddress;
        combinedData.supervisorName = combinedData.supervisorName || combinedData.companyInfo.supervisorName;
        combinedData.supervisorPosition = combinedData.supervisorPosition || combinedData.companyInfo.supervisorPosition;
        combinedData.supervisorPhone = combinedData.supervisorPhone || combinedData.companyInfo.supervisorPhone;
        combinedData.supervisorEmail = combinedData.supervisorEmail || combinedData.companyInfo.supervisorEmail;
      }
      if (combinedData.internshipPeriod) {
        combinedData.startDate = combinedData.startDate || combinedData.internshipPeriod.startDate;
        combinedData.endDate = combinedData.endDate || combinedData.internshipPeriod.endDate;
      }
      if (combinedData.studentInfo) {
        // เติม yearLevel / classroom ถ้ายังไม่มีใน studentInfo เดิมที่ถูกเลือก
        combinedData.yearLevel = combinedData.yearLevel || combinedData.studentInfo.yearLevel;
        combinedData.classroom = combinedData.classroom || combinedData.studentInfo.classroom;
        combinedData.phoneNumber = combinedData.phoneNumber || combinedData.studentInfo.phoneNumber;
      }

      // ✅ เตรียมข้อมูลนักศึกษาจากหลายแหล่ง
      const studentData = this._prepareLogbookStudentInfo(combinedData, userInfo);
      console.log('📊 Final student data prepared:', studentData);

      // ✅ คำนวณสถิติการฝึกงาน
      const statistics = this._calculateLogbookStatistics(combinedData);

      // ✅ จัดรูปแบบบันทึกรายวัน
      const formattedEntries = this._formatLogbookEntries(combinedData.entries || combinedData.logEntries || []);

      return {
        // ข้อมูลเอกสาร
        documentId: combinedData.documentId || `LOGBOOK-${Date.now()}`,
        documentDate: new Date(),
        documentDateThai: formatThaiDate(new Date(), "DD MMMM BBBB"),

        // ข้อมูลนักศึกษา (รองรับหลายรูปแบบ)
        studentData: studentData ? [studentData] : [],

        // ข้อมูลบริษัท
        companyName: cleanText(
          combinedData.companyName || 
          combinedData.company?.name || 
          ""
        ),
        companyAddress: cleanText(
          combinedData.companyAddress || 
          combinedData.company?.address || 
          ""
        ),

        // ข้อมูลผู้ควบคุมงาน
        supervisorName: cleanText(
          combinedData.supervisorName || 
          combinedData.supervisor?.name || 
          ""
        ),
        supervisorPosition: cleanText(
          combinedData.supervisorPosition || 
          combinedData.supervisor?.position || 
          ""
        ),
        supervisorPhone: formatThaiPhoneNumber(
          combinedData.supervisorPhone || 
          combinedData.supervisor?.phone || 
          ""
        ),
        supervisorEmail: cleanText(
          combinedData.supervisorEmail || 
          combinedData.supervisor?.email || 
          ""
        ),

        // ข้อมูลระยะเวลา
  startDate: combinedData.startDate,
  endDate: combinedData.endDate,
        startDateThai: formatThaiDate(combinedData.startDate, "DD MMMM BBBB"),
        endDateThai: formatThaiDate(combinedData.endDate, "DD MMMM BBBB"),
        internshipDays: this._calculateDurationDays(
          combinedData.startDate,
          combinedData.endDate
        ),
        durationText: formatDurationText(
          combinedData.startDate,
          combinedData.endDate
        ),

        // บันทึกรายวัน - ในรูปแบบที่ template ต้องการ
        logEntries: {
          entries: formattedEntries,
        },

        // บทสรุปประสบการณ์
        reflection: this._prepareReflectionData(combinedData.reflection),

        // สถิติการฝึกงาน
        statistics: statistics,

        // ข้อมูลมหาวิทยาลัย
        universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        facultyName: "คณะวิทยาศาสตร์ประยุกต์",
        departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",

        // การจัดรูปแบบ
        generatedDate: new Date(),
        generatedDateThai: formatThaiDate(new Date(), "DD MMMM BBBB HH:mm"),

        // เพิ่มข้อมูลเพื่อ debugging
        sourceDataTypes: {
          hasLogbookData: !!logbookData,
          hasSummaryData: !!summaryData,
          hasUserInfo: !!userInfo,
          entriesCount: formattedEntries.length,
        }
      };
    } catch (error) {
      console.error("Error preparing internship logbook data:", error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลบันทึกฝึกงานได้: ${error.message}`);
    }
  }

  /**
   * 🆕 Helper method สำหรับเตรียมข้อมูลนักศึกษาสำหรับ logbook
   * @param {Object} combinedData - ข้อมูลที่รวมแล้ว
   * @param {Object} userInfo - ข้อมูลผู้ใช้
   */
  _prepareLogbookStudentInfo(combinedData, userInfo) {
    console.log('🔍 _prepareLogbookStudentInfo inputs:', { 
      combinedData: {
        studentInfo: combinedData?.studentInfo,
        student: combinedData?.student,
        studentData: combinedData?.studentData,
        firstName: combinedData?.firstName,
        lastName: combinedData?.lastName,
        fullName: combinedData?.fullName,
        studentId: combinedData?.studentId
      }, 
      userInfo 
    });

    // ลำดับความสำคัญในการหาข้อมูลนักศึกษา
    let studentInfo = null;
    let dataSource = "none";

    // 1. จาก userInfo (ความสำคัญสูงสุด)
    if (userInfo && (userInfo.firstName || userInfo.lastName || userInfo.fullName)) {
      studentInfo = userInfo;
      dataSource = "userInfo";
    }
    // 2. จาก combinedData.studentInfo
    else if (combinedData.studentInfo && (combinedData.studentInfo.firstName || combinedData.studentInfo.lastName || combinedData.studentInfo.fullName)) {
      studentInfo = combinedData.studentInfo;
      dataSource = "combinedData.studentInfo";
    }
    // 3. จาก combinedData.student
    else if (combinedData.student && (combinedData.student.firstName || combinedData.student.lastName || combinedData.student.fullName)) {
      studentInfo = combinedData.student;
      dataSource = "combinedData.student";
    }
    // 4. จาก combinedData.studentData[0] (ตรวจสอบว่าไม่ใช่ข้อมูลว่าง)
    else if (combinedData.studentData && Array.isArray(combinedData.studentData) && combinedData.studentData[0]) {
      const candidate = combinedData.studentData[0];
      if (candidate.firstName || candidate.lastName || candidate.fullName || candidate.studentId) {
        studentInfo = candidate;
        dataSource = "combinedData.studentData[0]";
      }
    }
    // 5. จาก combined data โดยตรง
    else if (combinedData.firstName || combinedData.lastName || combinedData.fullName || combinedData.studentId) {
      studentInfo = combinedData;
      dataSource = "combinedData direct";
    }
    // 6. 🆕 พยายามหาจาก localStorage หรือ context (fallback)
    else {
      try {
        const cachedUserInfo = localStorage.getItem('userInfo');
        if (cachedUserInfo) {
          const parsed = JSON.parse(cachedUserInfo);
          if (parsed && (parsed.firstName || parsed.lastName || parsed.fullName)) {
            studentInfo = parsed;
            dataSource = "localStorage.userInfo";
            console.log('📦 Found student info in localStorage:', parsed);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error reading from localStorage:', error);
      }
    }

    if (!studentInfo) {
      console.warn('⚠️ No student information found in any data source, creating default info');
      // สร้างข้อมูลพื้นฐานเพื่อป้องกันการ crash
      return {
        fullName: "นักศึกษาฝึกงาน",
        firstName: "",
        lastName: "",
        studentId: "",
        yearLevel: "",
        yearLevelText: "",
        classroom: "",
        phoneNumber: "",
        email: "",
        title: "",
        totalCredits: 0,
        totalCreditsText: "0 หน่วยกิต",
      };
    }

    console.log(`✅ Student info found from: ${dataSource}`, studentInfo);

    return {
      fullName: cleanText(
        studentInfo.fullName ||
        formatFullName(studentInfo.firstName, studentInfo.lastName, studentInfo.title) ||
        `${studentInfo.firstName || ""} ${studentInfo.lastName || ""}`.trim() ||
        "นักศึกษาฝึกงาน"
      ),
      firstName: cleanText(studentInfo.firstName || ""),
      lastName: cleanText(studentInfo.lastName || ""),
  // บังคับเป็น string เพื่อเลี่ยงปัญหา trim กับ number
  studentId: String(formatStudentId(studentInfo.studentId || studentInfo.student_id || "")),
      yearLevel: studentInfo.yearLevel || studentInfo.year_level || "",
      yearLevelText: studentInfo.yearLevel || studentInfo.year_level
        ? `ชั้นปีที่ ${studentInfo.yearLevel || studentInfo.year_level}`
        : "",
      classroom: cleanText(studentInfo.classroom || studentInfo.class || ""),
      phoneNumber: formatThaiPhoneNumber(studentInfo.phoneNumber || studentInfo.phone || ""),
      email: cleanText(studentInfo.email || ""),
      title: cleanText(studentInfo.title || ""),
      totalCredits: studentInfo.totalCredits || studentInfo.total_credits || 0,
      totalCreditsText: `${studentInfo.totalCredits || studentInfo.total_credits || 0} หน่วยกิต`,
    };
  }

  /**
   * 🆕 Helper method สำหรับคำนวณสถิติการฝึกงาน
   * @param {Object} combinedData - ข้อมูลที่รวมแล้ว
   */
  _calculateLogbookStatistics(combinedData) {
    const entries = combinedData.entries || combinedData.logEntries || [];
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return {
        totalDays: 0,
        totalHours: 0,
        averageHours: 0,
      };
    }

    const totalDays = entries.length;
    
    // คำนวณชั่วโมงรวม
    const totalHours = entries.reduce((sum, entry) => {
      const hours = parseFloat(
        entry.approvedHours || 
        entry.totalHours || 
        entry.workHours || 
        entry.hours || 
        0
      );
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);

    const averageHours = totalDays > 0 ? (totalHours / totalDays) : 0;

    return {
      totalDays,
      totalHours: Math.round(totalHours * 100) / 100, // ปัดทศนิยม 2 ตำแหน่ง
      averageHours: Math.round(averageHours * 100) / 100,
    };
  }

  /**
   * 🆕 Helper method สำหรับจัดรูปแบบบันทึกรายวัน
   * @param {Array} entries - รายการบันทึก
   */
  _formatLogbookEntries(entries) {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.map((entry, index) => {
      if (!entry) {
        console.warn(`⚠️ Log entry at index ${index} is null or undefined`);
        return null;
      }

      return {
        // ข้อมูลวันที่
        workDate: entry.workDate || entry.date,
        workDateThai: formatThaiDate(entry.workDate || entry.date, "DD MMMM BBBB"),
        
        // ข้อมูลเวลา
        timeIn: entry.timeIn || entry.startTime || "",
        timeOut: entry.timeOut || entry.endTime || "",
        
        // กิจกรรมและผลงาน
        activities: cleanText(
          entry.activities || 
          entry.workDescription || 
          entry.description || 
          entry.activity || 
          ""
        ),
        
        // ความรู้ที่ได้รับ
        learnings: cleanText(
          entry.learnings || 
          entry.knowledgeGained || 
          entry.learningOutcome || 
          entry.knowledge || 
          ""
        ),
        
        // ชั่วโมงทำงาน
        workHours: parseFloat(
          entry.approvedHours || 
          entry.totalHours || 
          entry.workHours || 
          entry.hours || 
          0
        ),
        approvedHours: parseFloat(
          entry.approvedHours || 
          entry.totalHours || 
          entry.workHours || 
          entry.hours || 
          0
        ),
        
        // สถานะ
        status: entry.status || "completed",
        
        // ข้อมูลเพิ่มเติม
        notes: cleanText(entry.notes || entry.remarks || ""),
      };
    }).filter(entry => entry !== null); // กรองข้อมูลที่ null ออก
  }

  /**
   * 🆕 Helper method สำหรับเตรียมข้อมูลบทสรุป - ปรับปรุงการ mapping
   * @param {Object} reflectionData - ข้อมูลบทสรุป
   */
  _prepareReflectionData(reflectionData) {
    if (!reflectionData) {
      return null;
    }

    return {
      // รองรับหลายรูปแบบของ reflection data
      experience: cleanText(
        reflectionData.experience || 
        reflectionData.learningOutcome || 
        ""
      ),
      skillsLearned: cleanText(
        reflectionData.skillsLearned || 
        reflectionData.skills || 
        reflectionData.keyLearnings || 
        ""
      ),
      challenges: cleanText(
        reflectionData.challenges || 
        reflectionData.problems || 
        reflectionData.improvements || 
        ""
      ),
      suggestions: cleanText(
        reflectionData.suggestions || 
        reflectionData.recommendations || 
        reflectionData.futureApplication || 
        ""
      ),
      overallRating: reflectionData.overallRating || reflectionData.rating || 0,
      wouldRecommend: reflectionData.wouldRecommend || false,
    };
  }

  /**
   * เตรียมข้อมูลนักศึกษา (แก้ไขเพื่อป้องกัน TypeError)
   * @param {Array} studentData - ข้อมูลนักศึกษา
   */
  _prepareStudentData(studentData) {
    if (!Array.isArray(studentData)) {
      return [];
    }

    return studentData
      .map((student, index) => {
        if (!student) {
          console.warn(`Student data at index ${index} is null or undefined`);
          return null;
        }

        return {
          // ใช้ || operator และ fallback values เพื่อป้องกัน undefined/null
          fullName: cleanText(student.fullName ?? ""),
          studentId: formatStudentId(student.studentId ?? ""),
          yearLevel: student.yearLevel ?? "",
          yearLevelText: student.yearLevel
            ? `ชั้นปีที่ ${student.yearLevel}`
            : "",
          classroom: cleanText(student.classroom ?? ""),
          phoneNumber: formatThaiPhoneNumber(student.phoneNumber ?? ""),
          totalCredits: student.totalCredits ?? 0,
          totalCreditsText: `${student.totalCredits ?? 0} หน่วยกิต`,
        };
      })
      .filter((student) => student !== null); // กรองข้อมูลที่ null ออก
  }

  /**
   * คำนวณระยะเวลาฝึกงานเป็นจำนวนวัน (ใช้ utils ใหม่)
   * @param {string} startDate - วันเริ่มต้น
   * @param {string} endDate - วันสิ้นสุด
   */
  _calculateDurationDays(startDate, endDate) {
    if (!startDate || !endDate) {
      return 0;
    }

    try {
      return calculateInternshipDays(startDate, endDate);
    } catch (error) {
      console.error("Error calculating duration days:", error);
      return 0;
    }
  }

  /**
   * สร้างหมายเลขเอกสาร
   * @param {string} existingNumber - หมายเลขที่มีอยู่
   */
  _generateDocumentNumber(existingNumber) {
    if (existingNumber) {
      return existingNumber;
    }

    // สร้างเลข 3 หลักจากเวลาปัจจุบัน (ม็อด 1000 = 0-999)
    const threedigits = String(Date.now() % 1000).padStart(3, "0");

    // รูปแบบใหม่: อว 7105(05)/XXX
    return `อว 7105(05)/${threedigits}`;
  }

  /**
   * สร้างหมายเลขเอกสารใหม่ (public method)
   * @returns {string} - หมายเลขเอกสารที่สร้างขึ้น
   */
  generateNewDocumentNumber() {
    return this._generateDocumentNumber();
  }

  /**
   * 🆕 สร้างหมายเลขหนังสือรับรอง
   * @returns {string} หมายเลขหนังสือรับรอง
   */
  generateCertificateNumber() {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 999).toString().padStart(3, "0");
    
    return `อว 7105(16)/${month}${year.toString().slice(-2)}-${random}`;
  }

  /**
   * แปลงสถานะเป็นข้อความ
   * @param {string} status - สถานะ
   */
  _getStatusText(status) {
    const statusMap = {
      pending: "รอการพิจารณา",
      approved: "อนุมัติแล้ว",
      rejected: "ไม่อนุมัติ",
      draft: "ร่าง",
    };

    return statusMap[status] || "ไม่ทราบสถานะ";
  }

  /**
   * ตรวจสอบความครบถ้วนของข้อมูล
   * @param {Object} data - ข้อมูลที่ต้องตรวจสอบ
   * @param {Array} requiredFields - ฟิลด์ที่จำเป็น
   */
  validateRequiredFields(data, requiredFields) {
    const missing = [];

    requiredFields.forEach((field) => {
      const value = this._getNestedValue(data, field);
      if (!value || (typeof value === "string" && value.trim() === "")) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      throw new Error(`ข้อมูลไม่ครบถ้วน: ${missing.join(", ")}`);
    }

    return true;
  }

  /**
   * ดึงค่าจาก nested object
   * @param {Object} obj - object ต้นทาง
   * @param {string} path - path ของข้อมูล (เช่น 'studentData.0.fullName')
   */
  _getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * จัดรูปแบบข้อมูลวันที่ (ใช้ utils ใหม่)
   * @param {string} dateString - วันที่ในรูปแบบ string
   * @param {string} format - รูปแบบที่ต้องการ
   */
  formatDate(dateString, format = "DD MMMM BBBB") {
    return formatThaiDate(dateString, format);
  }

  /**
   * สร้างข้อมูลสำหรับ Timeline (ปรับปรุงใหม่)
   * @param {Object} data - ข้อมูลต้นฉบับ
   */
  createTimelineData(data) {
    const steps = [
      {
        title: "ส่งแบบฟอร์ม CS05",
        desc: "นักศึกษาส่งคำร้องขอฝึกงาน",
        status: data.cs05SubmissionDate ? "completed" : "waiting",
        date: data.cs05SubmissionDate,
        dateThai: formatThaiDate(data.cs05SubmissionDate, "DD MMMM BBBB"),
        icon: "📝",
      },
      {
        title: "การอนุมัติ CS05",
        desc: "อาจารย์พิจารณาและอนุมัติคำร้อง",
        status:
          data.cs05Status === "approved"
            ? "completed"
            : data.cs05Status === "pending"
            ? "pending"
            : data.cs05Status === "rejected"
            ? "error"
            : "waiting",
        date: data.cs05ApprovalDate,
        dateThai: formatThaiDate(data.cs05ApprovalDate, "DD MMMM BBBB"),
        icon:
          data.cs05Status === "approved"
            ? "✅"
            : data.cs05Status === "pending"
            ? "⏳"
            : data.cs05Status === "rejected"
            ? "❌"
            : "⚪",
      },
      {
        title: "กรอกข้อมูลสถานประกอบการ",
        desc: "กรอกข้อมูลผู้ควบคุมงานและรายละเอียดเพิ่มเติม",
        status:
          data.supervisorName && data.supervisorPhone && data.supervisorEmail
            ? "completed"
            : "waiting",
        date: data.companyInfoSubmissionDate,
        dateThai: formatThaiDate(
          data.companyInfoSubmissionDate,
          "DD MMMM BBBB"
        ),
        icon: data.supervisorName ? "🏢" : "⚪",
      },
      {
        title: "เริ่มฝึกงาน",
        desc: "เริ่มการฝึกงานตามระยะเวลาที่กำหนด",
        status: data.internshipStarted
          ? "completed"
          : data.startDate && new Date(data.startDate) <= new Date()
          ? "pending"
          : "waiting",
        date: data.startDate,
        dateThai: formatThaiDate(data.startDate, "DD MMMM BBBB"),
        icon: data.internshipStarted ? "🎯" : "⚪",
      },
      {
        title: "สิ้นสุดการฝึกงาน",
        desc: "เสร็จสิ้นการฝึกงานตามระยะเวลาที่กำหนด",
        status:
          data.endDate && new Date(data.endDate) < new Date()
            ? "completed"
            : "waiting",
        date: data.endDate,
        dateThai: formatThaiDate(data.endDate, "DD MMMM BBBB"),
        icon: data.endDate && new Date(data.endDate) < new Date() ? "🎉" : "⚪",
      },
    ];

    return steps;
  }

  /**
   * สร้างข้อมูลสถิติสำหรับ Dashboard
   * @param {Object} data - ข้อมูลต้นฉบับ
   */
  createStatisticsData(data) {
    const timeline = this.createTimelineData(data);
    const completedSteps = timeline.filter(
      (step) => step.status === "completed"
    ).length;
    const totalSteps = timeline.length;
    const pendingSteps = timeline.filter(
      (step) => step.status === "pending"
    ).length;
    const errorSteps = timeline.filter(
      (step) => step.status === "error"
    ).length;

    return {
      completedSteps,
      totalSteps,
      pendingSteps,
      errorSteps,
      progressPercentage: Math.round((completedSteps / totalSteps) * 100),
      nextAction: this._getNextAction(timeline),
      estimatedCompletion: this._estimateCompletion(data, timeline),
    };
  }

  /**
   * หาการดำเนินการถัดไป
   * @param {Array} timeline - ข้อมูล timeline
   */
  _getNextAction(timeline) {
    const nextStep = timeline.find(
      (step) => step.status === "waiting" || step.status === "pending"
    );

    if (!nextStep) {
      return {
        title: "เสร็จสิ้นทุกขั้นตอน",
        desc: "การดำเนินการเสร็จสิ้นแล้ว",
        priority: "low",
      };
    }

    const priorityMap = {
      pending: "high",
      waiting: "medium",
    };

    return {
      title: nextStep.title,
      desc: nextStep.desc,
      priority: priorityMap[nextStep.status] || "low",
    };
  }

  /**
   * ประเมินเวลาเสร็จสิ้น
   * @param {Object} data - ข้อมูลต้นฉบับ
   * @param {Array} timeline - ข้อมูล timeline
   */
  _estimateCompletion(data, timeline) {
    if (data.endDate) {
      return {
        date: data.endDate,
        dateThai: formatThaiDate(data.endDate, "DD MMMM BBBB"),
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(data.endDate) - new Date()) / (1000 * 60 * 60 * 24)
          )
        ),
      };
    }

    return {
      date: null,
      dateThai: "ยังไม่กำหนด",
      daysRemaining: null,
    };
  }

  /**
   * ตรวจสอบความพร้อมของข้อมูลสำหรับแต่ละ template
   * @param {string} templateType - ประเภท template
   * @param {Object} data - ข้อมูล
   */
  validateDataForTemplate(templateType, data) {
    const requiredFieldsMap = {
      cs05: [
        "companyName",
        "companyAddress",
        "startDate",
        "endDate",
        "studentData.0.fullName",
      ],
      official_letter: [
        "companyName",
        "contactPersonName",
        "startDate",
        "endDate",
        "studentData.0.fullName",
      ],
      student_summary: ["studentData.0.fullName", "companyName"],
      company_info: [
        "companyName",
        "supervisorName",
        "supervisorPhone",
        "supervisorEmail",
      ],
    };

    const requiredFields = requiredFieldsMap[templateType];
    if (!requiredFields) {
      throw new Error(`ไม่รองรับประเภท template: ${templateType}`);
    }

    return this.validateRequiredFields(data, requiredFields);
  }

  /**
   * รีเซ็ตข้อมูล cache (ถ้ามี)
   */
  clearCache() {
    // สำหรับการใช้งานในอนาคต
    console.log("Template data cache cleared");
  }

  /**
   * ตรวจสอบสถานะ service (อัปเดตใหม่)
   */
  getStatus() {
    return {
      isReady: true,
      version: "1.4.0", // เพิ่มเวอร์ชัน
      supportedTemplates: [
        "cs05",
        "official_letter",
        "acceptance_letter",
        "referral_letter",
        "internship_logbook", // 🆕 เพิ่มใหม่
        "student_summary",
        "company_info",
      ],
      utilsIntegrated: true,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 🆕 เตรียมข้อมูลสำหรับหนังสือรับรองการฝึกงาน
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {Object} ข้อมูลที่เตรียมแล้วสำหรับ CertificateTemplate
   */
  prepareCertificateData(certificateData) {
    try {
      // ตรวจสอบข้อมูลพื้นฐาน
      if (!certificateData) {
        throw new Error("ไม่มีข้อมูลหนังสือรับรอง");
      }

      // เตรียมข้อมูลตามโครงสร้างที่ CertificateTemplate ต้องการ
      const preparedData = {
        // ข้อมูลเอกสาร
        documentInfo: {
          certificateNumber: certificateData.certificateNumber || this.generateCertificateNumber(),
          issueDate: certificateData.issueDate || new Date(),
          documentDate: certificateData.documentDate || new Date(),
          validityPeriod: "ไม่มีกำหนดหมดอายุ",
          purpose: certificateData.purpose || "เพื่อใช้เป็นหลักฐานการฝึกงานตามหลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        },

        // ข้อมูลนักศึกษา
        studentInfo: {
          studentId: certificateData.studentInfo?.studentId || certificateData.studentId,
          firstName: certificateData.studentInfo?.firstName || certificateData.firstName,
          lastName: certificateData.studentInfo?.lastName || certificateData.lastName,
          fullName: certificateData.studentInfo?.fullName || 
                   `${certificateData.firstName || ''} ${certificateData.lastName || ''}`.trim(),
          yearLevel: certificateData.studentInfo?.yearLevel || certificateData.yearLevel,
          classroom: certificateData.studentInfo?.classroom || certificateData.classroom,
          department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          faculty: "คณะวิทยาศาสตร์ประยุกต์",
          university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // ข้อมูลบริษัทและการฝึกงาน
        internshipInfo: {
          companyName: certificateData.companyName || certificateData.internshipInfo?.companyName,
          companyAddress: certificateData.companyAddress || certificateData.internshipInfo?.companyAddress,
          startDate: certificateData.startDate || certificateData.internshipInfo?.startDate,
          endDate: certificateData.endDate || certificateData.internshipInfo?.endDate,
          totalDays: certificateData.totalDays || certificateData.internshipInfo?.totalDays,
          totalHours: certificateData.totalHours || certificateData.internshipInfo?.totalHours,
          supervisorName: certificateData.supervisorName || certificateData.internshipInfo?.supervisorName,
          supervisorPosition: certificateData.supervisorPosition || certificateData.internshipInfo?.supervisorPosition,
          supervisorPhone: certificateData.supervisorPhone || certificateData.internshipInfo?.supervisorPhone,
          supervisorEmail: certificateData.supervisorEmail || certificateData.internshipInfo?.supervisorEmail,
        },

        // ข้อมูลการประเมิน (ถ้ามี)
        evaluationInfo: certificateData.evaluationInfo || null,

        // ข้อมูลผู้อนุมัติ
        approvalInfo: {
          approvedBy: certificateData.approvedBy || "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
          approverTitle: certificateData.approverTitle || "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          approvedDate: certificateData.approvedDate || new Date(),
          departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          facultyName: "คณะวิทยาศาสตร์ประยุกต์",
          universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // Metadata สำหรับ PDF
        metadata: {
          templateType: "certificate",
          fileName: `หนังสือรับรองการฝึกงาน-${certificateData.studentInfo?.studentId || certificateData.studentId}`,
          title: "หนังสือรับรองการฝึกงาน",
          subject: `หนังสือรับรองการฝึกงาน - ${certificateData.studentInfo?.fullName || certificateData.fullName}`,
          author: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          keywords: ["หนังสือรับรอง", "การฝึกงาน", "วิทยาการคอมพิวเตอร์"],
        },
      };

      console.log("✅ Certificate data prepared successfully");
      return preparedData;

    } catch (error) {
      console.error("❌ Error preparing certificate data:", error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้: ${error.message}`);
    }
  }
}

// สร้าง instance เดียวสำหรับทั้งระบบ (Singleton pattern)
const templateDataService = new TemplateDataService();

export default templateDataService;
