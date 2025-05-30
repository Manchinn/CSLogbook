import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Spin, Button } from 'antd';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// แก้ไข worker path สำหรับเวอร์ชันใหม่
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

const PDFViewer = ({ 
  pdfFile, 
  width = 595,
  height = 842,
  style,
  onError,
  onLoadSuccess, // เพิ่ม prop สำหรับส่งข้อมูล PDF กลับ
  currentPage: externalCurrentPage, // เพิ่ม prop สำหรับรับหน้าจาก parent
  showControls = true
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  // ใช้ external current page หากมี ไม่งั้นใช้ internal state
  const currentPageNumber = externalCurrentPage || pageNumber;

  // ฟังก์ชันเมื่อโหลด PDF สำเร็จ
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    
    // ส่งข้อมูล PDF กลับไปยัง parent component
    if (onLoadSuccess) {
      onLoadSuccess({ numPages });
    }
  }

  // ฟังก์ชันเมื่อเกิดข้อผิดพลาดในการโหลด PDF
  function onDocumentLoadError(error) {
    console.error('เกิดข้อผิดพลาดในการโหลด PDF:', error);
    setLoading(false);
    if (onError) {
      onError(error);
    }
  }

  // ฟังก์ชันไปหน้าก่อนหน้า
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  // ฟังก์ชันไปหน้าถัดไป
  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  // รีเซ็ตหน้าเมื่อโหลด PDF ใหม่
  useEffect(() => {
    setPageNumber(1);
    setNumPages(null);
    setLoading(true);
  }, [pdfFile]);

  return (
    <div style={{ 
      ...style, 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Spin spinning={loading} tip="กำลังโหลด PDF...">
        <div style={{ 
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div style={{ textAlign: 'center', padding: '20px' }}>กำลังโหลด PDF...</div>}
            error={
              <div style={{ 
                color: 'red', 
                textAlign: 'center', 
                padding: '20px',
                border: '1px solid #ff4d4f',
                borderRadius: '4px',
                backgroundColor: '#fff2f0'
              }}>
                ไม่สามารถโหลดไฟล์ PDF ได้
              </div>
            }
            noData={
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: '#666'
              }}>
                ไม่มีเอกสาร PDF
              </div>
            }
          >
            <Page 
              pageNumber={currentPageNumber} // ใช้หน้าที่ถูกควบคุม
              width={width}
              height={height}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={<div style={{ textAlign: 'center' }}>กำลังโหลดหน้า...</div>}
              scale={1}
            />
          </Document>
        </div>
        
        {/* แสดงปุ่มนำทางเฉพาะเมื่อไม่มีการควบคุมจากภายนอก */}
        {showControls && !externalCurrentPage && numPages && numPages > 1 && (
          <div style={{ 
            marginTop: '16px', 
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            flexShrink: 0
          }}>
            <Button 
              onClick={goToPrevPage} 
              disabled={pageNumber <= 1}
              style={{ 
                marginRight: '8px',
                minWidth: '80px'
              }}
              size="small"
            >
              หน้าก่อนหน้า
            </Button>
            
            <span style={{ 
              margin: '0 12px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              หน้า {pageNumber} จาก {numPages}
            </span>
            
            <Button 
              onClick={goToNextPage} 
              disabled={pageNumber >= numPages}
              style={{ 
                marginLeft: '8px',
                minWidth: '80px'
              }}
              size="small"
            >
              หน้าถัดไป
            </Button>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default PDFViewer;