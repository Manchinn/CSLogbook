const { WorkflowStepDefinition, StudentWorkflowActivity } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class WorkflowStepDefinitionController {
  /**
   * ดึงรายการขั้นตอนทั้งหมด (สำหรับ admin จัดการ)
   */
  async getAllSteps(req, res) {
    try {
      const { workflowType, page = 1, limit = 50, search } = req.query;
      
      const whereClause = {};
      
      // กรองตาม workflow type
      if (workflowType && ['internship', 'project'].includes(workflowType)) {
        whereClause.workflowType = workflowType;
      }
      
      // ค้นหาจากชื่อหรือ stepKey
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { stepKey: { [Op.like]: `%${search}%` } },
          { descriptionTemplate: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const offset = (page - 1) * limit;
      
      const { count, rows } = await WorkflowStepDefinition.findAndCountAll({
        where: whereClause,
        order: [['workflowType', 'ASC'], ['stepOrder', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        message: 'ดึงข้อมูลขั้นตอน workflow สำเร็จ',
        data: {
          steps: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error in getAllSteps:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอน workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ดึงข้อมูลขั้นตอนเฉพาะรายการ
   */
  async getStepById(req, res) {
    try {
      const { stepId } = req.params;
      
      const step = await WorkflowStepDefinition.findByPk(stepId);
      
      if (!step) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบขั้นตอน workflow ที่ระบุ'
        });
      }
      
      res.json({
        success: true,
        message: 'ดึงข้อมูลขั้นตอน workflow สำเร็จ',
        data: step
      });
    } catch (error) {
      logger.error('Error in getStepById:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอน workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * สร้างขั้นตอนใหม่
   */
  async createStep(req, res) {
    try {
      const { 
        workflowType, 
        stepKey, 
        stepOrder, 
        title, 
        descriptionTemplate,
        isRequired = true,
        dependencies = null
      } = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!workflowType || !stepKey || !title || stepOrder === undefined) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกข้อมูลที่จำเป็น: workflowType, stepKey, title, stepOrder'
        });
      }
      
      // ตรวจสอบประเภท workflow
      if (!['internship', 'project'].includes(workflowType)) {
        return res.status(400).json({
          success: false,
          message: 'ประเภท workflow ไม่ถูกต้อง กรุณาระบุ internship หรือ project'
        });
      }
      
      // ตรวจสอบรูปแบบ stepKey
      if (!/^[A-Z_]+$/.test(stepKey)) {
        return res.status(400).json({
          success: false,
          message: 'stepKey ต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่และ underscore เท่านั้น'
        });
      }
      
      // ตรวจสอบว่า stepKey ซ้ำใน workflowType เดียวกันหรือไม่
      const existingStep = await WorkflowStepDefinition.findOne({
        where: { workflowType, stepKey }
      });
      
      if (existingStep) {
        return res.status(400).json({
          success: false,
          message: `มี stepKey '${stepKey}' อยู่แล้วใน workflow '${workflowType}'`
        });
      }
      
      // ตรวจสอบว่า stepOrder ซ้ำใน workflowType เดียวกันหรือไม่
      const existingOrder = await WorkflowStepDefinition.findOne({
        where: { workflowType, stepOrder }
      });
      
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: `มี stepOrder ${stepOrder} อยู่แล้วใน workflow '${workflowType}'`
        });
      }
      
      // แปลง dependencies เป็น JSON ถ้าเป็น string
      let parsedDependencies = null;
      if (dependencies) {
        try {
          parsedDependencies = typeof dependencies === 'string' 
            ? JSON.parse(dependencies) 
            : dependencies;
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'รูปแบบ dependencies ไม่ถูกต้อง กรุณาใช้รูปแบบ JSON Array'
          });
        }
      }
      
      const newStep = await WorkflowStepDefinition.create({
        workflowType,
        stepKey,
        stepOrder,
        title,
        descriptionTemplate,
        isRequired,
        dependencies: parsedDependencies
      });
      
      logger.info(`สร้างขั้นตอน workflow ใหม่: ${stepKey} ใน ${workflowType} โดย admin`);
      
      res.status(201).json({
        success: true,
        message: 'สร้างขั้นตอน workflow ใหม่สำเร็จ',
        data: newStep
      });
    } catch (error) {
      logger.error('Error in createStep:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างขั้นตอน workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * อัปเดตขั้นตอน
   */
  async updateStep(req, res) {
    try {
      const { stepId } = req.params;
      const updateData = req.body;
      
      const step = await WorkflowStepDefinition.findByPk(stepId);
      
      if (!step) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบขั้นตอน workflow ที่ระบุ'
        });
      }
      
      // ตรวจสอบ stepKey หากมีการเปลี่ยนแปลง
      if (updateData.stepKey && updateData.stepKey !== step.stepKey) {
        if (!/^[A-Z_]+$/.test(updateData.stepKey)) {
          return res.status(400).json({
            success: false,
            message: 'stepKey ต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่และ underscore เท่านั้น'
          });
        }
        
        const existingStepKey = await WorkflowStepDefinition.findOne({
          where: { 
            workflowType: step.workflowType, 
            stepKey: updateData.stepKey,
            stepId: { [Op.ne]: stepId }
          }
        });
        
        if (existingStepKey) {
          return res.status(400).json({
            success: false,
            message: `มี stepKey '${updateData.stepKey}' อยู่แล้วใน workflow '${step.workflowType}'`
          });
        }
      }
      
      // ตรวจสอบ stepOrder หากมีการเปลี่ยนแปลง
      if (updateData.stepOrder && updateData.stepOrder !== step.stepOrder) {
        const existingOrder = await WorkflowStepDefinition.findOne({
          where: { 
            workflowType: step.workflowType, 
            stepOrder: updateData.stepOrder,
            stepId: { [Op.ne]: stepId }
          }
        });
        
        if (existingOrder) {
          return res.status(400).json({
            success: false,
            message: `มี stepOrder ${updateData.stepOrder} อยู่แล้วใน workflow '${step.workflowType}'`
          });
        }
      }
      
      // แปลง dependencies หากมี
      if (updateData.dependencies) {
        try {
          updateData.dependencies = typeof updateData.dependencies === 'string' 
            ? JSON.parse(updateData.dependencies) 
            : updateData.dependencies;
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'รูปแบบ dependencies ไม่ถูกต้อง กรุณาใช้รูปแบบ JSON Array'
          });
        }
      }
      
      await step.update(updateData);
      
      logger.info(`อัปเดตขั้นตอน workflow: ${step.stepKey} ใน ${step.workflowType} โดย admin`);
      
      res.json({
        success: true,
        message: 'อัปเดตขั้นตอน workflow สำเร็จ',
        data: step
      });
    } catch (error) {
      logger.error('Error in updateStep:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตขั้นตอน workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ลบขั้นตอน
   */
  async deleteStep(req, res) {
    try {
      const { stepId } = req.params;
      
      const step = await WorkflowStepDefinition.findByPk(stepId);
      
      if (!step) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบขั้นตอน workflow ที่ระบุ'
        });
      }
      
      // ตรวจสอบว่ามีการใช้งานขั้นตอนนี้อยู่หรือไม่
      const usageCount = await StudentWorkflowActivity.count({
        where: { 
          workflowType: step.workflowType,
          currentStepKey: step.stepKey
        }
      });
      
      if (usageCount > 0) {
        return res.status(400).json({
          success: false,
          message: `ไม่สามารถลบขั้นตอนนี้ได้ เนื่องจากมีนักศึกษา ${usageCount} คนกำลังใช้งานขั้นตอนนี้อยู่`
        });
      }
      
      await step.destroy();
      
      logger.info(`ลบขั้นตอน workflow: ${step.stepKey} จาก ${step.workflowType} โดย admin`);
      
      res.json({
        success: true,
        message: 'ลบขั้นตอน workflow สำเร็จ'
      });
    } catch (error) {
      logger.error('Error in deleteStep:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบขั้นตอน workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * จัดเรียงลำดับขั้นตอนใหม่
   */
  async reorderSteps(req, res) {
    try {
      const { workflowType, stepOrders } = req.body;
      
      if (!workflowType || !Array.isArray(stepOrders)) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุ workflowType และ stepOrders (array)'
        });
      }
      
      if (!['internship', 'project'].includes(workflowType)) {
        return res.status(400).json({
          success: false,
          message: 'ประเภท workflow ไม่ถูกต้อง'
        });
      }
      
      // ตรวจสอบว่าทุก step ที่ส่งมามีอยู่จริง
      const stepIds = stepOrders.map(item => item.stepId);
      const existingSteps = await WorkflowStepDefinition.findAll({
        where: { 
          stepId: { [Op.in]: stepIds },
          workflowType 
        }
      });
      
      if (existingSteps.length !== stepIds.length) {
        return res.status(400).json({
          success: false,
          message: 'พบขั้นตอนที่ไม่มีอยู่ในระบบ'
        });
      }
      
      // อัปเดตลำดับขั้นตอนแต่ละรายการ
      const updatePromises = stepOrders.map(({ stepId, newOrder }) => 
        WorkflowStepDefinition.update(
          { stepOrder: newOrder },
          { where: { stepId, workflowType } }
        )
      );
      
      await Promise.all(updatePromises);
      
      logger.info(`จัดเรียงลำดับขั้นตอน workflow ใหม่สำหรับ ${workflowType} โดย admin`);
      
      res.json({
        success: true,
        message: 'จัดเรียงลำดับขั้นตอน workflow ใหม่สำเร็จ'
      });
    } catch (error) {
      logger.error('Error in reorderSteps:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการจัดเรียงลำดับขั้นตอน workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ดูสถิติการใช้งานขั้นตอน
   */
  async getStepUsageStats(req, res) {
    try {
      const { stepId } = req.params;
      
      const step = await WorkflowStepDefinition.findByPk(stepId);
      
      if (!step) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบขั้นตอน workflow ที่ระบุ'
        });
      }
      
      // นับจำนวนนักศึกษาที่อยู่ในขั้นตอนนี้
      const currentUsage = await StudentWorkflowActivity.count({
        where: { 
          workflowType: step.workflowType,
          currentStepKey: step.stepKey
        }
      });
      
      // สถิติเพิ่มเติมอื่นๆ สามารถเพิ่มได้ที่นี่
      
      res.json({
        success: true,
        message: 'ดึงสถิติการใช้งานขั้นตอน workflow สำเร็จ',
        data: {
          step: step,
          usage: {
            currentStudents: currentUsage
          }
        }
      });
    } catch (error) {
      logger.error('Error in getStepUsageStats:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงสถิติการใช้งาน',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new WorkflowStepDefinitionController();