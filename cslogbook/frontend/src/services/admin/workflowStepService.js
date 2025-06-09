import apiClient from '../apiClient';

/**
 * Service สำหรับจัดการขั้นตอน Workflow Step Definitions (Admin Only)
 * ใช้สำหรับเรียก API ที่เกี่ยวข้องกับการจัดการ CRUD ของขั้นตอน workflow
 */
class WorkflowStepService {
  constructor() {
    // กำหนด base URL สำหรับ workflow step management API
    this.baseURL = '/admin/workflow-steps';
    
    // รายการประเภท workflow ที่รองรับ
    this.workflowTypes = ['internship', 'project'];
  }

  /**
   * ดึงรายการขั้นตอน workflow ทั้งหมด (สำหรับ admin จัดการ)
   * @param {Object} params - พารามิเตอร์สำหรับการค้นหาและกรอง
   * @returns {Promise<Object>} - ข้อมูลขั้นตอน workflow
   */
  async getAllSteps(params = {}) {
    try {
      console.log('🔍 กำลังดึงรายการขั้นตอน workflow...', params);
      
      const response = await apiClient.get(this.baseURL, { params });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลขั้นตอน workflow ได้');
      }

      console.log('✅ ดึงรายการขั้นตอน workflow สำเร็จ:', response.data.data);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'ดึงข้อมูลสำเร็จ'
      };
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการดึงขั้นตอน workflow:', error);
      
      // จัดการข้อผิดพลาดตามประเภท
      let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอน workflow';
      
