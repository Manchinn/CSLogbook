/**
 * Logbook Analysis Helper
 * ฟังก์ชันวิเคราะห์เนื้อหาบันทึกประจำวันของนักศึกษา
 * ใช้สำหรับการประเมินคุณภาพและให้คำแนะนำในการปรับปรุง
 */

const logger = require('../../utils/logger');

class LogbookAnalyzer {
  /**
   * วิเคราะห์เนื้อหาของบันทึก
   * @param {string} content เนื้อหาบันทึกประจำวัน
   * @returns {Object} ผลการวิเคราะห์
   */
  analyzeContent(content) {
    if (!content || typeof content !== 'string') {
      return {
        quality: 'poor',
        wordCount: 0,
        suggestions: ['ไม่พบเนื้อหาบันทึกประจำวัน กรุณากรอกรายละเอียดการทำงาน'],
        keywords: []
      };
    }

    try {
      const wordCount = this.countWords(content);
      const keywordAnalysis = this.extractKeywords(content);
      const quality = this.assessQuality(content, wordCount, keywordAnalysis);
      const suggestions = this.generateSuggestions(content, wordCount, quality);

      return {
        quality,
        wordCount,
        suggestions,
        keywords: keywordAnalysis.keywords
      };
    } catch (error) {
      logger.error('LogbookAnalyzer: Error analyzing content:', error);
      return {
        quality: 'unknown',
        wordCount: 0,
        suggestions: ['เกิดข้อผิดพลาดในการวิเคราะห์เนื้อหา'],
        keywords: []
      };
    }
  }

  /**
   * นับจำนวนคำในเนื้อหา
   * @param {string} content เนื้อหา
   * @returns {number} จำนวนคำ
   */
  countWords(content) {
    // ตัดช่องว่างที่ไม่จำเป็นและแบ่งคำด้วยช่องว่าง
    return content
      .trim()
      .replace(/\s+/g, ' ') // แทนที่ช่องว่างหลายช่องด้วยช่องว่างเดียว
      .split(' ')
      .filter(word => word.length > 0) // กรองคำที่ว่างออก
      .length;
  }

  /**
   * สกัดคำสำคัญจากเนื้อหา
   * @param {string} content เนื้อหา
   * @returns {Object} ผลการวิเคราะห์คำสำคัญ
   */
  extractKeywords(content) {
    // คำสำคัญที่เกี่ยวข้องกับการฝึกงาน/โครงงาน
    const technicalKeywords = [
      'พัฒนา', 'เขียน', 'โค้ด', 'โปรแกรม', 'ทดสอบ', 'แก้ไข', 'ปรับปรุง',
      'ออกแบบ', 'วิเคราะห์', 'ศึกษา', 'เรียนรู้', 'ประชุม', 'นำเสนอ',
      'database', 'api', 'frontend', 'backend', 'server', 'framework',
      'algorithm', 'debug', 'fix', 'implement', 'deploy', 'test'
    ];

    // คำทั่วไปที่ควรหลีกเลี่ยง
    const generalWords = [
      'วันนี้', 'เมื่อวาน', 'ทำ', 'มี', 'ได้', 'เป็น', 'คือ',
      'ไป', 'มา', 'และ', 'หรือ', 'ที่', 'the', 'is', 'are', 'was', 'were'
    ];

    const normalizedContent = content.toLowerCase();
    const foundKeywords = [];
    let technicalTermCount = 0;

    // ตรวจสอบคำสำคัญทางเทคนิค
    for (const keyword of technicalKeywords) {
      if (normalizedContent.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        technicalTermCount++;
      }
    }

    // นับคำทั่วไป
    let generalWordCount = 0;
    for (const word of generalWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = normalizedContent.match(regex);
      if (matches) {
        generalWordCount += matches.length;
      }
    }

    return {
      keywords: foundKeywords,
      technicalTermCount,
      generalWordCount,
      keywordRatio: foundKeywords.length / this.countWords(content)
    };
  }

