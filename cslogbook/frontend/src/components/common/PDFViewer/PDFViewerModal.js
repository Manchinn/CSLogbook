import React, { useState, useCallback } from 'react';
import { Modal, Button, Slider, Space, Typography, Tooltip } from 'antd';
// Use direct imports instead of barrel files for better performance (bundle-barrel-imports)
import ZoomInOutlined from '@ant-design/icons/ZoomInOutlined';
import ZoomOutOutlined from '@ant-design/icons/ZoomOutOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import FileOutlined from '@ant-design/icons/FileOutlined';
import PDFViewer from './PDFViewer';

const { Text } = Typography;

// เวอร์ชันลดสเปค: เปิดมา 100%, ซูมได้ และเปิดแท็บใหม่
const PDFViewerModal = ({ visible, pdfUrl, onClose, title = 'เอกสาร PDF', style }) => {
  const [scale, setScale] = useState(1); // 1 = 100%

  const handleZoomChange = useCallback((value) => setScale(value / 100), []);
  const quickZoom = useCallback((delta) => setScale(prev => Math.max(0.5, Math.min(3, prev + delta))), []);
  const resetZoom = useCallback(() => setScale(1), []);
  const handleClose = useCallback(() => { setScale(1); onClose(); }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileOutlined />
            <Text strong style={{ fontSize: '16px' }}>{title}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>ซูม: {Math.round(scale*100)}%</Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width="90%"
      style={{ top: 20, maxWidth: 1200, ...style }}
      styles={{ body: { padding: 8, height: '80vh', overflow: 'auto', background: '#f5f5f5' } }}
      footer={[
        <div key="footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}>
          <Space size="small">
            <Tooltip title="ซูมออก">
              <Button size="small" icon={<ZoomOutOutlined />} onClick={() => quickZoom(-0.1)} disabled={scale <= 0.5} />
            </Tooltip>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 160 }}>
              <Text style={{ fontSize: 11, marginRight: 4 }}>50%</Text>
              <Slider
                value={Math.round(scale * 100)}
                min={50}
                max={300}
                step={10}
                onChange={handleZoomChange}
                style={{ flex: 1 }}
              />
              <Text style={{ fontSize: 11, marginLeft: 4 }}>300%</Text>
            </div>
            <Tooltip title="ซูมเข้า">
              <Button size="small" icon={<ZoomInOutlined />} onClick={() => quickZoom(0.1)} disabled={scale >= 3} />
            </Tooltip>
            <Tooltip title="รีเซ็ต 100%">
              <Button size="small" icon={<ReloadOutlined />} onClick={resetZoom} disabled={scale === 1} />
            </Tooltip>
          </Space>
        </div>
      ]}
    >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
          {pdfUrl ? (
            <div style={{ background: '#fff', padding: 8, borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
              <PDFViewer
                pdfFile={pdfUrl}
                width={Math.min(900 * scale, window.innerWidth - 160)}
                height={Math.min(1200 * scale, window.innerHeight - 260)}
                currentPage={1}
                showControls={false}
                style={{ width: '100%', height: '100%' }}
                onError={(err) => console.error('PDF error:', err)}
              />
            </div>
          ) : (
            <div style={{ padding: 40 }}>
              <FileOutlined style={{ fontSize: 48, color: '#999' }} />
              <div><Text type="secondary">ไม่มีเอกสาร PDF</Text></div>
            </div>
          )}
        </div>
    </Modal>
  );
};

export default React.memo(PDFViewerModal);