      if (error.response?.status === 401) {
        errorMessage = 'ไม่มีสิทธิ์ในการเข้าถึงข้อมูลขั้นตอน workflow';
      } else if (error.response?.status === 403) {
        errorMessage = 'ไม่มีสิทธิ์ Admin ในการจัดการขั้นตอน workflow';
      } else if (error.response?.status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * ดึงข้อมูลขั้นตอน workflow เฉพาะรายการ
   * @param {string|number} stepId - ID ของขั้นตอน
   * @returns {Promise<Object>} - ข้อมูลขั้นตอน workflow
   */
  async getStepById(stepId) {
    try {
      console.log(`🔍 กำลังดึงข้อมูลขั้นตอน workflow ID: ${stepId}...`);
      
      const response = await apiClient.get(`${this.baseURL}/${stepId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลขั้นตอน workflow ได้');
      }

      console.log('✅ ดึงข้อมูลขั้นตอน workflow สำเร็จ:', response.data.data);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'ดึงข้อมูลสำเร็จ'
      };
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาดในการดึงขั้นตอน workflow ID ${stepId}:`, error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอน workflow';
      
      if (error.response?.status === 404) {
        errorMessage = 'ไม่พบขั้นตอน workflow ที่ระบุ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * ดูสถิติการใช้งานขั้นตอน
   * @param {string|number} stepId - ID ของขั้นตอน
   * @returns {Promise<Object>} - สถิติการใช้งาน
   */
  async getStepUsageStats(stepId) {
    try {
      console.log(`📊 กำลังดึงสถิติการใช้งานขั้นตอน ID: ${stepId}...`);
      
      const response = await apiClient.get(`${this.baseURL}/${stepId}/stats`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงสถิติการใช้งานได้');
      }

      console.log('✅ ดึงสถิติการใช้งานสำเร็จ:', response.data.data);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'ดึงสถิติสำเร็จ'
      };
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาดในการดึงสถิติขั้นตอน ID ${stepId}:`, error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการดึงสถิติการใช้งาน';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * สร้างขั้นตอน workflow ใหม่
   * @param {Object} stepData - ข้อมูลขั้นตอนที่จะสร้าง
   * @returns {Promise<Object>} - ผลการสร้าง
   */
  async createStep(stepData) {
    try {
      // ตรวจสอบและเตรียมข้อมูลก่อนส่ง
      const validation = this.validateStepData(stepData);
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(', '));
      }

      const preparedData = this.prepareStepData(stepData);
      
      console.log('🔄 กำลังสร้างขั้นตอน workflow ใหม่...', preparedData);
      
      const response = await apiClient.post(this.baseURL, preparedData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถสร้างขั้นตอน workflow ได้');
      }

      console.log('✅ สร้างขั้นตอน workflow ใหม่สำเร็จ:', response.data.data);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'สร้างขั้นตอนใหม่สำเร็จ'
      };
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการสร้างขั้นตอน workflow:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการสร้างขั้นตอน workflow';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * อัปเดตขั้นตอน workflow
   * @param {string|number} stepId - ID ของขั้นตอน
   * @param {Object} stepData - ข้อมูลที่จะอัปเดต
   * @returns {Promise<Object>} - ผลการอัปเดต
   */
  async updateStep(stepId, stepData) {
    try {
      const preparedData = this.prepareStepData(stepData);
      
      console.log(`🔄 กำลังอัปเดตขั้นตอน workflow ID: ${stepId}...`, preparedData);
      
      const response = await apiClient.put(`${this.baseURL}/${stepId}`, preparedData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัปเดตขั้นตอน workflow ได้');
      }

      console.log('✅ อัปเดตขั้นตอน workflow สำเร็จ:', response.data.data);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'อัปเดตขั้นตอนสำเร็จ'
      };
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาดในการอัปเดตขั้นตอน workflow ID ${stepId}:`, error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการอัปเดตขั้นตอน workflow';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      } else if (error.response?.status === 404) {
        errorMessage = 'ไม่พบขั้นตอน workflow ที่ระบุ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * ลบขั้นตอน workflow
   * @param {string|number} stepId - ID ของขั้นตอน
   * @returns {Promise<Object>} - ผลการลบ
   */
  async deleteStep(stepId) {
    try {
      console.log(`🗑️ กำลังลบขั้นตอน workflow ID: ${stepId}...`);
      
      const response = await apiClient.delete(`${this.baseURL}/${stepId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถลบขั้นตอน workflow ได้');
      }

      console.log('✅ ลบขั้นตอน workflow สำเร็จ');

      return {
        success: true,
        message: response.data.message || 'ลบขั้นตอนสำเร็จ'
      };
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาดในการลบขั้นตอน workflow ID ${stepId}:`, error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการลบขั้นตอน workflow';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'ไม่สามารถลบขั้นตอนนี้ได้ เนื่องจากมีการใช้งานอยู่';
      } else if (error.response?.status === 404) {
        errorMessage = 'ไม่พบขั้นตอน workflow ที่ระบุ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * จัดเรียงลำดับขั้นตอน workflow ใหม่
   * @param {string} workflowType - ประเภท workflow
   * @param {Array} stepOrders - รายการขั้นตอนพร้อมลำดับใหม่
   * @returns {Promise<Object>} - ผลการจัดเรียงลำดับ
   */
  async reorderSteps(workflowType, stepOrders) {
    try {
      console.log(`🔄 กำลังจัดเรียงลำดับขั้นตอน workflow สำหรับ ${workflowType}...`, stepOrders);
      
      const response = await apiClient.post(`${this.baseURL}/reorder`, {
        workflowType,
        stepOrders
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถจัดเรียงลำดับขั้นตอน workflow ได้');
      }

      console.log('✅ จัดเรียงลำดับขั้นตอน workflow สำเร็จ');

      return {
        success: true,
        message: response.data.message || 'จัดเรียงลำดับขั้นตอนสำเร็จ'
      };
    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาดในการจัดเรียงลำดับขั้นตอน workflow สำหรับ ${workflowType}:`, error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการจัดเรียงลำดับขั้นตอน workflow';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * ฟังก์ชันช่วยสำหรับ validation ข้อมูลก่อนส่ง
   * @param {Object} stepData - ข้อมูลขั้นตอน
   * @returns {Object} - ผลการ validation
   */
  validateStepData(stepData) {
    const errors = {};

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!stepData.workflowType) {
      errors.workflowType = 'กรุณาเลือกประเภท workflow';
    } else if (!this.workflowTypes.includes(stepData.workflowType)) {
      errors.workflowType = 'ประเภท workflow ไม่ถูกต้อง';
    }

    if (!stepData.stepKey) {
      errors.stepKey = 'กรุณากรอกรหัสขั้นตอน';
    } else if (!/^[A-Z_]+$/.test(stepData.stepKey)) {
      errors.stepKey = 'รหัสขั้นตอนต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่และ underscore เท่านั้น';
    }

    if (!stepData.title) {
      errors.title = 'กรุณากรอกชื่อขั้นตอน';
    }

    if (stepData.stepOrder === undefined || stepData.stepOrder === null) {
      errors.stepOrder = 'กรุณากรอกลำดับขั้นตอน';
    } else if (stepData.stepOrder < 1) {
      errors.stepOrder = 'ลำดับขั้นตอนต้องมากกว่า 0';
    }

    if (!stepData.descriptionTemplate) {
      errors.descriptionTemplate = 'กรุณากรอกคำอธิบายขั้นตอน';
    }

    // ตรวจสอบ dependencies ถ้ามี
    if (stepData.dependencies) {
      try {
        if (typeof stepData.dependencies === 'string') {
          JSON.parse(stepData.dependencies);
        }
      } catch (e) {
        errors.dependencies = 'รูปแบบ dependencies ไม่ถูกต้อง กรุณาใช้รูปแบบ JSON Array';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * ฟังก์ชันช่วยสำหรับแปลงข้อมูลก่อนส่ง API
   * @param {Object} stepData - ข้อมูลขั้นตอน
   * @returns {Object} - ข้อมูลที่แปลงแล้ว
   */
  prepareStepData(stepData) {
    const prepared = { ...stepData };

    // แปลง stepOrder เป็น number
    if (prepared.stepOrder) {
      prepared.stepOrder = parseInt(prepared.stepOrder, 10);
    }

    // แปลง dependencies เป็น JSON ถ้าเป็น string
    if (prepared.dependencies && typeof prepared.dependencies === 'string') {
      try {
        prepared.dependencies = JSON.parse(prepared.dependencies);
      } catch (e) {
        // ถ้าแปลงไม่ได้ให้เป็น null
        prepared.dependencies = null;
      }
    }

    // ตั้งค่า default สำหรับ isRequired
    if (prepared.isRequired === undefined) {
      prepared.isRequired = true;
    }

    return prepared;
  }

  /**
   * ตรวจสอบการเชื่อมต่อกับ API
   * @returns {Promise<boolean>} - สถานะการเชื่อมต่อ
   */
  async checkApiConnection() {
    try {
      await apiClient.get('/health'); // สมมติว่ามี health check endpoint
      return true;
    } catch (error) {
      console.error('ไม่สามารถเชื่อมต่อกับ API ได้:', error);
      return false;
    }
  }
}

// สร้าง instance และ export
const workflowStepService = new WorkflowStepService();

export default workflowStepService;