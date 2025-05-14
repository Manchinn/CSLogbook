import React, { useState } from 'react';
import { Modal, Button, Slider } from 'antd';
import PDFViewer from './PDFViewer';

/**
 * Component สำหรับแสดง PDF ในรูปแบบ Modal
 * @param {boolean} visible - สถานะการแสดง Modal
 * @param {string} pdfUrl - URL ของไฟล์ PDF ที่จะแสดง
 * @param {function} onClose - ฟังก์ชันเมื่อปิด Modal
 * @param {object} style - กำหนดรูปแบบเพิ่มเติม
 */
const PDFViewerModal = ({ visible, pdfUrl, onClose, style }) => {
  // สัดส่วนขนาด A4 คือ 1:√2 (width:height)
  // ความกว้างมาตรฐานของ A4 คือ 595 พิกเซล ที่ 72 dpi
  const [scale, setScale] = useState(1);
  const baseWidth = 595; // ความกว้างมาตรฐานของ A4 ที่ 72 dpi
  const baseHeight = 842; // ความสูงมาตรฐานของ A4 ที่ 72 dpi (≈ 595 * √2)

  return (
    <Modal
      title="เอกสาร PDF"
      open={visible}
      onCancel={onClose}
      footer={[
        <div key="zoom-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 10 }}>ซูม: {Math.round(scale * 100)}%</span>
            <Slider 
              value={scale * 100} 
              min={50} 
              max={200} 
              style={{ width: 200 }} 
              onChange={(value) => setScale(value / 100)}
            />
          </div>
          <Button key="close" onClick={onClose}>ปิด</Button>
        </div>
      ]}
      width="90%"
      style={{ top: 20, ...style }}
      styles={{ 
        body: { 
          height: 'calc(90vh - 100px)', 
          padding: '20px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: '#f0f2f5'
        }
      }}
    >
      <div style={{ 
        width: baseWidth * scale, 
        height: baseHeight * scale, 
        maxHeight: 'calc(90vh - 140px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
        backgroundColor: 'white',
        overflow: 'auto'
      }}>
        {visible && pdfUrl && (
          <PDFViewer
            pdfFile={pdfUrl}
            size={baseWidth * scale}
            height={baseHeight * scale}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </Modal>
  );
};

export default PDFViewerModal;