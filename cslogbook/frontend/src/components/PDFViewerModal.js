import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Modal, Button, Slider, Space, Typography, Tooltip, Select } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  DownloadOutlined, 
  FullscreenOutlined,
  ReloadOutlined,
  DragOutlined,
  LeftOutlined,
  RightOutlined,
  FileOutlined
} from '@ant-design/icons';
import PDFViewer from './PDFViewer';

const { Text } = Typography;
const { Option } = Select;

/**
 * Component สำหรับแสดง PDF ในรูปแบบ Modal ที่รองรับการเลื่อนและ pan และหลายหน้า
 */
const PDFViewerModal = ({ visible, pdfUrl, onClose, title = "เอกสาร PDF", style }) => {
  // State สำหรับการซูมและการ pan
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  
  // State สำหรับการจัดการหน้า PDF
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  
  // Ref สำหรับ container ที่มี scroll
  const scrollContainerRef = useRef(null);
  
  // ขนาดพื้นฐานของ A4
  const baseWidth = 794;
  const baseHeight = 1123;
  
  // คำนวณขนาดที่แสดงผล
  const displayDimensions = useMemo(() => {
    const availableWidth = window.innerWidth * 0.9;
    const availableHeight = window.innerHeight * 0.8;
    
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    
    return {
      width: Math.min(scaledWidth, availableWidth),
      height: Math.min(scaledHeight, availableHeight)
    };
  }, [scale]);

  // ตรวจสอบว่า PDF ใหญ่กว่าพื้นที่แสดงผลหรือไม่
  const isScrollable = useMemo(() => {
    if (!scrollContainerRef.current) return false;
    const container = scrollContainerRef.current;
    return (
      displayDimensions.width > container.clientWidth ||
      displayDimensions.height > container.clientHeight
    );
  }, [displayDimensions]);

  // ฟังก์ชันจัดการข้อมูล PDF เมื่อโหลดสำเร็จ
  const handlePDFLoad = useCallback((pdfData) => {
    setTotalPages(pdfData.numPages);
    setCurrentPage(1); // รีเซ็ตเป็นหน้าแรกเมื่อโหลด PDF ใหม่
  }, []);

  // ฟังก์ชันจัดการการเปลี่ยนหน้า
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // รีเซ็ตตำแหน่ง scroll เมื่อเปลี่ยนหน้า
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo(0, 0);
      }
    }
  }, [totalPages]);

  // ฟังก์ชันไปหน้าก่อนหน้า
  const goToPrevPage = useCallback(() => {
    handlePageChange(currentPage - 1);
  }, [currentPage, handlePageChange]);

  // ฟังก์ชันไปหน้าถัดไป
  const goToNextPage = useCallback(() => {
    handlePageChange(currentPage + 1);
  }, [currentPage, handlePageChange]);

  // ฟังก์ชันจัดการการซูม
  const handleZoomChange = useCallback((value) => {
    setScale(value / 100);
  }, []);

  const quickZoom = useCallback((increment) => {
    setScale(prevScale => {
      const newScale = prevScale + increment;
      return Math.max(0.3, Math.min(5, newScale));
    });
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, []);

  // ฟังก์ชันปรับซูมให้พอดีหน้าจอ
  const fitToWidth = useCallback(() => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth - 40;
      const newScale = containerWidth / baseWidth;
      setScale(Math.max(0.3, Math.min(5, newScale)));
    }
  }, [baseWidth]);

  const fitToHeight = useCallback(() => {
    if (scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight - 40;
      const newScale = containerHeight / baseHeight;
      setScale(Math.max(0.3, Math.min(5, newScale)));
    }
  }, [baseHeight]);

  // ฟังก์ชันจัดการการ pan ด้วยเมาส์
  const handleMouseDown = useCallback((e) => {
    if (!isScrollable) return;
    
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY
    });
    
    if (scrollContainerRef.current) {
      setScrollPosition({
        x: scrollContainerRef.current.scrollLeft,
        y: scrollContainerRef.current.scrollTop
      });
    }
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [isScrollable]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning || !scrollContainerRef.current) return;
    
    e.preventDefault();
    
    const deltaX = panStart.x - e.clientX;
    const deltaY = panStart.y - e.clientY;
    
    scrollContainerRef.current.scrollLeft = scrollPosition.x + deltaX;
    scrollContainerRef.current.scrollTop = scrollPosition.y + deltaY;
  }, [isPanning, panStart, scrollPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // เพิ่ม event listeners สำหรับ mouse events
  React.useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // ฟังก์ชันปิด Modal
  const handleClose = useCallback(() => {
    setScale(1);
    setIsPanning(false);
    setCurrentPage(1);
    setTotalPages(null);
    onClose();
  }, [onClose]);

  // ฟังก์ชันดาวน์โหลด
  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `document_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl]);

  // ฟังก์ชันเปิดใน Tab ใหม่
  const handleOpenNewTab = useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  }, [pdfUrl]);

  // Style สำหรับ Modal body
  const modalBodyStyle = useMemo(() => ({
    height: 'calc(98vh - 120px)',
    padding: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f0f2f5'
  }), []);

  // ไม่ render หาก Modal ไม่เปิด
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
            {/* แสดงข้อมูลหน้าปัจจุบัน */}
            {totalPages && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  หน้า {currentPage} / {totalPages}
                </Text>
              </div>
            )}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ซูม: {Math.round(scale * 100)}%
            </Text>
            {isScrollable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DragOutlined style={{ fontSize: '12px', color: '#666' }} />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  ลาก เพื่อเลื่อน
                </Text>
              </div>
            )}
          </div>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width="98%"
      style={{ 
        top: 5,
        maxWidth: '1600px',
        ...style 
      }}
      styles={{ body: modalBodyStyle }}
      destroyOnHidden={true}
      footer={[
        <div key="controls" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '6px 0'
        }}>
          {/* ส่วนควบคุมการนำทางหน้า */}
          {totalPages && totalPages > 1 && (
            <Space size="small" style={{ marginRight: '16px' }}>
              <Tooltip title="หน้าก่อนหน้า">
                <Button 
                  size="small"
                  icon={<LeftOutlined />}
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                />
              </Tooltip>
              
              <Select
                size="small"
                value={currentPage}
                onChange={handlePageChange}
                style={{ width: '80px' }}
                showSearch={false}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Option key={page} value={page}>
                    {page}
                  </Option>
                ))}
              </Select>
              
              <Tooltip title="หน้าถัดไป">
                <Button 
                  size="small"
                  icon={<RightOutlined />}
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                />
              </Tooltip>
            </Space>
          )}

          {/* ส่วนควบคุมการซูม */}
          <Space size="small" style={{ flex: 1 }}>
            <Tooltip title="ซูมออก">
              <Button 
                size="small"
                icon={<ZoomOutOutlined />}
                onClick={() => quickZoom(-0.25)}
                disabled={scale <= 0.3}
              />
            </Tooltip>
            
            <Tooltip title="พอดีความกว้าง">
              <Button 
                size="small"
                onClick={fitToWidth}
                style={{ fontSize: '10px', padding: '0 8px' }}
              >
                กว้าง
              </Button>
            </Tooltip>
            
            <Tooltip title="พอดีความสูง">
              <Button 
                size="small"
                onClick={fitToHeight}
                style={{ fontSize: '10px', padding: '0 8px' }}
              >
                สูง
              </Button>
            </Tooltip>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              minWidth: '140px',
              maxWidth: '180px'
            }}>
              <Text style={{ fontSize: '10px', minWidth: '24px' }}>30%</Text>
              <Slider
                value={scale * 100}
                min={30}
                max={500}
                step={25}
                style={{ flex: 1, margin: '0 6px' }}
                onChange={handleZoomChange}
                tooltip={{ formatter: (value) => `${value}%` }}
              />
              <Text style={{ fontSize: '10px', minWidth: '36px' }}>500%</Text>
            </div>
            
            <Tooltip title="ซูมเข้า">
              <Button 
                size="small"
                icon={<ZoomInOutlined />}
                onClick={() => quickZoom(0.25)}
                disabled={scale >= 5}
              />
            </Tooltip>
            
            <Tooltip title="รีเซ็ตซูมและตำแหน่ง">
              <Button 
                size="small"
                icon={<ReloadOutlined />}
                onClick={resetZoom}
                disabled={scale === 1}
              />
            </Tooltip>
          </Space>

          {/* ปุ่มด้านขวา */}
          <Space size="small">
            <Tooltip title="ดาวน์โหลดไฟล์ PDF">
              <Button 
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                disabled={!pdfUrl}
              >
                ดาวน์โหลด
              </Button>
            </Tooltip>
            
            <Tooltip title="เปิดในแท็บใหม่">
              <Button 
                size="small"
                icon={<FullscreenOutlined />}
                onClick={handleOpenNewTab}
                disabled={!pdfUrl}
              >
                เปิดใหม่
              </Button>
            </Tooltip>
            
            <Button size="small" onClick={handleClose}>
              ปิด
            </Button>
          </Space>
        </div>
      ]}
    >
      {/* พื้นที่แสดง PDF */}
      <div 
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
          cursor: isScrollable ? (isPanning ? 'grabbing' : 'grab') : 'default',
          scrollbarWidth: 'thin',
          scrollbarColor: '#bfbfbf #f0f0f0',
          backgroundColor: '#fafafa'
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: '100%',
          padding: '10px'
        }}>
          {pdfUrl ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              width: `${displayDimensions.width}px`,
              height: `${displayDimensions.height}px`,
              userSelect: isPanning ? 'none' : 'auto'
            }}>
              <PDFViewer
                pdfFile={pdfUrl}
                width={displayDimensions.width}
                height={displayDimensions.height}
                currentPage={currentPage} // ส่งหน้าปัจจุบัน
                onLoadSuccess={handlePDFLoad} // รับข้อมูล PDF
                showControls={false}
                style={{ 
                  border: 'none',
                  borderRadius: '8px',
                  width: '100%',
                  height: '100%'
                }}
                onError={(error) => {
                  console.error('เกิดข้อผิดพลาดในการแสดง PDF:', error);
                }}
              />
            </div>
          ) : (
            <div style={{
              width: displayDimensions.width,
              height: displayDimensions.height,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fafafa',
              color: '#999',
              minHeight: '400px',
              borderRadius: '8px',
              border: '2px dashed #d9d9d9'
            }}>
              <div style={{ textAlign: 'center' }}>
                <FileOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <br />
                <Text type="secondary" style={{ fontSize: '18px' }}>
                  ไม่มีเอกสาร PDF ให้แสดง
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  กรุณาเลือกไฟล์ PDF ที่ต้องการดู
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* แสดงคำแนะนำการใช้งาน */}
      {(isScrollable || (totalPages && totalPages > 1)) && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          pointerEvents: 'none',
          opacity: 0.8,
          zIndex: 1000,
          maxWidth: '200px',
          lineHeight: '1.4'
        }}>
          {isScrollable && '💡 ลากเพื่อเลื่อน หรือใช้ scroll wheel'}
          {isScrollable && totalPages > 1 && <br />}
          {totalPages > 1 && '📄 ใช้ปุ่มหรือเลือกหน้าที่ต้องการ'}
        </div>
      )}
    </Modal>
  );
};

export default React.memo(PDFViewerModal);