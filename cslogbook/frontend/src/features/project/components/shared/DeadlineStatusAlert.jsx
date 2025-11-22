import React from 'react';
import { Alert, Result } from 'antd';
import { ClockCircleOutlined, StopOutlined } from '@ant-design/icons';

/**
 * DeadlineStatusAlert
 * 
 * Reusable component to display deadline warnings/errors
 * based on workflow phase_variant from backend
 * 
 * @param {object} workflowState - ProjectWorkflowState with stepDefinition
 * @param {string} contextType - 'proposal' | 'defense' | 'final'
 * @param {boolean} showFull - Show full Result component for overdue (default: true)
 */
const DeadlineStatusAlert = ({ workflowState, contextType = 'proposal', showFull = true }) => {
    if (!workflowState?.stepDefinition) {
        return null;
    }

    const { phase_variant, title } = workflowState.stepDefinition;

    // Map context to Thai labels
    const contextLabels = {
        proposal: 'ข้อเสนอโครงงาน',
        defense: 'คำขอสอบ',
        final: 'เอกสารฉบับสมบูรณ์'
    };

    const label = contextLabels[contextType] || 'เอกสาร';

    // OVERDUE - Block submission
    if (phase_variant === 'overdue') {
        if (!showFull) {
            return (
                <Alert
                    type="error"
                    message="หมดเขตส่งแล้ว"
                    description={`ไม่สามารถส่ง${label}ได้ กรุณาติดต่อเจ้าหน้าที่ภาควิชา`}
                    showIcon
                    icon={<StopOutlined />}
                    style={{ marginBottom: 16 }}
                />
            );
        }

        return (
            <Result
                status="error"
                title={`หมดเขตส่ง${label}`}
                subTitle="กรุณาติดต่อเจ้าหน้าที่ภาควิชาเพื่อขอความช่วยเหลือ"
                extra={
                    <Alert
                        type="info"
                        message="สถานะปัจจุบัน"
                        description={title || 'ระบบตรวจพบว่าหมดเขตส่งแล้ว'}
                        showIcon
                        style={{ textAlign: 'left' }}
                    />
                }
                style={{ marginTop: 24 }}
            />
        );
    }

    // LATE - Warning only
    if (phase_variant === 'late') {
        return (
            <Alert
                type="warning"
                message="⚠️ การส่งหลังกำหนด"
                description={
                    <>
                        <p style={{ margin: 0, marginBottom: 8 }}>
                            คุณกำลังส่ง{label}<strong>หลังกำหนดเวลา</strong>
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li>{label}จะถูกส่งไปยังคิวพิจารณาพิเศษ</li>
                            <li>กรุณาระบุเหตุผลในหมายเหตุ (ถ้ามี)</li>
                            <li>อาจมีผลต่อการพิจารณาของอาจารย์</li>
                        </ul>
                    </>
                }
                showIcon
                icon={<ClockCircleOutlined />}
                style={{ marginBottom: 16 }}
                banner
            />
        );
    }

    // ON-TIME or undefined - No warning
    return null;
};

export default DeadlineStatusAlert;
