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
      // ลงทะเบียนฟอนต์ THSarabunNew (ฟอนต์ราชการ)
      Font.register({
        family: 'THSarabunNew',
        fonts: [
          {
            src: '/assets/fonts/THSarabunNew.ttf',
            fontWeight: 'normal'
          },
          {
            src: '/assets/fonts/THSarabunNew-Bold.ttf',
            fontWeight: 'bold'
          }
        ]
      });

      // ลงทะเบียนฟอนต์ Sarabun (ฟอนต์สำรอง)
      Font.register({
        family: 'Sarabun',
        fonts: [
          {
            src: '/assets/fonts/Sarabun-Regular.ttf',
            fontWeight: 'normal'
          },
          {
            src: '/assets/fonts/Sarabun-Bold.ttf',
            fontWeight: 'bold'
          }
        ]
      });

      this.fontsLoaded = true;
      console.log('✅ โหลดฟอนต์ภาษาไทยสำเร็จ');
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการโหลดฟอนต์:', error);
      throw new Error('ไม่สามารถโหลดฟอนต์ภาษาไทยได้');
    }
  }

  /**
   * ตรวจสอบว่าฟอนต์โหลดแล้วหรือไม่
   */
  isFontLoaded() {
    return this.fontsLoaded;
  }

  /**
   * โหลดฟอนต์แบบ Cache
   * @param {string} fontName - ชื่อฟอนต์
   */
  async loadFontWithCache(fontName) {
    if (this.fontCache.has(fontName)) {
      return this.fontCache.get(fontName);
    }

    try {
      // โหลดฟอนต์ (logic สำหรับการโหลดฟอนต์เฉพาะ)
      const fontData = await this._loadSpecificFont(fontName);
      this.fontCache.set(fontName, fontData);
      return fontData;
    } catch (error) {
      console.error(`Error loading font ${fontName}:`, error);
      throw error;
    }
  }

  async _loadSpecificFont(fontName) {
    // Implementation สำหรับการโหลดฟอนต์เฉพาะ
    // ในที่นี้ return promise สำหรับการโหลดฟอนต์
    return new Promise((resolve) => {
      // Simulate font loading
      setTimeout(() => {
        resolve({ fontName, loaded: true });
      }, 100);
    });
  }

  /**
   * รีเซ็ตสถานะการโหลดฟอนต์
   */
  reset() {
    this.fontsLoaded = false;
    this.loadPromise = null;
    this.fontCache.clear();
  }

  /**
   * ตรวจสอบการรองรับฟอนต์
   * @param {string} fontFamily - ชื่อฟอนต์
   */
  isFontSupported(fontFamily) {
    const supportedFonts = ['THSarabunNew', 'Sarabun'];
    return supportedFonts.includes(fontFamily);
  }

  /**
   * รับฟอนต์ที่เหมาะสม
   * @param {string} preferredFont - ฟอนต์ที่ต้องการ
   */
  getBestFont(preferredFont = 'THSarabunNew') {
    if (this.isFontSupported(preferredFont)) {
      return preferredFont;
    }
    
    // Fallback
    return 'THSarabunNew';
  }
}

export default new FontService();