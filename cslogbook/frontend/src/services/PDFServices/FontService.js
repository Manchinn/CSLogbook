import { Font } from '@react-pdf/renderer';

class FontService {
  constructor() {
    this.fontsLoaded = false;
    this.loadPromise = null;
    this.fontCache = new Map();
  }

  /**
   * โหลดฟอนต์ภาษาไทยสำหรับ PDF
   */
  async loadThaiFont() {
    if (this.fontsLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._registerFonts();
    return this.loadPromise;
  }

  async _registerFonts() {
    try {
      // ตรวจสอบและโหลดฟอนต์ปกติก่อน
      Font.register({
        family: 'THSarabunNew',
        src: '/assets/fonts/THSarabunNew.ttf',
        fontWeight: 'normal'
      });

      // ลงทะเบียนฟอนต์แบบตัวหนา
      Font.register({
        family: 'THSarabunNew',
        src: '/assets/fonts/THSarabunNew-Bold.ttf',
        fontWeight: 'bold'
      });

      Font.register({
        family: 'THSarabunNew',
        src: '/assets/fonts/THSarabunNew-Italic.ttf',
        fontStyle: 'italic'
      });

      Font.register({
        family: 'THSarabunNew',
        src: '/assets/fonts/THSarabunNew-BoldItalic.ttf',
        fontWeight: 'bold',
        fontStyle: 'italic'
      });

      // ฟอนต์สำรองแบบ online
      Font.register({
        family: 'Sarabun',
        src: '/assets/fonts/Sarabun-Regular.ttf',
        fontWeight: 'normal'
      });

      Font.register({
        family: 'Sarabun',
        src: '/assets/fonts/Sarabun-Bold.ttf',
        fontWeight: 'bold'
      });

      this.fontsLoaded = true;
      console.log('✅ โหลดฟอนต์ภาษาไทยสำเร็จ');
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการโหลดฟอนต์:', error);
      // ใช้ฟอนต์ default แทน
      this.fontsLoaded = true; // ตั้งค่าเป็น true เพื่อไม่ให้โหลดซ้ำ
    }
  }

  /**
   * ตรวจสอบว่าฟอนต์โหลดแล้วหรือไม่
   */
  isFontLoaded() {
    return this.fontsLoaded;
  }

  /**
   * รับฟอนต์ที่เหมาะสม
   * @param {string} preferredFont - ฟอนต์ที่ต้องการ
   */
  getBestFont(preferredFont = 'THSarabunNew') {
    const availableFonts = ['THSarabunNew', 'Sarabun'];
    
    if (availableFonts.includes(preferredFont)) {
      return preferredFont;
    }
    
    // Fallback หลายระดับ
    return 'THSarabunNew'; // หรือ 'Sarabun' ถ้าไม่มี
  }

  /**
   * รีเซ็ตสถานะการโหลดฟอนต์
   */
  reset() {
    this.fontsLoaded = false;
    this.loadPromise = null;
    this.fontCache.clear();
  }
}

// Export class แทน instance
export default FontService;