  /**
   * ประเมินคุณภาพของเนื้อหา
   * @param {string} content เนื้อหา
   * @param {number} wordCount จำนวนคำ
   * @param {Object} keywordAnalysis ผลการวิเคราะห์คำสำคัญ
   * @returns {string} ระดับคุณภาพ (excellent, good, average, poor)
   */
  assessQuality(content, wordCount, keywordAnalysis) {
    // เกณฑ์การประเมินคุณภาพ
    if (wordCount < 20) {
      return 'poor'; // เนื้อหาสั้นเกินไป
    }

    if (wordCount >= 100 && keywordAnalysis.technicalTermCount >= 5 && keywordAnalysis.keywordRatio >= 0.1) {
      return 'excellent'; // เนื้อหายาวพอและมีคำสำคัญเยอะ
    }

    if (wordCount >= 50 && keywordAnalysis.technicalTermCount >= 3) {
      return 'good'; // เนื้อหาดี มีคำสำคัญพอสมควร
    }

    if (wordCount >= 30 && keywordAnalysis.technicalTermCount >= 1) {
      return 'average'; // เนื้อหาพอใช้
    }

    return 'poor'; // เนื้อหาไม่ดีพอ
  }

  /**
   * สร้างคำแนะนำสำหรับการปรับปรุงเนื้อหา
   * @param {string} content เนื้อหา
   * @param {number} wordCount จำนวนคำ
   * @param {string} quality ระดับคุณภาพ
   * @returns {string[]} รายการคำแนะนำ
   */
  generateSuggestions(content, wordCount, quality) {
    const suggestions = [];

    // คำแนะนำตามจำนวนคำ
    if (wordCount < 30) {
      suggestions.push('ควรเพิ่มรายละเอียดให้มากขึ้น อธิบายงานที่ทำอย่างละเอียด');
    }

    // คำแนะนำตามคุณภาพ
    switch (quality) {
      case 'poor':
        suggestions.push('ควรเพิ่มคำศัพท์เทคนิคหรือรายละเอียดเฉพาะทางเกี่ยวกับงานที่ทำ');
        suggestions.push('ควรระบุปัญหาที่พบและวิธีการแก้ไขปัญหา');
        break;
      case 'average':
        suggestions.push('ควรเพิ่มรายละเอียดเกี่ยวกับเทคนิค/เทคโนโลยีที่ใช้ในการทำงาน');
        suggestions.push('ควรเพิ่มการสะท้อนคิดหรือบทเรียนที่ได้จากการทำงานในวันนี้');
        break;
      case 'good':
        suggestions.push('ควรเพิ่มการเชื่อมโยงกับความรู้ทางทฤษฎีที่ได้เรียนมา');
        break;
      case 'excellent':
        suggestions.push('บันทึกมีคุณภาพดีมาก อาจเพิ่มรูปภาพหรือแผนภาพประกอบเพื่อให้เห็นภาพชัดเจนยิ่งขึ้น');
        break;
      default:
        suggestions.push('ควรตรวจสอบเนื้อหาให้มีความสมบูรณ์');
    }

    // ตรวจสอบรูปแบบของบันทึก
    if (!content.includes('\n')) {
      suggestions.push('ควรจัดรูปแบบบันทึกให้เป็นย่อหน้า เพื่อให้อ่านง่ายขึ้น');
    }

    // ตรวจสอบหัวข้อหรือการแบ่งส่วน
    if (!this.hasStructure(content)) {
      suggestions.push('ควรแบ่งเนื้อหาเป็นส่วนๆ เช่น งานที่ได้รับมอบหมาย, ขั้นตอนการทำงาน, ปัญหาที่พบ, การแก้ไข เป็นต้น');
    }

    // ถ้าบันทึกดีอยู่แล้วและไม่มีคำแนะนำ
    if (suggestions.length === 0) {
      suggestions.push('บันทึกมีคุณภาพดี ครอบคลุมเนื้อหาสำคัญแล้ว');
    }

    return suggestions;
  }

  /**
   * ตรวจสอบว่าเนื้อหามีโครงสร้างหรือการแบ่งส่วนหรือไม่
   * @param {string} content เนื้อหา
   * @returns {boolean}
   */
  hasStructure(content) {
    // ตรวจสอบหัวข้อหรือการแบ่งย่อหน้า
    const hasSections = /[#:*-]|\d+\.|\n\n/.test(content);
    const hasHeadings = /(หัวข้อ|ส่วนที่|part|section|task|ปัญหา|ขั้นตอน|สรุป|วิธีการ)[:.]?/i.test(content);
    
    return hasSections || hasHeadings;
  }
}

module.exports = new LogbookAnalyzer();