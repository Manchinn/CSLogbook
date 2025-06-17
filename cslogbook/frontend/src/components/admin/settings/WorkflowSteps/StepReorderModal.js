import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Space, Alert, Typography, Card, List, 
  InputNumber, Row, Col, Tag, message, Spin
} from 'antd';
import {
  DragOutlined, SaveOutlined, ReloadOutlined, 
  ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import workflowStepService from '../../../../services/admin/workflowStepService';

const { Title, Text } = Typography;

/**
 * คอมโพเนนต์รายการขั้นตอนที่สามารถลากได้
 */
const SortableStepItem = ({ step, index, onOrderChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.stepId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        size="small" 
        style={{ 
          marginBottom: 8,
          border: isDragging ? '2px dashed #1890ff' : '1px solid #d9d9d9',
          cursor: 'move'
        }}
      >
        <Row align="middle" gutter={16}>
          <Col span={2}>
            <div 
              {...attributes} 
              {...listeners}
              style={{ 
                cursor: 'grab',
                padding: '4px',
                textAlign: 'center'
              }}
            >
              <DragOutlined style={{ fontSize: '16px', color: '#8c8c8c' }} />
            </div>
          </Col>
          
          <Col span={4}>
            <InputNumber
              min={1}
              value={step.newOrder}
              onChange={(value) => onOrderChange(step.stepId, value)}
              style={{ width: '100%' }}
              size="small"
            />
          </Col>
          
          <Col span={6}>
            <Text code style={{ fontSize: '12px' }}>
              {step.stepKey}
            </Text>
          </Col>
          
          <Col span={10}>
            <Text strong>{step.title}</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

/**
 * Modal สำหรับจัดเรียงลำดับขั้นตอน Workflow
 */
const StepReorderModal = ({ 
  visible, 
  workflowType, 
  steps, 
  onCancel, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [reorderedSteps, setReorderedSteps] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // เตรียมข้อมูลเมื่อเปิด modal
  useEffect(() => {
    if (visible && steps.length > 0) {
      const stepsWithNewOrder = steps
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((step, index) => ({
          ...step,
          newOrder: step.stepOrder,
          originalOrder: step.stepOrder
        }));
      setReorderedSteps(stepsWithNewOrder);
      setHasChanges(false);
    }
  }, [visible, steps]);

  /**
   * ฟังก์ชันจัดการการลากและวาง
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setReorderedSteps((items) => {
        const oldIndex = items.findIndex(item => item.stepId === active.id);
        const newIndex = items.findIndex(item => item.stepId === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // อัปเดตลำดับใหม่
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          newOrder: index + 1
        }));
        
        // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
        const hasChanged = updatedItems.some(item => 
          item.newOrder !== item.originalOrder
        );
        setHasChanges(hasChanged);
        
        return updatedItems;
      });
    }
  };

  /**
   * ฟังก์ชันจัดการการเปลี่ยนลำดับจาก InputNumber
   */
  const handleOrderChange = (stepId, newOrder) => {
    if (!newOrder || newOrder < 1) return;
    
    setReorderedSteps(prevSteps => {
      const updatedSteps = prevSteps.map(step => 
        step.stepId === stepId ? { ...step, newOrder } : step
      );
      
      // เรียงลำดับใหม่ตาม newOrder
      const sortedSteps = updatedSteps.sort((a, b) => a.newOrder - b.newOrder);
      
      // ปรับลำดับให้ต่อเนื่อง
      const reindexedSteps = sortedSteps.map((step, index) => ({
        ...step,
        newOrder: index + 1
      }));
      
      // ตรวจสอบการเปลี่ยนแปลง
      const hasChanged = reindexedSteps.some(item => 
        item.newOrder !== item.originalOrder
      );
      setHasChanges(hasChanged);
      
      return reindexedSteps;
    });
  };

  /**
   * ฟังก์ชันย้ายขั้นตอนขึ้น
   */
  const moveStepUp = (stepId) => {
    setReorderedSteps(prevSteps => {
      const currentIndex = prevSteps.findIndex(step => step.stepId === stepId);
      if (currentIndex <= 0) return prevSteps;
      
      const newSteps = arrayMove(prevSteps, currentIndex, currentIndex - 1);
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        newOrder: index + 1
      }));
      
      const hasChanged = updatedSteps.some(item => 
        item.newOrder !== item.originalOrder
      );
      setHasChanges(hasChanged);
      
      return updatedSteps;
    });
  };

  /**
   * ฟังก์ชันย้ายขั้นตอนลง
   */
  const moveStepDown = (stepId) => {
    setReorderedSteps(prevSteps => {
      const currentIndex = prevSteps.findIndex(step => step.stepId === stepId);
      if (currentIndex >= prevSteps.length - 1) return prevSteps;
      
      const newSteps = arrayMove(prevSteps, currentIndex, currentIndex + 1);
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        newOrder: index + 1
      }));
      
      const hasChanged = updatedSteps.some(item => 
        item.newOrder !== item.originalOrder
      );
      setHasChanges(hasChanged);
      
      return updatedSteps;
    });
  };

  /**
   * ฟังก์ชันรีเซ็ตลำดับ
   */
  const resetOrder = () => {
    const resetSteps = reorderedSteps.map(step => ({
      ...step,
      newOrder: step.originalOrder
    })).sort((a, b) => a.originalOrder - b.originalOrder);
    
    setReorderedSteps(resetSteps);
    setHasChanges(false);
  };

  /**
   * ฟังก์ชันบันทึกการเปลี่ยนแปลง
   */
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // เตรียมข้อมูลสำหรับส่ง API
      const stepOrders = reorderedSteps.map(step => ({
        stepId: step.stepId,
        newOrder: step.newOrder
      }));
      
      await workflowStepService.reorderSteps(workflowType, stepOrders);
      
      message.success('จัดเรียงลำดับขั้นตอนใหม่สำเร็จ');
      onSuccess();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการจัดเรียงลำดับ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ฟังก์ชันแปลงประเภท workflow เป็นภาษาไทย
   */
  const getWorkflowTypeLabel = (type) => {
    const types = {
      'internship': 'การฝึกงาน',
      'project': 'โครงงานพิเศษ'
    };
    return types[type] || type;
  };

  return (
    <Modal
      title={
        <Space>
          <DragOutlined />
          จัดเรียงลำดับขั้นตอน
          <Tag color="blue">{getWorkflowTypeLabel(workflowType)}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      style={{ top: 30 }}
      footer={
        <Space>
          <Button onClick={onCancel} disabled={loading}>
            ยกเลิก
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={resetOrder}
            disabled={loading || !hasChanges}
          >
            รีเซ็ต
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            disabled={!hasChanges}
          >
            บันทึกการเปลี่ยนแปลง
          </Button>
        </Space>
      }
      destroyOnHidden={true}
    >
      {reorderedSteps.length === 0 ? (
        <Alert
          message="ไม่มีขั้นตอนสำหรับจัดเรียงลำดับ"
          description="กรุณาเพิ่มขั้นตอนก่อนจัดเรียงลำดับ"
          type="info"
          showIcon
        />
      ) : (
        <div>
          {/* คำแนะนำการใช้งาน */}
          <Alert
            message="วิธีการจัดเรียงลำดับ"
            description={
              <div>
                <p>• ลากและวางรายการเพื่อเปลี่ยนลำดับ</p>
                <p>• แก้ไขตัวเลขในช่องลำดับโดยตรง</p>
                <p>• ใช้ปุ่มลูกศรเพื่อย้ายขึ้นลง</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* ส่วนหัวตาราง */}
          <Card size="small" style={{ marginBottom: 8, backgroundColor: '#fafafa' }}>
            <Row align="middle" gutter={16}>
              <Col span={2}>
                <Text strong>ลาก</Text>
              </Col>
              <Col span={4}>
                <Text strong>ลำดับ</Text>
              </Col>
              <Col span={6}>
                <Text strong>รหัสขั้นตอน</Text>
              </Col>
              <Col span={10}>
                <Text strong>ชื่อขั้นตอน</Text>
              </Col>
            </Row>
          </Card>

          {/* รายการขั้นตอน */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={reorderedSteps.map(step => step.stepId)}
                strategy={verticalListSortingStrategy}
              >
                {reorderedSteps.map((step, index) => (
                  <SortableStepItem
                    key={step.stepId}
                    step={step}
                    index={index}
                    onOrderChange={handleOrderChange}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* แสดงการเปลี่ยนแปลง */}
          {hasChanges && (
            <Alert
              message="มีการเปลี่ยนแปลง"
              description="คุณได้เปลี่ยนลำดับขั้นตอนแล้ว กรุณาบันทึกการเปลี่ยนแปลงหรือรีเซ็ตหากต้องการยกเลิก"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default StepReorderModal;